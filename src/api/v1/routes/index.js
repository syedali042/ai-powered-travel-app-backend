const { Router } = require('express');
const userRoutes = require('./user.routes');
const seedRoutes = require('./seed.routes');
const authRoutes = require('./auth.routes');
const tripRoutes = require('./trip.routes');
const chatRoutes = require('./chat.routes');
const destinationRoutes = require('./destination.routes');
const { activityRouter, searchRouter, discoverRouter } = require('./search.routes');

const router = Router();

router.use('/auth',         authRoutes);
router.use('/users',        userRoutes);
router.use('/trips',        tripRoutes);
router.use('/chat',         chatRoutes);
router.use('/destinations', destinationRoutes);
router.use('/activities',   activityRouter);
router.use('/search',       searchRouter);
router.use('/discover',     discoverRouter);
router.use('/seed',         seedRoutes);

module.exports = router;
