const router = require('express').Router();
const XLSX   = require('xlsx');
const { Sale, Purchase, Product, UsedMobile, Service, Customer, Expense } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/backup/json  — full JSON export
router.get('/json', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    const [sales, purchases, products, mobiles, services, customers, expenses] = await Promise.all([
      Sale.find({ isDeleted: false }).lean(),
      Purchase.find({ isDeleted: false }).lean(),
      Product.find({ isDeleted: false }).lean(),
      UsedMobile.find({ isDeleted: false }).lean(),
      Service.find({ isDeleted: false }).lean(),
      Customer.find({ isDeleted: false }).lean(),
      Expense.find({ isDeleted: false }).lean(),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      counts: { sales: sales.length, purchases: purchases.length, products: products.length,
                mobiles: mobiles.length, services: services.length, customers: customers.length },
      sales, purchases, products, mobiles, services, customers, expenses,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${Date.now()}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) { next(err); }
});

// GET /api/backup/excel  — Excel export with multiple sheets
router.get('/excel', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    const [sales, purchases, products, mobiles, services, customers, expenses] = await Promise.all([
      Sale.find({ isDeleted: false }).lean(),
      Purchase.find({ isDeleted: false }).lean(),
      Product.find({ isDeleted: false }).lean(),
      UsedMobile.find({ isDeleted: false }).lean(),
      Service.find({ isDeleted: false }).lean(),
      Customer.find({ isDeleted: false }).lean(),
      Expense.find({ isDeleted: false }).lean(),
    ]);

    const wb = XLSX.utils.book_new();

    // Sales sheet
    const salesFlat = sales.map(s => ({
      'Sale Number': s.saleNumber,
      'Date':        new Date(s.createdAt).toLocaleDateString(),
      'Customer':    s.customerName || '',
      'Total':       s.totalAmount,
      'Profit':      s.totalProfit,
      'Discount':    s.discount,
      'Payment':     s.paymentMethod,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesFlat), 'Sales');

    // Products sheet
    const productsFlat = products.map(p => ({
      'Name': p.name, 'Category': p.category,
      'Purchase Price': p.purchasePrice, 'Sale Price': p.salePrice, 'Stock': p.stock,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsFlat), 'Products');

    // Used Mobiles sheet
    const mobilesFlat = mobiles.map(m => ({
      'IMEI': m.imei, 'Brand': m.brand, 'Model': m.model,
      'Purchase Price': m.purchasePrice, 'Sale Price': m.salePrice || '',
      'Status': m.status, 'Condition': m.condition,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mobilesFlat), 'Used Mobiles');

    // Purchases sheet
    const purchasesFlat = purchases.map(p => ({
      'Number': p.purchaseNumber, 'Product': p.productName,
      'Qty': p.quantity, 'Price': p.purchasePrice, 'Total': p.totalCost,
      'Supplier': p.supplier || '', 'Date': new Date(p.createdAt).toLocaleDateString(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchasesFlat), 'Purchases');

    // Services sheet
    const servicesFlat = services.map(s => ({
      'Number': s.serviceNumber, 'Type': s.type,
      'Description': s.description, 'Charge': s.charge,
      'Status': s.status, 'Customer': s.customerName || '',
      'Date': new Date(s.createdAt).toLocaleDateString(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(servicesFlat), 'Services');

    // Customers sheet
    const customersFlat = customers.map(c => ({
      'Name': c.name, 'Phone': c.phone || '', 'Email': c.email || '', 'Address': c.address || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customersFlat), 'Customers');

    // Expenses sheet
    const expensesFlat = expenses.map(e => ({
      'Category': e.category, 'Description': e.description,
      'Amount': e.amount, 'Date': new Date(e.date).toLocaleDateString(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesFlat), 'Expenses');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${Date.now()}.xlsx"`);
    res.send(buf);
  } catch (err) { next(err); }
});

module.exports = router;
