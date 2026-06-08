const { Router } = require('express');
const { body } = require('express-validator');
const chatController = require('../../../controllers/chat.controller');
const { verifyToken } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');

const router = Router();

// All chat routes require authentication
router.use(verifyToken);

// POST /api/v1/chat — main streaming endpoint
router.post(
  '/',
  body('message').trim().notEmpty().withMessage('message is required'),
  body('tripId').optional().isMongoId().withMessage('tripId must be a valid MongoDB ID'),
  body('sessionId').optional().isMongoId().withMessage('sessionId must be a valid MongoDB ID'),
  validate,
  chatController.chat
);

// GET  /api/v1/chat/sessions        — list user's sessions (no messages)
// GET  /api/v1/chat/sessions/:id    — full session with message history
// DELETE /api/v1/chat/sessions/:id  — delete session
router.get('/sessions',     chatController.getSessions);
router.get('/sessions/:id', chatController.getSession);
router.delete('/sessions/:id', chatController.deleteSession);

module.exports = router;
