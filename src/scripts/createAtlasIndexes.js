/**
 * Creates (or recreates) Atlas Vector Search indexes on all embeddable collections.
 *
 * Uses the MongoDB Node.js driver's native createSearchIndex() command — no Atlas
 * Admin API keys required; only the standard MONGODB_URI connection is needed.
 *
 * Requirements:
 *   - Atlas M10+ cluster (Vector Search is not available on M0 free tier)
 *   - MongoDB Atlas connection via MONGODB_URI in .env
 *   - The connecting user must have atlasAdmin or dbAdmin role
 *
 * Usage:
 *   node src/scripts/createAtlasIndexes.js             # create missing, skip existing
 *   node src/scripts/createAtlasIndexes.js --recreate  # drop existing, then recreate
 *   node src/scripts/createAtlasIndexes.js --collection destinations  # single collection
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const { connectDB } = require('../config/db');
const logger = require('../utils/logger');

// ── Index definitions ────────────────────────────────────────────────────────

const INDEX_CONFIGS = [
  {
    collectionName: 'destinations',
    definition: require(path.join(__dirname, '../../atlas/indexes/destination_vector_index.json')),
  },
  {
    collectionName: 'activities',
    definition: require(path.join(__dirname, '../../atlas/indexes/activity_vector_index.json')),
  },
  {
    collectionName: 'hotels',
    definition: require(path.join(__dirname, '../../atlas/indexes/hotel_vector_index.json')),
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function indexExists(collection, indexName) {
  try {
    const indexes = await collection.listSearchIndexes(indexName).toArray();
    return indexes.length > 0 ? indexes[0] : null;
  } catch {
    return null;
  }
}

async function dropIndex(collection, indexName) {
  await collection.dropSearchIndex(indexName);
  // Atlas index deletion is async; wait briefly before recreating
  logger.info(`  Dropped: ${indexName}`);
  await new Promise((r) => setTimeout(r, 3000));
}

async function createIndex(collection, definition) {
  const name = await collection.createSearchIndex(definition);
  return name;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const recreate = process.argv.includes('--recreate');
  const targetCollection = (() => {
    const i = process.argv.indexOf('--collection');
    return i !== -1 ? process.argv[i + 1] : null;
  })();

  await connectDB();
  const db = mongoose.connection.db;

  const configs = targetCollection
    ? INDEX_CONFIGS.filter((c) => c.collectionName === targetCollection)
    : INDEX_CONFIGS;

  if (!configs.length) {
    logger.error(`Unknown collection: "${targetCollection}". Valid: ${INDEX_CONFIGS.map((c) => c.collectionName).join(', ')}`);
    process.exit(1);
  }

  const results = [];

  for (const { collectionName, definition } of configs) {
    const collection = db.collection(collectionName);
    const indexName = definition.name;

    logger.info(`\n[${collectionName}] Processing index: ${indexName}`);

    const existing = await indexExists(collection, indexName);

    if (existing) {
      if (!recreate) {
        logger.info(`  Already exists (status: ${existing.status}) — skipping. Use --recreate to rebuild.`);
        results.push({ collectionName, indexName, action: 'skipped', status: existing.status });
        continue;
      }
      await dropIndex(collection, indexName);
    }

    try {
      await createIndex(collection, definition);
      logger.info(`  Created: ${indexName} (building in background — check Atlas UI for READY status)`);
      results.push({ collectionName, indexName, action: 'created', status: 'BUILDING' });
    } catch (err) {
      logger.error(`  Failed: ${err.message}`);
      results.push({ collectionName, indexName, action: 'failed', error: err.message });
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(72));
  console.log('Index creation summary:');
  console.log('─'.repeat(72));
  for (const r of results) {
    const icon = r.action === 'failed' ? '✗' : r.action === 'skipped' ? '·' : '✓';
    const detail = r.error ? `  ← ${r.error}` : `  [${r.status}]`;
    console.log(`  ${icon}  ${r.collectionName}.${r.indexName}${detail}`);
  }
  console.log('─'.repeat(72));
  console.log('Note: newly created indexes take 1-5 minutes to reach READY status on Atlas.');
  console.log('Run  node src/scripts/verifyIndexes.js  to check when they are queryable.\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  logger.error('createAtlasIndexes failed:', err.message);
  process.exit(1);
});
