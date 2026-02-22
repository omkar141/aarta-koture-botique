// Mock in-memory user storage for development without MongoDB
const bcrypt = require('bcryptjs');

// Default test user
const defaultHashedPassword = bcrypt.hashSync('password123', 10);

const mockUsers = [
  {
    _id: '1',
    userId: 'USER-admin001',
    name: 'Admin User',
    email: 'admin@boutique.com',
    password: defaultHashedPassword,
    phone: '1234567890',
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
    lastLogin: new Date()
  }
];

// Mock Customers
const mockCustomers = [
  {
    _id: '1',
    customerId: 'CUST-001',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@example.com',
    address: '123 Main Street, New Delhi',
    measurements: [
      {
        shoulder: 40,
        bust: 36,
        waist: 32,
        hip: 38,
        sleeveLength: 25,
        dressLength: 42,
        notes: 'Regular fit',
        recordedAt: new Date()
      }
    ],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    _id: '2',
    customerId: 'CUST-002',
    name: 'Priya Singh',
    phone: '9876543211',
    email: 'priya@example.com',
    address: '456 Park Avenue, Mumbai',
    measurements: [
      {
        shoulder: 35,
        bust: 32,
        waist: 28,
        hip: 34,
        sleeveLength: 22,
        dressLength: 38,
        notes: 'Slim fit',
        recordedAt: new Date()
      }
    ],
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-20')
  },
  {
    _id: '3',
    customerId: 'CUST-003',
    name: 'Amit Patel',
    phone: '9876543212',
    email: 'amit@example.com',
    address: '789 Garden Road, Bangalore',
    measurements: [],
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01')
  },
  {
    _id: '4',
    customerId: 'CUST-004',
    name: 'Neha Sharma',
    phone: '9876543213',
    email: 'neha@example.com',
    address: '321 Ocean View, Chennai',
    measurements: [
      {
        shoulder: 38,
        bust: 34,
        waist: 30,
        hip: 36,
        sleeveLength: 23,
        dressLength: 40,
        notes: 'Wedding collection',
        recordedAt: new Date()
      }
    ],
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2025-02-10')
  },
  {
    _id: '5',
    customerId: 'CUST-005',
    name: 'Vikram Singh',
    phone: '9876543214',
    email: 'vikram@example.com',
    address: '654 River Walk, Kolkata',
    measurements: [],
    createdAt: new Date('2025-02-15'),
    updatedAt: new Date('2025-02-15')
  }
];

// Mock Orders
const mockOrders = [
  {
    _id: '1',
    orderId: 'ORD-001',
    customerId: '1',
    customerName: 'Rajesh Kumar',
    garmentType: 'Suit',
    color: 'Black',
    status: 'In Stitching',
    description: 'Formal suit with lining',
    orderDate: new Date('2025-02-01'),
    dueDate: new Date('2025-02-15'),
    totalAmount: 5000,
    advanceAmount: 2500,
    staffAssignedTo: 'Staff Member 1',
    notes: 'Premium fabric',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-05')
  },
  {
    _id: '2',
    orderId: 'ORD-002',
    customerId: '2',
    customerName: 'Priya Singh',
    garmentType: 'Lehenga',
    color: 'Red',
    status: 'Delivered',
    description: 'Wedding lehenga with embroidery',
    orderDate: new Date('2025-01-20'),
    dueDate: new Date('2025-02-10'),
    totalAmount: 15000,
    advanceAmount: 7500,
    staffAssignedTo: 'Staff Member 2',
    notes: 'Rush order completed',
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-02-10')
  },
  {
    _id: '3',
    orderId: 'ORD-003',
    customerId: '1',
    customerName: 'Rajesh Kumar',
    garmentType: 'Shirt',
    color: 'Blue',
    status: 'Trial Done',
    description: 'Casual shirt',
    orderDate: new Date('2025-02-05'),
    dueDate: new Date('2025-02-20'),
    totalAmount: 2000,
    advanceAmount: 1000,
    staffAssignedTo: 'Staff Member 1',
    notes: 'Waiting for customer feedback',
    createdAt: new Date('2025-02-05'),
    updatedAt: new Date('2025-02-12')
  },
  {
    _id: '4',
    orderId: 'ORD-004',
    customerId: '4',
    customerName: 'Neha Sharma',
    garmentType: 'Saree Blouse',
    color: 'Gold',
    status: 'New',
    description: 'Embroidered blouse for saree',
    orderDate: new Date('2025-02-18'),
    dueDate: new Date('2025-03-05'),
    totalAmount: 3500,
    advanceAmount: 1750,
    staffAssignedTo: null,
    notes: 'Standard embroidery',
    createdAt: new Date('2025-02-18'),
    updatedAt: new Date('2025-02-18')
  },
  {
    _id: '5',
    orderId: 'ORD-005',
    customerId: '3',
    customerName: 'Amit Patel',
    garmentType: 'Kurta',
    color: 'White',
    status: 'Alteration',
    description: 'Traditional kurta',
    orderDate: new Date('2025-02-10'),
    dueDate: new Date('2025-02-25'),
    totalAmount: 2500,
    advanceAmount: 1250,
    staffAssignedTo: 'Staff Member 3',
    notes: 'Length alteration needed',
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2025-02-17')
  }
];

