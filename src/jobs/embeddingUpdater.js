/**
 * Background embedding updater.
 *
 * Scans all embeddable collections for documents that have no embedding
 * (null, missing, or empty array) and generates + stores them via Voyage AI.
 *
 * Two modes:
 *   - Scheduled: runs every 5 minutes via node-cron when this module is
 *     required and the process stays alive (e.g. started by server.js)
 *   - Manual: call runOnce() directly or run via CLI
 *
 * CLI usage:
 *   node src/jobs/embeddingUpdater.js
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { generateEmbeddingsBatched } = require('../services/embeddingService');
const { buildEmbeddingText, userHasEmbeddablePreferences } = require('../services/contentProcessor');
const { Destination, Activity, Hotel, User } = require('../models');

const BATCH = 50; // docs per update pass (keep small to avoid long-running passes)

// ── Collection configs ────────────────────────────────────────────────────────

const CONFIGS = [
  {
    name: 'destinations',
    Model: Destination,
    type: 'destination',
    embeddingField: 'embedding',
    projection: '+embedding name country city description shortDescription category tags bestMonths',
  },
  {
    name: 'activities',
    Model: Activity,
    type: 'activity',
    embeddingField: 'embedding',
    projection: '+embedding name destinationId description category priceLevel duration tags',
    needsDestName: true,
  },
  {
    name: 'hotels',
    Model: Hotel,
    type: 'hotel',
    embeddingField: 'embedding',
    projection: '+embedding name destinationId starRating description amenities priceLevel',
    needsDestName: true,
  },
  {
    name: 'users',
    Model: User,
    type: 'user',
    embeddingField: 'profileEmbedding',
    projection: '+profileEmbedding name preferences',
    preFilter: (doc) => userHasEmbeddablePreferences(doc),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// Query for documents that are missing their embedding
function missingEmbeddingQuery(field) {
  return {
    $or: [
      { [field]: { $exists: false } },
      { [field]: null },
      { [`${field}.0`]: { $exists: false } },
    ],
  };
}

let destMap = null;

async function getDestinationMap() {
  if (destMap) return destMap;
  const dests = await Destination.find({}).select('name').lean();
  destMap = new Map(dests.map((d) => [d._id.toString(), d.name]));
  return destMap;
}

// ── Per-collection update ─────────────────────────────────────────────────────

async function updateCollection(config) {
  const { name, Model, type, embeddingField, projection, needsDestName, preFilter } = config;

  const docs = await Model.find(missingEmbeddingQuery(embeddingField))
    .select(projection)
    .limit(BATCH)
    .lean();

  if (!docs.length) return 0;

  const eligible = preFilter ? docs.filter(preFilter) : docs;
  if (!eligible.length) return 0;

  const dm = needsDestName ? await getDestinationMap() : null;

  const texts = eligible.map((doc) => {
    const context = needsDestName
      ? { destinationName: dm.get(doc.destinationId?.toString()) || '' }
      : {};
    return buildEmbeddingText(doc, type, context);
  });

  const embeddings = await generateEmbeddingsBatched(texts, { batchSize: 128 });

  const ops = eligible.map((doc, i) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { [embeddingField]: embeddings[i] } },
    },
  }));

  await Model.bulkWrite(ops, { ordered: false });

  logger.info(`[embeddingUpdater] ${name}: embedded ${eligible.length} doc(s)`);
  return eligible.length;
}

// ── Main run ──────────────────────────────────────────────────────────────────

async function runOnce() {
  let total = 0;
  for (const config of CONFIGS) {
    try {
      total += await updateCollection(config);
    } catch (err) {
      logger.error(`[embeddingUpdater] ${config.name} failed: ${err.message}`);
    }
  }
  if (total === 0) {
    logger.info('[embeddingUpdater] No missing embeddings found.');
  } else {
    logger.info(`[embeddingUpdater] Pass complete — ${total} total embeddings generated.`);
  }
  return total;
}

// ── Scheduler (active when this file is required, not run via CLI) ────────────

let schedulerStarted = false;

function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('[embeddingUpdater] Scheduled pass starting…');
    await runOnce().catch((err) =>
      logger.error('[embeddingUpdater] Scheduled pass error:', err.message)
    );
  });

  logger.info('[embeddingUpdater] Scheduler active — running every 5 minutes');
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

if (require.main === module) {
  require('dotenv').config();
  const { connectDB } = require('../config/db');

  connectDB()
    .then(() => runOnce())
    .then(() => mongoose.disconnect())
    .catch((err) => {
      logger.error('embeddingUpdater CLI failed:', err.message);
      process.exit(1);
    });
}

module.exports = { runOnce, startScheduler };
