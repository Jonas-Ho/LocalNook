const Place = require('../models/Place');
const asyncHandler = require('../utils/asyncHandler');

// @route   GET /api/admin/places/pending
// @access  Admin
const getPendingPlaces = asyncHandler(async (_req, res) => {
  const places = await Place.find({ moderationStatus: 'pending' })
    .sort({ createdAt: 1 })
    .populate('creator', 'name email trustLevel');

  res.json({
    success: true,
    count: places.length,
    places,
  });
});

// @route   PATCH /api/admin/places/:id/approve
// @access  Admin
const approvePlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);

  if (!place) {
    res.status(404);
    throw new Error('Place not found');
  }

  if (place.moderationStatus === 'approved') {
    res.status(400);
    throw new Error('Place is already approved');
  }

  place.moderationStatus = 'approved';
  place.rejectionReason = null;
  await place.save();

  res.json({
    success: true,
    message: 'Place approved',
    place,
  });
});

// @route   PATCH /api/admin/places/:id/reject
// @access  Admin
const rejectPlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);

  if (!place) {
    res.status(404);
    throw new Error('Place not found');
  }

  if (place.moderationStatus === 'rejected') {
    res.status(400);
    throw new Error('Place is already rejected');
  }

  place.moderationStatus = 'rejected';
  place.rejectionReason = req.body.reason || 'Does not meet community guidelines';
  await place.save();

  res.json({
    success: true,
    message: 'Place rejected',
    place,
  });
});

// @route   GET /api/admin/places
// @access  Admin
const getAllPlacesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { moderationStatus: status } : {};

  const places = await Place.find(filter)
    .sort({ createdAt: -1 })
    .populate('creator', 'name email');

  res.json({
    success: true,
    count: places.length,
    places,
  });
});

module.exports = {
  getPendingPlaces,
  approvePlace,
  rejectPlace,
  getAllPlacesByStatus,
};