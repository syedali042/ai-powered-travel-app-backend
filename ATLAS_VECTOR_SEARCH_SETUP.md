# Atlas Vector Search — Setup Guide

## Overview

This project uses **MongoDB Atlas Vector Search** with **Voyage AI `voyage-3.5-lite`** (1024-dim embeddings) across three collections.

| Collection | Index name | Vector field | Dimensions |
|---|---|---|---|
| `destinations` | `destination_vector_index` | `embedding` | 1024 |
| `activities` | `activity_vector_index` | `embedding` | 1024 |
| `hotels` | `hotel_vector_index` | `embedding` | 1024 |

> **Note:** MongoDB Atlas M0 (free tier) supports a maximum of 3 search indexes. These three collections cover the core search use cases for the app.

All similarity metrics use **cosine** distance.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Atlas cluster tier | **M10 or higher** — Vector Search is not available on M0 (free tier) or M2/M5 shared clusters |
| MongoDB version | 6.0.11+ / 7.0+ |
| Atlas user role | `atlasAdmin` or `Project Data Access Admin` |
| Node.js | 18+ |
| `MONGODB_URI` | Set in `.env` pointing to your Atlas cluster |

---

## Method 1 — Script (recommended for CI/CD)

The `createAtlasIndexes.js` script uses the **MongoDB Node.js driver's native `createSearchIndex()` command** — no Atlas Admin API keys required. It reads the canonical JSON definitions from `atlas/indexes/`.

```bash
# Create all missing indexes (skip existing)
npm run create-indexes

# Drop existing indexes and recreate from scratch
npm run create-indexes -- --recreate

# Target a single collection
node src/scripts/createAtlasIndexes.js --collection destinations
```

Index creation is **asynchronous on Atlas** — the script submits the request and the index builds in the background. New indexes take **1–5 minutes** to reach `READY` status.

```bash
# Check status (one-shot)
npm run verify-indexes

# Poll every 15 s until all indexes are READY (blocks until done or times out)
node src/scripts/verifyIndexes.js --wait
```

---

## Method 2 — Atlas UI (manual, no tooling required)

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com) and navigate to your project.
2. Click your cluster name → **Atlas Search** tab → **Create Search Index**.
3. Select **Atlas Vector Search** → **JSON Editor**.
4. Set **Database** and **Collection** (e.g., `your_db` → `destinations`).
5. Paste the index definition JSON (see below or from `atlas/indexes/`).
6. Click **Next → Create Search Index**.
7. Repeat for each collection.

### Destination index definition

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" },
    { "type": "filter", "path": "country" },
    { "type": "filter", "path": "category" },
    { "type": "filter", "path": "avgDailyBudget.budget" },
    { "type": "filter", "path": "bestMonths" },
    { "type": "filter", "path": "isActive" }
  ]
}
```

> **Note:** The Atlas UI JSON editor takes the `definition` object directly (without the outer `name`/`type` wrapper — those are set via dropdowns above).

### Activity index definition

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" },
    { "type": "filter", "path": "destinationId" },
    { "type": "filter", "path": "category" },
    { "type": "filter", "path": "priceLevel" },
    { "type": "filter", "path": "isActive" }
  ]
}
```

### Hotel index definition

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" },
    { "type": "filter", "path": "destinationId" },
    { "type": "filter", "path": "starRating" },
    { "type": "filter", "path": "priceLevel" },
    { "type": "filter", "path": "isActive" }
  ]
}
```

---

## Method 3 — Atlas Admin API (curl / CI pipeline)

Requires an **Atlas API key pair** (`ATLAS_PUBLIC_KEY` / `ATLAS_PRIVATE_KEY`) with `Project Data Access Admin` or higher.

```bash
export ATLAS_PUBLIC_KEY="your_public_key"
export ATLAS_PRIVATE_KEY="your_private_key"
export ATLAS_PROJECT_ID="your_project_id"
export ATLAS_CLUSTER="your_cluster_name"
export ATLAS_DB="your_database_name"
```

```bash
# Create destination_vector_index via Atlas Admin API
curl --user "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" \
     --digest \
     --header "Content-Type: application/json" \
     --request POST \
     "https://cloud.mongodb.com/api/atlas/v2/groups/${ATLAS_PROJECT_ID}/clusters/${ATLAS_CLUSTER}/search/indexes" \
     --data '{
       "collectionName": "destinations",
       "database": "'"${ATLAS_DB}"'",
       "name": "destination_vector_index",
       "type": "vectorSearch",
       "definition": {
         "fields": [
           { "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" },
           { "type": "filter", "path": "country" },
           { "type": "filter", "path": "category" },
           { "type": "filter", "path": "avgDailyBudget.budget" },
           { "type": "filter", "path": "bestMonths" },
           { "type": "filter", "path": "isActive" }
         ]
       }
     }'
