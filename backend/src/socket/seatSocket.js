const db = require('../config/db');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join', ({ userId, role }) => {
      socket.join(`user:${userId}`);
      if (role === 'admin') socket.join('admin');
      console.log(`👤 User ${userId} (${role}) joined`);
    });

    // Join seat monitoring room
    socket.on('joinSeatMonitor', () => {
      socket.join('seatMonitor');
    });

    // Admin force-release seat
    socket.on('adminReleaseSeat', async ({ bookingId }) => {
      try {
        const { rows } = await db.query(`
          UPDATE seat_bookings SET status='auto_released'
          WHERE id=$1 AND status IN ('active','checked_in')
          RETURNING *
        `, [bookingId]);

        if (rows[0]) {
          io.emit('seatStatusUpdate', { seatId: rows[0].seat_id, status: 'available' });
          io.to(`user:${rows[0].user_id}`).emit('notification', {
            type: 'warning',
            message: 'Your seat booking was released by admin',
          });
        }
      } catch (err) {
        console.error('Socket error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Auto-release seats not checked in within 30 mins
  const autoRelease = async () => {
    const releaseMinutes = parseInt(process.env.SEAT_AUTO_RELEASE_MINUTES) || 30;

    try {
      const { rows } = await db.query(`
        UPDATE seat_bookings SET status='auto_released'
        WHERE status='active'
          AND created_at < NOW() - INTERVAL '${releaseMinutes} minutes'
          AND booking_date = CURRENT_DATE
        RETURNING *
      `);

      for (const booking of rows) {
        io.emit('seatStatusUpdate', { seatId: booking.seat_id, status: 'available' });
        io.to(`user:${booking.user_id}`).emit('notification', {
          type: 'warning',
          message: `Seat auto-released due to no check-in within ${releaseMinutes} minutes`,
        });
        console.log(`🔄 Auto-released seat booking ${booking.id}`);
      }
    } catch (err) {
      console.error('Auto-release error:', err);
    }
  };

  // Run auto-release every 5 minutes
  setInterval(autoRelease, 5 * 60 * 1000);

  return io;
};

module.exports = setupSocket;
