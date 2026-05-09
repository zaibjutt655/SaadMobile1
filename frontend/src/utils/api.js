import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  seed:           (data) => api.post('/auth/seed', data),
};

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll:  (params) => api.get('/products', { params }),
  getById: (id)     => api.get(`/products/${id}`),
  create:  (data)   => api.post('/products', data),
  update:  (id, data) => api.put(`/products/${id}`, data),
  delete:  (id)     => api.delete(`/products/${id}`),
};

// ─── USED MOBILES ─────────────────────────────────────────────────────────────
export const mobilesAPI = {
  getAll:      (params) => api.get('/mobiles', { params }),
  getById:     (id)     => api.get(`/mobiles/${id}`),
  searchIMEI:  (imei)   => api.get(`/mobiles/imei/${imei}`),
  create:      (data)   => api.post('/mobiles', data),
  update:      (id, data) => api.put(`/mobiles/${id}`, data),
  delete:      (id)     => api.delete(`/mobiles/${id}`),
};

// ─── SALES ────────────────────────────────────────────────────────────────────
export const salesAPI = {
  getAll:  (params)   => api.get('/sales', { params }),
  getById: (id)       => api.get(`/sales/${id}`),
  create:  (data)     => api.post('/sales', data),
  update:  (id, data) => api.put(`/sales/${id}`, data),
  delete:  (id)       => api.delete(`/sales/${id}`),
};

// ─── PURCHASES ────────────────────────────────────────────────────────────────
export const purchasesAPI = {
  getAll:  (params) => api.get('/purchases', { params }),
  create:  (data)   => api.post('/purchases', data),
  delete:  (id)     => api.delete(`/purchases/${id}`),
};

// ─── SERVICES ─────────────────────────────────────────────────────────────────
export const servicesAPI = {
  getAll:  (params)   => api.get('/services', { params }),
  create:  (data)     => api.post('/services', data),
  update:  (id, data) => api.put(`/services/${id}`, data),
  delete:  (id)       => api.delete(`/services/${id}`),
};

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export const customersAPI = {
  getAll:  (params)   => api.get('/customers', { params }),
  create:  (data)     => api.post('/customers', data),
  update:  (id, data) => api.put(`/customers/${id}`, data),
};

// ─── STAFF ────────────────────────────────────────────────────────────────────
export const staffAPI = {
  getAll:  ()         => api.get('/staff'),
  create:  (data)     => api.post('/staff', data),
  update:  (id, data) => api.put(`/staff/${id}`, data),
  delete:  (id)       => api.delete(`/staff/${id}`),
};

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export const expensesAPI = {
  getAll:  (params) => api.get('/expenses', { params }),
  create:  (data)   => api.post('/expenses', data),
  delete:  (id)     => api.delete(`/expenses/${id}`),
};

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getSummary:    (params) => api.get('/reports/summary', { params }),
  getDaily:      ()       => api.get('/reports/daily'),
  getTopProducts:(params) => api.get('/reports/top-products', { params }),
};

// ─── AUDIT ────────────────────────────────────────────────────────────────────
export const auditAPI = {
  getAll: (params) => api.get('/audit', { params }),
};

// ─── BACKUP ───────────────────────────────────────────────────────────────────
export const backupAPI = {
  downloadJSON:  () => api.get('/backup/json',  { responseType: 'blob' }),
  downloadExcel: () => api.get('/backup/excel', { responseType: 'blob' }),
};

// ─── CLOSING ──────────────────────────────────────────────────────────────────
export const closingAPI = {
  getAll:    ()  => api.get('/closing'),
  getToday:  ()  => api.get('/closing/today'),
  runClosing:()  => api.post('/closing/run'),
};

export default api;
