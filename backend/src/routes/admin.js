const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [users, books, borrows, seats, overdue, fines] = await Promise.all([
      db.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month FROM users WHERE role='student'`),
      db.query(`SELECT COUNT(*) as total, SUM(total_copies) as total_copies, SUM(available_copies) as available_copies FROM books WHERE is_active=true`),
      db.query(`SELECT COUNT(*) as active FROM borrow_records WHERE status='borrowed'`),
      db.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN EXISTS (SELECT 1 FROM seat_bookings sb WHERE sb.seat_id=s.id AND sb.booking_date=$1 AND sb.status IN ('active','checked_in')) THEN 1 END) as occupied FROM seats s WHERE s.is_active=true`, [today]),
      db.query(`SELECT COUNT(*) as count FROM borrow_records WHERE status='borrowed' AND due_date < NOW()`),
      db.query(`SELECT SUM(fine_balance) as total_pending FROM users WHERE fine_balance > 0`),
    ]);
    const { rows: recentBorrows } = await db.query(`SELECT br.*, b.title, u.name as student_name FROM borrow_records br JOIN books b ON b.id=br.book_id JOIN users u ON u.id=br.user_id ORDER BY br.created_at DESC LIMIT 8`);
    res.json({
      success: true,
      stats: {
        totalStudents: parseInt(users.rows[0].total), newStudentsMonth: parseInt(users.rows[0].new_this_month),
        totalBooks: parseInt(books.rows[0].total), totalCopies: parseInt(books.rows[0].total_copies || 0), availableCopies: parseInt(books.rows[0].available_copies || 0),
        activeBorrows: parseInt(borrows.rows[0].active), totalSeats: parseInt(seats.rows[0].total), occupiedSeats: parseInt(seats.rows[0].occupied || 0),
        overdueBooks: parseInt(overdue.rows[0].count), pendingFines: parseFloat(fines.rows[0].total_pending || 0),
      },
      recentActivity: recentBorrows,
    });
  } catch (err) { next(err); }
});

router.get('/students', protect, adminOnly, async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE role='student'"; const params = [];
    if (search) { params.push(`%${search}%`); where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR student_id ILIKE $${params.length})`; }
    const countRes = await db.query(`SELECT COUNT(*) FROM users ${where}`, params);
    params.push(limit, offset);
    const { rows } = await db.query(`SELECT u.*, COUNT(br.id) FILTER (WHERE br.status='borrowed') as active_borrows FROM users u LEFT JOIN borrow_records br ON br.user_id = u.id ${where} GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    res.json({ success: true, students: rows.map(({ password, ...s }) => s), total: parseInt(countRes.rows[0].count), page: parseInt(page) });
  } catch (err) { next(err); }
});

router.get('/students/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { rows: user } = await db.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    if (!user[0]) return res.status(404).json({ success: false, message: 'Not found' });
    const { rows: borrows } = await db.query(`SELECT br.*, b.title, b.author FROM borrow_records br JOIN books b ON b.id=br.book_id WHERE br.user_id=$1 ORDER BY br.issue_date DESC`, [req.params.id]);
    const { rows: seatBookings } = await db.query(`SELECT sb.*, s.seat_number, s.section FROM seat_bookings sb JOIN seats s ON s.id=sb.seat_id WHERE sb.user_id=$1 ORDER BY sb.booking_date DESC LIMIT 10`, [req.params.id]);
    const { password, ...u } = user[0];
    res.json({ success: true, student: u, borrows, seatBookings });
  } catch (err) { next(err); }
});

router.put('/students/:id/toggle-active', protect, adminOnly, async (req, res, next) => {
  try {
    const { rows } = await db.query(`UPDATE users SET is_active = NOT is_active WHERE id=$1 RETURNING id, name, is_active`, [req.params.id]);
    res.json({ success: true, student: rows[0] });
  } catch (err) { next(err); }
});

router.delete('/students/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT id FROM borrow_records WHERE user_id=$1 AND status='borrowed'", [req.params.id]);
    if (rows.length > 0) return res.status(400).json({ success: false, message: 'Cannot delete student with active borrowed books' });
    await db.query("DELETE FROM users WHERE id=$1 AND role='student'", [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/notifications/send-reminders', protect, adminOnly, async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT br.*, u.email, u.name, b.title, b.author FROM borrow_records br JOIN users u ON u.id=br.user_id JOIN books b ON b.id=br.book_id WHERE br.status='borrowed' AND br.due_date < NOW() + INTERVAL '3 days'`);
    const { sendEmail, dueDateReminderEmail } = require('../utils/email');
    const { calculateFine } = require('../utils/fineCalculator');
    let sent = 0;
    for (const record of rows) {
      const { fine } = calculateFine(record.issue_date);
      const daysLeft = Math.ceil((new Date(record.due_date) - new Date()) / (86400000));
      await db.query(`INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)`, [record.user_id, daysLeft <= 0 ? 'Book Overdue!' : 'Due Date Reminder', `"${record.title}" is ${daysLeft <= 0 ? `${Math.abs(daysLeft)}d overdue. Fine: ₹${fine}` : `due in ${daysLeft}d`}`, daysLeft <= 0 ? 'danger' : 'warning']);
      if (record.email) sendEmail(dueDateReminderEmail({ email: record.email, name: record.name }, record, daysLeft, fine)).catch(() => {});
      sent++;
    }
    res.json({ success: true, message: `Reminders sent for ${sent} records` });
  } catch (err) { next(err); }
});

router.get('/seat-bookings', protect, adminOnly, async (req, res, next) => {
  try {
    const { date } = req.query;
    const bookingDate = date || new Date().toISOString().split('T')[0];
    const { rows } = await db.query(`SELECT sb.*, s.seat_number, s.section, u.name as student_name, u.student_id FROM seat_bookings sb JOIN seats s ON s.id=sb.seat_id JOIN users u ON u.id=sb.user_id WHERE sb.booking_date=$1 ORDER BY sb.start_time, s.section`, [bookingDate]);
    res.json({ success: true, bookings: rows });
  } catch (err) { next(err); }
});

module.exports = router;
