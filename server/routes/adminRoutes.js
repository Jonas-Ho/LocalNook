const express = require('express');
const {
  getPendingPlaces,
  approvePlace,
  rejectPlace,
  getAllPlacesByStatus,
} = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(auth, adminOnly);

router.get('/places', getAllPlacesByStatus);
router.get('/places/pending', getPendingPlaces);
router.patch('/places/:id/approve', approvePlace);
router.patch('/places/:id/reject', rejectPlace);

module.exports = router;