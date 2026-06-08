const Cache = require('../models/cache.model');
const logger = require('../utils/logger');

// ── Primitives ─────────────────────────────────────────────────────────────────

async function get(key) {
  try {
    const entry = await Cache.findOne({ key }).lean();
    return entry?.data ?? null;
  } catch (err) {
    logger.warn(`Cache.get failed for "${key}": ${err.message}`);
    return null; // DB unavailable — degrade gracefully
  }
}

async function set(key, data, ttlSeconds, provider = 'unknown') {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await Cache.findOneAndUpdate(
      { key },
      { key, data, provider, expiresAt },
      { upsert: true, new: true }
    );
  } catch (err) {
    logger.warn(`Cache.set failed for "${key}": ${err.message}`);
  }
}

async function invalidate(key) {
  try {
    await Cache.deleteOne({ key });
  } catch (err) {
    logger.warn(`Cache.invalidate failed for "${key}": ${err.message}`);
  }
}

// ── Cache-aside helper — B10.5 ────────────────────────────────────────────────

/**
 * Cache-aside pattern with graceful degradation:
 *   1. Return cached data immediately if present (cache HIT)
 *   2. Call fn() to fetch live data (cache MISS)
 *   3. Persist result and return it
 *   4. If fn() throws (provider down), return { data: null, error }
 *      — caller decides whether to surface the error or silently skip
 *
 * @param {string}   key         Unique cache key
 * @param {Function} fn          Async function that fetches live data
 * @param {number}   ttlSeconds  Time-to-live in seconds
 * @param {string}   provider    Provider name for logging
 * @returns {{ data: any, fromCache: boolean, error?: string }}
 */
async function wrap(key, fn, ttlSeconds, provider = 'unknown') {
  const cached = await get(key);
  if (cached !== null) {
    logger.debug(`Cache HIT [${provider}] ${key}`);
    return { data: cached, fromCache: true };
  }

  logger.debug(`Cache MISS [${provider}] ${key} — fetching live`);

  try {
    const data = await fn();
    if (data !== null && data !== undefined) {
      await set(key, data, ttlSeconds, provider);
    }
    return { data: data ?? null, fromCache: false };
  } catch (err) {
    logger.warn(`Live fetch failed [${provider}] "${key}": ${err.message}`);
    return { data: null, fromCache: false, error: err.message };
  }
}

module.exports = { get, set, invalidate, wrap };
