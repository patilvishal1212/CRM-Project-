import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

const leaveAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

leaveAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

leaveAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const leaveService = {
  // Apply for leave (POST /api/leaves/apply/)
  applyLeave: async (leaveData) => {
    const response = await leaveAxios.post('/leaves/apply/', leaveData);
    return response.data;
  },

  // Fetch my leave requests (GET /api/leaves/my-requests/)
  getMyRequests: async () => {
    const response = await leaveAxios.get('/leaves/my-requests/');
    return response.data;
  },

  // Fetch my leave balances (GET /api/leaves/balances/)
  getBalances: async () => {
    const response = await leaveAxios.get('/leaves/balances/');
    return response.data;
  },

  // Fetch pending review requests for HR & Admin (GET /api/leaves/pending-list/)
  getPendingRequests: async () => {
    const response = await leaveAxios.get('/leaves/pending-list/');
    return response.data;
  },

  // Review leave request status (PATCH /api/leaves/review/<id>/)
  reviewLeave: async (id, status) => {
    const response = await leaveAxios.patch(`/leaves/review/${id}/`, { status });
    return response.data;
  },
};

export default leaveService;
