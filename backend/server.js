require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const connectDB = require('./config/db');

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/mobiles',   require('./routes/mobiles'));
app.use('/api/sales',     require('./routes/sales'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/services',  require('./routes/services'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/staff',     require('./routes/staff'));
app.use('/api/expenses',  require('./routes/expenses'));
app.use('/api/audit',     require('./routes/audit'));
app.use('/api/backup',    require('./routes/backup'));
app.use('/api/closing',   require('./routes/closing'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ success: true, timestamp: new Date(), env: process.env.NODE_ENV })
);

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    startCronJobs();
  });
});

// ─── CRON JOBS ────────────────────────────────────────────────────────────────
function startCronJobs() {
  const { runDailyClosing } = require('./jobs/dailyClosing');
  const { runDataCleanup }  = require('./jobs/dataCleanup');

  // Daily closing at 12:05 AM
  cron.schedule('5 0 * * *', async () => {
    console.log('⏰ [CRON] Running daily closing...');
    await runDailyClosing();
  }, { timezone: process.env.TZ || 'Asia/Karachi' });

  // Monthly data cleanup on the 1st at 3:00 AM
  cron.schedule('0 3 1 * *', async () => {
    console.log('🧹 [CRON] Running data cleanup...');
    await runDataCleanup();
  }, { timezone: process.env.TZ || 'Asia/Karachi' });

  console.log('✅ Cron jobs scheduled');
}

module.exports = app;
