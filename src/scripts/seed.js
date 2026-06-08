/**
 * Seed 40 approved local gems around San Francisco for development.
 *
 * Usage:
 *   1. Copy .env.example to .env and set MONGO_URI + JWT_SECRET
 *   2. npm run seed
 *
 * Creates:
 *   - admin@localnook.app / admin123 (role: admin)
 *   - demo@localnook.app / demo123 (role: user)
 *   - 40 approved places with geospatial data
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Place = require('../models/Place');
const { calculateTrustScore } = require('../utils/trustScore');
const { formatAddress } = require('../utils/geocode');

const sfAddress = (p) => {
  const address = {
    line1: p.line1 || '',
    building: p.building || '',
    floor: p.floor || '',
    area: p.area || 'Downtown',
    city: 'San Francisco',
    country: 'United States',
    countryCode: 'US',
    formatted: '',
  };
  address.formatted = formatAddress(address);
  return address;
};

const PLACEHOLDER_PHOTO = {
  url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  publicId: 'seed/placeholder',
};

const SEED_PLACES = [
  { name: 'Blue Bottle Mint Plaza', category: 'cafe', lat: 37.7836, lng: -122.3965, shortNote: 'Quiet corner, great pour-over, perfect for morning reads.', tags: ['wifi', 'quiet'] },
  { name: 'Ritual Coffee Roasters', category: 'cafe', lat: 37.7614, lng: -122.4212, shortNote: 'Lively but cozy — grab a seat by the window.', tags: ['coffee', 'local'] },
  { name: 'Philz Coffee', category: 'cafe', lat: 37.7749, lng: -122.4194, shortNote: 'Custom blends and a mellow vibe for slow afternoons.', tags: ['custom-blend'] },
  { name: 'Sightglass SOMA', category: 'cafe', lat: 37.7769, lng: -122.4078, shortNote: 'Industrial-chic space with excellent single-origin.', tags: ['roastery', 'aesthetic'] },
  { name: 'Four Barrel Coffee', category: 'cafe', lat: 37.767, lng: -122.4218, shortNote: 'No WiFi on purpose — forces you to unplug and focus.', tags: ['no-wifi', 'focus'] },
  { name: 'Main Library Reading Room', category: 'study', lat: 37.7799, lng: -122.4153, shortNote: 'Grand hall, free WiFi, strict silence — ideal for deep work.', tags: ['free', 'quiet', 'wifi'] },
  { name: 'SF Public Library Mission', category: 'study', lat: 37.755, lng: -122.4197, shortNote: 'Community feel, good hours, less crowded than downtown.', tags: ['community', 'wifi'] },
  { name: 'Cafe Réveille Study Nook', category: 'study', lat: 37.7701, lng: -122.4092, shortNote: 'Upstairs corner stays quiet before noon.', tags: ['outlets', 'morning'] },
  { name: 'The Mill Study Spot', category: 'study', lat: 37.7762, lng: -122.424, shortNote: 'Shared tables, strong coffee, good for pair sessions.', tags: ['collab'] },
  { name: 'University Cafe Back Room', category: 'study', lat: 37.789, lng: -122.4095, shortNote: 'Hidden back room — locals only know about it.', tags: ['hidden-gem', 'quiet'] },
  { name: 'Tartine Manufactory', category: 'food', lat: 37.7615, lng: -122.411, shortNote: 'Outstanding bread and pastries — worth the line.', tags: ['bakery', 'brunch'] },
  { name: 'La Taqueria', category: 'food', lat: 37.7509, lng: -122.418, shortNote: 'Legendary burritos — cash only, no frills.', tags: ['mexican', 'cash-only'] },
  { name: 'Swan Oyster Depot', category: 'food', lat: 37.7992, lng: -122.4078, shortNote: 'Counter seating, fresh seafood, old-school SF institution.', tags: ['seafood', 'historic'] },
  { name: 'Bi-Rite Creamery', category: 'food', lat: 37.7618, lng: -122.4241, shortNote: 'Salted caramel ice cream in Dolores Park — classic combo.', tags: ['dessert', 'park-nearby'] },
  { name: 'Nopalito', category: 'food', lat: 37.7712, lng: -122.4245, shortNote: 'Authentic Mexican, great for group dinners.', tags: ['dinner', 'groups'] },
  { name: 'Dolores Park Hill', category: 'hangout', lat: 37.7596, lng: -122.4269, shortNote: 'Best sunset views in the city — bring a blanket.', tags: ['sunset', 'outdoor'] },
  { name: 'Crissy Field Beach', category: 'hangout', lat: 37.8034, lng: -122.4662, shortNote: 'Golden Gate backdrop, breezy walks, dog-friendly.', tags: ['beach', 'views'] },
  { name: 'Bernal Heights Hilltop', category: 'hangout', lat: 37.743, lng: -122.4156, shortNote: '360° city views without the tourist crowds.', tags: ['views', 'local-favorite'] },
  { name: 'Hidden Garden Steps', category: 'hangout', lat: 37.7568, lng: -122.4345, shortNote: 'Mosaic stairway — peaceful spot for photos and chats.', tags: ['art', 'quiet'] },
  { name: 'Wave Organ', category: 'hangout', lat: 37.8065, lng: -122.4401, shortNote: 'Sound sculpture powered by the bay — eerie and beautiful.', tags: ['unique', 'waterfront'] },
  { name: 'SF Jazz Center', category: 'event', lat: 37.7853, lng: -122.437, shortNote: 'World-class jazz in an intimate venue.', tags: ['music', 'nightlife'] },
  { name: 'Roxie Theater', category: 'event', lat: 37.7691, lng: -122.4312, shortNote: 'Indie and documentary films — true cinema lovers spot.', tags: ['film', 'indie'] },
  { name: 'Ape Concerts', category: 'event', lat: 37.774, lng: -122.408, shortNote: 'Small venue, emerging artists, cheap tickets.', tags: ['live-music', 'affordable'] },
  { name: 'Off the Grid Fort Mason', category: 'event', lat: 37.806, lng: -122.431, shortNote: 'Friday food trucks with waterfront sunset.', tags: ['food-trucks', 'friday'] },
  { name: 'Street Food Festival', category: 'event', lat: 37.768, lng: -122.415, shortNote: 'Annual pop-up — check dates, always packed and fun.', tags: ['seasonal', 'food'] },
  { name: 'Lands End Labyrinth', category: 'other', lat: 37.7885, lng: -122.506, shortNote: 'Short hike to a stone labyrinth overlooking the Pacific.', tags: ['hike', 'coastal'] },
  { name: 'Sutro Baths Ruins', category: 'other', lat: 37.7804, lng: -122.5135, shortNote: 'Foggy, dramatic ruins — moody photo spot.', tags: ['historic', 'fog'] },
  { name: 'Cable Car Museum', category: 'other', lat: 37.7947, lng: -122.4114, shortNote: 'Free museum showing how cable cars actually work.', tags: ['free', 'museum'] },
  { name: 'Clarion Alley Murals', category: 'other', lat: 37.756, lng: -122.419, shortNote: 'Rotating street art alley — always something new.', tags: ['street-art', 'walkable'] },
  { name: 'City Lights Bookstore', category: 'other', lat: 37.7975, lng: -122.4067, shortNote: 'Beat generation landmark — browse poetry upstairs.', tags: ['books', 'historic'] },
  { name: 'Andytown Coffee', category: 'cafe', lat: 37.742, lng: -122.505, shortNote: 'Outer Sunset gem — snowy plover drink is a must.', tags: ['ocean-nearby'] },
  { name: 'Devil\'s Teeth Baking', category: 'food', lat: 37.7415, lng: -122.5065, shortNote: 'Breakfast sandwich worth the trip to the Sunset.', tags: ['breakfast'] },
  { name: 'Green Apple Books', category: 'study', lat: 37.781, lng: -122.463, shortNote: 'Independent bookstore with quiet reading corners.', tags: ['books', 'quiet'] },
  { name: 'Precita Park', category: 'hangout', lat: 37.748, lng: -122.414, shortNote: 'Neighborhood park — mellow picnics and people-watching.', tags: ['park', 'family'] },
  { name: 'Balmy Alley', category: 'other', lat: 37.752, lng: -122.412, shortNote: 'Political murals in the Mission — powerful and colorful.', tags: ['art', 'mission'] },
  { name: 'House of Air Trampoline', category: 'event', lat: 37.801, lng: -122.466, shortNote: 'Indoor trampoline park — surprisingly good workout.', tags: ['active', 'fun'] },
  { name: 'Ferry Building Farmers Market', category: 'event', lat: 37.7955, lng: -122.393, shortNote: 'Saturday market — sample local produce and snacks.', tags: ['saturday', 'local-produce'] },
  { name: 'Coit Tower', category: 'other', lat: 37.8024, lng: -122.4058, shortNote: 'Murals inside, panoramic views on top — go early.', tags: ['views', 'murals'] },
  { name: 'Tank Hill', category: 'hangout', lat: 37.761, lng: -122.447, shortNote: 'Tiny hill, huge views — locals\' alternative to Twin Peaks.', tags: ['views', 'hidden-gem'] },
  { name: 'Stable Cafe', category: 'cafe', lat: 37.7575, lng: -122.413, shortNote: 'Plants everywhere, great matcha, courtyard seating.', tags: ['matcha', 'plants'] },
  { name: 'Arlequin Cafe', category: 'study', lat: 37.7765, lng: -122.4255, shortNote: 'Back patio is a secret study oasis in Hayes Valley.', tags: ['patio', 'wifi'] },
];

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const seed = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is required in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await Place.deleteMany({});
  await User.deleteMany({ email: { $in: ['admin@localnook.app', 'demo@localnook.app'] } });

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@localnook.app',
    password: 'admin123',
    role: 'admin',
    trustLevel: 10,
  });

  const demo = await User.create({
    name: 'Demo User',
    email: 'demo@localnook.app',
    password: 'demo123',
    role: 'user',
    trustLevel: 3,
  });

  const places = SEED_PLACES.map((p) => {
    const upvoteCount = randomInt(0, 25);
    const visitedCount = randomInt(0, 15);
    const { line1, building, floor, area, ...rest } = p;
    return {
      ...rest,
      address: sfAddress({ line1, building, floor, area }),
      location: { type: 'Point', coordinates: [p.lng, p.lat] },
      photo: PLACEHOLDER_PHOTO,
      creator: demo._id,
      moderationStatus: 'approved',
      upvotedBy: [],
      visitedBy: [],
      upvoteCount,
      visitedCount,
      trustScore: calculateTrustScore(upvoteCount, visitedCount),
    };
  });

  const inserted = await Place.insertMany(places);

  await User.findByIdAndUpdate(demo._id, {
    addedPlaces: inserted.map((p) => p._id),
    savedPlaces: inserted.slice(0, 5).map((p) => p._id),
  });

  console.log(`Seeded ${inserted.length} approved places`);
  console.log('Admin: admin@localnook.app / admin123');
  console.log('Demo:  demo@localnook.app / demo123');

  await mongoose.disconnect();
  console.log('Done.');
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});