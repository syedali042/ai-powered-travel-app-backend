const { Router } = require('express');
const { body, query, param } = require('express-validator');
const tripController = require('../../../controllers/trip.controller');
const { verifyToken } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');

const router = Router();

// All trip routes require a valid JWT
router.use(verifyToken);

// ── Shared validation rules ────────────────────────────────────────────────────

const dateRangeCheck = body('endDate')
  .optional()
  .isISO8601().toDate()
  .withMessage('Invalid end date')
  .custom((endDate, { req }) => {
    if (req.body.startDate && endDate < new Date(req.body.startDate)) {
      throw new Error('endDate must be on or after startDate');
    }
    return true;
  });

const budgetRules = [
  body('budget.total')
    .optional()
    .isFloat({ min: 0, max: 10_000_000 })
    .withMessage('Budget must be between 0 and 10,000,000'),
  body('budget.currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter ISO code'),
];

const travelersRules = [
  body('travelers.count')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('travelers.count must be between 1 and 100'),
  body('travelers.type')
    .optional()
    .isIn(['solo', 'couple', 'family', 'group', 'business'])
    .withMessage('Invalid traveler type'),
];

const itemRules = [
  body('type')
    .isIn(['activity', 'hotel', 'transport'])
    .withMessage('type must be activity, hotel, or transport'),
  body('refId').optional().isMongoId().withMessage('refId must be a valid MongoDB ID'),
  body('time')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('time must be in HH:MM format'),
  body('duration')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('duration must be non-negative'),
];

// ── Trip CRUD ─────────────────────────────────────────────────────────────────

router.post(
  '/',
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
  dateRangeCheck,
  ...budgetRules,
  ...travelersRules,
  validate,
  tripController.createTrip
);

router.get(
  '/',
  query('status')
    .optional()
    .isIn(['draft', 'planned', 'active', 'completed'])
    .withMessage('Invalid status filter'),
  validate,
  tripController.getTrips
);

router.get('/:id', tripController.getTrip);

router.patch(
  '/:id',
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('status')
    .optional()
    .isIn(['draft', 'planned', 'active', 'completed'])
    .withMessage('Invalid status'),
  body('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
  dateRangeCheck,
  ...budgetRules,
  ...travelersRules,
  validate,
  tripController.updateTrip
);

router.delete('/:id', tripController.deleteTrip);

// ── Itinerary ─────────────────────────────────────────────────────────────────

router.put(
  '/:id/itinerary',
  body('itinerary').optional().isArray().withMessage('itinerary must be an array'),
  validate,
  tripController.replaceItinerary
);

router.patch('/:id/itinerary/:dayNumber', tripController.updateDay);

router.post(
  '/:id/itinerary/:dayNumber/items',
  ...itemRules,
  validate,
  tripController.addItem
);

router.delete('/:id/itinerary/:dayNumber/items/:itemId', tripController.removeItem);

// ── Sharing ───────────────────────────────────────────────────────────────────

router.post(
  '/:id/share',
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('permission')
    .optional()
    .isIn(['view', 'edit'])
    .withMessage('permission must be view or edit'),
  validate,
  tripController.shareTrip
);

module.exports = router;
