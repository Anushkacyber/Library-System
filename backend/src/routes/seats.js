const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res, next) => {
  try {
    const { date, section } = req.query;
    const bookingDate = date || new Date().toISOString().split('T')[0];
    let query = `SELECT s.*, sb.id as booking_id, sb.user_id as booked_by, sb.start_time, sb.end_time, sb.status as booking_status, u.name as booked_by_name FROM seats s LEFT JOIN seat_bookings sb ON sb.seat_id = s.id AND sb.booking_date = $1 AND sb.status IN ('active', 'checked_in') LEFT JOIN users u ON u.id = sb.user_id WHERE s.is_active = true`;
    const params = [bookingDate];
    if (section) { params.push(section); query += ` AND s.section = $${params.length}`; }
    query += ' ORDER BY s.section, s.row_number, s.column_number';
    const { rows } = await db.query(query, params);
    res.json({ success: true, seats: rows });
  } catch (err) { next(err); }
});

router.post('/book', protect, async (req, res, next) => {
  try {
    const { seat_id, booking_date, start_time, end_time } = req.body;
    if (!seat_id || !booking_date || !start_time || !end_time) return res.status(400).json({ success: false, message: 'All fields required' });
    const { rows: seat } = await db.query('SELECT * FROM seats WHERE id=$1 AND is_active=true', [seat_id]);
    if (!seat[0]) return res.status(404).json({ success: false, message: 'Seat not found' });
    const { rows: existing } = await db.query(`SELECT id FROM seat_bookings WHERE seat_id=$1 AND booking_date=$2 AND status IN ('active','checked_in') AND ((start_time <= $3 AND end_time > $3) OR (start_time < $4 AND end_time >= $4) OR (start_time >= $3 AND end_time <= $4))`, [seat_id, booking_date, start_time, end_time]);
    if (existing[0]) return res.status(400).json({ success: false, message: 'Seat already booked for this time slot' });
    const { rows: booking } = await db.query(`INSERT INTO seat_bookings (user_id, seat_id, booking_date, start_time, end_time, status) VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`, [req.user.id, seat_id, booking_date, start_time, end_time]);
    const io = req.app.get('io');
    if (io) io.emit('seatStatusUpdate', { seatId: seat_id, status: 'reserved' });
    res.status(201).json({ success: true, booking: booking[0], seat: seat[0] });
  } catch (err) { next(err); }
});

router.post('/checkin/:bookingId', protect, async (req, res, next) => {
  try {
    const { rows } = await db.query(`UPDATE seat_bookings SET status='checked_in', checked_in_at=NOW() WHERE id=$1 AND user_id=$2 AND status='active' RETURNING *`, [req.params.bookingId, req.user.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Booking not found' });
    const io = req.app.get('io');
    if (io) io.emit('seatStatusUpdate', { seatId: rows[0].seat_id, status: 'occupied' });
    res.json({ success: true, booking: rows[0] });
  } catch (err) { next(err); }
});

router.post('/checkout/:bookingId', protect, async (req, res, next) => {
  try {
    const { rows } = await db.query(`UPDATE seat_bookings SET status='completed', checked_out_at=NOW() WHERE id=$1 AND user_id=$2 AND status IN ('active','checked_in') RETURNING *`, [req.params.bookingId, req.user.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Booking not found' });
    const io = req.app.get('io');
    if (io) io.emit('seatStatusUpdate', { seatId: rows[0].seat_id, status: 'available' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/booking/:bookingId', protect, async (req, res, next) => {
  try {
    const { rows } = await db.query(`UPDATE seat_bookings SET status='cancelled' WHERE id=$1 AND user_id=$2 AND status='active' RETURNING *`, [req.params.bookingId, req.user.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Booking not found' });
    const io = req.app.get('io');
    if (io) io.emit('seatStatusUpdate', { seatId: rows[0].seat_id, status: 'available' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/my-bookings', protect, async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT sb.*, s.seat_number, s.section, s.seat_type FROM seat_bookings sb JOIN seats s ON s.id = sb.seat_id WHERE sb.user_id = $1 ORDER BY sb.booking_date DESC, sb.start_time DESC LIMIT 20`, [req.user.id]);
    res.json({ success: true, bookings: rows });
  } catch (err) { next(err); }
});

router.get('/stats', protect, adminOnly, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { rows } = await db.query(`SELECT COUNT(*) as total_seats, SUM(CASE WHEN EXISTS (SELECT 1 FROM seat_bookings sb WHERE sb.seat_id=s.id AND sb.booking_date=$1 AND sb.status IN ('active','checked_in')) THEN 1 ELSE 0 END) as occupied_today FROM seats s WHERE s.is_active=true`, [today]);
    res.json({ success: true, stats: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
