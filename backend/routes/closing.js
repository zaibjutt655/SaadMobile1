const router  = require('express').Router();
const { DailyClosing } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { runDailyClosing } = require('../jobs/dailyClosing');

// GET /api/closing  — list recent closings
router.get('/', authenticate, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const closings = await DailyClosing.find().sort({ date: -1 }).limit(30);
    res.json({ success: true, data: closings });
  } catch (err) { next(err); }
});

// GET /api/closing/today  — check if today is closed
router.get('/today', authenticate, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const closing = await DailyClosing.findOne({ date: today });
    res.json({ success: true, isClosed: !!closing, data: closing });
  } catch (err) { next(err); }
});

// POST /api/closing/run  — manual closing trigger (owner only)
router.post('/run', authenticate, authorize('owner'), async (req, res, next) => {
  try {
    const result = await runDailyClosing(req.user.username);
    res.json({ success: true, message: 'Daily closing completed', data: result });
  } catch (err) { next(err); }
});

module.exports = router;
