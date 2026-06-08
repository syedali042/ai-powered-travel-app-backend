const { Router } = require('express');
const { query } = require('express-validator');
const searchController = require('../../../controllers/search.controller');
const { optionalAuth, verifyToken } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');

// ── /api/v1/activities ────────────────────────────────────────────────────────
// Exported as a separate router; mounted at /activities in routes/index.js
const activityRouter = Router();

activityRouter.use(optionalAuth);

activityRouter.get(
  '/',
  query('category')
    .optional()
    .isIn(['food', 'adventure', 'cultural', 'nightlife', 'nature', 'shopping', 'wellness', 'transport'])
    .withMessage('Invalid activity category'),
  query('price')
    .optional()
    .isIn(['free', 'budget', 'mid', 'luxury'])
    .withMessage('Invalid price level'),
  validate,
  searchController.listActivities
);

// ── /api/v1/search ────────────────────────────────────────────────────────────
// Exported as a separate router; mounted at /search in routes/index.js
const searchRouter = Router();

searchRouter.use(optionalAuth);

searchRouter.get(
  '/',
  query('q').notEmpty().withMessage('q (search query) is required'),
  query('stars').optional().isInt({ min: 1, max: 5 }).withMessage('stars must be 1–5'),
  query('budget').optional().isFloat({ min: 0 }).withMessage('budget must be a positive number'),
  validate,
  searchController.unifiedSearch
);

// ── /api/v1/discover ──────────────────────────────────────────────────────────
// Exported as a separate router; mounted at /discover in routes/index.js
const discoverRouter = Router();

// B9.7 — personalised requires a valid JWT + profileEmbedding
discoverRouter.get('/personalized', verifyToken, searchController.personalizedRecommendations);

// B9.8 — trending is public
discoverRouter.get('/trending', optionalAuth, searchController.trendingDestinations);

module.exports = { activityRouter, searchRouter, discoverRouter };
