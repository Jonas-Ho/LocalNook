import { apiRequest } from './client';

export const register = (name, email, password) =>
  apiRequest('/auth/register', {
    auth: false,
    method: 'POST',
    body: { name, email, password },
  });

export const login = (email, password) =>
  apiRequest('/auth/login', {
    auth: false,
    method: 'POST',
    body: { email, password },
  });

export const getMe = () => apiRequest('/auth/me');