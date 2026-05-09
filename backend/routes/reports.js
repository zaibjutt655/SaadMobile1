const router  = require('express').Router();
const { Sale, Purchase, Service, Expense, DailyClosing } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Helper: build date filter
const buildDateFilter = (period, startDate, endDate) => {
  const now   = new Date();
  const start = new Date();

  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
    return { $gte: start, $lte: now };
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7);
    return { $gte: start, $lte: now };
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { $gte: start, $lte: now };
  } else if (startDate && endDate) {
    return { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
  }
  // default: this month
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return { $gte: start, $lte: now };
};

// GET /api/reports/summary  — owner and manager only
router.get('/summary', authenticate, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(period, startDate, endDate);

    const [salesAgg, purchasesAgg, servicesAgg, expensesAgg] = await Promise.all([
      // Sales: total revenue + profit + breakdown
      Sale.aggregate([
        { $match: { isDeleted: false, createdAt: dateFilter } },
        { $unwind: '$items' },
        { $group: {
            _id: '$items.itemType',
            totalSales:  { $sum: { $multiply: ['$items.salePrice', '$items.quantity'] } },
            totalProfit: { $sum: '$items.profit' },
            count:       { $sum: 1 },
        }},
      ]),

      // Purchases: total cost
      Purchase.aggregate([
        { $match: { isDeleted: false, createdAt: dateFilter } },
        { $group: {
            _id: null,
            totalCost: { $sum: '$totalCost' },
            count:     { $sum: 1 },
        }},
      ]),

      // Services: total income (= 100% profit)
      Service.aggregate([
        { $match: { isDeleted: false, status: 'completed', createdAt: dateFilter } },
        { $group: {
            _id: null,
            totalIncome: { $sum: '$charge' },
            count:       { $sum: 1 },
        }},
      ]),

      // Expenses: total
      Expense.aggregate([
        { $match: { isDeleted: false, createdAt: dateFilter } },
        { $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
        }},
      ]),
    ]);

    // Reshape sales by type
    const salesByType = { product: 0, mobile: 0, service: 0 };
    const profitByType = { product: 0, mobile: 0, service: 0 };
    let totalSales = 0;
    let totalProfit = 0;

    salesAgg.forEach(item => {
      salesByType[item._id]  = item.totalSales;
      profitByType[item._id] = item.totalProfit;
      totalSales  += item.totalSales;
      totalProfit += item.totalProfit;
    });

    // Add service income to totals
    const serviceIncome = servicesAgg[0]?.totalIncome || 0;
    totalSales  += serviceIncome;
    totalProfit += serviceIncome;

    const totalPurchases = purchasesAgg[0]?.totalCost || 0;
    const totalExpenses  = expensesAgg.reduce((s, e) => s + e.total, 0);

    res.json({
      success: true,
      data: {
        period,
        totalSales,
        totalProfit,
        totalPurchases,
        totalExpenses,
        netProfit: totalProfit - totalExpenses,
        breakdown: {
          productSales:   salesByType.product,
          mobileSales:    salesByType.mobile,
          serviceIncome,
          productProfit:  profitByType.product,
          mobileProfit:   profitByType.mobile,
        },
        expenses: expensesAgg,
        serviceSummary: servicesAgg[0] || {},
      },
    });
  } catch (err) { next(err); }
});

// GET /api/reports/daily  — list of daily closings
router.get('/daily', authenticate, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const closings = await DailyClosing.find().sort({ date: -1 }).limit(60);
    res.json({ success: true, data: closings });
  } catch (err) { next(err); }
});

// GET /api/reports/top-products
router.get('/top-products', authenticate, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { period } = req.query;
    const dateFilter = buildDateFilter(period);
    const data = await Sale.aggregate([
      { $match: { isDeleted: false, createdAt: dateFilter } },
      { $unwind: '$items' },
      { $match: { 'items.itemType': 'product' } },
      { $group: {
          _id: '$items.product',
          name:   { $first: '$items.name' },
          qty:    { $sum: '$items.quantity' },
          revenue:{ $sum: { $multiply: ['$items.salePrice', '$items.quantity'] } },
          profit: { $sum: '$items.profit' },
      }},
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;
