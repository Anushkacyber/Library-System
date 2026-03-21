# 📚 LibraFlow — Full-Stack Library Management System

A production-ready MERN stack (React + Node.js + PostgreSQL/NeonDB) library management system with real-time seat booking, book management, fine tracking, and live notifications via Socket.io.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons |
| Backend | Node.js, Express.js |
| Database | PostgreSQL via NeonDB |
| Real-Time | Socket.io |
| Auth | JWT (JSON Web Tokens) |
| Email | Nodemailer (Gmail SMTP) |
| Scheduler | node-cron |

---

## 📁 Project Structure

```
library-management-system/
├── backend/
│   ├── server.js                  # Express + Socket.io entry point
│   ├── .env.example               # Environment variable template
│   ├── package.json
│   └── src/
│       ├── config/db.js           # PostgreSQL connection pool
│       ├── db/init.js             # DB schema + seed script
│       ├── middleware/
│       │   ├── auth.js            # JWT middleware
│       │   └── errorHandler.js    # Global error handler
│       ├── routes/
│       │   ├── auth.js            # Login, Register, Profile
│       │   ├── books.js           # CRUD + Borrow/Return
│       │   ├── seats.js           # Seat booking + check-in
│       │   ├── borrow.js          # History + Fine payment
│       │   ├── admin.js           # Admin operations
│       │   └── notifications.js   # In-app notifications
│       ├── socket/
│       │   └── seatSocket.js      # Real-time seat events
│       └── utils/
│           ├── email.js           # Nodemailer templates
│           ├── fineCalculator.js  # Fine logic
│           └── cronJobs.js        # Scheduled tasks
│
└── frontend/
    ├── src/
    │   ├── App.jsx                # Routes
    │   ├── main.jsx               # Entry point
    │   ├── context/
    │   │   ├── AuthContext.jsx    # Global auth state
    │   │   └── SocketContext.jsx  # Socket.io connection
    │   ├── pages/
    │   │   ├── Landing.jsx        # Public homepage
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx      # Student dashboard
    │   │   ├── Books.jsx          # Book search & browse
    │   │   ├── Seats.jsx          # Live seat booking
    │   │   ├── BorrowHistory.jsx  # History + fine payment
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx
    │   │       ├── AdminBooks.jsx
    │   │       ├── AdminStudents.jsx
    │   │       ├── AdminBorrows.jsx
    │   │       ├── AdminSeats.jsx
    │   │       └── AdminFines.jsx
    │   ├── components/
    │   │   └── common/
    │   │       ├── Layout.jsx     # Student layout + nav
    │   │       ├── AdminLayout.jsx
    │   │       └── LoadingScreen.jsx
    │   └── utils/api.js           # Axios instance
    └── index.html
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- A NeonDB account (free tier works): https://neon.tech
- Gmail account for email notifications (optional)

---

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

#### Backend (`backend/.env`)
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development

# NeonDB connection string (get from neon.tech dashboard)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/library_db?sslmode=require

JWT_SECRET=your_very_long_random_secret_key_here

# Email (optional — for due date notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password  # Gmail App Password (not your regular password)

CLIENT_URL=http://localhost:5173

FINE_PER_DAY=5
BORROW_DAYS=7
SEAT_AUTO_RELEASE_MINUTES=30
```

#### Frontend (`frontend/.env`)
```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

### 3. Initialize Database

```bash
cd backend
node src/db/init.js
```

This will:
- Create all 7 tables (users, books, seats, seat_bookings, borrow_records, notifications, book_reservations)
- Seed 78 library seats across 4 sections (A, B, C, D)
- Create admin account: `admin@library.com` / `admin123`

---

### 4. Start Development Servers

**Backend:**
```bash
cd backend
npm run dev
# Starts on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm run dev
# Starts on http://localhost:5173
```

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | admin123 |
| Student | Register via /register | your choice |

---

## 📖 Feature Guide

### Students Can:
1. **Register/Login** — JWT-based auth with role detection
2. **Browse Books** — Search by title, author, ISBN; filter by genre; availability filter
3. **Reserve Books** — Mark interest in available books
4. **Book Seats** — Visual seat grid, pick time slots, real-time availability
5. **Check In/Out** — Confirm presence at booked seat
6. **View Borrow History** — See all past and current borrows with due date status
7. **Pay Fines** — Clear outstanding fine balance directly from dashboard
8. **Receive Notifications** — In-app bell icon with unread count + email reminders

### Admins Can:
1. **Dashboard** — Live stats: occupancy, borrows, overdue, fines pending
2. **Manage Books** — Add, edit, delete books; issue books to students
3. **Return Books** — Process book returns with automatic fine calculation
4. **Manage Students** — View profiles, toggle active status, clear fines, delete accounts
5. **Monitor Seats** — Live seat grid showing real-time occupancy for any date
6. **Fine Reports** — Summary stats, list of debtors, clear fines per student
7. **Send Reminders** — Trigger email + in-app notifications for due/overdue books

### System Automations:
- **Auto-release** seats not checked in within 30 minutes (configurable)
- **Daily cron** at 9 AM marks overdue books and sends email reminders
- **Fine accumulation** calculated dynamically on each API call
- **Real-time updates** via Socket.io — no page refresh needed for seat changes

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/change-password
```

### Books
```
GET    /api/books?search=&genre=&available=true&page=1
GET    /api/books/:id
POST   /api/books               (admin)
PUT    /api/books/:id           (admin)
DELETE /api/books/:id           (admin)
POST   /api/books/:id/borrow    (admin)
POST   /api/books/:id/return    (admin)
GET    /api/books/genres/list
```

### Seats
```
GET    /api/seats?date=&section=
POST   /api/seats/book
POST   /api/seats/checkin/:bookingId
POST   /api/seats/checkout/:bookingId
DELETE /api/seats/booking/:bookingId
GET    /api/seats/my-bookings
GET    /api/seats/stats          (admin)
```

### Borrow & Fines
```
GET  /api/borrow/my-history
GET  /api/borrow/active
GET  /api/borrow/all             (admin)
GET  /api/borrow/fine-report     (admin)
POST /api/borrow/pay-fine
POST /api/borrow/pay-fine/:userId (admin)
```

### Admin
```
GET  /api/admin/dashboard
GET  /api/admin/students
GET  /api/admin/students/:id
PUT  /api/admin/students/:id/toggle-active
DELETE /api/admin/students/:id
POST /api/admin/notifications/send-reminders
GET  /api/admin/seat-bookings?date=
```

---

## 🔌 Real-Time Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | client→server | Join user room |
| `joinSeatMonitor` | client→server | Subscribe to seat updates |
| `seatStatusUpdate` | server→client | Seat availability changed |
| `seatsRefresh` | server→client | Refresh all seats |
| `notification` | server→client | Push notification to user |
| `statsUpdated` | server→client | Admin dashboard refresh |
| `adminReleaseSeat` | client→server | Admin force-release |

---

## 🚢 Deployment

### Backend (Render / Railway / Heroku)
1. Set all environment variables from `.env.example`
2. Set `NODE_ENV=production`
3. Run `node src/db/init.js` once to initialize DB
4. Start command: `node server.js`

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL=https://your-backend-url.com`
2. Set `VITE_SOCKET_URL=https://your-backend-url.com`
3. Build command: `npm run build`
4. Output directory: `dist`

### NeonDB Setup
1. Go to https://neon.tech and create a free project
2. Copy the connection string
3. Add it as `DATABASE_URL` in backend `.env`

---

## 📄 License
MIT — Free to use and modify.
