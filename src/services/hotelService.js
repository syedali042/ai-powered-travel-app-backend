const axios = require('axios');
const { wrap } = require('./cacheService');
const { TokenBucket } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

// RateHawk B2B API v3 — https://www.ratehawk.com/
// Auth: HTTP Basic with key:secret
const BASE_URL = 'https://api.worldota.net/api/b2b/v3';
const TIMEOUT  = 20_000; // search responses can be slower on first call

const TTL = {
  search:    1_800,  // 30 min — rates change frequently
  region:    86_400, // 24h  — region IDs are stable
  hotelInfo: 3_600,  // 1h   — hotel detail pages
};

// Conservative: 2 req/s to avoid hitting RateHawk concurrency limits
const rateLimiter = new TokenBucket(2, 5);

// ── Auth helpers ───────────────────────────────────────────────────────────────

function authHeader() {
  const key    = process.env.RATEHAWK_KEY;
  const secret = process.env.RATEHAWK_SECRET;
  if (!key || !secret) return null;
  return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`;
}

function isConfigured() {
  return Boolean(process.env.RATEHAWK_KEY && process.env.RATEHAWK_SECRET);
}

async function post(path, body) {
  const auth = authHeader();
  if (!auth) throw new Error('RATEHAWK_KEY / RATEHAWK_SECRET not set');
  await rateLimiter.acquire();
  const resp = await axios.post(`${BASE_URL}${path}`, body, {
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    timeout: TIMEOUT,
  });
  return resp.data;
}

// ── Region resolution ─────────────────────────────────────────────────────────

/**
 * Resolve a city/destination name to a RateHawk region object.
 * Uses the multi-complete endpoint — cached 24h.
 *
 * @returns {{ id: number, name: string, country: string } | null}
 */
async function resolveRegion(destination) {
  const normDest = destination.toLowerCase().replace(/\s+/g, '_').slice(0, 100);
  const { data } = await wrap(
    `ratehawk:region:${normDest}`,
    async () => {
      const resp = await post('/hotel/search/multicomplete/', {
        query:    destination,
        language: 'en',
      });
      const region = resp?.data?.regions?.[0];
      if (!region) return null;
      return { id: region.id, name: region.name, country: region.country_code };
    },
    TTL.region,
    'ratehawk'
  );
  return data;
}

// ── B10.4 — Hotel search ──────────────────────────────────────────────────────

/**
 * Search for hotel price estimates via RateHawk.
 *
 * Flow:
 *   1. Resolve destination → region_id (cached 24h)
 *   2. POST /search/hp/ with checkin/checkout/guests/region_id
 *   3. Return top 10 hotels with their best 3 rate options
 *
 * All results are cached for 30 minutes.
 * Returns [] (not throws) if credentials are missing or RateHawk is unavailable.
 *
 * @param {string} destination   City or destination name, e.g. 'Amsterdam'
 * @param {string} checkInDate   YYYY-MM-DD
 * @param {string} checkOutDate  YYYY-MM-DD
 * @param {number} adults
 */
async function searchHotels(destination, checkInDate, checkOutDate, adults = 2) {
  const cacheKey = `ratehawk:search:${destination}:${checkInDate}:${checkOutDate}:${adults}`;
  const { data } = await wrap(
    cacheKey,
    async () => {
      if (!isConfigured()) return null;

      const region = await resolveRegion(destination);
      if (!region) {
        logger.warn(`RateHawk: no region found for "${destination}"`);
        return null;
      }

      const resp = await post('/search/hp/', {
        checkin:   checkInDate,
        checkout:  checkOutDate,
        residency: 'en',
        language:  'en',
        guests:    [{ adults, children: [] }],
        region_id: region.id,
        currency:  'EUR',
      });

      const hotels = resp?.data?.hotels ?? [];
      const nights = Math.max(
        1,
        Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / 86_400_000)
      );

      return hotels.slice(0, 10).map((h) => ({
        id:          h.id,
        name:        h.name,
        stars:       h.star_rating ?? null,
        address:     h.address ?? null,
        coordinates: h.location
          ? { lat: h.location.latitude, lng: h.location.longitude }
          : null,
        amenities: h.amenities ?? [],
        rates: (h.rates ?? []).slice(0, 3).map((r) => {
          const paymentType = r.payment_options?.payment_types?.[0];
          const total = paymentType?.amount ? parseFloat(paymentType.amount) : null;
          return {
            roomName:     r.room_name ?? null,
            boardType:    r.meal ?? null,
            totalEur:     total,
            perNightEur:  total ? +(total / nights).toFixed(2) : null,
            currency:     paymentType?.currency_code ?? 'EUR',
            refundable:   paymentType?.is_refundable ?? null,
            rateKey:      r.book_hash ?? null, // opaque key used for booking
          };
        }),
      }));
    },
    TTL.search,
    'ratehawk'
  );

  return data ?? [];
}

// ── Hotel detail ──────────────────────────────────────────────────────────────

/**
 * Fetch full hotel details by RateHawk hotel_id.
 * Returns photos, description, amenities, and location data.
 * Cached for 1h.
 */
async function getHotelDetails(hotelId) {
  const { data } = await wrap(
    `ratehawk:hotel:${hotelId}`,
    async () => {
      if (!isConfigured()) return null;
      const resp = await post('/hotel/info/', {
        id:       hotelId,
        language: 'en',
      });
      return resp?.data ?? null;
    },
    TTL.hotelInfo,
    'ratehawk'
  );
  return data;
}

module.exports = { searchHotels, getHotelDetails, resolveRegion };
