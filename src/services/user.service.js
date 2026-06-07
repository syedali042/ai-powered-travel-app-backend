const User = require('../models/user.model');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const { generateEmbedding } = require('./embeddingService');
const { buildEmbeddingText, userHasEmbeddablePreferences } = require('./contentProcessor');

async function getAllUsers({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find({ isActive: true }).skip(skip).limit(limit).lean(),
    User.countDocuments({ isActive: true }),
  ]);
  return { users, total, page, limit };
}

async function getUserById(id) {
  const user = await User.findById(id).lean();
  if (!user) throw new NotFoundError('User');
  return user;
}

async function createUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ValidationError('Email already in use');
  const user = await User.create(data);
  return user.toObject();
}

async function updateUser(id, data) {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
  if (!user) throw new NotFoundError('User');

  // Regenerate profile embedding whenever preferences change
  if (data.preferences !== undefined) {
    generateAndStoreProfileEmbedding(id).catch((err) =>
      logger.warn(`Profile embedding update failed for user ${id}: ${err.message}`)
    );
  }

  return user;
}

/**
 * Generates a Voyage AI embedding from the user's travel preferences and
 * stores it as profileEmbedding on the User document.
 *
 * Only runs if the user has at least one preference set. Update the guard
 * inside userHasEmbeddablePreferences() once interaction tracking is added
 * (target: 5+ rated/saved/skipped items).
 *
 * @param {string} userId
 */
async function generateAndStoreProfileEmbedding(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new NotFoundError('User');
  if (!userHasEmbeddablePreferences(user)) {
    logger.debug(`Skipping profile embedding for user ${userId} — insufficient preferences`);
    return null;
  }

  const text = buildEmbeddingText(user, 'user');
  const embedding = await generateEmbedding(text);

  await User.updateOne({ _id: userId }, { $set: { profileEmbedding: embedding } });
  logger.info(`Profile embedding updated for user ${userId}`);
  return embedding;
}

async function deleteUser(id) {
  // Soft delete
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  if (!user) throw new NotFoundError('User');
  return user;
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, generateAndStoreProfileEmbedding };
