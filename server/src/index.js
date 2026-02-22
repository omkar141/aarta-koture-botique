const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting server...');
console.log('PORT=', PORT);

// Connect to MongoDB
connectDB();

console.log('Database configured');

// Middleware
app.use(cors());
app.use(express.json());

console.log('Middleware configured');

// Routes
console.log('Loading routes...');
app.use('/api/auth', require('./routes/authRoutes'));
console.log('Auth routes loaded');
app.use('/api/customers', require('./routes/customerRoutes'));
console.log('Customer routes loaded');
app.use('/api/orders', require('./routes/orderRoutes'));
console.log('Order routes loaded');
app.use('/api/payments', require('./routes/paymentRoutes'));
console.log('Payment routes loaded');
app.use('/api/inventory', require('./routes/inventoryRoutes'));
console.log('Inventory routes loaded');
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
console.log('Dashboard routes loaded');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