// Mock Payments
const mockPayments = [
  {
    _id: '1',
    paymentId: 'PAY-001',
    orderId: 'ORD-001',
    customerId: '1',
    customerName: 'Rajesh Kumar',
    amount: 2500,
    paymentDate: new Date('2025-02-01'),
    paymentMethod: 'Cash',
    status: 'Completed',
    notes: 'Advance payment',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01')
  },
  {
    _id: '2',
    paymentId: 'PAY-002',
    orderId: 'ORD-002',
    customerId: '2',
    customerName: 'Priya Singh',
    amount: 15000,
    paymentDate: new Date('2025-02-10'),
    paymentMethod: 'Card',
    status: 'Completed',
    notes: 'Full payment',
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2025-02-10')
  },
  {
    _id: '3',
    paymentId: 'PAY-003',
    orderId: 'ORD-001',
    customerId: '1',
    customerName: 'Rajesh Kumar',
    amount: 2500,
    paymentDate: null,
    paymentMethod: null,
    status: 'Pending',
    notes: 'Balance payment due',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01')
  },
  {
    _id: '4',
    paymentId: 'PAY-004',
    orderId: 'ORD-003',
    customerId: '1',
    customerName: 'Rajesh Kumar',
    amount: 1000,
    paymentDate: new Date('2025-02-05'),
    paymentMethod: 'UPI',
    status: 'Completed',
    notes: 'Advance payment',
    createdAt: new Date('2025-02-05'),
    updatedAt: new Date('2025-02-05')
  },
  {
    _id: '5',
    paymentId: 'PAY-005',
    orderId: 'ORD-004',
    customerId: '4',
    customerName: 'Neha Sharma',
    amount: 1750,
    paymentDate: new Date('2025-02-18'),
    paymentMethod: 'Cash',
    status: 'Completed',
    notes: 'Advance payment',
    createdAt: new Date('2025-02-18'),
    updatedAt: new Date('2025-02-18')
  }
];

// Mock Inventory
const mockInventory = [
  {
    _id: '1',
    itemId: 'INV-001',
    itemName: 'Premium Silk Fabric',
    category: 'Fabric',
    quantity: 50,
    minStock: 10,
    supplierName: 'Textile Imports Ltd',
    purchaseCost: 500,
    status: 'In Stock',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-02-18')
  },
  {
    _id: '2',
    itemId: 'INV-002',
    itemName: 'Golden Lace',
    category: 'Lace',
    quantity: 5,
    minStock: 10,
    supplierName: 'Lace Traders',
    purchaseCost: 200,
    status: 'Low Stock',
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-02-10')
  },
  {
    _id: '3',
    itemId: 'INV-003',
    itemName: 'Black Buttons',
    category: 'Button',
    quantity: 200,
    minStock: 50,
    supplierName: 'Button Warehouse',
    purchaseCost: 10,
    status: 'In Stock',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-02-12')
  },
  {
    _id: '4',
    itemId: 'INV-004',
    itemName: 'White Cotton Thread',
    category: 'Thread',
    quantity: 0,
    minStock: 20,
    supplierName: 'Thread Mills',
    purchaseCost: 50,
    status: 'Out of Stock',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-02-08')
  },
  {
    _id: '5',
    itemId: 'INV-005',
    itemName: 'Metal Zippers',
    category: 'Zipper',
    quantity: 80,
    minStock: 25,
    supplierName: 'Zip Factory',
    purchaseCost: 30,
    status: 'In Stock',
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-02-15')
  }
];

const mockDatabase = {
  users: mockUsers,
  customers: mockCustomers,
  orders: mockOrders,
  payments: mockPayments,
  inventory: mockInventory
};

// Mock User model
class MockUser {
  static async findOne(query) {
    return mockDatabase.users.find(user => {
      if (query.email) return user.email === query.email;
      if (query._id) return user._id === query._id;
      return false;
    });
  }

  static async findById(id) {
    return mockDatabase.users.find(user => user._id === id);
  }

  static async create(userData) {
    const newUser = {
      _id: Date.now().toString(),
      ...userData,
      password: bcrypt.hashSync(userData.password, 10),
      createdAt: new Date(),
      status: 'active'
    };
    mockDatabase.users.push(newUser);
    return newUser;
  }

  static async save(userData) {
    const index = mockDatabase.users.findIndex(u => u._id === userData._id);
    if (index > -1) {
      mockDatabase.users[index] = userData;
    }
    return userData;
  }

  comparePassword(password) {
    return bcrypt.compareSync(password, this.password);
  }
}

// Add comparePassword and save to user instances
mockDatabase.users.forEach(user => {
  user.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };
  user.save = async function() {
    return MockUser.save(this);
  };
});

module.exports = {
  MockUser,
  mockDatabase
};
