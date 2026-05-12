const router  = require('express').Router();
const { body, validationResult }   = require('express-validator');
const { Sale, Product, UsedMobile, Service, AuditLog } = require('../models');
const { authenticate, authorize }  = require('../middleware/auth');
const { notifySale, notifyLowStock } = require('../services/emailService');

// Helper: date range
const getDateRange = (period) => {
  const now   = new Date();
  const start = new Date();
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'yesterday') {
    start.setDate(now.getDate() - 1); start.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() - 1);   now.setHours(23, 59, 59, 999);
  } else if (period === 'last7') {
    start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0);
  }
  return { $gte: start, $lte: now };
};

// GET /api/sales
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { period, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };

    if (req.user.role === 'seller') {
      const allowed = ['today', 'yesterday', 'last7'];
      const p = allowed.includes(period) ? period : 'today';
      filter.createdAt = getDateRange(p);
    } else if (period && period !== 'all') {
      filter.createdAt = getDateRange(period);
    } else if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Sale.find(filter)
        .populate('createdBy', 'name username')
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Sale.countDocuments(filter),
    ]);

    const sanitized = req.user.role === 'seller'
      ? data.map(s => {
          const obj = s.toObject();
          delete obj.totalProfit;
          obj.items = obj.items.map(i => { delete i.profit; delete i.purchasePrice; return i; });
          return obj;
        })
      : data;

    res.json({ success: true, data: sanitized, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/sales/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, isDeleted: false })
      .populate('createdBy', 'name username').populate('customer', 'name phone');
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) { next(err); }
});

// POST /api/sales  — all roles can create
router.post('/', authenticate, [
  body('items').isArray({ min: 1 }),
  body('items.*.itemType').isIn(['product', 'mobile', 'service']),
  body('items.*.salePrice').isFloat({ min: 0 }),
  body('items.*.quantity').optional().isInt({ min: 1 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const enrichedItems = [];
    let totalAmount = 0;
    let totalProfit = 0;

    for (const item of req.body.items) {
      let purchasePrice = item.purchasePrice || 0;
      let name = item.name || '';

      if (item.itemType === 'product' && item.product) {
        const p = await Product.findById(item.product);
        if (!p) return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
        purchasePrice = p.purchasePrice;
        name = p.name;
        const newStock = p.stock - (item.quantity || 1);
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -(item.quantity || 1) } });
        // Low stock check — notify if stock drops to 5 or below
        if (newStock <= 5 && newStock >= 0) {
          notifyLowStock(p.name, newStock)
            .catch((err) => console.error('LOW_STOCK_EMAIL_ERROR:', err.message));
        }
      } else if (item.itemType === 'mobile' && item.usedMobile) {
        const m = await UsedMobile.findById(item.usedMobile);
        if (!m) return res.status(400).json({ success: false, message: 'Mobile not found' });
        if (m.status === 'sold') return res.status(400).json({ success: false, message: `Mobile IMEI ${m.imei} already sold` });
        purchasePrice = m.purchasePrice;
        name = `${m.brand} ${m.model} (${m.imei})`;
        await UsedMobile.findByIdAndUpdate(item.usedMobile, {
          status: 'sold', salePrice: item.salePrice,
          soldTo: req.body.customer || null, soldAt: new Date(),
        });
      } else if (item.itemType === 'service') {
        purchasePrice = 0;
        name = item.name || 'Service';
      }

      const qty    = item.quantity || 1;
      const amount = item.salePrice * qty;
      const profit = (item.salePrice - purchasePrice) * qty;
      totalAmount += amount;
      totalProfit += profit;

      const cleanItem = { ...item, purchasePrice, name, quantity: qty };
      if (!cleanItem.product    || cleanItem.product === '')    delete cleanItem.product;
      if (!cleanItem.usedMobile || cleanItem.usedMobile === '') delete cleanItem.usedMobile;
      if (!cleanItem.service    || cleanItem.service === '')    delete cleanItem.service;

      enrichedItems.push(cleanItem);
    }

    const sale = await Sale.create({
      customer:      req.body.customer,
      customerName:  req.body.customerName,
      items:         enrichedItems,
      totalAmount:   totalAmount - (req.body.discount || 0),
      totalProfit:   totalProfit,
      discount:      req.body.discount || 0,
      paymentMethod: req.body.paymentMethod || 'cash',
      notes:         req.body.notes,
      createdBy:     req.user._id,
    });

    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'CREATE', module: 'sale', targetId: sale._id,
      description: `Created sale ${sale.saleNumber} — Rs ${sale.totalAmount}`, ip: req.ip,
    });

    // ── Response first — email completely detached ───────────────────────────
    res.status(201).json({ success: true, data: sale });

    // Email fires AFTER response is sent — zero impact on speed
    setImmediate(() => {
      notifySale(sale, req.user.name || req.user.username)
        .then(() => console.log('EMAIL_SENT:', sale.saleNumber))
        .catch((err) => console.error('EMAIL_ERROR:', err.message));
    });
  } catch (err) { next(err); }
});

// PUT /api/sales/:id  — OWNER ONLY
router.put('/:id', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, isDeleted: false });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    const updated = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'UPDATE', module: 'sale', targetId: sale._id,
      description: `Owner updated sale ${sale.saleNumber}`, ip: req.ip,
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/sales/:id  — OWNER ONLY
router.delete('/:id', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    await AuditLog.create({
      user: req.user._id, username: req.user.username,
      action: 'DELETE', module: 'sale', targetId: sale._id,
      description: `Owner soft-deleted sale ${sale.saleNumber}`, ip: req.ip,
    });
    res.json({ success: true, message: 'Sale deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
