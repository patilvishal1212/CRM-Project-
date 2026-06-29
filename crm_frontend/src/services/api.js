const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers = {};

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw errorData;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  post: async (endpoint, data, isMultipart = false) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(isMultipart),
      body: isMultipart ? data : JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (endpoint, data, isMultipart = false) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(isMultipart),
      body: isMultipart ? data : JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ── Auth / Accounts ────────────────────────────────────────────────────────
export const authService = {
  login: async (email, password) => {
    const data = await api.post('/accounts/login/', { email, password });
    if (data.access) {
      localStorage.setItem('token', data.access);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getProfile: () => api.get('/accounts/profile/'),
};

// ── Employee Management (Admin only) ──────────────────────────────────────
export const employeeService = {
  getAll: () => api.get('/accounts/employees/'),
  getById: (id) => api.get(`/accounts/employees/${id}/`),
  create: (data) => api.post('/accounts/employees/', data),
  update: (id, data) => api.put(`/accounts/employees/${id}/`, data),
  delete: (id) => api.delete(`/accounts/employees/${id}/`),
  toggleActive: (id) => api.post(`/accounts/employees/${id}/toggle-active/`, {}),
};

// ── Campaigns ─────────────────────────────────────────────────────────────
export const campaignService = {
  getAll: () => api.get('/campaigns/'),
  getById: (id) => api.get(`/campaigns/${id}/`),
  // Lightweight list for form dropdowns (id, name, status only)
  getDropdown: () => api.get('/campaigns/dropdown/'),
  create: (data) => api.post('/campaigns/', data),
  update: (id, data) => api.put(`/campaigns/${id}/`, data),
  delete: (id) => api.delete(`/campaigns/${id}/`),
};

// ── Leads ─────────────────────────────────────────────────────────────────
export const leadService = {
  getAll: () => api.get('/leads/'),
  create: (formData) => api.post('/leads/', formData, true), // multipart for audio
  review: (id, qaStatus, qaComments) =>
    api.post(`/leads/${id}/qa-review/`, { qa_status: qaStatus, qa_comments: qaComments }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardService = {
  // Single endpoint - backend returns role-specific payload
  getSummary: () => api.get('/dashboard/'),
};
