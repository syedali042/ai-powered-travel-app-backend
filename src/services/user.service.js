const User = require('../models/user.model');
const { NotFoundError, ValidationError } = require('../utils/errors');

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
  return user;
}

async function deleteUser(id) {
  // Soft delete
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  if (!user) throw new NotFoundError('User');
  return user;
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
