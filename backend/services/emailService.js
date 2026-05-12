// backend/services/emailService.js
const nodemailer = require('nodemailer');

// ── Create transporter ─────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });
};

// ── Format currency ────────────────────────────────────────────────────────────
const fmt = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;

// ── Format date ────────────────────────────────────────────────────────────────
const fmtDate = () => new Date().toLocaleString('en-PK', {
  timeZone: 'Asia/Karachi',
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

// ── Send email helper ──────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  // If email not configured, silently skip
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.OWNER_EMAIL) {
    console.log('📧 Email not configured — skipping notification');
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Mobile Shop 📱" <${process.env.EMAIL_USER}>`,
      to: to || process.env.OWNER_EMAIL,
      subject,
      html,
    });
    console.log(`📧 Email sent: ${subject}`);
  } catch (err) {
    // Never throw — email failure should NOT break the API response
    console.error('📧 Email error:', err.message);
  }
};

// ── Base email template ────────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; }
    .wrapper { max-width: 520px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { padding: 24px; text-align: center; }
    .body { padding: 20px 24px; }
    .footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #6b7280; }
    .value { color: #111827; font-weight: 500; }
    .total-row { padding: 14px 16px; background: #f0fdf4; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
    .total-label { color: #166534; font-weight: 600; font-size: 15px; }
    .total-value { color: #166534; font-weight: 800; font-size: 20px; }
    .item-card { background: #f9fafb; border-radius: 10px; padding: 12px; margin-bottom: 8px; font-size: 13px; }
    .item-name { font-weight: 600; color: #111827; margin-bottom: 4px; }
    .item-meta { color: #6b7280; }
    h2 { color: #111827; font-size: 18px; margin-bottom: 4px; }
    p.sub { color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    ${content}
    <div class="footer">
      <p style="color:#9ca3af;font-size:12px;">📱 Mobile Shop POS • ${fmtDate()}</p>
    </div>
  </div>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. NEW SALE NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
const notifySale = async (sale, sellerName) => {
  const itemsHtml = (sale.items || []).map(item => `
    <div class="item-card">
      <div class="item-name">${item.name || 'Item'}</div>
      <div class="item-meta">
        ${item.itemType === 'product' ? '🏷️ Product' : item.itemType === 'mobile' ? '📱 Mobile' : '🔧 Service'}
        &nbsp;•&nbsp; Qty: ${item.quantity || 1}
        &nbsp;•&nbsp; ${fmt(item.salePrice)} each
      </div>
    </div>
  `).join('');

  const html = baseTemplate(`
    <div class="header" style="background: linear-gradient(135deg, #4f46e5, #7c3aed);">
      <p style="font-size:32px;margin-bottom:8px;">🛒</p>
      <h2 style="color:white;">New Sale Recorded!</h2>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;">${sale.saleNumber}</p>
    </div>
    <div class="body">
      <div class="row"><span class="label">Seller</span><span class="value">👤 ${sellerName}</span></div>
      <div class="row"><span class="label">Customer</span><span class="value">${sale.customerName || 'Walk-in'}</span></div>
      <div class="row"><span class="label">Payment</span><span class="value">${sale.paymentMethod?.toUpperCase()}</span></div>
      ${sale.discount > 0 ? `<div class="row"><span class="label">Discount</span><span class="value" style="color:#ef4444;">- ${fmt(sale.discount)}</span></div>` : ''}

      <p style="font-size:13px;font-weight:600;color:#374151;margin:16px 0 8px;">Items</p>
      ${itemsHtml}

      <div class="total-row">
        <span class="total-label">Total Amount</span>
        <span class="total-value">${fmt(sale.totalAmount)}</span>
      </div>

      ${sale.totalProfit ? `
      <div style="margin-top:8px;padding:10px 16px;background:#eff6ff;border-radius:10px;display:flex;justify-content:space-between;">
        <span style="color:#1e40af;font-weight:600;font-size:14px;">Profit</span>
        <span style="color:#1e40af;font-weight:700;font-size:16px;">${fmt(sale.totalProfit)}</span>
      </div>` : ''}
    </div>
  `);

  await sendEmail({
    subject: `🛒 New Sale ${sale.saleNumber} — ${fmt(sale.totalAmount)}`,
    html,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. NEW PRODUCT NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
const notifyProduct = async (product, addedBy) => {
  const profit    = (product.salePrice - product.purchasePrice).toFixed(0);
  const marginPct = product.purchasePrice > 0
    ? (((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100).toFixed(0)
    : 0;

  const html = baseTemplate(`
    <div class="header" style="background: linear-gradient(135deg, #059669, #10b981);">
      <p style="font-size:32px;margin-bottom:8px;">🏷️</p>
      <h2 style="color:white;">New Product Added!</h2>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;">Inventory updated</p>
    </div>
    <div class="body">
      <h2 style="font-size:20px;margin-bottom:4px;">${product.name}</h2>
      <p class="sub" style="margin-bottom:16px;">${product.category} ${product.sku ? `• SKU: ${product.sku}` : ''}</p>

      <div class="row"><span class="label">Added By</span><span class="value">👤 ${addedBy}</span></div>
      <div class="row"><span class="label">Purchase Price</span><span class="value">${fmt(product.purchasePrice)}</span></div>
      <div class="row"><span class="label">Sale Price</span><span class="value">${fmt(product.salePrice)}</span></div>
      <div class="row"><span class="label">Stock</span><span class="value">${product.stock || 0} units</span></div>

      <div class="total-row" style="background:#f0fdf4;">
        <span class="total-label">Profit per Unit</span>
        <span class="total-value">${fmt(profit)} <span style="font-size:14px;font-weight:500;">(${marginPct}%)</span></span>
      </div>
    </div>
  `);

  await sendEmail({
    subject: `🏷️ New Product Added — ${product.name}`,
    html,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. LOW STOCK NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
const notifyLowStock = async (productName, stock) => {
  const html = baseTemplate(`
    <div class="header" style="background: linear-gradient(135deg, #dc2626, #f97316);">
      <p style="font-size:32px;margin-bottom:8px;">⚠️</p>
      <h2 style="color:white;">Low Stock Alert!</h2>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;">Reorder needed</p>
    </div>
    <div class="body">
      <div class="row"><span class="label">Product</span><span class="value">${productName}</span></div>
      <div class="row">
        <span class="label">Remaining Stock</span>
        <span class="value" style="color:#dc2626;font-size:18px;font-weight:800;">${stock} units</span>
      </div>
      <div style="margin-top:16px;padding:14px;background:#fef2f2;border-radius:12px;border-left:4px solid #dc2626;">
        <p style="color:#991b1b;font-size:13px;">Please reorder soon to avoid stockout!</p>
      </div>
    </div>
  `);

  await sendEmail({
    subject: `⚠️ Low Stock: ${productName} (${stock} left)`,
    html,
  });
};

module.exports = { notifySale, notifyProduct, notifyLowStock };
