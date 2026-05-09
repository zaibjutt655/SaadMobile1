const router  = require('express').Router();
const { body, validationResult } = require('express-validator');
const { Product, AuditLog }      = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/products
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Product.find(filter).populate('createdBy', 'name username')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
      .populate('createdBy', 'name username');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// POST /api/products  — owner, manager
router.post('/', authenticate, authorize('owner', 'manager'), [
  body('name').trim().notEmpty(),
  body('category').isIn(['accessory', 'protector', 'cover', 'other']),
  body('purchasePrice').isFloat({ min: 0 }),
  body('salePrice').isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const product = await Product.create({ ...req.body, createdBy: req.user._id });

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'CREATE', module: 'product', targetId: product._id,
      description: `Created product "${product.name}"`, ip: req.ip,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
});

// PUT /api/products/:id  — owner, manager
router.put('/:id', authenticate, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'UPDATE', module: 'product', targetId: product._id,
      description: `Updated product "${product.name}"`, ip: req.ip,
    });

    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id  (soft delete) — owner only
router.delete('/:id', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, { isDeleted: true }, { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'DELETE', module: 'product', targetId: product._id,
      description: `Soft-deleted product "${product.name}"`, ip: req.ip,
    });

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
