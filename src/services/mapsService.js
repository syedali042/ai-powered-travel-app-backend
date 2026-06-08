const axios = require('axios');
const { wrap } = require('./cacheService');
const { TokenBucket } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

const BASE_PLACES     = 'https://maps.googleapis.com/maps/api/place';
const BASE_GEOCODE    = 'https://maps.googleapis.com/maps/api/geocode';
const BASE_DIRECTIONS = 'https://maps.googleapis.com/maps/api/directions';
const TIMEOUT         = 8_000; // ms

// Conservative rate limit for free-tier Google Maps (50 QPS hard limit, cap burst at 20)
const rateLimiter = new TokenBucket(10, 20);

// TTL constants
const TTL = {
  place:      86_400,   // 24h — place info changes rarely
  directions: 21_600,   // 6h  — routing is stable, live traffic is ephemeral
  geocode:    604_800,  // 7d  — address coordinates are extremely stable
};

function apiKey() {
  return process.env.GOOGLE_MAPS_API_KEY;
}

function normKey(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 200);
}

// ── B10.1 ─────────────────────────────────────────────────────────────────────

/**
 * Fetch place details from Google Places API.
 * Returns photos, reviews, current opening hours, contact info, and geometry.
 * Returns null if GOOGLE_MAPS_API_KEY is not configured or provider is down.
 */
async function getPlaceDetails(placeId) {
  const { data } = await wrap(
    `maps:place:${placeId}`,
    async () => {
      if (!apiKey()) return null;
      await rateLimiter.acquire();
      const resp = await axios.get(`${BASE_PLACES}/details/json`, {
        params: {
          place_id: placeId,
          fields: [
            'name', 'formatted_address', 'geometry',
            'photos', 'opening_hours', 'rating',
            'reviews', 'website', 'formatted_phone_number',
          ].join(','),
          key: apiKey(),
        },
        timeout: TIMEOUT,
      });
      return resp.data?.result ?? null;
    },
    TTL.place,
    'google_maps'
  );
  return data;
}

/**
 * Get travel time and distance between two points.
 * mode: 'driving' | 'walking' | 'bicycling' | 'transit'
 */
async function getDirections(origin, destination, mode = 'driving') {
  const { data } = await wrap(
    `maps:directions:${normKey(origin)}:${normKey(destination)}:${mode}`,
    async () => {
      if (!apiKey()) return null;
      await rateLimiter.acquire();
      const resp = await axios.get(`${BASE_DIRECTIONS}/json`, {
        params: { origin, destination, mode, key: apiKey() },
        timeout: TIMEOUT,
      });
      const leg = resp.data?.routes?.[0]?.legs?.[0];
      if (!leg) return null;
      return {
        distance:           leg.distance,
        duration:           leg.duration,
        durationInTraffic:  leg.duration_in_traffic ?? null,
        startAddress:       leg.start_address,
        endAddress:         leg.end_address,
        mode,
      };
    },
    TTL.directions,
    'google_maps'
  );
  return data;
}

/**
 * Convert a human-readable address to { lat, lng, formattedAddress, placeId }.
 */
async function geocode(address) {
  const { data } = await wrap(
    `maps:geocode:${normKey(address)}`,
    async () => {
      if (!apiKey()) return null;
      await rateLimiter.acquire();
      const resp = await axios.get(`${BASE_GEOCODE}/json`, {
        params: { address, key: apiKey() },
        timeout: TIMEOUT,
      });
      const result = resp.data?.results?.[0];
      if (!result) return null;
      return {
        lat:              result.geometry.location.lat,
        lng:              result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        placeId:          result.place_id,
      };
    },
    TTL.geocode,
    'google_maps'
  );
  return data;
}

module.exports = { getPlaceDetails, getDirections, geocode };
