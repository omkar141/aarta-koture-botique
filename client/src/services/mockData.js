// Mock Users
export const mockUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@boutique.com',
    password: 'admin123',
    phone: '+91 9876543210',
    address: '123 Admin Street, City',
    role: 'owner',
    roleId: 1,
    status: 'active',
    lastLogin: '2024-02-24T10:30:00',
    createdAt: '2024-01-01',
    createdBy: 1
  },
  {
    id: 2,
    name: 'Staff User',
    email: 'staff@boutique.com',
    password: 'staff123',
    phone: '+91 8765432109',
    address: '456 Staff Avenue, City',
    role: 'staff',
    roleId: 2,
    status: 'active',
    lastLogin: '2024-02-23T15:20:00',
    createdAt: '2024-01-15',
    createdBy: 1
  },
  {
    id: 3,
    name: 'Accountant User',
    email: 'accountant@boutique.com',
    password: 'accountant123',
    phone: '+91 7654321098',
    address: '789 Finance Road, City',
    role: 'accountant',
    roleId: 3,
    status: 'active',
    lastLogin: '2024-02-22T09:15:00',
    createdAt: '2024-02-01',
    createdBy: 1
  }
];

// Mock Roles
export const mockRoles = [
  {
    id: 1,
    name: 'owner',
    displayName: 'Owner',
    description: 'Full system access',
    permissions: ['all'],
    modules: ['dashboard', 'customers', 'orders', 'payments', 'inventory', 'reports', 'users', 'roles'],
    createdAt: '2024-01-01'
  },
  {
    id: 2,
    name: 'staff',
    displayName: 'Staff',
    description: 'Limited access to operations',
    permissions: ['read', 'create', 'update'],
    modules: ['dashboard', 'customers', 'orders', 'inventory'],
    createdAt: '2024-01-01'
  },
  {
    id: 3,
    name: 'accountant',
    displayName: 'Accountant',
    description: 'Financial management access',
    permissions: ['read', 'create', 'update'],
    modules: ['dashboard', 'payments', 'reports'],
    createdAt: '2024-01-01'
  }
];

// Mock Customers
export const mockCustomers = [
  {
    id: 1,
    customerId: 'CUST001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 9876543210',
    address: '123 Main St, City, State',
    dateAdded: '2024-01-15',
    measurements: {
      shoulder: 15.5,
      bust: 38,
      waist: 32,
      hip: 36,
      sleeveLength: 22,
      dressLength: 40,
      notes: 'Prefers slim fit'
    }
  },
  {
    id: 2,
    customerId: 'CUST002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+91 8765432109',
    address: '456 Oak Ave, City, State',
    dateAdded: '2024-01-20',
    measurements: {
      shoulder: 14,
      bust: 34,
      waist: 26,
      hip: 36,
      sleeveLength: 20,
      dressLength: 38,
      notes: 'Allergic to wool'
    }
  },
  {
    id: 3,
    customerId: 'CUST003',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+91 7654321098',
    address: '789 Pine Rd, City, State',
    dateAdded: '2024-02-01',
    measurements: {
      shoulder: 16,
      bust: 42,
      waist: 36,
      hip: 40,
      sleeveLength: 24,
      dressLength: 42,
      notes: 'Regular customer, prefers loose fit'
    }
  }
];

// Mock Orders
export const mockOrders = [
  {
    id: 1,
    orderId: 'ORD001',
    customerId: 1,
    customerName: 'John Doe',
    dressType: 'Suit',
    fabricType: 'Wool',
    orderDate: '2024-02-10',
    trialDate: '2024-02-25',
    deliveryDate: '2024-03-10',
    status: 'In Stitching',
    assignedTo: 'Tailor A',
    amount: 1200,
    notes: 'Navy blue suit with silk lining. Rush order for wedding.'
  },
  {
    id: 2,
    orderId: 'ORD002',
    customerId: 2,
    customerName: 'Jane Smith',
    dressType: 'Gown',
    fabricType: 'Satin',
    orderDate: '2024-02-15',
    trialDate: '2024-03-01',
    deliveryDate: '2024-03-20',
    status: 'New',
    assignedTo: '',
    amount: 800,
    notes: 'Red evening gown with sequins. Customer will provide fabric.'
  },
  {
    id: 3,
    orderId: 'ORD003',
    customerId: 3,
    customerName: 'Bob Johnson',
    dressType: 'Trouser',
    fabricType: 'Cotton',
    orderDate: '2024-01-25',
    trialDate: '2024-02-01',
    deliveryDate: '2024-02-05',
    status: 'Delivered',
    assignedTo: 'Tailor B',
    amount: 150,
    notes: 'Pants hemming and jacket fitting. Completed ahead of schedule.'
  },
  {
    id: 4,
    orderId: 'ORD004',
    customerId: 1,
    customerName: 'John Doe',
    dressType: 'Shirt',
    fabricType: 'Cotton',
    orderDate: '2024-02-18',
    trialDate: '2024-02-28',
    deliveryDate: '2024-03-05',
    status: 'Trial Done',
    assignedTo: 'Tailor C',
    amount: 350,
    notes: 'Custom fit formal shirt'
  }
];

