// frontend/src/utils/api.js
const API_URL =
  (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000';

async function raw(path, options = {}) {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
    const err = new Error((data && data.message) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function apiFetch(path, options = {}) {
  return raw(path, options);
}

export const api = {
  get: (path, opts) => raw(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => raw(path, { ...opts, method: 'POST', body: JSON.stringify(body) }),
  put: (path, body, opts) => raw(path, { ...opts, method: 'PUT', body: JSON.stringify(body) }),
  del: (path, opts) => raw(path, { ...opts, method: 'DELETE' }),
};

export { API_URL };
export default apiFetch; // <-- default export para poder importar sin llaves
