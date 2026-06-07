const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_EXPIRY  = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_MAX_MS,
    path: '/api/v1/auth',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
}

function sanitizeUser(user) {
  const { passwordHash, refreshTokenHash, profileEmbedding, googleId, ...safe } = user;
  return safe;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  setRefreshCookie,
  clearRefreshCookie,
  sanitizeUser,
};
