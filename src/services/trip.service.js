const Trip = require('../models/trip.model');
const User = require('../models/user.model');
const Destination = require('../models/destination.model');
const Activity = require('../models/activity.model');
const Hotel = require('../models/hotel.model');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

// ── Auth helpers ───────────────────────────────────────────────────────────────

function canView(trip, userId) {
  const uid = userId.toString();
  return (
    trip.userId.toString() === uid ||
    trip.sharedWith.some((s) => s.userId.toString() === uid)
  );
}

function canEdit(trip, userId) {
  const uid = userId.toString();
  if (trip.userId.toString() === uid) return true;
  return trip.sharedWith.some((s) => s.userId.toString() === uid && s.permission === 'edit');
}

// ── Validation helpers ─────────────────────────────────────────────────────────

function assertDateRange(startDate, endDate) {
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new ValidationError('endDate must be on or after startDate');
  }
}

function assertBudget(total) {
  if (total !== undefined && (total < 0 || total > 10_000_000)) {
    throw new ValidationError('Budget must be between 0 and 10,000,000');
  }
}

// ── Population helper ─────────────────────────────────────────────────────────

async function populateTrip(trip) {
  const obj = trip.toObject ? trip.toObject() : trip;

  const destIds     = obj.destinations.map((d) => d.destinationId).filter(Boolean);
  const activityIds = [];
  const hotelIds    = [];

  for (const day of obj.itinerary) {
    for (const item of day.items) {
      if (!item.refId) continue;
      if (item.type === 'activity') activityIds.push(item.refId);
      else if (item.type === 'hotel') hotelIds.push(item.refId);
    }
  }

  const [destinations, activities, hotels] = await Promise.all([
    Destination.find({ _id: { $in: destIds } }, 'name country city region category').lean(),
    Activity.find({ _id: { $in: activityIds } }, 'name category priceLevel duration').lean(),
    Hotel.find({ _id: { $in: hotelIds } }, 'name starRating priceLevel').lean(),
  ]);

  const destMap  = new Map(destinations.map((d) => [d._id.toString(), d]));
  const actMap   = new Map(activities.map((a) => [a._id.toString(), a]));
  const hotelMap = new Map(hotels.map((h) => [h._id.toString(), h]));

  for (const d of obj.destinations) {
    d.destination = destMap.get(d.destinationId?.toString()) || null;
  }
  for (const day of obj.itinerary) {
    for (const item of day.items) {
      if (!item.refId) continue;
      if (item.type === 'activity') item.ref = actMap.get(item.refId.toString()) || null;
      else if (item.type === 'hotel') item.ref = hotelMap.get(item.refId.toString()) || null;
    }
  }

  return obj;
}

// ── Service functions ─────────────────────────────────────────────────────────

async function createTrip(userId, data) {
  const { title, startDate, endDate, budget, travelers, destinations, itinerary } = data;

  assertDateRange(startDate, endDate);
  assertBudget(budget?.total);

  const trip = await Trip.create({
    userId,
    title,
    startDate,
    endDate,
    budget,
    travelers,
    destinations: destinations || [],
    itinerary:    itinerary    || [],
    status: 'draft',
  });

  return trip.toObject();
}

async function getTrips(userId, { status, page = 1, limit = 20 } = {}) {
  const filter = {
    isActive: true,
    $or: [{ userId }, { 'sharedWith.userId': userId }],
  };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [trips, total] = await Promise.all([
    Trip.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Trip.countDocuments(filter),
  ]);

  return { trips, total, page, limit };
}

async function getTripById(tripId, userId) {
  const trip = await Trip.findOne({ _id: tripId, isActive: true });
  if (!trip) throw new NotFoundError('Trip');
  if (!canView(trip, userId)) throw new ForbiddenError();
  return populateTrip(trip);
}

async function updateTrip(tripId, userId, data) {
  const trip = await Trip.findOne({ _id: tripId, isActive: true });
  if (!trip) throw new NotFoundError('Trip');
  if (!canEdit(trip, userId)) throw new ForbiddenError();

  assertDateRange(
    data.startDate ?? trip.startDate,
    data.endDate   ?? trip.endDate
  );
  assertBudget(data.budget?.total);

  const allowed = ['title', 'startDate', 'endDate', 'budget', 'travelers', 'status'];
  for (const key of allowed) {
    if (data[key] !== undefined) trip[key] = data[key];
  }

  await trip.save();
  return trip.toObject();
}

