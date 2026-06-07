const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../../../controllers/auth.controller');
const validate = require('../../../middleware/validate');

const router = Router();

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters');

// POST /api/v1/auth/register
router.post(
  '/register',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  passwordRule,
  validate,
  authController.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
  authController.login
);

// POST /api/v1/auth/refresh  — reads refreshToken from httpOnly cookie
router.post('/refresh', authController.refresh);

// POST /api/v1/auth/logout
router.post('/logout', authController.logout);

// POST /api/v1/auth/google  — Google OAuth via ID token
router.post(
  '/google',
  body('idToken').notEmpty().withMessage('idToken is required'),
  validate,
  authController.googleAuth
);

module.exports = router;
