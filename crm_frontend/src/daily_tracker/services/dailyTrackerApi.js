import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

const dailyTrackerAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

dailyTrackerAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

dailyTrackerAxios.interceptors.response.use(
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

export const dailyTrackerService = {
  // Fetch active campaigns for dropdown selection
  getCampaigns: async () => {
    try {
      const response = await dailyTrackerAxios.get('/campaigns/dropdown/');
      return response.data;
    } catch (err) {
      // Fallback to main campaign list if dropdown endpoint not available
      const response = await dailyTrackerAxios.get('/campaigns/');
      return response.data.results || response.data;
    }
  },

  // Submit daily count log
  logCount: async (payload) => {
    const response = await dailyTrackerAxios.post('/daily-tracker/log-count/', payload);
    return response.data;
  },

  // Fetch personal log history
  getMyLogs: async () => {
    const response = await dailyTrackerAxios.get('/daily-tracker/my-logs/');
    return response.data;
  },

  // Fetch master administrative workforce records (Admin & HR)
  getWorkforceRecords: async () => {
    const response = await dailyTrackerAxios.get('/daily-tracker/workforce-records/');
    return response.data;
  },

  // Inline update record (Admin & HR)
  updateWorkforceRecord: async (id, payload) => {
    const response = await dailyTrackerAxios.put(`/daily-tracker/workforce-records/${id}/`, payload);
    return response.data;
  },

  // Inline delete record (Admin & HR)
  deleteWorkforceRecord: async (id) => {
    const response = await dailyTrackerAxios.delete(`/daily-tracker/workforce-records/${id}/`);
    return response.data;
  },
};

export default dailyTrackerService;
