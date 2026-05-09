const router  = require('express').Router();
const { body, validationResult } = require('express-validator');
const { User, AuditLog }         = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/staff  — owner sees all, manager sees sellers only
router.get('/', authenticate, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const filter = req.user.role === 'manager' ? { role: 'seller' } : {};
    const staff  = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: staff });
  } catch (err) { next(err); }
});

// POST /api/staff  — owner creates any role, manager creates seller only
router.post('/', authenticate, authorize('owner', 'manager'), [
  body('name').trim().notEmpty(),
  body('username').trim().notEmpty().isLength({ min: 3 }),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['owner', 'manager', 'seller']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    // Manager can only create sellers
    if (req.user.role === 'manager' && req.body.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Managers can only create sellers' });
    }

    const exists = await User.findOne({ username: req.body.username.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'Username already taken' });

    const user = await User.create({
      name:      req.body.name,
      username:  req.body.username,
      password:  req.body.password,
      role:      req.body.role,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'CREATE', module: 'user',
      targetId: user._id,
      description: `Created user ${user.username} (${user.role})`, ip: req.ip,
    });

    res.status(201).json({ success: true, data: user.toSafeObject() });
  } catch (err) { next(err); }
});

// PUT /api/staff/:id  — owner only: update name, username, password, role, isActive
router.put('/:id', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, username, password, role, isActive } = req.body;
    if (name)     user.name     = name;
    if (username) {
      const taken = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
      if (taken) return res.status(400).json({ success: false, message: 'Username taken' });
      user.username = username;
    }
    if (password)            user.password = password;
    if (role)                user.role     = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'UPDATE', module: 'user', targetId: user._id,
      description: `Updated user ${user.username}`, ip: req.ip,
    });

    res.json({ success: true, data: user.toSafeObject() });
  } catch (err) { next(err); }
});

// DELETE /api/staff/:id  (soft deactivate) — owner only
router.delete('/:id', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'DEACTIVATE', module: 'user', targetId: user._id,
      description: `Deactivated user ${user.username}`, ip: req.ip,
    });

    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
