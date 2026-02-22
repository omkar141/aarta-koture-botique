# Setup & Quick Start Guide

## Quick Start (5 Minutes)

### 1. Prerequisites
```bash
# Check Node.js installation
node --version  # Should be v14 or higher
npm --version   # Should be v6 or higher

# Install MongoDB (if using locally)
# Or create account at https://www.mongodb.com/cloud/atlas
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Update .env with MongoDB connection
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/boutique-app

# Start server
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
# Open new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Start frontend
npm start
# App opens at http://localhost:3000
```

### 4. Create First Admin User

Option A: Using Node.js script
```bash
# Create a script file: create-admin.js
const mongoose = require('mongoose');
const User = require('./server/src/models/User');

mongoose.connect('mongodb://localhost:27017/boutique-app');

const createAdmin = async () => {
  const admin = new User({
    userId: 'ADMIN-001',
    name: 'Administrator',
    email: 'admin@boutique.com',
    password: 'Admin@123',
    role: 'admin'
  });
  
  await admin.save();
  console.log('Admin created!');
  process.exit();
};

createAdmin();

# Run it
node create-admin.js
```

Option B: Using MongoDB Compass or MongoDB Atlas UI
1. Connect to MongoDB
2. Create document in Users collection with admin role
3. Password will be auto-hashed on first login attempt (requires code update)

### 5. Login Credentials

```
Email: admin@boutique.com
Password: Admin@123
Role: admin
```

## Folder Structure Overview

```
boutique-app/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # MongoDB connection
│   │   ├── models/                 # Database schemas
│   │   │   ├── User.js
│   │   │   ├── Customer.js
│   │   │   ├── Order.js
│   │   │   ├── Payment.js
│   │   │   ├── Inventory.js
│   │   │   └── Notification.js
│   │   ├── controllers/            # Business logic
│   │   │   ├── authController.js
│   │   │   ├── customerController.js
│   │   │   ├── orderController.js
│   │   │   ├── paymentController.js
│   │   │   ├── inventoryController.js
│   │   │   └── dashboardController.js
│   │   ├── routes/                 # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── customerRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   ├── inventoryRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication
│   │   └── index.js                # Express app setup
│   ├── .env                        # Environment variables
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js           # Main layout with sidebar
│   │   ├── pages/                  # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CustomerPage.js
│   │   │   ├── OrderPage.js
│   │   │   ├── PaymentPage.js
│   │   │   ├── InventoryPage.js
│   │   │   └── ReportsPage.js
│   │   ├── context/
│   │   │   └── AuthContext.js      # Auth state management
│   │   ├── services/
│   │   │   └── api.js              # API calls (axios)
│   │   ├── App.js                  # Main app with routing
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css               # Tailwind + custom styles
│   ├── public/
│   │   └── index.html
│   ├── tailwind.config.js          # Tailwind configuration
│   ├── postcss.config.js
│   └── package.json
│
└── README.md                       # Main documentation
   CSS_RESPONSIVE_GUIDE.md          # CSS & responsive design
```

## Environment Configuration

### Server (.env)
```env
# Server Port
PORT=5000

# Environment
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/boutique-app
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/boutique-app

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=24h
```

### Client (if needed)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running Both Servers Simultaneously

### Option 1: Two Terminal Windows
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

### Option 2: Using Concurrently (from root)
```bash
npm install --save-dev concurrently

# Add to root package.json scripts:
"scripts": {
  "dev": "concurrently \"cd server && npm run dev\" \"cd client && npm start\""
}

# Run both
npm run dev
```

## Database Setup

### Local MongoDB
```bash
# Install MongoDB Community Edition
# https://docs.mongodb.com/manual/installation/

# Start MongoDB service
mongod

# In another terminal, connect
mongo
```

### MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update MONGO_URI in .env

```
mongodb+srv://username:password@cluster.mongodb.net/boutique-app
```

## API Testing

### Using Postman
1. Download from https://www.postman.com/
2. Import collection (API endpoints provided below)
3. Set environment variables for auth token
4. Test endpoints

### Using cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@boutique.com","password":"Admin@123"}'

# Get customers (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/customers
```

## Basic API Endpoints

```
# AUTH
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
POST   /api/auth/logout

# CUSTOMERS
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
POST   /api/customers/:id/measurements

# ORDERS
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id
DELETE /api/orders/:id
PATCH  /api/orders/:id/status

# PAYMENTS
GET    /api/payments
GET    /api/payments/:id
POST   /api/payments
PUT    /api/payments/:id
DELETE /api/payments/:id

# INVENTORY
GET    /api/inventory
GET    /api/inventory/:id
POST   /api/inventory
PUT    /api/inventory/:id
DELETE /api/inventory/:id
PATCH  /api/inventory/:id/quantity

# DASHBOARD
GET    /api/dashboard/owner
GET    /api/dashboard/staff
GET    /api/dashboard/reports
```

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh  # Connect to local MongoDB
# or
# Check MongoDB Atlas connection string
```

### CORS Errors
- Ensure backend is running on port 5000
- Check `proxy` setting in client/package.json
- Verify CORS configuration in server/src/index.js

### Authentication Issues
- Clear localStorage in browser console: `localStorage.clear()`
- Check token in browser DevTools > Application > Local Storage
- Verify JWT_SECRET matches in .env

### React Port in Use
```bash
# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## Development Workflows

### Adding New Customer
1. Click "Add New Customer" button
2. Fill form (Name, Phone, Email, Address)
3. Click "Save Customer"
4. View in customer list
5. Add measurements if needed

### Creating an Order
1. Go to Orders
2. Click "Create New Order"
3. Select customer (dropdown)
4. Enter dress type and fabric type
5. Set trial and delivery dates
6. Click "Create Order"
7. Order appears in list

### Recording Payment
1. Go to Payments
2. Click "Record Payment"
3. Select order
4. Enter advance amount
5. Select payment mode (Cash/UPI/Card)
6. Click "Record Payment"

## Deployment Preparation

### Backend Deployment (Heroku)
```bash
# Create Heroku app
heroku create boutique-app

# Add Procfile
echo "web: node src/index.js" > Procfile

# Set environment variables
heroku config:set JWT_SECRET=production-secret
heroku config:set MONGO_URI=your-atlas-uri

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)
```bash
# Build for production
npm run build

# Deploy dist folder to Vercel or Netlify
# Update API URL to production backend
```

## Performance Optimization

1. **Database Indexing**
   - Customer: name, phone
   - Order: status, customerId
   - Payment: status, customerId

2. **API Optimization**
   - Use pagination for lists
   - Implement caching
   - Use GraphQL for better queries

3. **Frontend Optimization**
   - Code splitting with React.lazy
   - Image optimization
   - Bundle analysis

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS in production
- [ ] Add rate limiting
- [ ] Implement input validation
- [ ] Use environment variables
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Use CSRF protection

## Next Steps

1. ✅ Setup complete
2. Create admin user
3. Test login
4. Add sample customer
5. Create test order
6. Explore dashboard
7. Customize colors in Tailwind config
8. Add more features
9. Deploy to production
10. Monitor and maintain

---

**Need Help?** Check the main README.md or CSS_RESPONSIVE_GUIDE.md for more details.
