const Place = require('../models/Place');
const User = require('../models/User');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const asyncHandler = require('../utils/asyncHandler');
const {
  resolveLocationQuery,
  getSearchRadius,
  buildAddressFilter,
  formatAddress,
  reverseGeocode,
} = require('../utils/geocode');

const populatePlace = { path: 'creator', select: 'name trustLevel' };

const normalizeCountry = (country) => {
  if (!country) return country;
  return /hong\s*kong/i.test(country) ? 'China' : country.trim();
};

const buildAddressPayload = (body, lat, lng, reverseData = null) => {
  const address = {
    line1: body.line1?.trim() || '',
    line2: body.line2?.trim() || '',
    building: body.building?.trim() || '',
    floor: body.floor?.trim() || '',
    area: body.area?.trim() || reverseData?.area || '',
    city: body.city?.trim() || reverseData?.city || '',
    country: normalizeCountry(body.country?.trim() || reverseData?.country || ''),
    countryCode: body.countryCode?.trim() || reverseData?.countryCode || '',
    formatted: '',
  };

  if (/hong\s*kong/i.test(address.city) && !address.country) {
    address.country = 'China';
    address.countryCode = 'CN';
  }

  address.formatted = formatAddress(address);
  return address;
};

// @route   POST /api/places
// @access  Private
const addPlace = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Photo is required');
  }

  const { name, category, lat, lng, shortNote, tags } = req.body;

  if (!req.body.city?.trim() || !req.body.country?.trim()) {
    res.status(400);
    throw new Error('City and country are required');
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
    res.status(400);
    throw new Error('Drop a pin on the map to set the gem location');
  }

  let reverseData = null;
  try {
    reverseData = await reverseGeocode(parsedLat, parsedLng);
  } catch {
    // Pin is valid; address fields from the form are enough
  }

  let parsedTags = [];
  if (tags) {
    parsedTags =
      typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : Array.isArray(tags)
          ? tags
          : [];
  }

  const uploadResult = await uploadToCloudinary(req.file.buffer);
  const address = buildAddressPayload(req.body, parsedLat, parsedLng, reverseData);

  const place = await Place.create({
    name,
    category,
    lat: parsedLat,
    lng: parsedLng,
    address,
    shortNote,
    tags: parsedTags,
    photo: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    },
    creator: req.user._id,
    moderationStatus: 'pending',
  });

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { addedPlaces: place._id },
  });

  res.status(201).json({
    success: true,
    message: 'Place submitted for moderation',
    place,
  });
});

// @route   GET /api/places/nearby
// @access  Public (optional auth for user-specific flags)
const getNearby = asyncHandler(async (req, res) => {
  const {
    q,
    area,
    city,
    country,
    lat: latParam,
    lng: lngParam,
    radius: radiusParam,
  } = req.query;

  let lat = latParam != null ? parseFloat(latParam) : null;
  let lng = lngParam != null ? parseFloat(lngParam) : null;
  let precision = 'point';
  let locationLabel = null;
  let addressFilter = {};

  const hasTextQuery = q || area || city || country;

  if (hasTextQuery) {
    const resolved = await resolveLocationQuery({ q, area, city, country });
    lat = resolved.lat;
    lng = resolved.lng;
    precision = resolved.precision;
    locationLabel = resolved.formatted;
    addressFilter = buildAddressFilter({
      area: area || (precision === 'area' ? resolved.area : undefined),
      city: city || (['area', 'city'].includes(precision) ? resolved.city : undefined),
      country: country || resolved.country,
    });
  }

  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400);
    throw new Error(
      'Provide a map location or search by area, city, and country (e.g. area=Tsim Sha Tsui&city=Hong Kong&country=Hong Kong)'
    );
  }

  const userRadius = radiusParam ? parseInt(radiusParam, 10) : null;
  const radius = getSearchRadius(precision, userRadius);

  if (radius < 100 || radius > 100000) {
    res.status(400);
    throw new Error('Radius must be between 100 and 100000 meters');
  }

  const query = {
    moderationStatus: 'approved',
    ...addressFilter,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    },
  };

  const places = await Place.find(query)
    .sort({ trustScore: -1, createdAt: -1 })
    .populate(populatePlace)
    .lean();

  const userId = req.user?._id?.toString();

  const results = places.map((place) => ({
    ...place,
    displayAddress: formatAddress(place.address),
    hasUpvoted: userId
      ? place.upvotedBy?.some((id) => id.toString() === userId)
      : false,
    hasVisited: userId
      ? place.visitedBy?.some((id) => id.toString() === userId)
      : false,
    isSaved: userId
      ? req.user.savedPlaces?.some((id) => id.toString() === place._id.toString())
      : false,
    upvotedBy: undefined,
    visitedBy: undefined,
  }));

  res.json({
    success: true,
    count: results.length,
    radius,
    precision,
    location: locationLabel || { lat, lng },
    places: results,
  });
});

