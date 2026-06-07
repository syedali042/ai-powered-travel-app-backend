const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const authService = require('../services/authService');
const { success } = require('../utils/response');
const { ValidationError, UnauthorizedError, AppError } = require('../utils/errors');

const BCRYPT_ROUNDS = 12;

// Lazy Google client — only created when GOOGLE_CLIENT_ID is set and googleAuth is called
let _googleClient = null;
function getGoogleClient() {
  if (!_googleClient) _googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return _googleClient;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function issueTokens(res, user) {
  const accessToken  = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken();
  await User.updateOne(
    { _id: user._id },
    { $set: { refreshTokenHash: authService.hashToken(refreshToken) } }
  );
  authService.setRefreshCookie(res, refreshToken);
  return accessToken;
}

// ── Controllers ───────────────────────────────────────────────────────────────

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return next(new ValidationError('Email already registered'));

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ name, email, passwordHash, role: 'user' });

    const accessToken = await issueTokens(res, user);

    return success(res, { user: authService.sanitizeUser(user.toObject()), accessToken }, 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) return next(new UnauthorizedError('Invalid credentials'));

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return next(new UnauthorizedError('Invalid credentials'));

    const accessToken = await issueTokens(res, user);

    return success(res, { user: authService.sanitizeUser(user.toObject()), accessToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return next(new UnauthorizedError('No refresh token'));

    const hash = authService.hashToken(token);
    const user = await User.findOne({ refreshTokenHash: hash }).select('+refreshTokenHash');
    if (!user) return next(new UnauthorizedError('Invalid refresh token'));

    const accessToken = await issueTokens(res, user);

    return success(res, { accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const hash = authService.hashToken(token);
      await User.updateOne({ refreshTokenHash: hash }, { $unset: { refreshTokenHash: '' } });
    }
    authService.clearRefreshCookie(res);
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function googleAuth(req, res, next) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return next(new AppError('Google OAuth not configured', 503));
    }

    const { idToken } = req.body;

    let payload;
    try {
      const ticket = await getGoogleClient().verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return next(new UnauthorizedError('Invalid Google ID token'));
    }

    const { sub: googleId, email, name, email_verified } = payload;
    if (!email_verified) return next(new UnauthorizedError('Google account email not verified'));

    let isNew = false;
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      user = await User.create({ name, email: email.toLowerCase(), googleId, role: 'user' });
      isNew = true;
    } else if (!user.googleId) {
      await User.updateOne({ _id: user._id }, { $set: { googleId } });
    }

    const accessToken = await issueTokens(res, user);

    return success(
      res,
      { user: authService.sanitizeUser(user.toObject ? user.toObject() : user), accessToken },
      isNew ? 201 : 200
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, googleAuth };
