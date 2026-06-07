const { User, Destination, Activity, Hotel, Trip, ChatSession } = require('../models');
const logger = require('../utils/logger');

const users = require('./data/users');
const destinations = require('./data/destinations');
const activities = require('./data/activities');
const hotels = require('./data/hotels');
const trips = require('./data/trips');
const chatSessions = require('./data/chatSessions');

async function upsertMany(Model, docs) {
  if (!docs.length) return 0;
  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $setOnInsert: doc },
      upsert: true,
    },
  }));
  const result = await Model.bulkWrite(ops, { ordered: false });
  return result.upsertedCount;
}

async function clearAll() {
  await Promise.all([
    User.deleteMany({}),
    Destination.deleteMany({}),
    Activity.deleteMany({}),
    Hotel.deleteMany({}),
    Trip.deleteMany({}),
    ChatSession.deleteMany({}),
  ]);
  logger.info('Cleared all collections');
}

async function runSeed({ fresh = false } = {}) {
  if (fresh) await clearAll();

  // Must run sequentially: users and destinations before dependents
  const [uUsers, uDestinations] = await Promise.all([
    fresh ? User.insertMany(users).then((r) => r.length) : upsertMany(User, users),
    fresh ? Destination.insertMany(destinations).then((r) => r.length) : upsertMany(Destination, destinations),
  ]);

  const [uActivities, uHotels] = await Promise.all([
    fresh ? Activity.insertMany(activities).then((r) => r.length) : upsertMany(Activity, activities),
    fresh ? Hotel.insertMany(hotels).then((r) => r.length) : upsertMany(Hotel, hotels),
  ]);

  const [uTrips, uChatSessions] = await Promise.all([
    fresh ? Trip.insertMany(trips).then((r) => r.length) : upsertMany(Trip, trips),
    fresh ? ChatSession.insertMany(chatSessions).then((r) => r.length) : upsertMany(ChatSession, chatSessions),
  ]);

  const counts = {
    users: uUsers,
    destinations: uDestinations,
    activities: uActivities,
    hotels: uHotels,
    trips: uTrips,
    chatSessions: uChatSessions,
  };

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  logger.info(`Seed complete — ${total} documents written (${fresh ? 'fresh' : 'upsert'} mode)`, counts);
  return counts;
}

module.exports = { runSeed };
