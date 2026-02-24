import {
  mockDashboardData,
  initializeMockData,
  getStorageData,
  saveStorageData,
  getNextId,
  delay
} from './mockData';

// Initialize mock data on app load
initializeMockData();

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    await delay();
    const users = getStorageData('USERS');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      if (user.status === 'inactive' || user.status === 'disabled') {
        throw new Error('Your account has been disabled. Please contact administrator.');
      }
      // Update last login
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date().toISOString();
        saveStorageData('USERS', users);
      }
      const token = 'mock-jwt-token-' + user.id;
      localStorage.setItem('token', token);
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('boutique_current_user', JSON.stringify(userWithoutPassword));
      return { data: { token, user: userWithoutPassword } };
    }
    throw new Error('Invalid email or password');
  },
  register: async (userData) => {
    await delay();
    const users = getStorageData('USERS');
    const newId = getNextId(users);
    const newUser = { 
      ...userData, 
      id: newId,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    users.push(newUser);
    saveStorageData('USERS', users);
    const { password: _, ...userWithoutPassword } = newUser;
    return { data: userWithoutPassword };
  },
  getCurrentUser: async () => {
    await delay();
    const user = localStorage.getItem('boutique_current_user');
    return { data: user ? JSON.parse(user) : null };
  },
  logout: async () => {
    await delay();
    localStorage.removeItem('token');
    localStorage.removeItem('boutique_current_user');
    return { data: { message: 'Logged out successfully' } };
  },
  updateProfile: async (id, data) => {
    await delay();
    const users = getStorageData('USERS');
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      saveStorageData('USERS', users);
      const { password: _, ...userWithoutPassword } = users[index];
      // Update current user in localStorage if it's the same user
      const currentUser = JSON.parse(localStorage.getItem('boutique_current_user'));
      if (currentUser && currentUser.id === parseInt(id)) {
        localStorage.setItem('boutique_current_user', JSON.stringify(userWithoutPassword));
      }
      return { data: userWithoutPassword };
    }
    throw new Error('User not found');
  },
  changePassword: async (id, currentPassword, newPassword) => {
    await delay();
    const users = getStorageData('USERS');
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index !== -1) {
      if (users[index].password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }
      if (currentPassword === newPassword) {
        throw new Error('New password must be different from current password');
      }
      users[index].password = newPassword;
      saveStorageData('USERS', users);
      return { data: { message: 'Password changed successfully' } };
    }
    throw new Error('User not found');
  }
};

// Customer APIs
export const customerAPI = {
  getAll: async (search = '') => {
    await delay();
    let customers = getStorageData('CUSTOMERS');
    if (search) {
      customers = customers.filter(c => 
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
      );
    }
    return { data: { customers } };
  },
  getById: async (id) => {
    await delay();
    const customers = getStorageData('CUSTOMERS');
    const customer = customers.find(c => c.id === parseInt(id));
    return { data: customer };
  },
  create: async (data) => {
    await delay();
    const customers = getStorageData('CUSTOMERS');
    const newId = getNextId(customers);
    const newCustomer = {
      ...data,
      id: newId,
      customerId: `CUST${String(newId).padStart(3, '0')}`,
      dateAdded: data.dateAdded || new Date().toISOString().split('T')[0]
    };
    customers.push(newCustomer);
    saveStorageData('CUSTOMERS', customers);
    return { data: newCustomer };
  },
  update: async (id, data) => {
    await delay();
    const customers = getStorageData('CUSTOMERS');
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index !== -1) {
      customers[index] = { ...customers[index], ...data };
      saveStorageData('CUSTOMERS', customers);
      return { data: customers[index] };
    }
    throw new Error('Customer not found');
  },
  delete: async (id) => {
    await delay();
    const customers = getStorageData('CUSTOMERS');
    const filtered = customers.filter(c => c.id !== parseInt(id));
    saveStorageData('CUSTOMERS', filtered);
    return { data: { message: 'Customer deleted' } };
  },
  addMeasurement: async (id, measurements) => {
    await delay();
    const customers = getStorageData('CUSTOMERS');
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index !== -1) {
      customers[index].measurements = measurements;
      saveStorageData('CUSTOMERS', customers);
      return { data: customers[index] };
    }
    throw new Error('Customer not found');
  },
  getOrders: async (id) => {
    await delay();
    const orders = getStorageData('ORDERS');
    const customerOrders = orders.filter(o => o.customerId === parseInt(id));
    return { data: customerOrders };
  }
};

