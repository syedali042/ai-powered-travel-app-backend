const { Router } = require('express');
const { runSeed } = require('../../../seeders');
const { success, error } = require('../../../utils/response');

const router = Router();

// Guard: only available in development
router.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return error(res, 'Seed endpoint is only available in development mode', 403);
  }
  next();
});

/**
 * POST /api/v1/seed
 * Body: { "fresh": true }  — drop all collections and re-seed
 * Body: {}                 — upsert-only (idempotent, safe to re-run)
 */
router.post('/', async (req, res, next) => {
  try {
    const fresh = Boolean(req.body?.fresh);
    const counts = await runSeed({ fresh });
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    return success(res, { counts, total, mode: fresh ? 'fresh' : 'upsert' }, 200);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
