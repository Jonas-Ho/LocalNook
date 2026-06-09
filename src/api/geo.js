import { apiRequest } from './client';

export const searchLocations = (q) =>
  apiRequest(`/geo/search?q=${encodeURIComponent(q)}`, { auth: false });

export const reverseGeocode = (lat, lng) =>
  apiRequest(`/geo/reverse?lat=${lat}&lng=${lng}`, { auth: false });