const { Router } = require('express');
const { body } = require('express-validator');
const userController = require('../../../controllers/user.controller');
const { verifyToken } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');

const router = Router();

const preferencesRules = [
  body('travelStyle')
    .optional()
    .isIn(['adventure', 'luxury', 'budget', 'cultural', 'family'])
    .withMessage('travelStyle must be one of: adventure, luxury, budget, cultural, family'),
  body('destinations').optional().isArray().withMessage('destinations must be an array'),
  body('currencies').optional().isArray().withMessage('currencies must be an array'),
];

// Protected /me routes — must come before /:id so Express doesn't treat "me" as an ID
router.get('/me', verifyToken, userController.getMe);
router.patch('/me/preferences', verifyToken, ...preferencesRules, validate, userController.updateMyPreferences);

// Admin / internal CRUD
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
