/**
 * Reads all seeded documents from MongoDB, generates Voyage AI embeddings,
 * and writes them back. Supports resume-on-failure via a local progress file.
 *
 * Usage:
 *   node src/scripts/seedAndEmbed.js              # embed any docs not yet done
 *   node src/scripts/seedAndEmbed.js --fresh       # reset progress, redo all
 *   node src/scripts/seedAndEmbed.js --collection destinations
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const logger = require('../utils/logger');
const { generateEmbeddingsBatched } = require('../services/embeddingService');
const { buildEmbeddingText, userHasEmbeddablePreferences } = require('../services/contentProcessor');

const { Destination, Activity, Hotel, User } = require('../models');

// ── Constants ─────────────────────────────────────────────────────────────────

const MONGO_BATCH = 100;  // docs fetched per MongoDB query
const API_BATCH   = 128;  // texts sent per Voyage AI call

const PROGRESS_FILE = path.join(__dirname, '.embed-progress.json');

// ── Collection configs ────────────────────────────────────────────────────────

const ALL_COLLECTIONS = [
  {
    name: 'destinations',
    Model: Destination,
    type: 'destination',
    embeddingField: 'embedding',
    projection: 'name country city description shortDescription category tags bestMonths',
  },
  {
    name: 'activities',
    Model: Activity,
    type: 'activity',
    embeddingField: 'embedding',
    projection: 'name destinationId description category priceLevel duration tags',
    needsDestName: true,
  },
  {
    name: 'hotels',
    Model: Hotel,
    type: 'hotel',
    embeddingField: 'embedding',
    projection: 'name destinationId starRating description amenities priceLevel',
    needsDestName: true,
  },
  {
    name: 'users',
    Model: User,
    type: 'user',
    embeddingField: 'profileEmbedding',
    projection: 'name preferences',
    filter: (doc) => userHasEmbeddablePreferences(doc),
  },
];

// ── Progress file ─────────────────────────────────────────────────────────────

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ── Destination name map (needed for activities & hotels) ─────────────────────

async function buildDestinationMap() {
  const dests = await Destination.find({}).select('name').lean();
  const map = new Map();
  for (const d of dests) {
    map.set(d._id.toString(), d.name);
  }
  return map;
}

// ── Core processor ────────────────────────────────────────────────────────────

async function processCollection(config, progress, destMap) {
  const { name, Model, type, embeddingField, projection, needsDestName, filter } = config;

  const total = await Model.countDocuments();
  const startAt = progress[name]?.processed ?? 0;

  if (startAt >= total) {
    logger.info(`[${name}] Already complete — ${total} docs. Skipping.`);
    return;
  }

  logger.info(`[${name}] Starting from doc ${startAt + 1}/${total}`);

  let processed = startAt;

  while (processed < total) {
    const docs = await Model.find({})
      .select(projection)
      .skip(processed)
      .limit(MONGO_BATCH)
      .lean();

    if (!docs.length) break;

    // Optionally filter (e.g. users with no preferences skip embedding)
    const eligible = filter ? docs.filter(filter) : docs;

    if (eligible.length) {
      // Build embedding texts
      const texts = eligible.map((doc) => {
        const context = needsDestName
          ? { destinationName: destMap?.get(doc.destinationId?.toString()) || '' }
          : {};
        return buildEmbeddingText(doc, type, context);
      });

      // Embed in sub-batches of API_BATCH
      const embeddings = await generateEmbeddingsBatched(texts, { batchSize: API_BATCH });

      // Write back to MongoDB via bulkWrite
      const ops = eligible.map((doc, i) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { [embeddingField]: embeddings[i] } },
        },
      }));
      await Model.bulkWrite(ops, { ordered: false });
    }

    processed += docs.length;
    progress[name] = { processed, total };
    saveProgress(progress);

    const pct = Math.round((processed / total) * 100);
    logger.info(`[${name}] ${processed}/${total} (${pct}%) — batch embedded`);
  }

  logger.info(`[${name}] Done — ${processed} docs processed`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const fresh = args.includes('--fresh');
  const targetCollection = (() => {
    const i = args.indexOf('--collection');
    return i !== -1 ? args[i + 1] : null;
  })();

  const collections = targetCollection
    ? ALL_COLLECTIONS.filter((c) => c.name === targetCollection)
    : ALL_COLLECTIONS;

  if (!collections.length) {
    logger.error(`Unknown collection "${targetCollection}". Valid: ${ALL_COLLECTIONS.map((c) => c.name).join(', ')}`);
    process.exit(1);
  }

  if (fresh && fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    logger.info('Progress file cleared (--fresh mode)');
  }

  await connectDB();

  const progress = loadProgress();
  const destMap = await buildDestinationMap();

  logger.info(`Starting embedding pipeline — ${collections.length} collection(s)`);

  for (const config of collections) {
    try {
      await processCollection(config, progress, destMap);
    } catch (err) {
      logger.error(`[${config.name}] Fatal error: ${err.message}`);
      logger.info('Progress saved — re-run to resume from the last completed batch.');
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  logger.info('Embedding pipeline complete.');
  await mongoose.disconnect();
}

main().catch((err) => {
  logger.error('seedAndEmbed failed:', err.message);
  process.exit(1);
});
