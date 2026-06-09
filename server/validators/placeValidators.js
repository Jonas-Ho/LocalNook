const { body, query } = require('express-validator');
const { CATEGORIES } = require('../models/Place');

const addPlaceRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('category')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('lat')
    .toFloat()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Drop a pin on the map to set location'),
  body('lng')
    .toFloat()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Drop a pin on the map to set location'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('area').optional().trim(),
  body('line1').optional().trim(),
  body('line2').optional().trim(),
  body('building').optional().trim(),
  body('floor').optional().trim(),
  body('shortNote')
    .trim()
    .notEmpty()
    .withMessage('Short note is required')
    .isLength({ max: 280 })
    .withMessage('Short note must be 280 characters or less'),
];

const nearbyRules = [
  query('lat').optional().isFloat({ min: -90, max: 90 }),
  query('lng').optional().isFloat({ min: -180, max: 180 }),
  query('q').optional().trim().isLength({ min: 2 }),
  query('area').optional().trim(),
  query('city').optional().trim(),
  query('country').optional().trim(),
  query('radius')
    .optional()
    .isInt({ min: 100, max: 100000 })
    .withMessage('Radius must be between 100 and 100000 meters'),
  query().custom((_value, { req }) => {
    const { lat, lng, q, area, city, country } = req.query;
    const hasCoords = lat != null && lng != null;
    const hasText = q || area || city || country;
    if (!hasCoords && !hasText) {
      throw new Error('Provide map coordinates or a location (area, city, country)');
    }
    return true;
  }),
];

const voteRules = [
  body('placeId').notEmpty().withMessage('placeId is required').isMongoId(),
];

module.exports = { addPlaceRules, nearbyRules, voteRules };