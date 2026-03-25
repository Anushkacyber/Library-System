const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');
const { calculateFine, getDueDateStatus } = require('../utils/fineCalculator');

router.post('/', protect, async (req, res, next) => {
  try {
    const { book_id } = req.body;
    const student_id = req.user.id;

    // 1. Check if student has unpaid fines
    const { rows: student } = await db.query('SELECT * FROM users WHERE id=$1', [student_id]);
    if (!student[0]) return res.status(404).json({ success: false, message: 'Student not found' });
    if (parseFloat(student[0].fine_balance) > 0) {
      return res.status(400).json({ success: false, message: `You have unpaid fine: ₹${student[0].fine_balance}. Please clear it before borrowing more books.` });
    }

    // 2. Check if already has this book borrowed
    const already = await db.query("SELECT id FROM borrow_records WHERE user_id=$1 AND book_id=$2 AND status='borrowed'", [student_id, book_id]);
    if (already.rows[0]) return res.status(400).json({ success: false, message: 'You already have this book borrowed.' });

    // 3. Check if book available
    const { rows: book } = await db.query('SELECT * FROM books WHERE id=$1 AND is_active=true AND available_copies > 0', [book_id]);
    if (!book[0]) return res.status(400).json({ success: false, message: 'Book not available at the moment.' });

    // 4. Atomic transaction
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (parseInt(process.env.BORROW_DAYS) || 7));
    
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Create borrow record
      const { rows: record } = await client.query(
        `INSERT INTO borrow_records (user_id, book_id, due_date) VALUES ($1,$2,$3) RETURNING *`,
        [student_id, book_id, dueDate]
      );

      // Decrement available copies
      await client.query('UPDATE books SET available_copies = available_copies - 1 WHERE id=$1', [book_id]);

      // Notify
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)`,
        [student_id, 'Book Borrowed', `You've borrowed "${book[0].title}". Due: ${dueDate.toDateString()}`, 'success']
      );

      await client.query('COMMIT');
      res.status(201).json({ success: true, record: record[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.get('/my-history', protect, async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT br.*, b.title, b.author, b.cover_image, b.isbn FROM borrow_records br JOIN books b ON b.id = br.book_id WHERE br.user_id = $1 ORDER BY br.issue_date DESC`, [req.user.id]);
    const enriched = rows.map(r => {
      const { fine, daysOverdue } = calculateFine(r.issue_date);
      const currentFine = r.status === 'borrowed' ? fine : r.fine_amount;
      const { status, daysLeft } = r.status === 'borrowed' ? getDueDateStatus(r.issue_date) : { status: 'returned', daysLeft: null };
      return { ...r, current_fine: currentFine, days_overdue: r.status === 'borrowed' ? daysOverdue : null, due_date_status: status, days_left: daysLeft };
    });
    res.json({ success: true, records: enriched });
  } catch (err) { next(err); }
});

router.get('/active', protect, async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT br.*, b.title, b.author, b.cover_image FROM borrow_records br JOIN books b ON b.id = br.book_id WHERE br.user_id=$1 AND br.status='borrowed' ORDER BY br.due_date ASC`, [req.user.id]);
    const enriched = rows.map(r => {
      const { fine, daysOverdue } = calculateFine(r.issue_date);
      const { status, daysLeft } = getDueDateStatus(r.issue_date);
      return { ...r, current_fine: fine, days_overdue: daysOverdue, due_date_status: status, days_left: daysLeft };
    });
    res.json({ success: true, records: enriched });
  } catch (err) { next(err); }
});

router.get('/all', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = ''; const params = [];
    if (status) { params.push(status); where = `WHERE br.status = $${params.length}`; }
    params.push(limit, offset);
    const { rows } = await db.query(`SELECT br.*, b.title, b.author, b.id as book_id, u.name as student_name, u.email as student_email, u.student_id FROM borrow_records br JOIN books b ON b.id = br.book_id JOIN users u ON u.id = br.user_id ${where} ORDER BY br.issue_date DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    const enriched = rows.map(r => {
      if (r.status === 'borrowed') {
        const { fine, daysOverdue } = calculateFine(r.issue_date);
        return { ...r, current_fine: fine, days_overdue: daysOverdue };
      }
      return r;
    });
    res.json({ success: true, records: enriched });
  } catch (err) { next(err); }
});

router.get('/fine-report', protect, adminOnly, async (req, res, next) => {
  try {
    const { rows: debtors } = await db.query(`SELECT u.name, u.email, u.student_id, u.id as student_id, u.fine_balance, COUNT(br.id) FILTER (WHERE br.status='borrowed') as overdue_books FROM users u LEFT JOIN borrow_records br ON br.user_id = u.id AND br.status = 'borrowed' WHERE u.fine_balance > 0 AND u.role='student' GROUP BY u.id ORDER BY u.fine_balance DESC`);
    const { rows: summary } = await db.query(`SELECT SUM(fine_amount) as total_fines, SUM(CASE WHEN fine_paid THEN fine_amount ELSE 0 END) as collected_fines, SUM(CASE WHEN NOT fine_paid AND fine_amount > 0 THEN fine_amount ELSE 0 END) as pending_fines, COUNT(CASE WHEN fine_amount > 0 AND NOT fine_paid THEN 1 END) as pending_count FROM borrow_records`);
    res.json({ success: true, debtors, summary: summary[0] });
  } catch (err) { next(err); }
});

router.post('/pay-fine', protect, async (req, res, next) => {
  try {
    const { amount } = req.body;
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    await db.query('UPDATE users SET fine_balance = GREATEST(0, fine_balance - $1) WHERE id=$2', [payAmount, req.user.id]);
    await db.query(`INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)`, [req.user.id, 'Fine Paid', `Fine payment of ₹${payAmount} recorded.`, 'success']);
    res.json({ success: true, message: `Fine of ₹${payAmount} paid` });
  } catch (err) { next(err); }
});

router.post('/pay-fine/:userId', protect, adminOnly, async (req, res, next) => {
  try {
    const { amount } = req.body;
    await db.query('UPDATE users SET fine_balance = GREATEST(0, fine_balance - $1) WHERE id=$2', [amount, req.params.userId]);
    res.json({ success: true, message: 'Fine cleared' });
  } catch (err) { next(err); }
});

module.exports = router;
