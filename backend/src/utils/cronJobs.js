const cron = require('node-cron');
const db = require('../config/db');
const { calculateFine } = require('./fineCalculator');
const { sendEmail, dueDateReminderEmail } = require('./email');

const setupCronJobs = (io) => {
  // Daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      const { rows } = await db.query(`
        UPDATE borrow_records SET status='overdue'
        WHERE status='borrowed' AND due_date < NOW()
        RETURNING *, (SELECT title FROM books WHERE id=book_id) as book_title,
          (SELECT email FROM users WHERE id=user_id) as user_email,
          (SELECT name FROM users WHERE id=user_id) as user_name
      `);
      for (const r of rows) {
        const { fine } = calculateFine(r.issue_date);
        await db.query('UPDATE borrow_records SET fine_amount=$1 WHERE id=$2', [fine, r.id]);
        await db.query('UPDATE users SET fine_balance = fine_balance + $1 WHERE id=$2', [fine, r.user_id]);
        await db.query(`INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)`,
          [r.user_id, 'Book Overdue!', `"${r.book_title}" is overdue. Fine: ₹${fine}`, 'danger']);
        if (r.user_email) sendEmail(dueDateReminderEmail({ email: r.user_email, name: r.user_name }, { title: r.book_title }, -1, fine)).catch(() => {});
      }
      if (io) io.to('admin').emit('statsUpdated');
    } catch (err) { console.error('Cron error:', err); }
  });

  // Every 30 min: release expired seats
  cron.schedule('*/30 * * * *', async () => {
    try {
      const { rows } = await db.query(`
        UPDATE seat_bookings SET status='auto_released'
        WHERE status='active' AND booking_date < CURRENT_DATE RETURNING *
      `);
      if (rows.length > 0 && io) io.emit('seatsRefresh');
    } catch (err) { console.error('Seat release cron error:', err); }
  });

  console.log('Cron jobs initialized');
};

module.exports = setupCronJobs;