// @route   POST /api/places/vote
// @access  Private
const votePlace = asyncHandler(async (req, res) => {
  const { placeId } = req.body;
  const place = await Place.findById(placeId);

  if (!place) {
    res.status(404);
    throw new Error('Place not found');
  }

  if (place.moderationStatus !== 'approved') {
    res.status(400);
    throw new Error('Only approved places can be upvoted');
  }

  const alreadyVoted = place.upvotedBy.some(
    (id) => id.toString() === req.user._id.toString()
  );

  if (alreadyVoted) {
    res.status(400);
    throw new Error('You have already upvoted this place');
  }

  place.upvotedBy.push(req.user._id);
  place.recalculateTrust();
  await place.save();

  res.json({
    success: true,
    message: 'Place upvoted',
    place: {
      id: place._id,
      upvoteCount: place.upvoteCount,
      trustScore: place.trustScore,
    },
  });
});

// @route   POST /api/places/:id/visit
// @access  Private
const visitPlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);

  if (!place) {
    res.status(404);
    throw new Error('Place not found');
  }

  if (place.moderationStatus !== 'approved') {
    res.status(400);
    throw new Error('Only approved places can be marked as visited');
  }

  const alreadyVisited = place.visitedBy.some(
    (id) => id.toString() === req.user._id.toString()
  );

  if (alreadyVisited) {
    res.status(400);
    throw new Error('You have already marked this place as visited');
  }

  place.visitedBy.push(req.user._id);
  place.recalculateTrust();
  await place.save();

  res.json({
    success: true,
    message: 'Place marked as visited',
    place: {
      id: place._id,
      visitedCount: place.visitedCount,
      trustScore: place.trustScore,
    },
  });
});

// @route   POST /api/places/:id/save
// @access  Private
const savePlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);

  if (!place) {
    res.status(404);
    throw new Error('Place not found');
  }

  if (place.moderationStatus !== 'approved') {
    res.status(400);
    throw new Error('Only approved places can be saved');
  }

  const user = await User.findById(req.user._id);
  const alreadySaved = user.savedPlaces.some(
    (id) => id.toString() === place._id.toString()
  );

  if (alreadySaved) {
    res.status(400);
    throw new Error('Place already in your saved list');
  }

  user.savedPlaces.push(place._id);
  await user.save();

  res.json({
    success: true,
    message: 'Place saved to your list',
  });
});

// @route   DELETE /api/places/:id/save
// @access  Private
const unsavePlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);

  if (!place) {
    res.status(404);
    throw new Error('Place not found');
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { savedPlaces: place._id },
  });

  res.json({
    success: true,
    message: 'Place removed from saved list',
  });
});

// @route   GET /api/places/saved
// @access  Private
const getSavedPlaces = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'savedPlaces',
    populate: populatePlace,
    options: { sort: { createdAt: -1 } },
  });

  const places = user.savedPlaces.map((p) => ({
    ...p.toObject(),
    displayAddress: formatAddress(p.address),
  }));

  res.json({
    success: true,
    count: places.length,
    places,
  });
});

// @route   GET /api/places/:id
// @access  Public
const getPlaceById = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id).populate(populatePlace);

  if (!place) {
    res.status(404);
    throw new Error('Place not found');
  }

  if (
    place.moderationStatus !== 'approved' &&
    place.creator.toString() !== req.user?._id?.toString() &&
    req.user?.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('This place is not publicly available');
  }

  const placeObj = place.toObject();
  placeObj.displayAddress = formatAddress(place.address);

  res.json({ success: true, place: placeObj });
});

// @route   GET /api/places/mine
// @access  Private
const getMyPlaces = asyncHandler(async (req, res) => {
  const places = await Place.find({ creator: req.user._id })
    .sort({ createdAt: -1 })
    .populate(populatePlace);

  const results = places.map((p) => ({
    ...p.toObject(),
    displayAddress: formatAddress(p.address),
  }));

  res.json({
    success: true,
    count: results.length,
    places: results,
  });
});

module.exports = {
  addPlace,
  getNearby,
  votePlace,
  visitPlace,
  savePlace,
  unsavePlace,
  getSavedPlaces,
  getPlaceById,
  getMyPlaces,
};