```

```bash
# List all search indexes on a collection (check status)
curl --user "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" \
     --digest \
     --request GET \
     "https://cloud.mongodb.com/api/atlas/v2/groups/${ATLAS_PROJECT_ID}/clusters/${ATLAS_CLUSTER}/search/indexes/${ATLAS_DB}/destinations"
```

Repeat for `activities` and `hotels` — adjust `collectionName`, `database`, `name`, and `definition` accordingly.

---

## How $vectorSearch queries work

Once indexes are READY, queries use the `$vectorSearch` aggregation stage:

```js
// Example: find the 5 most similar destinations to a user's query embedding
const results = await Destination.aggregate([
  {
    $vectorSearch: {
      index: 'destination_vector_index',
      path: 'embedding',
      queryVector: voyageEmbedding,   // Float32Array or number[], length 1024
      numCandidates: 100,             // candidates to consider (must be >= limit)
      limit: 5,                       // final results to return
      filter: {                       // optional pre-filter on indexed filter fields
        country: 'Netherlands',
        isActive: true,
      },
    },
  },
  {
    $project: {
      name: 1,
      city: 1,
      category: 1,
      score: { $meta: 'vectorSearchScore' },
    },
  },
]);
```

`numCandidates` controls the recall/latency tradeoff:
- Higher = better recall, slower query (start with `10 × limit`)
- Lower = faster query, may miss relevant results

---

## Populating embeddings (next step)

Seed documents are inserted **without embeddings** — the `embedding` field is empty by design. To populate them:

1. Call **Voyage AI** (`voyage-3.5-lite`) with the document text to generate a 1024-dim vector.
2. Update the document with `{ embedding: voyageVector }`.

```js
// Pseudo-code — see the Voyage AI service (to be implemented)
const text = `${destination.name} ${destination.description} ${destination.tags.join(' ')}`;
const vector = await voyageClient.embed(text, { model: 'voyage-3.5-lite' });
await Destination.updateOne({ _id: destination._id }, { $set: { embedding: vector } });
```

The `embedding` field is `select: false` in all schemas — it is **never returned by default** and must be explicitly projected: `.select('+embedding')`.

---

## Verification

```bash
npm run verify-indexes
```

Expected output when indexes are READY and no embeddings are populated:

```
══════════════════════════════════════════════════════════════════════════
 Atlas Vector Search Index Verification Report
══════════════════════════════════════════════════════════════════════════

  ✓  destinations  →  destination_vector_index
      Status   : READY
      Queryable: true
      Probe    : PASS — 0 results — expected (no embeddings in seed data yet)

  ✓  activities  →  activity_vector_index
      ...

  3/3 indexes READY
  All indexes are READY and queryable ✓
════════════════════════════════════════════════════════════════════════════
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Atlas Vector Search is not supported` | Cluster tier is M0/M2/M5 | Upgrade to M10+ |
| `createSearchIndex is not a function` | Mongoose <8 / Driver <6 | Ensure `mongoose ^8.4.0` |
| Index stays in `BUILDING` for >15 min | Large collection or Atlas issue | Check Atlas UI activity feed |
| `Index not found` in query | Index name typo or not READY yet | Run `verify-indexes`, check name |
| Probe returns 0 results (READY) | No documents have embeddings yet | Expected — populate embeddings first |
| `user is not authorized` | DB user lacks `dbAdmin` role | Add `atlasAdmin` role in Atlas → Database Access |

---

## File reference

```
atlas/
  indexes/
    destination_vector_index.json    ← canonical index definition (source of truth)
    activity_vector_index.json
    hotel_vector_index.json

src/scripts/
  createAtlasIndexes.js             ← creates/recreates all indexes via MongoDB driver
  verifyIndexes.js                  ← checks status and runs live probe queries
```
