const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ─── AUTHENTICATE ─────────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    next(err);
  }
};

// ─── ROLE GUARD ───────────────────────────────────────────────────────────────
// Usage: authorize('owner'), authorize('owner', 'manager'), authorize('owner', 'manager', 'seller')
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  next();
};

// ─── AUDIT LOGGER ────────────────────────────────────────────────────────────
// Middleware factory — logs actions after the handler succeeds
const auditLog = (action, module) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    if (body && body.success !== false && req.user) {
      try {
        const { AuditLog } = require('../models');
        await AuditLog.create({
          user:        req.user._id,
          username:    req.user.username,
          action,
          module,
          targetId:    body.data?._id || req.params.id,
          description: `${req.user.username} performed ${action} on ${module}`,
          ip:          req.ip,
        });
      } catch (e) {
        console.error('Audit log error:', e.message);
      }
    }
    return originalJson(body);
  };
  next();
};

module.exports = { authenticate, authorize, auditLog };