// Mock Payments
export const mockPayments = [
  {
    id: 1,
    orderId: 1,
    customerId: 1,
    customerName: 'John Doe',
    amount: 600,
    paymentMethod: 'Credit Card',
    paymentDate: '2024-02-10',
    status: 'Completed',
    transactionId: 'TXN001',
    notes: 'Advance payment for suit'
  },
  {
    id: 2,
    orderId: 2,
    customerId: 2,
    customerName: 'Jane Smith',
    amount: 400,
    paymentMethod: 'Cash',
    paymentDate: '2024-02-15',
    status: 'Completed',
    transactionId: 'TXN002',
    notes: 'Advance payment'
  },
  {
    id: 3,
    orderId: 3,
    customerId: 3,
    customerName: 'Bob Johnson',
    amount: 150,
    paymentMethod: 'Debit Card',
    paymentDate: '2024-02-05',
    status: 'Completed',
    transactionId: 'TXN003',
    notes: 'Full payment for alterations'
  }
];

// Mock Inventory
export const mockInventory = [
  {
    id: 1,
    name: 'Premium Wool Fabric',
    category: 'Fabric',
    sku: 'FAB001',
    quantity: 50,
    unit: 'meters',
    minStockLevel: 20,
    unitPrice: 45,
    supplier: 'Fabric Wholesalers Inc',
    status: 'In Stock',
    lastRestocked: '2024-02-01',
    notes: 'Navy blue, suitable for suits'
  },
  {
    id: 2,
    name: 'Silk Thread',
    category: 'Supplies',
    sku: 'SUP001',
    quantity: 15,
    unit: 'spools',
    minStockLevel: 25,
    unitPrice: 8,
    supplier: 'Thread Masters',
    status: 'Low Stock',
    lastRestocked: '2024-01-15',
    notes: 'Various colors available'
  },
  {
    id: 3,
    name: 'Buttons (Gold)',
    category: 'Accessories',
    sku: 'ACC001',
    quantity: 200,
    unit: 'pieces',
    minStockLevel: 50,
    unitPrice: 2,
    supplier: 'Button Emporium',
    status: 'In Stock',
    lastRestocked: '2024-02-10',
    notes: 'Premium gold-plated buttons'
  },
  {
    id: 4,
    name: 'Zippers (Various)',
    category: 'Accessories',
    sku: 'ACC002',
    quantity: 8,
    unit: 'pieces',
    minStockLevel: 30,
    unitPrice: 5,
    supplier: 'Fastener Co',
    status: 'Low Stock',
    lastRestocked: '2024-01-20',
    notes: 'Assorted sizes and colors'
  },
  {
    id: 5,
    name: 'Cotton Lining',
    category: 'Fabric',
    sku: 'FAB002',
    quantity: 75,
    unit: 'meters',
    minStockLevel: 30,
    unitPrice: 15,
    supplier: 'Fabric Wholesalers Inc',
    status: 'In Stock',
    lastRestocked: '2024-02-05',
    notes: 'White and cream colors'
  }
];

// Mock Dashboard Data
export const mockDashboardData = {
  owner: {
    revenue: {
      today: 1250,
      thisWeek: 8500,
      thisMonth: 32000,
      thisYear: 285000
    },
    orders: {
      total: 156,
      pending: 23,
      inProgress: 18,
      completed: 115
    },
    customers: {
      total: 87,
      new: 12,
      active: 45
    },
    payments: {
      pending: 15800,
      overdue: 3200,
      received: 285000
    },
    recentOrders: mockOrders.slice(0, 5),
    lowStockItems: mockInventory.filter(item => item.status === 'Low Stock'),
    upcomingDueDates: mockOrders.filter(order => order.status !== 'Completed').slice(0, 5),
    revenueChart: [
      { month: 'Jan', revenue: 28000 },
      { month: 'Feb', revenue: 32000 },
      { month: 'Mar', revenue: 29500 },
      { month: 'Apr', revenue: 35000 },
      { month: 'May', revenue: 31000 },
      { month: 'Jun', revenue: 34500 }
    ],
    orderStatusChart: [
      { name: 'Pending', value: 23 },
      { name: 'In Progress', value: 18 },
      { name: 'Completed', value: 115 }
    ]
  },
  staff: {
    myOrders: mockOrders.filter(order => order.assignedTo === 'Tailor A'),
    pending: 5,
    inProgress: 3,
    completed: 42,
    upcomingDueDates: mockOrders.filter(order => order.assignedTo === 'Tailor A' && order.status !== 'Completed')
  }
};

// Local storage keys
const STORAGE_KEYS = {
  CUSTOMERS: 'boutique_customers',
  ORDERS: 'boutique_orders',
  PAYMENTS: 'boutique_payments',
  INVENTORY: 'boutique_inventory',
  USERS: 'boutique_users',
  ROLES: 'boutique_roles',
  CURRENT_USER: 'boutique_current_user'
};

// Initialize local storage with mock data
export const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mockCustomers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mockOrders));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(mockPayments));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(mockInventory));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ROLES)) {
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(mockRoles));
  }
};

// Get data from local storage
export const getStorageData = (key) => {
  const data = localStorage.getItem(STORAGE_KEYS[key]);
  return data ? JSON.parse(data) : [];
};

// Save data to local storage
export const saveStorageData = (key, data) => {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
};

// Get next ID
export const getNextId = (data) => {
  return data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
};

// Simulate async delay
export const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));
