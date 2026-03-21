require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./src/middleware/errorHandler');
const setupSocket = require('./src/socket/seatSocket');
const setupCronJobs = require('./src/utils/cronJobs');

// Routes
const authRoutes = require('./src/routes/auth');
const bookRoutes = require('./src/routes/books');
const seatRoutes = require('./src/routes/seats');
const borrowRoutes = require('./src/routes/borrow');
const adminRoutes = require('./src/routes/admin');
const notificationRoutes = require('./src/routes/notifications');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// Make io accessible in routes
app.set('io', io);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts' },
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to LibraFlow API',
    status: 'Running',
    version: '1.0.0',
    documentation: '/api-docs', // placeholder
    health: '/health'
  });
});

// Serve empty favicon to prevent 404 errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Setup Socket.io events
setupSocket(io);

// Setup Cron jobs
setupCronJobs(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Library Management System Backend`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 http://localhost:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
