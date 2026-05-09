const router  = require('express').Router();
const { body, validationResult }  = require('express-validator');
const { UsedMobile, Customer, AuditLog } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/mobiles
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$text = { $search: search };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      UsedMobile.find(filter)
        .populate('createdBy', 'name username')
        .populate('soldTo', 'name phone')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      UsedMobile.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/mobiles/imei/:imei  — search by IMEI
router.get('/imei/:imei', authenticate, async (req, res, next) => {
  try {
    const mobile = await UsedMobile.findOne({ imei: req.params.imei, isDeleted: false })
      .populate('soldTo', 'name phone');
    if (!mobile) return res.status(404).json({ success: false, message: 'IMEI not found' });
    res.json({ success: true, data: mobile });
  } catch (err) { next(err); }
});

// GET /api/mobiles/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const mobile = await UsedMobile.findOne({ _id: req.params.id, isDeleted: false })
      .populate('soldTo', 'name phone').populate('createdBy', 'name username');
    if (!mobile) return res.status(404).json({ success: false, message: 'Mobile not found' });
    res.json({ success: true, data: mobile });
  } catch (err) { next(err); }
});

// POST /api/mobiles  — owner, manager
router.post('/', authenticate, authorize('owner', 'manager'), [
  body('imei').trim().notEmpty().isLength({ min: 10 }),
  body('brand').trim().notEmpty(),
  body('model').trim().notEmpty(),
  body('purchasePrice').isFloat({ min: 0 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const exists = await UsedMobile.findOne({ imei: req.body.imei });
    if (exists) return res.status(400).json({ success: false, message: 'IMEI already registered' });

    const mobile = await UsedMobile.create({ ...req.body, createdBy: req.user._id });

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'CREATE', module: 'usedMobile', targetId: mobile._id,
      description: `Registered mobile IMEI ${mobile.imei} (${mobile.brand} ${mobile.model})`,
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: mobile });
  } catch (err) { next(err); }
});

// PUT /api/mobiles/:id  — owner, manager
router.put('/:id', authenticate, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const mobile = await UsedMobile.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!mobile) return res.status(404).json({ success: false, message: 'Mobile not found' });

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'UPDATE', module: 'usedMobile', targetId: mobile._id,
      description: `Updated mobile IMEI ${mobile.imei}`, ip: req.ip,
    });

    res.json({ success: true, data: mobile });
  } catch (err) { next(err); }
});

// DELETE /api/mobiles/:id  (soft delete) — owner only
router.delete('/:id', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    const mobile = await UsedMobile.findByIdAndUpdate(
      req.params.id, { isDeleted: true }, { new: true }
    );
    if (!mobile) return res.status(404).json({ success: false, message: 'Mobile not found' });

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'DELETE', module: 'usedMobile', targetId: mobile._id,
      description: `Soft-deleted mobile IMEI ${mobile.imei}`, ip: req.ip,
    });

    res.json({ success: true, message: 'Mobile deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
