const OpenAI = require('openai');
const logger = require('../utils/logger');

// Lazy-initialize to avoid key validation at require-time
let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const FAST_MODEL = process.env.OPENAI_FAST_MODEL || 'gpt-4o-mini';

// ── Schema documentation passed to the LLM ────────────────────────────────────

const SYSTEM_PROMPT = `You are a filter extraction engine for a Netherlands travel search API.
Extract structured search filters from the user's query. Respond ONLY with a valid JSON object.

Output schema (all fields optional — include only what the query clearly implies):
{
  "destinations": {
    "country": "Netherlands",          // always "Netherlands" for this app — include only if mentioned
    "category": ["cultural","nature"], // from: historical, cultural, nature, beach, urban, museum, windmill, art
    "bestMonths": ["April","May"],      // months mentioned or implied by season
    "maxDailyBudget": 150             // number in EUR if a specific budget is mentioned
  },
  "activities": {
    "category": "cultural",           // one of: food, adventure, cultural, nightlife, nature, shopping, wellness, transport
    "priceLevel": "budget"            // one of: free, budget, mid, luxury
  },
  "hotels": {
    "priceLevel": "mid",              // one of: budget, mid, luxury
    "minStarRating": 4                // number 1-5
  }
}

Rules:
- Return {} (empty object) if you cannot extract any meaningful filters
- Never invent information not implied by the query
- "cheap/affordable" → priceLevel "budget"; "nice/comfortable" → "mid"; "luxury/5-star" → "luxury"
- Seasonal hints: "spring" → April/May; "summer" → June/July/August; "autumn" → Sept/Oct; "winter" → Nov-Feb
- Museums, galleries, history → category "cultural" or "museum"
- Beaches, hiking, nature → category "nature"
- Respond with ONLY the JSON object, no prose`;

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Extracts structured Atlas Vector Search filters from a natural language query.
 * Returns an object with optional `destinations`, `activities`, `hotels` sub-filters.
 * Falls back to `{}` on any failure so vector search still works without filters.
 *
 * @param {string} query  Natural language travel query
 * @returns {Promise<{destinations?: object, activities?: object, hotels?: object}>}
 */
async function extractFilters(query) {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not set — skipping filter extraction');
    return {};
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: FAST_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 300,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    logger.debug('extractFilters result:', JSON.stringify(parsed));
    return parsed;
  } catch (err) {
    // Extraction failure is non-fatal — vector search still works without filters
    logger.warn(`extractFilters failed (${err.message}). Using empty filters.`);
    return {};
  }
}

module.exports = { extractFilters };
