const express = require('express');
const {
  addPlace,
  getNearby,
  votePlace,
  visitPlace,
  savePlace,
  unsavePlace,
  getSavedPlaces,
  getPlaceById,
  getMyPlaces,
} = require('../controllers/placeController');
const { auth } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  addPlaceRules,
  nearbyRules,
  voteRules,
} = require('../validators/placeValidators');

const router = express.Router();

router.get('/nearby', optionalAuth, nearbyRules, validate, getNearby);
router.get('/saved', auth, getSavedPlaces);
router.get('/mine', auth, getMyPlaces);

router.post('/', auth, upload.single('photo'), addPlaceRules, validate, addPlace);
router.post('/vote', auth, voteRules, validate, votePlace);

router.post('/:id/visit', auth, visitPlace);
router.post('/:id/save', auth, savePlace);
router.delete('/:id/save', auth, unsavePlace);

router.get('/:id', optionalAuth, getPlaceById);

module.exports = router;