/**
 * Verifies Atlas Vector Search indexes across all embeddable collections.
 *
 * For each expected index it:
 *   1. Checks existence via listSearchIndexes
 *   2. Reports the current Atlas status (PENDING / BUILDING / READY / FAILED)
 *   3. If READY, runs a live $vectorSearch probe and confirms the pipeline executes
 *      (0 results are expected — seed documents have no embeddings yet)
 *   4. Prints a pass/fail summary table
 *
 * Usage:
 *   node src/scripts/verifyIndexes.js
 *   node src/scripts/verifyIndexes.js --wait   # poll every 15 s until all READY
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const logger = require('../utils/logger');

// ── Expected indexes ──────────────────────────────────────────────────────────

const EXPECTED = [
  {
    collectionName: 'destinations',
    indexName: 'destination_vector_index',
    vectorPath: 'embedding',
  },
  {
    collectionName: 'activities',
    indexName: 'activity_vector_index',
    vectorPath: 'embedding',
  },
  {
    collectionName: 'hotels',
    indexName: 'hotel_vector_index',
    vectorPath: 'embedding',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// A normalised 1024-dim unit vector used as the probe query.
// Cosine similarity against this will be well-defined even though the values
// are uniform — what matters is that Atlas accepts and executes the pipeline.
const PROBE_VECTOR = Array.from({ length: 1024 }, () => 1 / Math.sqrt(1024));

async function getIndexInfo(collection, indexName) {
  try {
    const list = await collection.listSearchIndexes(indexName).toArray();
    return list.length > 0 ? list[0] : null;
  } catch (err) {
    return { _error: err.message };
  }
}

async function probeVectorSearch(collection, indexName, vectorPath) {
  try {
    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: indexName,
            path: vectorPath,
            queryVector: PROBE_VECTOR,
            numCandidates: 10,
            limit: 3,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ])
      .toArray();
    return { ok: true, count: results.length, results };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function statusIcon(status) {
  const map = {
    READY: '✓',
    BUILDING: '⏳',
    PENDING: '⏳',
    FAILED: '✗',
    DELETING: '…',
    STALE: '⚠',
    TEMPORARILY_UNAVAILABLE: '⚠',
  };
  return map[status] || '?';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function runVerification(db) {
  const rows = [];

  for (const { collectionName, indexName, vectorPath } of EXPECTED) {
    const collection = db.collection(collectionName);
    const info = await getIndexInfo(collection, indexName);

    if (!info) {
      rows.push({
        collectionName,
        indexName,
        status: 'NOT FOUND',
        queryable: false,
        probeResult: null,
        icon: '✗',
      });
      continue;
    }

    if (info._error) {
      rows.push({
        collectionName,
        indexName,
        status: `ERROR: ${info._error}`,
        queryable: false,
        probeResult: null,
        icon: '✗',
      });
      continue;
    }

    const status = info.status || 'UNKNOWN';
    const queryable = info.queryable === true;
    let probeResult = null;

    if (queryable) {
      probeResult = await probeVectorSearch(collection, indexName, vectorPath);
    }

    rows.push({
      collectionName,
      indexName,
      status,
      queryable,
      probeResult,
      icon: statusIcon(status),
    });
  }

  return rows;
}

function printReport(rows) {
  const w = 72;
  console.log('\n' + '═'.repeat(w));
  console.log(' Atlas Vector Search Index Verification Report');
  console.log('═'.repeat(w));

  for (const r of rows) {
    console.log(`\n  ${r.icon}  ${r.collectionName}  →  ${r.indexName}`);
    console.log(`      Status   : ${r.status}`);
    console.log(`      Queryable: ${r.queryable}`);

    if (r.probeResult) {
      if (r.probeResult.ok) {
        const msg =
          r.probeResult.count === 0
            ? '0 results — expected (no embeddings in seed data yet)'
            : `${r.probeResult.count} result(s) returned`;
        console.log(`      Probe    : PASS — ${msg}`);
      } else {
        console.log(`      Probe    : FAIL — ${r.probeResult.error}`);
      }
    } else if (r.queryable === false && r.status !== 'NOT FOUND') {
      console.log(`      Probe    : skipped — index not yet queryable`);
    }
  }

  console.log('\n' + '─'.repeat(w));

  const ready = rows.filter((r) => r.status === 'READY').length;
  const total = rows.length;
  const allReady = ready === total;
  const probesFailed = rows.filter((r) => r.probeResult && !r.probeResult.ok).length;

  console.log(`  ${ready}/${total} indexes READY${probesFailed ? `  |  ${probesFailed} probe(s) FAILED` : ''}`);

  if (!allReady) {
    const notReady = rows.filter((r) => r.status !== 'READY').map((r) => r.collectionName);
    console.log(`  Waiting on: ${notReady.join(', ')}`);
    console.log('  Run  node src/scripts/verifyIndexes.js --wait  to poll until all READY.');
  } else {
    console.log('  All indexes are READY and queryable ✓');
  }
  console.log('═'.repeat(w) + '\n');

  return allReady && probesFailed === 0;
}

async function main() {
  const waitMode = process.argv.includes('--wait');
  const POLL_INTERVAL_MS = 15_000;

  await connectDB();
  const db = mongoose.connection.db;

  if (!waitMode) {
    const rows = await runVerification(db);
    printReport(rows);
    await mongoose.disconnect();
    return;
  }

  // ── Poll mode ─────────────────────────────────────────────────────────────
  logger.info('--wait mode: polling every 15 s until all indexes are READY...');
  let allReady = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 40; // 10 minutes

  while (!allReady && attempts < MAX_ATTEMPTS) {
    attempts++;
    const rows = await runVerification(db);
    allReady = printReport(rows);

    if (!allReady) {
      logger.info(`Attempt ${attempts}/${MAX_ATTEMPTS} — retrying in ${POLL_INTERVAL_MS / 1000} s...`);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }

  if (!allReady) {
    logger.error('Timed out waiting for indexes to become READY. Check Atlas UI for details.');
    process.exitCode = 1;
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  logger.error('verifyIndexes failed:', err.message);
  process.exit(1);
});
