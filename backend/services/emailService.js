const nodemailer = require('nodemailer');

const fmt = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');

// ── Single reusable transporter (connection pooling) ───────────────────────────
// Created once, reused for all emails — much faster than creating each time
let _transporter = null;
const getTransporter = () => {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,          // connection pool — reuse connections
    maxConnections: 3,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return _transporter;
};

// ── Send email — fire and forget, never blocks API ────────────────────────────
const sendEmail = async (subject, htmlBody) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.OWNER_EMAIL) {
    console.log('EMAIL_SKIP: env vars missing');
    return;
  }
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: '"Mobile Shop" <' + process.env.EMAIL_USER + '>',
      to: process.env.OWNER_EMAIL,
      subject: subject,
      html: htmlBody,
    });
    console.log('EMAIL_OK:', info.messageId);
  } catch (err) {
    console.error('EMAIL_FAIL:', err.message, '| code:', err.code);
    // Reset transporter on error so next call creates fresh one
    _transporter = null;
  }
};

// ── Sale notification ─────────────────────────────────────────────────────────
const notifySale = async (sale, sellerName) => {
  var items = '';
  (sale.items || []).forEach(function(item) {
    items += '<tr><td style="padding:8px;border-bottom:1px solid #f3f4f6;">' + (item.name || 'Item') + '</td>';
    items += '<td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:center;">' + (item.quantity || 1) + '</td>';
    items += '<td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:right;">' + fmt(item.salePrice) + '</td></tr>';
  });

  var html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">';
  html += '<div style="max-width:500px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">';
  html += '<div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;text-align:center;">';
  html += '<p style="font-size:36px;margin:0 0 8px;">🛒</p>';
  html += '<h2 style="color:white;margin:0;font-size:20px;">New Sale Recorded!</h2>';
  html += '<p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">' + (sale.saleNumber || '') + '</p>';
  html += '</div><div style="padding:20px 24px;">';
  html += '<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">';
  html += '<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Seller</td><td style="padding:8px 0;font-weight:600;text-align:right;">' + sellerName + '</td></tr>';
  html += '<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Customer</td><td style="padding:8px 0;font-weight:600;text-align:right;">' + (sale.customerName || 'Walk-in') + '</td></tr>';
  html += '<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Payment</td><td style="padding:8px 0;font-weight:600;text-align:right;">' + (sale.paymentMethod || 'cash').toUpperCase() + '</td></tr>';
  html += '</table>';
  html += '<p style="font-weight:600;color:#374151;margin:0 0 8px;font-size:14px;">Items</p>';
  html += '<table style="width:100%;border-collapse:collapse;">';
  html += '<tr style="background:#f9fafb;"><th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;">Item</th><th style="padding:8px;font-size:12px;color:#6b7280;">Qty</th><th style="padding:8px;font-size:12px;color:#6b7280;text-align:right;">Price</th></tr>';
  html += items + '</table>';
  html += '<div style="margin-top:16px;padding:14px 16px;background:#f0fdf4;border-radius:12px;display:flex;justify-content:space-between;">';
  html += '<span style="color:#166534;font-weight:700;font-size:15px;">Total</span>';
  html += '<span style="color:#166534;font-weight:800;font-size:20px;">' + fmt(sale.totalAmount) + '</span></div>';
  if (sale.totalProfit) {
    html += '<div style="margin-top:8px;padding:10px 16px;background:#eff6ff;border-radius:10px;display:flex;justify-content:space-between;">';
    html += '<span style="color:#1e40af;font-weight:600;font-size:14px;">Profit</span>';
    html += '<span style="color:#1e40af;font-weight:700;font-size:16px;">' + fmt(sale.totalProfit) + '</span></div>';
  }
  html += '</div><div style="padding:12px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">';
  html += '<p style="color:#9ca3af;font-size:12px;margin:0;">Mobile Shop POS</p></div></div></body></html>';

  await sendEmail('Sale ' + (sale.saleNumber || '') + ' — ' + fmt(sale.totalAmount), html);
};

