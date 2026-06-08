const Activity = require('../models/activity.model');
const { generateEmbedding } = require('../services/embeddingService');
const { combinedSearch } = require('../services/vectorSearchService');
const { getPersonalizedRecommendations, getTrendingDestinations } = require('../services/discoverService');
const { success, paginated } = require('../utils/response');
const logger = require('../utils/logger');

// ── B9.5 — GET /api/v1/activities ─────────────────────────────────────────────

async function listActivities(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = { isActive: true };

    if (req.query.destination) filter.destinationId = req.query.destination;
    if (req.query.category)    filter.category      = req.query.category;
    if (req.query.price)       filter.priceLevel    = req.query.price;

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .select('-embedding')
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments(filter),
    ]);

    return paginated(res, activities, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

// ── B9.6 — GET /api/v1/search ─────────────────────────────────────────────────

async function unifiedSearch(req, res, next) {
  try {
    const { q } = req.query;
    if (!q?.trim()) {
      return res.status(422).json({ error: 'q (search query) is required' });
    }

    // Build optional hard filters from query params
    const filters = {
      destinations: {},
      activities:   {},
      hotels:       {},
    };
    if (req.query.country)        filters.destinations.country        = req.query.country;
    if (req.query.category)       filters.destinations.category       = [].concat(req.query.category);
    if (req.query.month)          filters.destinations.bestMonths     = [req.query.month];
    if (req.query.budget)         filters.destinations.maxDailyBudget = parseFloat(req.query.budget);
    if (req.query.actCategory)    filters.activities.category         = req.query.actCategory;
    if (req.query.price)          filters.activities.priceLevel       = req.query.price;
    if (req.query.hotelPrice)     filters.hotels.priceLevel           = req.query.hotelPrice;
    if (req.query.stars)          filters.hotels.minStarRating        = parseInt(req.query.stars);

    // Load user embedding if authenticated (optionalAuth sets req.user)
    let userEmbedding = null;
    if (req.user?._id) {
      const User = require('../models/user.model');
      const user = await User.findById(req.user._id).select('+profileEmbedding').lean();
      userEmbedding = user?.profileEmbedding?.length ? user.profileEmbedding : null;
    }

    // Embed the query and run combined search
    const queryEmbedding = await generateEmbedding(q.trim());
    const results = await combinedSearch(queryEmbedding, {
      filters,
      limitPerType: 10,
      totalLimit: 30,
      userEmbedding,
    });

    // Group by collection type for the response
    const grouped = {
      destinations: results.filter((r) => r._collection === 'destinations'),
      activities:   results.filter((r) => r._collection === 'activities'),
      hotels:       results.filter((r) => r._collection === 'hotels'),
    };

    return success(res, grouped, 200, { total: results.length, query: q });
  } catch (err) {
    logger.error('Unified search error:', err.message);
    next(err);
  }
}

// ── B9.7 — GET /api/v1/discover/personalized ─────────────────────────────────

async function personalizedRecommendations(req, res, next) {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 15);
    const { hasProfile, results, preferences } = await getPersonalizedRecommendations(
      req.user._id,
      limit
    );

    if (!hasProfile) {
      return success(res, [], 200, {
        message:
          'Set your travel preferences (PATCH /api/v1/users/me/preferences) to unlock personalised recommendations.',
      });
    }

    return success(res, results, 200, { preferences });
  } catch (err) {
    next(err);
  }
}

// ── B9.8 — GET /api/v1/discover/trending ─────────────────────────────────────

async function trendingDestinations(req, res, next) {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const results = await getTrendingDestinations(limit);
    return success(res, results, 200, { window: '30d' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listActivities, unifiedSearch, personalizedRecommendations, trendingDestinations };
