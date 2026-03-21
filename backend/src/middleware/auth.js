const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await db.query(
      'SELECT id, name, email, role, student_id, fine_balance, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!rows[0]) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

module.exports = { protect, adminOnly, generateToken };
