import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const unwrap = response => ({ ...response, data: response.data.data });
const request = promise => promise.then(unwrap);

export const authAPI = {
  login: async (email, password) => {
    const response = await request(api.post('/auth/login', { email, password }));
    localStorage.setItem('boutique_current_user', JSON.stringify(response.data.user));
    return response;
  },
  loginSuperAdmin: async (email, password) => {
    const response = await request(api.post('/super-admin/login', { email, password }));
    localStorage.setItem('boutique_current_user', JSON.stringify(response.data.user));
    return response;
  },
  register: data => request(api.post('/auth/register', data)),
  getCurrentUser: () => request(api.get('/auth/me')),
  logout: () => request(api.post('/auth/logout')),
  updateProfile: (id, data) => request(api.put(`/auth/profile/${id}`, data)).then(response => {
    localStorage.setItem('boutique_current_user', JSON.stringify(response.data));
    return response;
  }),
  changePassword: (id, currentPassword, newPassword) => request(api.put(`/auth/password/${id}`, { currentPassword, newPassword }))
};

const resourceAPI = (path, wrapper) => ({
  getAll: (params = {}) => request(api.get(`/${path}`, { params })),
  getById: id => request(api.get(`/${path}/${id}`)),
  create: data => request(api.post(`/${path}`, data)),
  update: (id, data) => request(api.put(`/${path}/${id}`, data)),
  delete: id => request(api.delete(`/${path}/${id}`)),
  wrapper
});

export const customerAPI = {
  ...resourceAPI('customers', 'customers'),
  getAll: (search = '') => request(api.get('/customers', { params: search ? { search } : {} })),
  getOrders: id => request(api.get(`/customers/${id}/orders`)),
  addMeasurement: (id, measurements) => request(api.post(`/customers/${id}/measurements`, measurements))
};

export const orderAPI = {
  ...resourceAPI('orders', 'orders'),
  getAll: (status = '', customerId = '') => request(api.get('/orders', { params: { ...(status ? { status } : {}), ...(customerId ? { customerId } : {}) } })),
  changeStatus: (id, status, notes) => request(api.patch(`/orders/${id}/status`, { status, notes })),
  assign: (id, staffId) => request(api.patch(`/orders/${id}/assign`, { staffId }))
};

export const paymentAPI = {
  ...resourceAPI('payments', 'payments'),
  getAll: (status = '', customerId = '', duePayment = false) => request(api.get('/payments', { params: { ...(status ? { status } : {}), ...(customerId ? { customerId } : {}), ...(duePayment ? { duePayment: true } : {}) } })),
  getGatewayConfig: () => request(api.get('/payments/gateway/config')),
  createGatewayOrder: data => request(api.post('/payments/gateway/orders', data)),
  verifyGatewayPayment: data => request(api.post('/payments/gateway/verify', data))
};

export const integrationSettingsAPI = {
  get: () => request(api.get('/settings/integrations')),
  save: data => request(api.put('/settings/integrations', data))
};

export const superAdminAPI = {
  getTenants: () => request(api.get('/super-admin/tenants')),
  createTenant: data => request(api.post('/super-admin/tenants', data)),
  updateTenant: (id, data) => request(api.put(`/super-admin/tenants/${id}`, data))
};

export const inventoryAPI = {
  ...resourceAPI('inventory', 'inventory'),
  getAll: (category = '', status = '', search = '') => request(api.get('/inventory', { params: { ...(category ? { category } : {}), ...(status ? { status } : {}), ...(search ? { search } : {}) } })),
  updateQuantity: (id, quantity) => request(api.patch(`/inventory/${id}/quantity`, { quantity })),
  getLowStockItems: () => request(api.get('/inventory/low-stock'))
};

export const userAPI = {
  ...resourceAPI('users', 'users'),
  getUserStats: id => request(api.get(`/users/stats/${id}`)),
  toggleStatus: id => request(api.patch(`/users/${id}/status`))
};

export const roleAPI = resourceAPI('roles', 'roles');

export const dashboardAPI = {
  getOwnerDashboard: () => request(api.get('/dashboard/owner')),
  getStaffDashboard: () => request(api.get('/dashboard/staff')),
  getReports: () => request(api.get('/dashboard/reports'))
};