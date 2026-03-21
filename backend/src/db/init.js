require('dotenv').config();
const db = require('../config/db');

const initializeDatabase = async () => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
        student_id VARCHAR(50) UNIQUE,
        phone VARCHAR(20),
        department VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        fine_balance DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Books table
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(500) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(20) UNIQUE,
        genre VARCHAR(100),
        publisher VARCHAR(255),
        publish_year INTEGER,
        description TEXT,
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        cover_image VARCHAR(500),
        location VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seat_number VARCHAR(20) UNIQUE NOT NULL,
        section VARCHAR(50) NOT NULL,
        row_number INTEGER,
        column_number INTEGER,
        seat_type VARCHAR(50) DEFAULT 'regular' CHECK (seat_type IN ('regular', 'study_room', 'computer', 'reading')),
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
        features JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seat Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS seat_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'checked_in', 'completed', 'cancelled', 'auto_released')),
        checked_in_at TIMESTAMP,
        checked_out_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(seat_id, booking_date, start_time)
      )
    `);

    // Borrow Records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS borrow_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        book_id UUID REFERENCES books(id) ON DELETE CASCADE,
        issued_by UUID REFERENCES users(id),
        issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP NOT NULL,
        return_date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue', 'lost')),
        fine_amount DECIMAL(10,2) DEFAULT 0.00,
        fine_paid BOOLEAN DEFAULT false,
        fine_paid_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'danger', 'success')),
        is_read BOOLEAN DEFAULT false,
        related_id UUID,
        related_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Book Reservations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS book_reservations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        book_id UUID REFERENCES books(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'expired')),
        reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        UNIQUE(user_id, book_id, status)
      )
    `);

    await client.query('COMMIT');

    // Seed initial seats
    await seedSeats(client);

    // Seed admin user
    await seedAdmin();

    console.log('✅ Database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', err);
    throw err;
  } finally {
    client.release();
  }
};

const seedSeats = async (client) => {
  const sections = [
    { name: 'A', type: 'regular', rows: 4, cols: 5 },
    { name: 'B', type: 'computer', rows: 2, cols: 5 },
    { name: 'C', type: 'reading', rows: 3, cols: 4 },
    { name: 'D', type: 'study_room', rows: 2, cols: 3 },
  ];

  for (const section of sections) {
    for (let r = 1; r <= section.rows; r++) {
      for (let c = 1; c <= section.cols; c++) {
        const seatNumber = `${section.name}${r}${c}`;
        await client.query(`
          INSERT INTO seats (seat_number, section, row_number, column_number, seat_type)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (seat_number) DO NOTHING
        `, [seatNumber, section.name, r, c, section.type]);
      }
    }
  }
  console.log('✅ Seats seeded');
};

const seedAdmin = async () => {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 12);

  await db.query(`
    INSERT INTO users (name, email, password, role, student_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO NOTHING
  `, ['Admin User', 'admin@library.com', hashedPassword, 'admin', 'ADMIN001']);

  console.log('✅ Admin seeded: admin@library.com / admin123');
};

initializeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
