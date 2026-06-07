const tripService = require('../services/trip.service');
const { success, paginated } = require('../utils/response');

async function createTrip(req, res, next) {
  try {
    const trip = await tripService.createTrip(req.user._id, req.body);
    return success(res, trip, 201);
  } catch (err) {
    next(err);
  }
}

async function getTrips(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const result = await tripService.getTrips(req.user._id, {
      status: req.query.status,
      page,
      limit,
    });
    return paginated(res, result.trips, result);
  } catch (err) {
    next(err);
  }
}

async function getTrip(req, res, next) {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user._id);
    return success(res, trip);
  } catch (err) {
    next(err);
  }
}

async function updateTrip(req, res, next) {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.user._id, req.body);
    return success(res, trip);
  } catch (err) {
    next(err);
  }
}

async function replaceItinerary(req, res, next) {
  try {
    // Accept either { itinerary: [...] } or a bare array
    const itinerary = Array.isArray(req.body) ? req.body : req.body.itinerary;
    const trip = await tripService.replaceItinerary(req.params.id, req.user._id, itinerary);
    return success(res, trip);
  } catch (err) {
    next(err);
  }
}

async function updateDay(req, res, next) {
  try {
    const dayNumber = parseInt(req.params.dayNumber, 10);
    const trip = await tripService.updateDay(req.params.id, req.user._id, dayNumber, req.body);
    return success(res, trip);
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const dayNumber = parseInt(req.params.dayNumber, 10);
    const trip = await tripService.addItineraryItem(req.params.id, req.user._id, dayNumber, req.body);
    return success(res, trip, 201);
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const dayNumber = parseInt(req.params.dayNumber, 10);
    await tripService.removeItineraryItem(
      req.params.id,
      req.user._id,
      dayNumber,
      req.params.itemId
    );
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function shareTrip(req, res, next) {
  try {
    const trip = await tripService.shareTrip(
      req.params.id,
      req.user._id,
      req.body.email,
      req.body.permission
    );
    return success(res, trip);
  } catch (err) {
    next(err);
  }
}

async function deleteTrip(req, res, next) {
  try {
    await tripService.deleteTrip(req.params.id, req.user._id);
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  replaceItinerary,
  updateDay,
  addItem,
  removeItem,
  shareTrip,
  deleteTrip,
};
