import { apiRequest } from './client';

export const searchPlaces = ({ lat, lng, area, city, country, radius }) => {
  const params = new URLSearchParams();
  if (lat != null) params.set('lat', lat);
  if (lng != null) params.set('lng', lng);
  if (area) params.set('area', area);
  if (city) params.set('city', city);
  if (country) params.set('country', country);
  if (radius) params.set('radius', radius);
  return apiRequest(`/places/nearby?${params.toString()}`, { auth: false });
};

export const getPlace = (id) => apiRequest(`/places/${id}`, { auth: false });

export const getSavedPlaces = () => apiRequest('/places/saved');

export const getMyPlaces = () => apiRequest('/places/mine');

export const addPlace = (formData) =>
  apiRequest('/places', { method: 'POST', body: formData });

export const votePlace = (placeId) =>
  apiRequest('/places/vote', { method: 'POST', body: { placeId } });

export const visitPlace = (id) =>
  apiRequest(`/places/${id}/visit`, { method: 'POST' });

export const savePlace = (id) =>
  apiRequest(`/places/${id}/save`, { method: 'POST' });

export const unsavePlace = (id) =>
  apiRequest(`/places/${id}/save`, { method: 'DELETE' });