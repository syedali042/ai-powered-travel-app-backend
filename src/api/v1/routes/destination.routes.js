const { Router } = require('express');
const { query } = require('express-validator');
const destController = require('../../../controllers/destination.controller');
const { optionalAuth } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');

const router = Router();

// Destination browsing is public; optionalAuth enriches re-ranking if the
// user is authenticated and has a profileEmbedding (future use).
router.use(optionalAuth);

// ── GET /api/v1/destinations ──────────────────────────────────────────────────
router.get(
  '/',
  query('budget').optional().isFloat({ min: 0 }).withMessage('budget must be a positive number'),
  query('category')
    .optional()
    .isIn(['historical', 'beach', 'adventure', 'cultural', 'nature', 'urban', 'wellness', 'family'])
    .withMessage('Invalid category'),
  query('month')
    .optional()
    .isIn(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])
    .withMessage('Invalid month'),
  validate,
  destController.listDestinations
);

// ── GET /api/v1/destinations/:id ──────────────────────────────────────────────
router.get('/:id', destController.getDestination);

// ── GET /api/v1/destinations/:id/similar ─────────────────────────────────────
router.get('/:id/similar', destController.getSimilarDestinations);

module.exports = router;
