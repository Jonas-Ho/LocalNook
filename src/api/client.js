const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function apiRequest(path, options = {}) {
  const { auth = true, body, headers = {}, ...rest } = options;

  const config = {
    ...rest,
    headers: { ...headers },
  };

  if (auth) {
    const token = localStorage.getItem('token');
    if (token) config.headers['x-auth-token'] = token;
  }

  if (body instanceof FormData) {
    config.body = body;
  } else if (body !== undefined) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, config);
  } catch {
    throw new ApiError(
      'Cannot reach the API server. Run `npm run dev` in the project root (default port 8000).',
      0
    );
  }

  const text = await res.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        `Unexpected server response (${res.status}). Port 5000 on macOS is often blocked by AirPlay — use port 8000.`,
        res.status
      );
    }
  }

  if (!res.ok) {
    const message =
      data.message ||
      (data.errors?.[0]?.message) ||
      (res.status === 401 ? 'Invalid email or password' : null) ||
      (res.status === 404 ? 'API route not found — check VITE_API_URL' : null) ||
      `Request failed (${res.status})`;

    throw new ApiError(message, res.status, data.errors);
  }

  return data;
}