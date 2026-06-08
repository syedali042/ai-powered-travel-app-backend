const { Router } = require('express');
const userRoutes = require('./user.routes');
const seedRoutes = require('./seed.routes');
const authRoutes = require('./auth.routes');
const tripRoutes = require('./trip.routes');
const chatRoutes = require('./chat.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trips', tripRoutes);
router.use('/chat', chatRoutes);
router.use('/seed', seedRoutes);

// Future route groups (add as features grow):
// router.use('/destinations', destinationRoutes);
// router.use('/search', searchRoutes);

module.exports = router;
