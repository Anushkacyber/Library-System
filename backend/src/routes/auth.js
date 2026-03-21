const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { protect, generateToken } = require('../middleware/auth');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, student_id, phone, department } = req.body;

    // Check if user exists
    const userExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows[0]) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      'INSERT INTO users (name, email, password, student_id, phone, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, student_id',
      [name, email, hashedPassword, student_id, phone, department]
    );

    const token = generateToken(rows[0].id);

    res.status(201).json({
      success: true,
      token,
      user: rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateToken(user.id);

    const { password: _, ...userData } = user;

    res.json({
      success: true,
      token,
      user: userData
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone, department } = req.body;

    const { rows } = await db.query(
      'UPDATE users SET name = $1, phone = $2, department = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, email, role, student_id, phone, department, fine_balance',
      [name, phone, department, req.user.id]
    );

    res.json({
      success: true,
      user: rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { rows } = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
