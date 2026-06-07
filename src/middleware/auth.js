const authService = require('../services/authService');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }
  try {
    const decoded = authService.verifyAccessToken(header.slice(7));
    req.user = { _id: decoded.sub, email: decoded.email, role: decoded.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const decoded = authService.verifyAccessToken(header.slice(7));
    req.user = { _id: decoded.sub, email: decoded.email, role: decoded.role };
  } catch {
    // invalid token — proceed without req.user
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return next(new ForbiddenError('Admin access required'));
  next();
}

module.exports = { verifyToken, optionalAuth, requireAdmin };
