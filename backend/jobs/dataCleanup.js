const { Sale, Purchase, Service, Expense, AuditLog } = require('../models');
// NOTE: Product, UsedMobile, Customer are NEVER touched by this job

/**
 * runDataCleanup
 * Deletes non-critical data older than 1 year.
 * NEVER deletes: Products, Used Mobiles, Customers
 * SAFE to delete: old closed sales, purchases, services, expenses, audit logs
 */
const runDataCleanup = async () => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const filter = {
    isDeleted: true,           // only already soft-deleted records
    isClosed:  true,           // only closed/locked records
    createdAt: { $lt: oneYearAgo },
  };

  const auditFilter = {
    createdAt: { $lt: oneYearAgo },
  };

  try {
    const [sales, purchases, services, expenses, auditLogs] = await Promise.all([
      Sale.deleteMany(filter),
      Purchase.deleteMany(filter),
      Service.deleteMany(filter),
      Expense.deleteMany(filter),
      AuditLog.deleteMany(auditFilter),   // audit logs > 1 year
    ]);

    const summary = {
      sales:     sales.deletedCount,
      purchases: purchases.deletedCount,
      services:  services.deletedCount,
      expenses:  expenses.deletedCount,
      auditLogs: auditLogs.deletedCount,
      runAt:     new Date().toISOString(),
    };

    console.log('[DataCleanup] ✅ Cleanup complete:', summary);
    return summary;
  } catch (err) {
    console.error('[DataCleanup] ❌ Error during cleanup:', err.message);
    throw err;
  }
};

module.exports = { runDataCleanup };