// ── Product notification ──────────────────────────────────────────────────────
const notifyProduct = async (product, addedBy) => {
  var profit = Number(product.salePrice || 0) - Number(product.purchasePrice || 0);
  var margin = product.purchasePrice > 0 ? ((profit / product.purchasePrice) * 100).toFixed(0) : 0;

  var html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">';
  html += '<div style="max-width:500px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">';
  html += '<div style="background:linear-gradient(135deg,#059669,#10b981);padding:24px;text-align:center;">';
  html += '<p style="font-size:36px;margin:0 0 8px;">🏷️</p>';
  html += '<h2 style="color:white;margin:0;font-size:20px;">New Product Added!</h2></div>';
  html += '<div style="padding:20px 24px;">';
  html += '<h3 style="margin:0 0 4px;font-size:18px;">' + (product.name || '') + '</h3>';
  html += '<p style="color:#6b7280;margin:0 0 16px;font-size:13px;">' + (product.category || '') + '</p>';
  html += '<table style="width:100%;border-collapse:collapse;">';
  html += '<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Added By</td><td style="font-weight:600;text-align:right;">' + addedBy + '</td></tr>';
  html += '<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Purchase Price</td><td style="font-weight:600;text-align:right;">' + fmt(product.purchasePrice) + '</td></tr>';
  html += '<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Sale Price</td><td style="font-weight:600;text-align:right;">' + fmt(product.salePrice) + '</td></tr>';
  html += '<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Stock</td><td style="font-weight:600;text-align:right;">' + (product.stock || 0) + ' units</td></tr></table>';
  html += '<div style="margin-top:16px;padding:14px 16px;background:#f0fdf4;border-radius:12px;display:flex;justify-content:space-between;">';
  html += '<span style="color:#166534;font-weight:700;">Profit/Unit</span>';
  html += '<span style="color:#166534;font-weight:800;font-size:18px;">' + fmt(profit) + ' (' + margin + '%)</span></div>';
  html += '</div><div style="padding:12px 24px;background:#f9fafb;text-align:center;">';
  html += '<p style="color:#9ca3af;font-size:12px;margin:0;">Mobile Shop POS</p></div></div></body></html>';

  await sendEmail('New Product — ' + (product.name || ''), html);
};

// ── Low stock notification ────────────────────────────────────────────────────
const notifyLowStock = async (productName, stock) => {
  var html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">';
  html += '<div style="max-width:500px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">';
  html += '<div style="background:linear-gradient(135deg,#dc2626,#f97316);padding:24px;text-align:center;">';
  html += '<p style="font-size:36px;margin:0 0 8px;">⚠️</p>';
  html += '<h2 style="color:white;margin:0;">Low Stock Alert!</h2></div>';
  html += '<div style="padding:20px 24px;">';
  html += '<table style="width:100%;"><tr><td style="color:#6b7280;">Product</td><td style="font-weight:600;text-align:right;">' + productName + '</td></tr>';
  html += '<tr><td style="color:#6b7280;padding-top:8px;">Stock Left</td><td style="color:#dc2626;font-weight:800;font-size:20px;text-align:right;">' + stock + ' units</td></tr></table>';
  html += '<div style="margin-top:16px;padding:14px;background:#fef2f2;border-radius:12px;border-left:4px solid #dc2626;">';
  html += '<p style="color:#991b1b;margin:0;font-size:13px;">Please reorder soon!</p></div></div>';
  html += '<div style="padding:12px 24px;background:#f9fafb;text-align:center;"><p style="color:#9ca3af;font-size:12px;margin:0;">Mobile Shop POS</p></div>';
  html += '</div></body></html>';

  await sendEmail('Low Stock: ' + productName + ' (' + stock + ' left)', html);
};

module.exports = { notifySale, notifyProduct, notifyLowStock };
