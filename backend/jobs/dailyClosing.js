const { Sale, Purchase, Service, Expense, DailyClosing } = require('../models');

/**
 * runDailyClosing
 * Aggregates the day's data, writes a DailyClosing record,
 * and locks all records created today (sets isClosed = true).
 * @param {string} closedBy  - 'system' or a username (manual trigger)
 */
const runDailyClosing = async (closedBy = 'system') => {
  const now   = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // Avoid duplicate closing for the same date
  const existing = await DailyClosing.findOne({ dateStr: todayStr });
  if (existing) {
    console.log(`[DailyClosing] Already closed for ${todayStr}`);
    return existing;
  }

  const dateRange = { $gte: today, $lte: now };

  // Aggregate today's data
  const [salesAgg, purchasesAgg, servicesAgg, expensesAgg] = await Promise.all([
    Sale.aggregate([
      { $match: { isDeleted: false, createdAt: dateRange } },
      { $group: {
          _id: null,
          totalSales:  { $sum: '$totalAmount' },
          totalProfit: { $sum: '$totalProfit' },
          count:       { $sum: 1 },
      }},
    ]),
    Purchase.aggregate([
      { $match: { isDeleted: false, createdAt: dateRange } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' } }},
    ]),
    Service.aggregate([
      { $match: { isDeleted: false, status: 'completed', createdAt: dateRange } },
      { $group: { _id: null, totalIncome: { $sum: '$charge' } }},
    ]),
    Expense.aggregate([
      { $match: { isDeleted: false, createdAt: dateRange } },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } }},
    ]),
  ]);

  // Lock all today's records
  await Promise.all([
    Sale.updateMany(    { createdAt: dateRange, isClosed: false }, { isClosed: true, closingDate: now }),
    Purchase.updateMany({ createdAt: dateRange, isClosed: false }, { isClosed: true }),
    Service.updateMany( { createdAt: dateRange, isClosed: false }, { isClosed: true }),
    Expense.updateMany( { createdAt: dateRange, isClosed: false }, { isClosed: true }),
  ]);

  // Create closing record
  const closing = await DailyClosing.create({
    date:           today,
    dateStr:        todayStr,
    totalSales:     salesAgg[0]?.totalSales    || 0,
    totalProfit:    salesAgg[0]?.totalProfit   || 0,
    totalPurchases: purchasesAgg[0]?.totalCost || 0,
    totalServices:  servicesAgg[0]?.totalIncome || 0,
    totalExpenses:  expensesAgg[0]?.totalExpenses || 0,
    saleCount:      salesAgg[0]?.count         || 0,
    closedBy,
    isClosed: true,
  });

  console.log(`[DailyClosing] ✅ Closed ${todayStr} | Sales: ${closing.totalSales} | Profit: ${closing.totalProfit}`);
  return closing;
};

module.exports = { runDailyClosing };
