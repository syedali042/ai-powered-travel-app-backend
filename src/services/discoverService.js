const mongoose = require('mongoose');
const Destination = require('../models/destination.model');
const Trip = require('../models/trip.model');
const User = require('../models/user.model');
const { combinedSearch } = require('./vectorSearchService');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const SIMILAR_PROJECT = {
  name: 1, country: 1, city: 1, region: 1, shortDescription: 1,
  category: 1, rating: 1, images: 1, tags: 1, bestMonths: 1,
  score: { $meta: 'vectorSearchScore' },
};

// ── B9.4 — "More Like This" ───────────────────────────────────────────────────

/**
 * Find destinations semantically similar to a given destination.
 * Uses the destination's stored embedding as the query vector.
 */
async function findSimilarDestinations(destId, limit = 5) {
  const dest = await Destination.findById(destId).select('+embedding').lean();
  if (!dest) throw new NotFoundError('Destination');

  // If embedding is missing (not yet processed), return empty rather than error
  if (!dest.embedding?.length) return [];

  const results = await Destination.aggregate([
    {
      $vectorSearch: {
        index: 'destination_vector_index',
        queryVector: dest.embedding,
        path: 'embedding',
        numCandidates: limit * 4,
        limit: limit + 1, // over-fetch by 1 to account for excluding self
        filter: { isActive: true },
      },
    },
    { $project: SIMILAR_PROJECT },
  ]);

  // Post-filter: remove self, cap at limit
  return results
    .filter((r) => r._id.toString() !== destId.toString())
    .slice(0, limit)
    .map((r) => ({ ...r, _collection: 'destinations' }));
}

// ── B9.7 — Personalized recommendations ──────────────────────────────────────

/**
 * Run vector search using the user's profileEmbedding as the query vector.
 * Excludes destinations the user has already added to any of their trips.
 */
async function getPersonalizedRecommendations(userId, limit = 15) {
  const user = await User.findById(userId).select('+profileEmbedding').lean();

  if (!user?.profileEmbedding?.length) {
    return { hasProfile: false, results: [], preferences: user?.preferences || null };
  }

  // Collect destination IDs the user has already planned
  const trips = await Trip.find({ userId, isActive: true }, 'destinations').lean();
  const visitedSet = new Set(
    trips.flatMap((t) => t.destinations.map((d) => d.destinationId?.toString())).filter(Boolean)
  );

  // Fetch extra to cover post-filtering
  const raw = await combinedSearch(user.profileEmbedding, {
    limitPerType: 8,
    totalLimit: limit + visitedSet.size + 5,
    userEmbedding: user.profileEmbedding,
  });

  // Exclude already-visited destinations
  const results = raw
    .filter((r) => !(r._collection === 'destinations' && visitedSet.has(r._id.toString())))
    .slice(0, limit);

  return { hasProfile: true, results, preferences: user.preferences || null };
}

// ── B9.8 — Trending ───────────────────────────────────────────────────────────

/**
 * Most-planned destinations across all users in the last 30 days.
 * Uses a Trip aggregation pipeline counting destination occurrences.
 */
async function getTrendingDestinations(limit = 10) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const trending = await Trip.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, isActive: true } },
    { $unwind: '$destinations' },
    { $group: { _id: '$destinations.destinationId', tripCount: { $sum: 1 } } },
    { $sort: { tripCount: -1 } },
    { $limit: limit * 2 }, // over-fetch to allow filtering inactive destinations
    {
      $lookup: {
        from: 'destinations',
        localField: '_id',
        foreignField: '_id',
        as: 'destination',
      },
    },
    { $unwind: '$destination' },
    { $match: { 'destination.isActive': true } },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ['$destination', { trendingCount: '$tripCount' }] },
      },
    },
    { $limit: limit },
    { $unset: 'embedding' }, // never expose raw vectors
  ]);

  return trending;
}

module.exports = { findSimilarDestinations, getPersonalizedRecommendations, getTrendingDestinations };
