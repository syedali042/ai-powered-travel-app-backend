const axios = require('axios');
const { wrap } = require('./cacheService');
const logger = require('../utils/logger');

// Frankfurter API — open source, no API key required, backed by the ECB
// Docs: https://www.frankfurter.app/docs/
const FRANKFURTER_BASE = 'https://api.frankfurter.app';
const TIMEOUT          = 8_000;

// B10.3 specifies 1-hour TTL for exchange rates
const TTL_RATES    = 3_600;
const TTL_CURRENCY_LIST = 86_400; // 24h — currency list is static

// ── B10.3 ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all exchange rates for a given base currency (cached 1h in MongoDB).
 * Returns a plain object like { USD: 1.08, GBP: 0.86, JPY: 163.4, ... }
 * or null if the provider is unavailable.
 */
async function getRates(base = 'EUR') {
  const normalised = base.toUpperCase();
  const { data } = await wrap(
    `currency:rates:${normalised}`,
    async () => {
      const resp = await axios.get(`${FRANKFURTER_BASE}/latest`, {
        params:  { from: normalised },
        timeout: TIMEOUT,
      });
      return resp.data?.rates ?? null;
    },
    TTL_RATES,
    'frankfurter'
  );
  return data;
}

/**
 * Convert an amount from one currency to another.
 *
 * @returns {{ amount, from, to, rate, result }} or null on failure
 */
async function convert(amount, from, to) {
  const f = from.toUpperCase();
  const t = to.toUpperCase();

  if (f === t) return { amount, from: f, to: t, rate: 1, result: +amount };

  const rates = await getRates(f);
  if (!rates) {
    logger.warn(`Currency rates unavailable for base ${f}`);
    return null;
  }

  const rate = rates[t];
  if (!rate) {
    logger.warn(`No exchange rate found for ${f} → ${t}`);
    return null;
  }

  return {
    amount,
    from:   f,
    to:     t,
    rate:   +rate.toFixed(6),
    result: +(amount * rate).toFixed(2),
  };
}

/**
 * Get the full list of supported currencies (symbol → name).
 * Cached for 24h since the list changes very rarely.
 */
async function getSupportedCurrencies() {
  const { data } = await wrap(
    'currency:list',
    async () => {
      const resp = await axios.get(`${FRANKFURTER_BASE}/currencies`, { timeout: TIMEOUT });
      return resp.data ?? null;
    },
    TTL_CURRENCY_LIST,
    'frankfurter'
  );
  return data;
}

module.exports = { convert, getRates, getSupportedCurrencies };
