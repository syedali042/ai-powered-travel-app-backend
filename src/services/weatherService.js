const axios = require('axios');
const { wrap } = require('./cacheService');
const { TokenBucket } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

// OpenWeatherMap — 5-day forecast (requires API key, free tier: 60 calls/min)
const OWM_BASE    = 'https://api.openweathermap.org/data/2.5';
// Open-Meteo archive — historical averages (completely free, no API key required)
const METEO_BASE  = 'https://archive-api.open-meteo.com/v1/archive';
const TIMEOUT     = 8_000;

// OpenWeatherMap: ~1 req/s on free tier (60/min)
const rateLimiter = new TokenBucket(1, 5);

const TTL = {
  forecast:   10_800,    // 3h  — forecasts change but not every minute
  historical: 2_592_000, // 30d — historical averages are stable
};

function owmKey() {
  return process.env.OPENWEATHER_API_KEY;
}

function coordKey(lat, lng) {
  return `${parseFloat(lat).toFixed(3)}:${parseFloat(lng).toFixed(3)}`;
}

// ── B10.2 ─────────────────────────────────────────────────────────────────────

/**
 * Fetch 5-day forecast in 3-hour intervals from OpenWeatherMap.
 * If `dates` is provided (array of date strings), the returned list is
 * filtered to items that fall within that window.
 *
 * Returns null if OPENWEATHER_API_KEY is not configured or provider is down.
 */
async function getForecast(lat, lng, dates) {
  // Bucket cache key to the current UTC hour so we re-use within the same hour
  const hourBucket = new Date().toISOString().slice(0, 13);
  const cacheKey   = `weather:forecast:${coordKey(lat, lng)}:${hourBucket}`;

  const { data } = await wrap(
    cacheKey,
    async () => {
      if (!owmKey()) return null;
      await rateLimiter.acquire();
      const resp = await axios.get(`${OWM_BASE}/forecast`, {
        params: {
          lat,
          lon:   lng,
          appid: owmKey(),
          units: 'metric',
          cnt:   40, // max 5 days × 8 intervals/day
        },
        timeout: TIMEOUT,
      });
      return (
        resp.data?.list?.map((item) => ({
          dt:          item.dt,
          date:        new Date(item.dt * 1000).toISOString(),
          temp:        item.main.temp,
          feelsLike:   item.main.feels_like,
          humidity:    item.main.humidity,
          windSpeed:   item.wind.speed,
          weather: {
            main:        item.weather[0].main,
            description: item.weather[0].description,
            icon:        item.weather[0].icon,
          },
        })) ?? null
      );
    },
    TTL.forecast,
    'openweathermap'
  );

  if (!data) return null;

  // Filter to the trip date window if provided
  if (dates?.length) {
    const startEpoch = Math.floor(new Date(dates[0]).getTime() / 1000);
    const endEpoch   = Math.floor(new Date(dates[dates.length - 1]).getTime() / 1000) + 86400;
    return data.filter((d) => d.dt >= startEpoch && d.dt <= endEpoch);
  }

  return data;
}

/**
 * Get historical monthly averages via Open-Meteo (no API key required).
 * Uses the same calendar month from the previous year as the reference period.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} month  1–12
 */
async function getHistoricalAvg(lat, lng, month) {
  const cacheKey = `weather:historical:${coordKey(lat, lng)}:${month}`;

  const { data } = await wrap(
    cacheKey,
    async () => {
      const refYear     = new Date().getFullYear() - 1;
      const mm          = String(month).padStart(2, '0');
      const daysInMonth = new Date(refYear, parseInt(month), 0).getDate();
      const startDate   = `${refYear}-${mm}-01`;
      const endDate     = `${refYear}-${mm}-${daysInMonth}`;

      const resp = await axios.get(METEO_BASE, {
        params: {
          latitude:   lat,
          longitude:  lng,
          start_date: startDate,
          end_date:   endDate,
          daily:      'temperature_2m_max,temperature_2m_min,precipitation_sum',
          timezone:   'UTC',
        },
        timeout: TIMEOUT,
      });

      const daily = resp.data?.daily;
      if (!daily?.temperature_2m_max?.length) return null;

      const avg = (arr) => arr.reduce((s, v) => s + (v ?? 0), 0) / arr.length;

      return {
        month,
        referenceYear: refYear,
        avgMaxTempC:          +avg(daily.temperature_2m_max).toFixed(1),
        avgMinTempC:          +avg(daily.temperature_2m_min).toFixed(1),
        avgDailyPrecipMm:     +avg(daily.precipitation_sum).toFixed(1),
        totalPrecipMm:        +daily.precipitation_sum.reduce((s, v) => s + (v ?? 0), 0).toFixed(1),
      };
    },
    TTL.historical,
    'open_meteo'
  );

  return data;
}

module.exports = { getForecast, getHistoricalAvg };
