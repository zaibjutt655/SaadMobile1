// ─── PURCHASES ────────────────────────────────────────────────────────────────
const purchaseRouter = require('express').Router();
const { Purchase, Product, AuditLog } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult }  = require('express-validator');

purchaseRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { period, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };

    if (req.user.role === 'seller') {
      const now = new Date(); const start = new Date();
      start.setHours(0,0,0,0);
      filter.createdAt = { $gte: start, $lte: now };
    } else if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
    }

    const skip = (parseInt(page)-1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Purchase.find(filter).populate('createdBy','name username')
        .populate('product','name category').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Purchase.countDocuments(filter),
    ]);
    res.json({ success: true, data, total });
  } catch (err) { next(err); }
});

purchaseRouter.post('/', authenticate, [
  body('productName').notEmpty(),
  body('quantity').isInt({ min: 1 }),
  body('purchasePrice').isFloat({ min: 0 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const purchase = await Purchase.create({ ...req.body, createdBy: req.user._id });

    // Update stock if product linked
    if (req.body.product) {
      await Product.findByIdAndUpdate(req.body.product, { $inc: { stock: req.body.quantity } });
    }

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'CREATE', module: 'purchase', targetId: purchase._id,
      description: `Purchase: ${purchase.productName} x${purchase.quantity}`, ip: req.ip,
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (err) { next(err); }
});

purchaseRouter.delete('/:id', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    await Purchase.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ success: true, message: 'Purchase deleted' });
  } catch (err) { next(err); }
});

module.exports.purchaseRouter = purchaseRouter;

// ─── SERVICES ─────────────────────────────────────────────────────────────────
const serviceRouter = require('express').Router();
const { Service } = require('../models');

serviceRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.status) filter.status = req.query.status;
    const data = await Service.find(filter)
      .populate('createdBy','name').populate('customer','name phone')
      .sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

serviceRouter.post('/', authenticate, [
  body('type').isIn(['repair','software','other']),
  body('description').notEmpty(),
  body('charge').isFloat({ min: 0 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const svc = await Service.create({ ...req.body, createdBy: req.user._id });
    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'CREATE', module: 'service', targetId: svc._id,
      description: `Service job created: ${svc.description}`, ip: req.ip,
    });
    res.status(201).json({ success: true, data: svc });
  } catch (err) { next(err); }
});

serviceRouter.put('/:id', authenticate, authorize('owner','manager'), async (req, res, next) => {
  try {
    const svc = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!svc) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: svc });
  } catch (err) { next(err); }
});

serviceRouter.delete('/:id', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    await Service.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) { next(err); }
});

module.exports.serviceRouter = serviceRouter;

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
const customerRouter = require('express').Router();
const { Customer } = require('../models');

customerRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    const data = await Customer.find(filter).sort({ name: 1 }).limit(200);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

customerRouter.post('/', authenticate, [body('name').notEmpty()], async (req, res, next) => {
  try {
    const cust = await Customer.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: cust });
  } catch (err) { next(err); }
});

customerRouter.put('/:id', authenticate, authorize('owner','manager'), async (req, res, next) => {
  try {
    const cust = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: cust });
  } catch (err) { next(err); }
});

module.exports.customerRouter = customerRouter;

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
const expenseRouter = require('express').Router();
const { Expense } = require('../models');

expenseRouter.get('/', authenticate, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { isDeleted: false };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
    }
    const data = await Expense.find(filter).populate('createdBy','name').sort({ date: -1 }).limit(200);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

expenseRouter.post('/', authenticate, authorize('owner','manager'), [
  body('category').isIn(['rent','electricity','salary','internet','supplies','other']),
  body('description').notEmpty(),
  body('amount').isFloat({ min: 0 }),
], async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: expense });
  } catch (err) { next(err); }
});

expenseRouter.delete('/:id', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    await Expense.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { next(err); }
});

module.exports.expenseRouter = expenseRouter;