// Order APIs
export const orderAPI = {
  getAll: async (status = '', customerId = '') => {
    await delay();
    let orders = getStorageData('ORDERS');
    if (status) {
      orders = orders.filter(o => (o.status || '').toLowerCase() === status.toLowerCase());
    }
    if (customerId) {
      orders = orders.filter(o => o.customerId === parseInt(customerId));
    }
    return { data: { orders } };
  },
  getById: async (id) => {
    await delay();
    const orders = getStorageData('ORDERS');
    const order = orders.find(o => o.id === parseInt(id));
    return { data: order };
  },
  create: async (data) => {
    await delay();
    const orders = getStorageData('ORDERS');
    const customers = getStorageData('CUSTOMERS');
    const customer = customers.find(c => c.id === parseInt(data.customerId));
    const newId = getNextId(orders);
    const newOrder = {
      ...data,
      id: newId,
      orderId: `ORD${String(newId).padStart(3, '0')}`,
      customerName: customer ? customer.name : 'Unknown',
      orderDate: data.orderDate || new Date().toISOString().split('T')[0]
    };
    orders.push(newOrder);
    saveStorageData('ORDERS', orders);
    return { data: newOrder };
  },
  update: async (id, data) => {
    await delay();
    const orders = getStorageData('ORDERS');
    const index = orders.findIndex(o => o.id === parseInt(id));
    if (index !== -1) {
      orders[index] = { ...orders[index], ...data };
      saveStorageData('ORDERS', orders);
      return { data: orders[index] };
    }
    throw new Error('Order not found');
  },
  delete: async (id) => {
    await delay();
    const orders = getStorageData('ORDERS');
    const filtered = orders.filter(o => o.id !== parseInt(id));
    saveStorageData('ORDERS', filtered);
    return { data: { message: 'Order deleted' } };
  },
  changeStatus: async (id, status, notes) => {
    await delay();
    const orders = getStorageData('ORDERS');
    const index = orders.findIndex(o => o.id === parseInt(id));
    if (index !== -1) {
      orders[index].status = status;
      if (notes) orders[index].notes = notes;
      saveStorageData('ORDERS', orders);
      return { data: orders[index] };
    }
    throw new Error('Order not found');
  },
  assign: async (id, staffId) => {
    await delay();
    const orders = getStorageData('ORDERS');
    const index = orders.findIndex(o => o.id === parseInt(id));
    if (index !== -1) {
      orders[index].assignedTo = staffId;
      saveStorageData('ORDERS', orders);
      return { data: orders[index] };
    }
    throw new Error('Order not found');
  }
};

// Payment APIs
export const paymentAPI = {
  getAll: async (status = '', customerId = '', duePayment = false) => {
    await delay();
    let payments = getStorageData('PAYMENTS');
    if (status) {
      payments = payments.filter(p => (p.status || '').toLowerCase() === status.toLowerCase());
    }
    if (customerId) {
      payments = payments.filter(p => p.customerId === parseInt(customerId));
    }
    if (duePayment) {
      const orders = getStorageData('ORDERS');
      payments = orders.filter(o => o.balanceAmount > 0);
    }
    return { data: payments };
  },
  getById: async (id) => {
    await delay();
    const payments = getStorageData('PAYMENTS');
    const payment = payments.find(p => p.id === parseInt(id));
    return { data: payment };
  },
  create: async (data) => {
    await delay();
    const payments = getStorageData('PAYMENTS');
    const customers = getStorageData('CUSTOMERS');
    
    // Use customerName from data if provided, otherwise lookup by customerId
    let customerName = data.customerName;
    if (!customerName && data.customerId) {
      const customer = customers.find(c => c.id === parseInt(data.customerId));
      customerName = customer ? customer.name : 'Unknown';
    }
    
    const newPayment = {
      ...data,
      id: getNextId(payments),
      customerName: customerName || 'Unknown',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Completed',
      transactionId: 'TXN' + Date.now()
    };
    payments.push(newPayment);
    saveStorageData('PAYMENTS', payments);
    
    // Update order balance
    if (data.orderId) {
      const orders = getStorageData('ORDERS');
      const orderIndex = orders.findIndex(o => o.id === parseInt(data.orderId));
      if (orderIndex !== -1) {
        orders[orderIndex].balanceAmount = (orders[orderIndex].balanceAmount || 0) - data.amount;
        saveStorageData('ORDERS', orders);
      }
    }
    
    return { data: newPayment };
  },
  update: async (id, data) => {
    await delay();
    const payments = getStorageData('PAYMENTS');
    const index = payments.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      payments[index] = { ...payments[index], ...data };
      saveStorageData('PAYMENTS', payments);
      return { data: payments[index] };
    }
    throw new Error('Payment not found');
  },
  delete: async (id) => {
    await delay();
    const payments = getStorageData('PAYMENTS');
    const filtered = payments.filter(p => p.id !== parseInt(id));
    saveStorageData('PAYMENTS', filtered);
    return { data: { message: 'Payment deleted' } };
  }
};

