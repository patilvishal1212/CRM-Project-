import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

// Create Axios Instance with Interceptors for payroll module
export const payrollAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

payrollAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

payrollAxios.interceptors.response.use(
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

export const payrollService = {
  // 1. Fetch live workforce employees (GET /accounts/employees/)
  getEmployees: async () => {
    const response = await payrollAxios.get('/accounts/employees/');
    return response.data;
  },

  // 2. Master Salary Profile Endpoints (GET & POST /payroll/master/ & PUT /payroll/master/<id>/)
  getSalaryMasters: async () => {
    const response = await payrollAxios.get('/payroll/master/');
    return response.data;
  },

  getSalaryMasterById: async (id) => {
    const response = await payrollAxios.get(`/payroll/master/${id}/`);
    return response.data;
  },

  saveSalaryMaster: async (masterData) => {
    const response = await payrollAxios.post('/payroll/master/', masterData);
    return response.data;
  },

  updateSalaryMaster: async (id, masterData) => {
    const response = await payrollAxios.put(`/payroll/master/${id}/`, masterData);
    return response.data;
  },

  // 3. HR Submit & Monthly Payroll Editing Pipeline
  getMonthlyPayrolls: async (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await payrollAxios.get('/payroll/monthly/', { params });
    return response.data;
  },

  submitHRPayroll: async (payrollData) => {
    const response = await payrollAxios.post('/payroll/hr-submit/', payrollData);
    return response.data;
  },

  updateMonthlyPayroll: async (id, payrollData) => {
    const response = await payrollAxios.put(`/payroll/monthly/${id}/`, payrollData);
    return response.data;
  },

  // 4. Admin Review Endpoints (GET /payroll/admin-review/ & POST /payroll/admin-review/<id>/)
  getAdminPendingReviews: async () => {
    const response = await payrollAxios.get('/payroll/admin-review/');
    return response.data;
  },

  reviewPayrollItem: async (id, action) => {
    const response = await payrollAxios.post(`/payroll/admin-review/${id}/`, { action });
    return response.data;
  },

  // 5. Employee My-Slips Endpoint (GET /payroll/my-slips/)
  getMyPayslips: async () => {
    const response = await payrollAxios.get('/payroll/my-slips/');
    return response.data;
  },

  // 6. Dedicated Binary Blob Download Handler (Fixes file corruption & empty page errors)
  fetchSlipBlob: async (pdfUrl, slipId) => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    let fullTargetUrl = pdfUrl;
    if (!fullTargetUrl && slipId) {
      fullTargetUrl = `${API_BASE_URL}/payroll/download/${slipId}/`;
    } else if (fullTargetUrl && !fullTargetUrl.startsWith('http')) {
      const rootHost = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
      fullTargetUrl = fullTargetUrl.startsWith('/') ? `${rootHost}${fullTargetUrl}` : `${rootHost}/${fullTargetUrl}`;
    }

    return await axios.get(fullTargetUrl, {
      responseType: 'blob',
      headers,
    });
  },

  downloadSlipPDF: async (pdfUrl, filename = 'SalarySlip.pdf') => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      let fullTargetUrl = pdfUrl;
      if (pdfUrl && !pdfUrl.startsWith('http')) {
        const rootHost = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
        fullTargetUrl = pdfUrl.startsWith('/') ? `${rootHost}${pdfUrl}` : `${rootHost}/${pdfUrl}`;
      }

      // Execute file stream retrieval via Axios configured with responseType: 'blob'
      const response = await axios.get(fullTargetUrl, {
        responseType: 'blob',
        headers,
      });

      // Instantiate native local JavaScript Browser Blob reference bounded explicitly to application/pdf
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      return true;
    } catch (err) {
      console.error('Binary Blob PDF Download failed:', err);
      throw err;
    }
  },
};

export default payrollService;
