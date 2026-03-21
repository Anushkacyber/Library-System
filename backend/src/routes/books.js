const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res, next) => {
  try {
    const { search, genre, available, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE b.is_active = true';
    const params = [];
    if (search) { params.push(`%${search}%`); where += ` AND (b.title ILIKE $${params.length} OR b.author ILIKE $${params.length} OR b.isbn ILIKE $${params.length})`; }
    if (genre) { params.push(genre); where += ` AND b.genre = $${params.length}`; }
    if (available === 'true') where += ` AND b.available_copies > 0`;
    const countResult = await db.query(`SELECT COUNT(*) FROM books b ${where}`, params);
    const total = parseInt(countResult.rows[0].count);
    params.push(limit, offset);
    const { rows: books } = await db.query(`SELECT * FROM books b ${where} ORDER BY b.title LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    res.json({ success: true, books, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

router.get('/genres/list', protect, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL ORDER BY genre');
    res.json({ success: true, genres: rows.map(r => r.genre) });
  } catch (err) { next(err); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM books WHERE id=$1 AND is_active=true', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, book: rows[0] });
  } catch (err) { next(err); }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { title, author, isbn, genre, publisher, publish_year, description, total_copies, cover_image, location } = req.body;
    const { rows } = await db.query(`INSERT INTO books (title, author, isbn, genre, publisher, publish_year, description, total_copies, available_copies, cover_image, location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10) RETURNING *`,
      [title, author, isbn, genre, publisher, publish_year, description, total_copies || 1, cover_image, location]);
    res.status(201).json({ success: true, book: rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { title, author, isbn, genre, publisher, publish_year, description, total_copies, cover_image, location } = req.body;
    const { rows } = await db.query(`UPDATE books SET title=$1, author=$2, isbn=$3, genre=$4, publisher=$5, publish_year=$6, description=$7, total_copies=$8, cover_image=$9, location=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [title, author, isbn, genre, publisher, publish_year, description, total_copies, cover_image, location, req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, book: rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try { await db.query('UPDATE books SET is_active=false WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { next(err); }
});

router.post('/:id/reserve', protect, async (req, res, next) => {
  try {
    const { rows: book } = await db.query('SELECT * FROM books WHERE id=$1 AND is_active=true AND available_copies > 0', [req.params.id]);
    if (!book[0]) return res.status(400).json({ success: false, message: 'Book not available' });
    const { rows } = await db.query(`INSERT INTO book_reservations (user_id, book_id, expires_at) VALUES ($1,$2, NOW() + INTERVAL '3 days') ON CONFLICT (user_id, book_id, status) DO NOTHING RETURNING *`, [req.user.id, req.params.id]);
    res.status(201).json({ success: true, reservation: rows[0] });
  } catch (err) { next(err); }
});

router.post('/:id/borrow', protect, adminOnly, async (req, res, next) => {
  try {
    const { student_id } = req.body;
    const { rows: student } = await db.query('SELECT * FROM users WHERE id=$1', [student_id]);
    if (!student[0]) return res.status(404).json({ success: false, message: 'Student not found' });
    if (parseFloat(student[0].fine_balance) > 0) return res.status(400).json({ success: false, message: `Student has unpaid fine: ₹${student[0].fine_balance}` });
    const already = await db.query("SELECT id FROM borrow_records WHERE user_id=$1 AND book_id=$2 AND status='borrowed'", [student_id, req.params.id]);
    if (already.rows[0]) return res.status(400).json({ success: false, message: 'Student already has this book' });
    const { rows: book } = await db.query('SELECT * FROM books WHERE id=$1 AND available_copies > 0', [req.params.id]);
    if (!book[0]) return res.status(400).json({ success: false, message: 'Book not available' });
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + (parseInt(process.env.BORROW_DAYS) || 7));
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const { rows: record } = await client.query(`INSERT INTO borrow_records (user_id, book_id, issued_by, due_date) VALUES ($1,$2,$3,$4) RETURNING *`, [student_id, req.params.id, req.user.id, dueDate]);
      await client.query('UPDATE books SET available_copies = available_copies - 1 WHERE id=$1', [req.params.id]);
      await client.query(`INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)`, [student_id, 'Book Issued', `"${book[0].title}" issued. Due: ${dueDate.toDateString()}`, 'info']);
      await client.query('COMMIT');
      res.status(201).json({ success: true, record: record[0] });
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  } catch (err) { next(err); }
});

router.post('/:id/return', protect, adminOnly, async (req, res, next) => {
  try {
    const { record_id } = req.body;
    const { calculateFine } = require('../utils/fineCalculator');
    const { rows: record } = await db.query("SELECT br.*, b.title FROM borrow_records br JOIN books b ON b.id=br.book_id WHERE br.id=$1 AND br.status='borrowed'", [record_id]);
    if (!record[0]) return res.status(404).json({ success: false, message: 'Record not found' });
    const { fine } = calculateFine(record[0].issue_date);
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE borrow_records SET status='returned', return_date=NOW(), fine_amount=$1 WHERE id=$2`, [fine, record_id]);
      await client.query('UPDATE books SET available_copies = available_copies + 1 WHERE id=$1', [req.params.id]);
      if (fine > 0) { await client.query('UPDATE users SET fine_balance = fine_balance + $1 WHERE id=$2', [fine, record[0].user_id]); }
      await client.query('COMMIT');
      res.json({ success: true, message: 'Book returned', fine });
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  } catch (err) { next(err); }
});

module.exports = router;
