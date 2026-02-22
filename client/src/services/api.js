import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Auth APIs
export const authAPI = {
  login: (email, password) => axios.post(`${API_BASE_URL}/auth/login`, { email, password }),
  register: (userData) => axios.post(`${API_BASE_URL}/auth/register`, userData, { headers: getAuthHeaders() }),
  getCurrentUser: () => axios.get(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() }),
  logout: () => axios.post(`${API_BASE_URL}/auth/logout`, {}, { headers: getAuthHeaders() })
};

// Customer APIs
export const customerAPI = {
  getAll: (search = '') => axios.get(`${API_BASE_URL}/customers?search=${search}`, { headers: getAuthHeaders() }),
  getById: (id) => axios.get(`${API_BASE_URL}/customers/${id}`, { headers: getAuthHeaders() }),
  create: (data) => axios.post(`${API_BASE_URL}/customers`, data, { headers: getAuthHeaders() }),
  update: (id, data) => axios.put(`${API_BASE_URL}/customers/${id}`, data, { headers: getAuthHeaders() }),
  delete: (id) => axios.delete(`${API_BASE_URL}/customers/${id}`, { headers: getAuthHeaders() }),
  addMeasurement: (id, measurements) => axios.post(`${API_BASE_URL}/customers/${id}/measurements`, measurements, { headers: getAuthHeaders() }),
  getOrders: (id) => axios.get(`${API_BASE_URL}/customers/${id}/orders`, { headers: getAuthHeaders() })
};

// Order APIs
export const orderAPI = {
  getAll: (status = '', customerId = '') => axios.get(`${API_BASE_URL}/orders?status=${status}&customerId=${customerId}`, { headers: getAuthHeaders() }),
  getById: (id) => axios.get(`${API_BASE_URL}/orders/${id}`, { headers: getAuthHeaders() }),
  create: (data) => axios.post(`${API_BASE_URL}/orders`, data, { headers: getAuthHeaders() }),
  update: (id, data) => axios.put(`${API_BASE_URL}/orders/${id}`, data, { headers: getAuthHeaders() }),
  delete: (id) => axios.delete(`${API_BASE_URL}/orders/${id}`, { headers: getAuthHeaders() }),
  changeStatus: (id, status, notes) => axios.patch(`${API_BASE_URL}/orders/${id}/status`, { status, notes }, { headers: getAuthHeaders() }),
  assign: (id, staffId) => axios.patch(`${API_BASE_URL}/orders/${id}/assign`, { staffId }, { headers: getAuthHeaders() })
};

// Payment APIs
export const paymentAPI = {
  getAll: (status = '', customerId = '', duePayment = false) => axios.get(`${API_BASE_URL}/payments?status=${status}&customerId=${customerId}&duePayment=${duePayment}`, { headers: getAuthHeaders() }),
  getById: (id) => axios.get(`${API_BASE_URL}/payments/${id}`, { headers: getAuthHeaders() }),
  create: (data) => axios.post(`${API_BASE_URL}/payments`, data, { headers: getAuthHeaders() }),
  update: (id, data) => axios.put(`${API_BASE_URL}/payments/${id}`, data, { headers: getAuthHeaders() }),
  delete: (id) => axios.delete(`${API_BASE_URL}/payments/${id}`, { headers: getAuthHeaders() })
};

// Inventory APIs
export const inventoryAPI = {
  getAll: (category = '', status = '', search = '') => axios.get(`${API_BASE_URL}/inventory?category=${category}&status=${status}&search=${search}`, { headers: getAuthHeaders() }),
  getById: (id) => axios.get(`${API_BASE_URL}/inventory/${id}`, { headers: getAuthHeaders() }),
  create: (data) => axios.post(`${API_BASE_URL}/inventory`, data, { headers: getAuthHeaders() }),
  update: (id, data) => axios.put(`${API_BASE_URL}/inventory/${id}`, data, { headers: getAuthHeaders() }),
  updateQuantity: (id, quantity) => axios.patch(`${API_BASE_URL}/inventory/${id}/quantity`, { quantity }, { headers: getAuthHeaders() }),
  delete: (id) => axios.delete(`${API_BASE_URL}/inventory/${id}`, { headers: getAuthHeaders() }),
  getLowStockItems: () => axios.get(`${API_BASE_URL}/inventory/low-stock`, { headers: getAuthHeaders() })
};

// Dashboard APIs
export const dashboardAPI = {
  getOwnerDashboard: () => axios.get(`${API_BASE_URL}/dashboard/owner`, { headers: getAuthHeaders() }),
  getStaffDashboard: () => axios.get(`${API_BASE_URL}/dashboard/staff`, { headers: getAuthHeaders() }),
  getReports: (reportType, month, quarter, year) => axios.get(`${API_BASE_URL}/dashboard/reports?reportType=${reportType}&month=${month}&quarter=${quarter}&year=${year}`, { headers: getAuthHeaders() })
};
