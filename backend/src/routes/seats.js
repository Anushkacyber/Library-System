const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res, next) => {
  try {
    const { date, section } = req.query;
    const bookingDate = date || new Date().toISOString().split('T')[0];
    let query = `SELECT s.*, sb.id as booking_id, sb.user_id as booked_by, sb.start_time, sb.end_time, sb.status as status, sb.duration_type, sb.price, sb.payment_status, u.name as booked_by_name FROM seats s LEFT JOIN seat_bookings sb ON sb.seat_id = s.id AND sb.booking_date = $1 AND sb.status IN ('active', 'checked_in') LEFT JOIN users u ON u.id = sb.user_id WHERE s.is_active = true`;
    const params = [bookingDate];
    if (section) { params.push(section); query += ` AND s.section = $${params.length}`; }
    query += ' ORDER BY s.section, s.row_number, s.column_number';
    const { rows } = await db.query(query, params);
    
    // Enrich with Busy Meter/Heatmap data for sections C & D
    const enriched = rows.map(s => ({
      ...s,
      is_busy: ['C', 'D'].includes(s.section) && s.status ? true : false
    }));

    res.json({ success: true, seats: enriched });
  } catch (err) { next(err); }
});

router.post('/book', protect, async (req, res, next) => {
  try {
    const seat_id = req.body.seat_id || req.body.seatId;
    const booking_date = req.body.booking_date || req.body.date;
    const duration_type = req.body.duration_type || '2h'; // 2h, 4h, full
    
    // Pricing logic
    let price = 0;
    let durationHours = 2;
    if (['A', 'B'].includes(req.body.section)) {
      if (duration_type === '4h') { price = 50; durationHours = 4; }
      else if (duration_type === 'full') { price = 100; durationHours = 12; }
      else { price = 30; durationHours = 2; }
    }

    const { rows: seat } = await db.query('SELECT * FROM seats WHERE id=$1 AND is_active=true', [seat_id]);
    if (!seat[0]) return res.status(404).json({ success: false, message: 'Seat not found' });
    if (seat[0].is_maintenance) return res.status(400).json({ success: false, message: 'Seat is under maintenance' });

    const start_time = req.body.start_time || '09:00:00';
    // Calculate end_time based on duration
    const [h, m, s] = start_time.split(':');
    const end_time = `${(parseInt(h) + durationHours).toString().padStart(2, '0')}:${m}:${s}`;

    const { rows: existing } = await db.query(`SELECT id FROM seat_bookings WHERE seat_id=$1 AND booking_date=$2 AND status IN ('active','checked_in') AND ((start_time <= $3 AND end_time > $3) OR (start_time < $4 AND end_time >= $4) OR (start_time >= $3 AND end_time <= $4))`, [seat_id, booking_date, start_time, end_time]);
    if (existing[0]) return res.status(400).json({ success: false, message: 'Seat already booked for this time slot' });

    const { rows: booking } = await db.query(`INSERT INTO seat_bookings (user_id, seat_id, booking_date, start_time, end_time, status, duration_type, price, payment_status) VALUES ($1,$2,$3,$4,$5,'active', $6, $7, $8) RETURNING *`, [req.user.id, seat_id, booking_date, start_time, end_time, duration_type, price, price > 0 ? 'pending' : 'paid']);
    
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

router.post('/extend/:bookingId', protect, async (req, res, next) => {
  try {
    const { rows: booking } = await db.query(`SELECT sb.*, s.section FROM seat_bookings sb JOIN seats s ON s.id = sb.seat_id WHERE sb.id=$1 AND sb.user_id=$2 AND sb.status='checked_in'`, [req.params.bookingId, req.user.id]);
    if (!booking[0]) return res.status(404).json({ success: false, message: 'Active checked-in booking not found' });

    const currentEndTime = booking[0].end_time;
    const [h, m, s] = currentEndTime.split(':');
    const newEndTime = `${(parseInt(h) + 2).toString().padStart(2, '0')}:${m}:${s}`;

    // Check conflict for the extended period
    const { rows: conflict } = await db.query(`SELECT id FROM seat_bookings WHERE seat_id=$1 AND booking_date=$2 AND status IN ('active','checked_in') AND id != $3 AND ((start_time < $4 AND end_time > $5))`, [booking[0].seat_id, booking[0].booking_date, booking[0].id, newEndTime, currentEndTime]);
    
    if (conflict[0]) return res.status(400).json({ success: false, message: 'Cannot extend: Next slot is already booked' });

    await db.query(`UPDATE seat_bookings SET end_time=$1, duration_type='extended' WHERE id=$2`, [newEndTime, req.params.bookingId]);
    
    const io = req.app.get('io');
    if (io) io.emit('seatsRefresh');
    res.json({ success: true, message: 'Stay extended by 2 hours' });
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

router.post('/maintenance/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { is_maintenance } = req.body;
    await db.query('UPDATE seats SET is_maintenance = $1 WHERE id = $2', [is_maintenance, req.params.id]);
    io = req.app.get('io');
    if (io) io.emit('seatStatusUpdate', { seatId: req.params.id, status: is_maintenance ? 'maintenance' : 'available' });
    res.json({ success: true, message: `Seat status updated to ${is_maintenance ? 'maintenance' : 'active'}` });
  } catch (err) { next(err); }
});

module.exports = router;
