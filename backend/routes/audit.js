const router  = require('express').Router();
const { AuditLog } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/audit  — owner and manager
router.get('/', authenticate, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { module, username, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (module)   filter.module   = module;
    if (username) filter.username = { $regex: username, $options: 'i' };
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

module.exports = router;