async function replaceItinerary(tripId, userId, itinerary) {
  if (!Array.isArray(itinerary)) throw new ValidationError('itinerary must be an array');

  const trip = await Trip.findOne({ _id: tripId, isActive: true });
  if (!trip) throw new NotFoundError('Trip');
  if (!canEdit(trip, userId)) throw new ForbiddenError();

  trip.itinerary = itinerary;
  await trip.save();
  return trip.toObject();
}

async function updateDay(tripId, userId, dayNumber, data) {
  const trip = await Trip.findOne({ _id: tripId, isActive: true });
  if (!trip) throw new NotFoundError('Trip');
  if (!canEdit(trip, userId)) throw new ForbiddenError();

  const dayIdx = trip.itinerary.findIndex((d) => d.dayNumber === dayNumber);

  if (dayIdx === -1) {
    trip.itinerary.push({ dayNumber, ...data });
    trip.itinerary.sort((a, b) => a.dayNumber - b.dayNumber);
  } else {
    if (data.date  !== undefined) trip.itinerary[dayIdx].date  = data.date;
    if (data.items !== undefined) {
      if (data.items.length > 20) throw new ValidationError('Maximum 20 items per day');
      trip.itinerary[dayIdx].items = data.items;
    }
  }

  await trip.save();
  return trip.toObject();
}

async function addItineraryItem(tripId, userId, dayNumber, item) {
  const trip = await Trip.findOne({ _id: tripId, isActive: true });
  if (!trip) throw new NotFoundError('Trip');
  if (!canEdit(trip, userId)) throw new ForbiddenError();

  let day = trip.itinerary.find((d) => d.dayNumber === dayNumber);
  if (!day) {
    trip.itinerary.push({ dayNumber, items: [] });
    trip.itinerary.sort((a, b) => a.dayNumber - b.dayNumber);
    day = trip.itinerary.find((d) => d.dayNumber === dayNumber);
  }

  if (day.items.length >= 20) throw new ValidationError('Maximum 20 items per day');

  day.items.push(item);
  await trip.save();
  return trip.toObject();
}

async function removeItineraryItem(tripId, userId, dayNumber, itemId) {
  const trip = await Trip.findOne({ _id: tripId, isActive: true });
  if (!trip) throw new NotFoundError('Trip');
  if (!canEdit(trip, userId)) throw new ForbiddenError();

  const day = trip.itinerary.find((d) => d.dayNumber === dayNumber);
  if (!day) throw new NotFoundError('Day');

  const itemIdx = day.items.findIndex((i) => i._id?.toString() === itemId);
  if (itemIdx === -1) throw new NotFoundError('Item');

  day.items.splice(itemIdx, 1);
  await trip.save();
}

async function shareTrip(tripId, ownerId, email, permission = 'view') {
  const trip = await Trip.findOne({ _id: tripId, isActive: true });
  if (!trip) throw new NotFoundError('Trip');
  if (trip.userId.toString() !== ownerId.toString()) {
    throw new ForbiddenError('Only the trip owner can share');
  }

  const target = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!target) throw new NotFoundError('User with that email');
  if (target._id.equals(trip.userId)) throw new ValidationError('Cannot share trip with yourself');

  const existing = trip.sharedWith.find((s) => s.userId.equals(target._id));
  if (existing) {
    existing.permission = permission;
  } else {
    trip.sharedWith.push({ userId: target._id, permission });
  }

  await trip.save();
  return trip.toObject();
}

async function deleteTrip(tripId, userId) {
  const trip = await Trip.findOne({ _id: tripId, isActive: true });
  if (!trip) throw new NotFoundError('Trip');
  if (trip.userId.toString() !== userId.toString()) throw new ForbiddenError();

  trip.isActive = false;
  await trip.save();
}

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  replaceItinerary,
  updateDay,
  addItineraryItem,
  removeItineraryItem,
  shareTrip,
  deleteTrip,
};
