const asyncHandler = require('../utils/asyncHandler');
const { searchLocations, reverseGeocode } = require('../utils/geocode');

// @route   GET /api/geo/search?q=
// @access  Public
const search = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    res.status(400);
    throw new Error('Search query must be at least 2 characters');
  }

  const results = await searchLocations(q.trim(), 8);

  res.json({ success: true, count: results.length, results });
});

// @route   GET /api/geo/reverse?lat=&lng=
// @access  Public
const reverse = asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400);
    throw new Error('Valid lat and lng are required');
  }

  const location = await reverseGeocode(lat, lng);

  res.json({ success: true, location });
});

module.exports = { search, reverse };