const { VoyageAIClient } = require('voyageai');
const logger = require('../utils/logger');

const voyageClient = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

const VOYAGE_MODEL = process.env.VOYAGE_MODEL || 'voyage-3.5-lite';

// voyage-3.5-lite has a 32K token context window. ~4 chars/token → 128K chars.
// Use a conservative 120K limit to leave headroom for tokenization overhead.
const MAX_CHARS = 120_000;

// ── Rate limiter ─────────────────────────────────────────────────────────────
// Voyage AI free tier: 300 RPM = 5 req/sec.
// Token bucket: refill at 5 tokens/sec, burst capacity 15.

class TokenBucket {
  constructor(ratePerSecond, capacity) {
    this.ratePerMs = ratePerSecond / 1000;
    this.capacity = capacity;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire() {
    const now = Date.now();
    this.tokens = Math.min(
      this.capacity,
      this.tokens + (now - this.lastRefill) * this.ratePerMs
    );
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const waitMs = Math.ceil((1 - this.tokens) / this.ratePerMs);
    await sleep(waitMs);
    this.tokens = 0;
    this.lastRefill = Date.now();
  }
}

const rateLimiter = new TokenBucket(5, 15);

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanText(text) {
  return String(text)
    .replace(/<[^>]+>/g, '')   // strip HTML tags
    .replace(/\s+/g, ' ')      // normalize whitespace / collapse newlines
    .trim()
    .slice(0, MAX_CHARS);
}

async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = 1000 * Math.pow(2, attempt); // 1 s, 2 s, 4 s
      logger.warn(`Voyage AI attempt ${attempt + 1} failed (${err.message}). Retrying in ${delay}ms…`);
      await sleep(delay);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Embed a single piece of text. Returns a 1024-dim float array.
 */
async function generateEmbedding(text) {
  const input = [cleanText(text)];
  await rateLimiter.acquire();
  return withRetry(async () => {
    const response = await voyageClient.embed({ input, model: VOYAGE_MODEL });
    return response.data[0].embedding;
  });
}

/**
 * Embed an array of texts in a single Voyage AI call (max 128 per call).
 * Returns an array of 1024-dim float arrays in the same order as the input.
 */
async function generateEmbeddings(texts) {
  if (!texts.length) return [];
  if (texts.length > 128) {
    throw new Error('generateEmbeddings: max 128 texts per call — use generateEmbeddingsBatched for larger sets');
  }
  const input = texts.map(cleanText);
  await rateLimiter.acquire();
  return withRetry(async () => {
    const response = await voyageClient.embed({ input, model: VOYAGE_MODEL });
    return response.data.map((d) => d.embedding);
  });
}

/**
 * Embed an arbitrary number of texts, automatically splitting into 128-text
 * batches and honouring the rate limiter between each batch.
 * Returns embeddings in the same order as the input.
 */
async function generateEmbeddingsBatched(texts, { batchSize = 128 } = {}) {
  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await generateEmbeddings(batch);
    results.push(...embeddings);
  }
  return results;
}

module.exports = { generateEmbedding, generateEmbeddings, generateEmbeddingsBatched, cleanText };
