const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, AuditLog }         = require('../models');
const { authenticate }           = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase(), isActive: true });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Audit log
    await AuditLog.create({
      user: user._id, username: user.username,
      action: 'LOGIN', module: 'auth',
      description: `${user.username} logged in`, ip: req.ip,
    });

    const token = signToken(user._id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
});

// PUT /api/auth/change-password  (user changes own password)
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Min 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();

    await AuditLog.create({
      user: user._id, username: user.username,
      action: 'CHANGE_PASSWORD', module: 'auth',
      description: `${user.username} changed own password`, ip: req.ip,
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

// POST /api/auth/seed  — create initial owner (only works if no users exist)
router.post('/seed', async (req, res, next) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res.status(403).json({ success: false, message: 'System already initialized' });
    }
    const owner = await User.create({
      name: 'Owner',
      username: req.body.username || 'owner',
      password: req.body.password || 'owner1234',
      role: 'owner',
    });
    res.json({ success: true, message: 'Owner account created', username: owner.username });
  } catch (err) { next(err); }
});

module.exports = router;
