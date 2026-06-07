const { Router } = require('express');
const userRoutes = require('./user.routes');
const seedRoutes = require('./seed.routes');

const router = Router();

router.use('/users', userRoutes);
router.use('/seed', seedRoutes);

// Future route groups (add as features grow):
// router.use('/destinations', destinationRoutes);
// router.use('/trips', tripRoutes);
// router.use('/search', searchRoutes);  // Atlas vector search

module.exports = router;
