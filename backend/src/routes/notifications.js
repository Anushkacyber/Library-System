const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [req.user.id]);
    res.json({ success: true, notifications: rows, unread: rows.filter(n => !n.is_read).length });
  } catch (err) { next(err); }
});

router.put('/read-all', protect, async (req, res, next) => {
  try { await db.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]); res.json({ success: true }); }
  catch (err) { next(err); }
});

router.put('/:id/read', protect, async (req, res, next) => {
  try { await db.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]); res.json({ success: true }); }
  catch (err) { next(err); }
});

module.exports = router;
