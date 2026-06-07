const userService = require('../services/user.service');
const { success, paginated } = require('../utils/response');

async function getUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const result = await userService.getAllUsers({ page, limit });
    return paginated(res, result.users, result);
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    return success(res, user, 201);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
