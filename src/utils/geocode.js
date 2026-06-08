const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'LocalNook/1.0 (community local discovery app)';

const nominatimFetch = async (path) => {
  const res = await fetch(`${NOMINATIM_BASE}${path}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Geocoding service unavailable (${res.status})`);
  }

  return res.json();
};

const pickArea = (address = {}) =>
  address.suburb ||
  address.neighbourhood ||
  address.quarter ||
  address.district ||
  address.borough ||
  address.subdistrict ||
  '';

const isHongKong = (value) =>
  value && /hong\s*kong/i.test(String(value).trim());

const pickCity = (address = {}) => {
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    '';

  if (isHongKong(address.state) || isHongKong(address.country)) {
    return city || 'Hong Kong';
  }

  return city;
};

const normalizeCountryInput = (country) => {
  if (!country) return country;
  return isHongKong(country) ? 'China' : country.trim();
};

const normalizeLocation = (location) => {
  const loc = { ...location };

  if (isHongKong(loc.country) || loc.countryCode === 'HK') {
    loc.country = 'China';
    loc.countryCode = 'CN';
    loc.city = loc.city || 'Hong Kong';
  }

  if (isHongKong(loc.city) && (!loc.country || isHongKong(loc.country))) {
    loc.country = 'China';
    loc.countryCode = 'CN';
  }

  loc.precision = detectPrecision(loc);
  return loc;
};

const detectPrecision = ({ area, city, country }) => {
  if (area) return 'area';
  if (city) return 'city';
  if (country) return 'country';
  return 'point';
};

const parseResult = (result) => {
  const address = result.address || {};
  const area = pickArea(address);
  const city = pickCity(address);
  const country = address.country || '';

  const location = {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    area,
    city,
    country,
    countryCode: (address.country_code || '').toUpperCase(),
    formatted: result.display_name,
    precision: detectPrecision({ area, city, country }),
    boundingBox: result.boundingbox?.map(Number) || null,
  };

  return normalizeLocation(location);
};

const searchLocations = async (query, limit = 6) => {
  if (!query || query.trim().length < 2) return [];

  const data = await nominatimFetch(
    `/search?format=json&q=${encodeURIComponent(query.trim())}&addressdetails=1&limit=${limit}`
  );

  return data.map(parseResult);
};

const reverseGeocode = async (lat, lng) => {
  const data = await nominatimFetch(
    `/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
  );

  if (!data || data.error) {
    throw new Error('Could not resolve this map location');
  }

  return parseResult(data);
};

const resolveLocationQuery = async ({ q, area, city, country }) => {
  if (q?.trim()) {
    const results = await searchLocations(q.trim(), 1);
    if (!results.length) {
      throw new Error(`No location found for "${q}"`);
    }
    return results[0];
  }

  const parts = [area, city, country].filter(Boolean);
  if (!parts.length) {
    throw new Error('Provide a location query or area/city/country');
  }

  const results = await searchLocations(parts.join(', '), 1);
  if (!results.length) {
    throw new Error(`No location found for "${parts.join(', ')}"`);
  }

  const resolved = results[0];

  const normalizedCountry = country ? normalizeCountryInput(country) : null;

  if (
    normalizedCountry &&
    resolved.country &&
    !new RegExp(normalizedCountry, 'i').test(resolved.country)
  ) {
    throw new Error('Country does not match the resolved location');
  }

  if (area) resolved.area = area;
  if (city) resolved.city = city;
  if (normalizedCountry) resolved.country = normalizedCountry;

  return normalizeLocation(resolved);
};

const getSearchRadius = (precision, userRadius) => {
  if (userRadius) return userRadius;
  switch (precision) {
    case 'country':
      return 80000;
    case 'city':
      return 15000;
    case 'area':
      return 4000;
    default:
      return 3000;
  }
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildAddressFilter = ({ area, city, country }) => {
  const filter = {};

  if (country) {
    filter['address.country'] = new RegExp(`^${escapeRegex(country)}$`, 'i');
  }
  if (city) {
    filter['address.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i');
  }
  if (area) {
    filter['address.area'] = new RegExp(escapeRegex(area), 'i');
  }

  return filter;
};

const formatAddress = (address = {}) => {
  if (address.formatted) return address.formatted;

  const parts = [
    address.line1,
    address.building,
    address.floor ? `Floor ${address.floor}` : null,
    address.area,
    address.city,
    address.country,
  ].filter(Boolean);

  return parts.join(', ') || 'Address not provided';
};

module.exports = {
  searchLocations,
  reverseGeocode,
  resolveLocationQuery,
  getSearchRadius,
  buildAddressFilter,
  formatAddress,
  detectPrecision,
};