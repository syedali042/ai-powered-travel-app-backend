const { Destination, Activity, Hotel } = require('../models');
const logger = require('../utils/logger');

// ── Constants ─────────────────────────────────────────────────────────────────

const NUM_CANDIDATES = 200; // ANN candidates before scoring — higher = better recall, slower
const DEFAULT_LIMIT   = 10;

// ── Cosine similarity (B5.5) ──────────────────────────────────────────────────

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Re-rank results by blending Atlas vector score with a user preference score.
 * finalScore = 0.7 × vectorSearchScore + 0.3 × cosineSimilarity(doc, user)
 *
 * Results that have no embedding are kept but placed at the bottom.
 * The `embedding` field is stripped from the returned objects.
 *
 * @param {Array}  results       - Documents from $vectorSearch (may include .embedding)
 * @param {number[]} userEmbedding - 1024-dim profileEmbedding from the User document
 */
function rerankWithPreferences(results, userEmbedding) {
  return results
    .map((r) => {
      const prefScore = r.embedding ? cosineSimilarity(r.embedding, userEmbedding) : 0;
      const finalScore = r.embedding
        ? 0.7 * (r.score ?? 0) + 0.3 * prefScore
        : (r.score ?? 0);
      return { ...r, prefScore, finalScore };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .map(({ embedding, ...rest }) => rest); // strip raw embeddings from response
}

// ── Filter conversion ─────────────────────────────────────────────────────────
// The filterExtractor returns plain JS values; this converts them to MQL
// operators that Atlas Vector Search supports ($eq, $in, $gte, $lte).

function destinationFilter(extracted = {}) {
  const f = { isActive: true };
  if (extracted.country)                f.country    = extracted.country;
  if (extracted.category?.length)       f.category   = { $in: extracted.category };
  if (extracted.bestMonths?.length)     f.bestMonths = { $in: extracted.bestMonths };
  if (extracted.maxDailyBudget != null) f['avgDailyBudget.budget'] = { $lte: extracted.maxDailyBudget };
  return f;
}

function activityFilter(extracted = {}) {
  const f = { isActive: true };
  if (extracted.category)         f.category   = extracted.category;
  if (extracted.priceLevel)       f.priceLevel = extracted.priceLevel;
  if (extracted.destinationId)    f.destinationId = extracted.destinationId;
  return f;
}

function hotelFilter(extracted = {}) {
  const f = { isActive: true };
  if (extracted.priceLevel)           f.priceLevel  = extracted.priceLevel;
  if (extracted.minStarRating != null) f.starRating  = { $gte: extracted.minStarRating };
  if (extracted.destinationId)        f.destinationId = extracted.destinationId;
  return f;
}

// ── Core search functions ─────────────────────────────────────────────────────

/**
 * @param {number[]} queryEmbedding  1024-dim Voyage AI embedding
 * @param {object}  filters          Output from filterExtractor (destinations section)
 * @param {number}  limit
 * @param {boolean} includeEmbedding  Set true for re-ranking
 */
async function searchDestinations(queryEmbedding, {
  filters = {},
  limit = DEFAULT_LIMIT,
  includeEmbedding = false,
} = {}) {
  const project = {
    name: 1, country: 1, city: 1, region: 1,
    description: 1, shortDescription: 1,
    category: 1, avgDailyBudget: 1, rating: 1,
    images: 1, tags: 1, bestMonths: 1,
    score: { $meta: 'vectorSearchScore' },
  };
  if (includeEmbedding) project.embedding = 1;

  try {
    const results = await Destination.aggregate([
      {
        $vectorSearch: {
          index: 'destination_vector_index',
          queryVector: queryEmbedding,
          path: 'embedding',
          numCandidates: NUM_CANDIDATES,
          limit,
          filter: destinationFilter(filters),
        },
      },
      { $project: project },
    ]);
    return results.map((r) => ({ ...r, _collection: 'destinations' }));
  } catch (err) {
    logger.error('searchDestinations failed:', err.message);
    return [];
  }
}

async function searchActivities(queryEmbedding, {
  filters = {},
  limit = DEFAULT_LIMIT,
  includeEmbedding = false,
} = {}) {
  const project = {
    name: 1, destinationId: 1, description: 1,
    category: 1, priceLevel: 1, priceRange: 1,
    duration: 1, rating: 1, images: 1,
    bookingUrl: 1, tags: 1,
    score: { $meta: 'vectorSearchScore' },
  };
  if (includeEmbedding) project.embedding = 1;

  try {
    const results = await Activity.aggregate([
      {
        $vectorSearch: {
          index: 'activity_vector_index',
          queryVector: queryEmbedding,
          path: 'embedding',
          numCandidates: NUM_CANDIDATES,
          limit,
          filter: activityFilter(filters),
        },
      },
      { $project: project },
    ]);
    return results.map((r) => ({ ...r, _collection: 'activities' }));
  } catch (err) {
    logger.error('searchActivities failed:', err.message);
    return [];
  }
}

async function searchHotels(queryEmbedding, {
  filters = {},
  limit = DEFAULT_LIMIT,
  includeEmbedding = false,
} = {}) {
  const project = {
    name: 1, destinationId: 1, description: 1,
    starRating: 1, pricePerNight: 1, priceLevel: 1,
    amenities: 1, rating: 1, images: 1, bookingUrl: 1,
    score: { $meta: 'vectorSearchScore' },
  };
  if (includeEmbedding) project.embedding = 1;

  try {
    const results = await Hotel.aggregate([
      {
        $vectorSearch: {
          index: 'hotel_vector_index',
          queryVector: queryEmbedding,
          path: 'embedding',
          numCandidates: NUM_CANDIDATES,
          limit,
          filter: hotelFilter(filters),
        },
      },
      { $project: project },
    ]);
    return results.map((r) => ({ ...r, _collection: 'hotels' }));
  } catch (err) {
    logger.error('searchHotels failed:', err.message);
    return [];
  }
}

// ── Combined search ───────────────────────────────────────────────────────────

/**
 * Run all three searches in parallel, merge results, and optionally re-rank
 * by user preference embedding.
 *
 * @param {number[]} queryEmbedding
 * @param {object}  opts
 * @param {object}  opts.filters        { destinations, activities, hotels } each from filterExtractor
 * @param {number}  opts.limitPerType   results per collection before merge
 * @param {number}  opts.totalLimit     max items returned after merge
 * @param {number[]} opts.userEmbedding if provided, re-rank results
 */
async function combinedSearch(queryEmbedding, {
  filters = {},
  limitPerType = 8,
  totalLimit = 15,
  userEmbedding = null,
} = {}) {
  const includeEmbedding = Boolean(userEmbedding);

  const [destinations, activities, hotels] = await Promise.all([
    searchDestinations(queryEmbedding, {
      filters: filters.destinations,
      limit: limitPerType,
      includeEmbedding,
    }),
    searchActivities(queryEmbedding, {
      filters: filters.activities,
      limit: limitPerType,
      includeEmbedding,
    }),
    searchHotels(queryEmbedding, {
      filters: filters.hotels,
      limit: limitPerType,
      includeEmbedding,
    }),
  ]);

  let merged = [...destinations, ...activities, ...hotels];

  if (userEmbedding) {
    merged = rerankWithPreferences(merged, userEmbedding);
  } else {
    merged.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    // Strip any accidentally fetched embeddings
    merged = merged.map(({ embedding, ...r }) => r);
  }

  return merged.slice(0, totalLimit);
}

module.exports = {
  searchDestinations,
  searchActivities,
  searchHotels,
  combinedSearch,
  rerankWithPreferences,
  cosineSimilarity,
};
