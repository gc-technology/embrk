const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? '';

const TOKEN_KEY = 'embark_admin_token';

export const adminToken = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function adminFetch(path, options = {}) {
  const token = adminToken.get();
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    adminToken.clear();
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }
  return res.json();
}

export const adminApi = {
  login: (email, password) =>
    adminFetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => adminFetch('/api/admin/logout', { method: 'POST' }),
  me: () => adminFetch('/api/admin/me'),

  getModes: () => adminFetch('/api/admin/modes'),
  createMode: (d) => adminFetch('/api/admin/modes', { method: 'POST', body: JSON.stringify(d) }),
  updateMode: (id, d) => adminFetch(`/api/admin/modes/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteMode: (id) => adminFetch(`/api/admin/modes/${id}`, { method: 'DELETE' }),

  getCategories: (modeId) => adminFetch(`/api/admin/categories?mode_id=${modeId}`),
  createCategory: (d) => adminFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(d) }),
  updateCategory: (id, d) => adminFetch(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteCategory: (id) => adminFetch(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  getFragments: () => adminFetch('/api/admin/fragments'),
  updateFragment: (id, d) => adminFetch(`/api/admin/fragments/${id}`, { method: 'PUT', body: JSON.stringify(d) }),

  getFlavors: () => adminFetch('/api/admin/flavors'),
  createFlavor: (d) => adminFetch('/api/admin/flavors', { method: 'POST', body: JSON.stringify(d) }),
  updateFlavor: (id, d) => adminFetch(`/api/admin/flavors/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteFlavor: (id) => adminFetch(`/api/admin/flavors/${id}`, { method: 'DELETE' }),

  getUsers: () => adminFetch('/api/admin/users'),
  createUser: (d) => adminFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(d) }),
  updateUser: (id, d) => adminFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(d) }),

  changePassword: (current_password, new_password) =>
    adminFetch('/api/admin/me/password', { method: 'PUT', body: JSON.stringify({ current_password, new_password }) }),
};