// Inventory APIs
export const inventoryAPI = {
  getAll: async (category = '', status = '', search = '') => {
    await delay();
    let inventory = getStorageData('INVENTORY');
    if (category) {
      inventory = inventory.filter(i => (i.category || '').toLowerCase() === category.toLowerCase());
    }
    if (status) {
      inventory = inventory.filter(i => (i.status || '').toLowerCase() === status.toLowerCase());
    }
    if (search) {
      inventory = inventory.filter(i =>
        (i.itemName || i.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.sku || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    return { data: inventory };
  },
  getById: async (id) => {
    await delay();
    const inventory = getStorageData('INVENTORY');
    const item = inventory.find(i => i.id === parseInt(id));
    return { data: item };
  },
  create: async (data) => {
    await delay();
    const inventory = getStorageData('INVENTORY');
    const newItem = {
      ...data,
      id: getNextId(inventory),
      lastRestocked: new Date().toISOString().split('T')[0],
      status: data.quantity <= (data.minStock || 10) ? 'Low Stock' : 'In Stock'
    };
    inventory.push(newItem);
    saveStorageData('INVENTORY', inventory);
    return { data: newItem };
  },
  update: async (id, data) => {
    await delay();
    const inventory = getStorageData('INVENTORY');
    const index = inventory.findIndex(i => i.id === parseInt(id));
    if (index !== -1) {
      inventory[index] = { ...inventory[index], ...data };
      inventory[index].status = inventory[index].quantity <= (inventory[index].minStock || 10) ? 'Low Stock' : 'In Stock';
      saveStorageData('INVENTORY', inventory);
      return { data: inventory[index] };
    }
    throw new Error('Inventory item not found');
  },
  updateQuantity: async (id, quantity) => {
    await delay();
    const inventory = getStorageData('INVENTORY');
    const index = inventory.findIndex(i => i.id === parseInt(id));
    if (index !== -1) {
      inventory[index].quantity = quantity;
      inventory[index].status = quantity <= (inventory[index].minStock || 10) ? 'Low Stock' : 'In Stock';
      inventory[index].lastRestocked = new Date().toISOString().split('T')[0];
      saveStorageData('INVENTORY', inventory);
      return { data: inventory[index] };
    }
    throw new Error('Inventory item not found');
  },
  delete: async (id) => {
    await delay();
    const inventory = getStorageData('INVENTORY');
    const filtered = inventory.filter(i => i.id !== parseInt(id));
    saveStorageData('INVENTORY', filtered);
    return { data: { message: 'Inventory item deleted' } };
  },
  getLowStockItems: async () => {
    await delay();
    const inventory = getStorageData('INVENTORY');
    const lowStock = inventory.filter(i => i.quantity <= (i.minStock || 10));
    return { data: lowStock };
  }
};

// Dashboard APIs
export const dashboardAPI = {
  getOwnerDashboard: async () => {
    await delay();
    const orders = getStorageData('ORDERS');
    const customers = getStorageData('CUSTOMERS');
    const payments = getStorageData('PAYMENTS');
    const inventory = getStorageData('INVENTORY');
    
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const inProgressOrders = orders.filter(o => o.status === 'In Progress').length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const pendingPayments = orders.reduce((sum, o) => sum + (o.balanceAmount || 0), 0);
    const lowStockItems = inventory.filter(i => i.quantity <= i.minStockLevel);
    
    return {
      data: {
        revenue: {
          today: totalRevenue * 0.05,
          thisWeek: totalRevenue * 0.15,
          thisMonth: totalRevenue * 0.40,
          thisYear: totalRevenue
        },
        orders: {
          total: orders.length,
          pending: pendingOrders,
          inProgress: inProgressOrders,
          completed: completedOrders
        },
        customers: {
          total: customers.length,
          new: Math.floor(customers.length * 0.2),
          active: Math.floor(customers.length * 0.6)
        },
        payments: {
          pending: pendingPayments,
          overdue: pendingPayments * 0.2,
          received: totalRevenue
        },
        recentOrders: orders.slice(0, 5),
        lowStockItems: lowStockItems,
        upcomingDueDates: orders.filter(o => o.status !== 'Completed').slice(0, 5),
        revenueChart: mockDashboardData.owner.revenueChart,
        orderStatusChart: [
          { name: 'Pending', value: pendingOrders },
          { name: 'In Progress', value: inProgressOrders },
          { name: 'Completed', value: completedOrders }
        ]
      }
    };
  },
  getStaffDashboard: async () => {
    await delay();
    const orders = getStorageData('ORDERS');
    const currentUser = JSON.parse(localStorage.getItem('boutique_current_user') || '{}');
    const myOrders = orders.filter(o => o.assignedTo === currentUser.name);
    
    return {
      data: {
        myOrders: myOrders,
        pending: myOrders.filter(o => o.status === 'Pending').length,
        inProgress: myOrders.filter(o => o.status === 'In Progress').length,
        completed: myOrders.filter(o => o.status === 'Completed').length,
        upcomingDueDates: myOrders.filter(o => o.status !== 'Completed')
      }
    };
  },
  getReports: async (reportType, month, quarter, year) => {
    await delay();
    return { data: mockDashboardData.owner };
  }
};

// User Management APIs
export const userAPI = {
  getAll: async () => {
    await delay();
    const users = getStorageData('USERS');
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    return { data: { users: usersWithoutPassword } };
  },
  getById: async (id) => {
    await delay();
    const users = getStorageData('USERS');
    const user = users.find(u => u.id === parseInt(id));
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return { data: userWithoutPassword };
    }
    throw new Error('User not found');
  },
  create: async (data) => {
    await delay();
    const users = getStorageData('USERS');
    const newId = getNextId(users);
    const newUser = {
      ...data,
      id: newId,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    users.push(newUser);
    saveStorageData('USERS', users);
    const { password, ...userWithoutPassword } = newUser;
    return { data: userWithoutPassword };
  },
  update: async (id, data) => {
    await delay();
    const users = getStorageData('USERS');
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      saveStorageData('USERS', users);
      const { password, ...userWithoutPassword } = users[index];
      return { data: userWithoutPassword };
    }
    throw new Error('User not found');
  },
  delete: async (id) => {
    await delay();
    const users = getStorageData('USERS');
    const filtered = users.filter(u => u.id !== parseInt(id));
    saveStorageData('USERS', filtered);
    return { data: { message: 'User deleted' } };
  },
  toggleStatus: async (id) => {
    await delay();
    const users = getStorageData('USERS');
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index !== -1) {
      users[index].status = users[index].status === 'active' ? 'inactive' : 'active';
      saveStorageData('USERS', users);
      const { password, ...userWithoutPassword } = users[index];
      return { data: userWithoutPassword };
    }
    throw new Error('User not found');
  },
  getUserStats: async (userId) => {
    await delay();
    const orders = getStorageData('ORDERS');
    const customers = getStorageData('CUSTOMERS');
    const payments = getStorageData('PAYMENTS');
    
    const user = JSON.parse(localStorage.getItem('boutique_current_user'));
    let userOrders = orders;
    let userCustomers = customers;
    
    if (user.role !== 'owner') {
      userOrders = orders.filter(o => o.assignedTo === user.name || o.createdBy === userId);
      userCustomers = customers.filter(c => c.createdBy === userId);
    }
    
    return {
      data: {
        totalOrders: userOrders.length,
        completedOrders: userOrders.filter(o => o.status === 'Delivered').length,
        pendingOrders: userOrders.filter(o => o.status !== 'Delivered').length,
        totalCustomers: userCustomers.length,
        totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      }
    };
  }
};

// Role Management APIs
export const roleAPI = {
  getAll: async () => {
    await delay();
    const roles = getStorageData('ROLES');
    return { data: { roles } };
  },
  getById: async (id) => {
    await delay();
    const roles = getStorageData('ROLES');
    const role = roles.find(r => r.id === parseInt(id));
    return { data: role };
  },
  create: async (data) => {
    await delay();
    const roles = getStorageData('ROLES');
    const newId = getNextId(roles);
    const roleName = (data.name || '').toLowerCase().replace(/\s+/g, '_');
    const newRole = {
      ...data,
      id: newId,
      name: roleName || `role_${newId}`,
      createdAt: new Date().toISOString()
    };
    roles.push(newRole);
    saveStorageData('ROLES', roles);
    return { data: newRole };
  },
  update: async (id, data) => {
    await delay();
    const roles = getStorageData('ROLES');
    const index = roles.findIndex(r => r.id === parseInt(id));
    if (index !== -1) {
      roles[index] = { ...roles[index], ...data };
      saveStorageData('ROLES', roles);
      return { data: roles[index] };
    }
    throw new Error('Role not found');
  },
  delete: async (id) => {
    await delay();
    const roles = getStorageData('ROLES');
    const filtered = roles.filter(r => r.id !== parseInt(id));
    saveStorageData('ROLES', filtered);
    return { data: { message: 'Role deleted' } };
  }
};
