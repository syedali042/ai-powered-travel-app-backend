const Destination = require('../models/destination.model');
const Activity = require('../models/activity.model');
const Hotel = require('../models/hotel.model');
const { findSimilarDestinations } = require('../services/discoverService');
const { success, paginated } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

// ── B9.2 — GET /api/v1/destinations ──────────────────────────────────────────

async function listDestinations(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = { isActive: true };

    // Text search — uses the { name, description, shortDescription } text index
    if (req.query.q) filter.$text = { $search: req.query.q };

    if (req.query.country) filter.country = req.query.country;

    if (req.query.category) {
      const cats = [].concat(req.query.category);
      filter.category = { $in: cats };
    }

    if (req.query.budget) {
      filter['avgDailyBudget.budget'] = { $lte: parseFloat(req.query.budget) };
    }

    if (req.query.month) filter.bestMonths = req.query.month;

    const sort = req.query.q ? { score: { $meta: 'textScore' } } : { name: 1 };

    const baseQuery = () => Destination.find(filter).select('-embedding');

    const [destinations, total] = await Promise.all([
      baseQuery().sort(sort).skip(skip).limit(limit).lean(),
      Destination.countDocuments(filter),
    ]);

    return paginated(res, destinations, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

// ── B9.3 — GET /api/v1/destinations/:id ──────────────────────────────────────

async function getDestination(req, res, next) {
  try {
    const dest = await Destination.findOne({ _id: req.params.id, isActive: true })
      .select('-embedding')
      .lean();
    if (!dest) throw new NotFoundError('Destination');

    // Hydrate with related content in parallel
    const [activities, hotels] = await Promise.all([
      Activity.find({ destinationId: req.params.id, isActive: true })
        .select('-embedding')
        .sort({ rating: -1 })
        .limit(12)
        .lean(),
      Hotel.find({ destinationId: req.params.id, isActive: true })
        .select('-embedding')
        .sort({ starRating: -1, rating: -1 })
        .limit(8)
        .lean(),
    ]);

    return success(res, { ...dest, activities, hotels });
  } catch (err) {
    next(err);
  }
}

// ── B9.4 — GET /api/v1/destinations/:id/similar ───────────────────────────────

async function getSimilarDestinations(req, res, next) {
  try {
    const limit = Math.min(10, parseInt(req.query.limit) || 5);
    const results = await findSimilarDestinations(req.params.id, limit);
    return success(res, results);
  } catch (err) {
    next(err);
  }
}

module.exports = { listDestinations, getDestination, getSimilarDestinations };
