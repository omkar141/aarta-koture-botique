# Boutique App - Quick Start Commands & Cheat Sheet

## 🚀 One-Line Quick Start

### Start Both Frontend and Backend (from root folder)
```bash
# Terminal 1 - Backend
cd server && npm install && npm run dev

# Terminal 2 - Frontend  
cd client && npm install && npm start
```

Backend URL: `http://localhost:5000`
Frontend URL: `http://localhost:3000`

---

## 📋 Essential Commands

### Backend Commands
```bash
cd server

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Check server health
curl http://localhost:5000/api/health
```

### Frontend Commands
```bash
cd client

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject (NOT recommended)
npm eject
```

---

## 🔑 Default Login Credentials

```
Email: admin@boutique.com
Password: Admin@123
```

**Note**: You need to create this user in MongoDB first (see SETUP_GUIDE.md)

---

## 📝 Important Files to Remember

### Backend
- `server/.env` - Environment variables
- `server/src/index.js` - Server entry point
- `server/src/models/` - Database schemas
- `server/src/routes/` - API endpoints
- `server/src/controllers/` - Business logic

### Frontend
- `client/src/App.js` - Main React app
- `client/src/pages/` - Page components
- `client/src/services/api.js` - API calls
- `client/src/context/AuthContext.js` - Auth state
- `client/tailwind.config.js` - Tailwind configuration

---

## 🔗 API Endpoint Quick Reference

### Authentication
```
POST   /api/auth/login          # Login user
POST   /api/auth/register        # Create staff (admin only)
GET    /api/auth/me              # Get current user
POST   /api/auth/logout          # Logout
```

### Customers
```
GET    /api/customers            # List all customers
GET    /api/customers/:id        # Get customer details
POST   /api/customers            # Create new customer
PUT    /api/customers/:id        # Update customer
DELETE /api/customers/:id        # Delete customer
POST   /api/customers/:id/measurements  # Add measurement
GET    /api/customers/:id/orders # Get customer orders
```

### Orders
```
GET    /api/orders               # List all orders
GET    /api/orders/:id           # Get order details
POST   /api/orders               # Create new order
PUT    /api/orders/:id           # Update order
PATCH  /api/orders/:id/status    # Change status
PATCH  /api/orders/:id/assign    # Assign to staff
DELETE /api/orders/:id           # Delete order
```

### Payments
```
GET    /api/payments             # List all payments
GET    /api/payments/:id         # Get payment details
POST   /api/payments             # Record payment
PUT    /api/payments/:id         # Update payment
DELETE /api/payments/:id         # Delete payment
```

### Inventory
```
GET    /api/inventory            # List all items
GET    /api/inventory/:id        # Get item details
POST   /api/inventory            # Create new item
PUT    /api/inventory/:id        # Update item
PATCH  /api/inventory/:id/quantity # Update quantity
DELETE /api/inventory/:id        # Delete item
GET    /api/inventory/low-stock  # Get low stock items
```

### Dashboard
```
GET    /api/dashboard/owner      # Owner dashboard stats
GET    /api/dashboard/staff      # Staff dashboard
GET    /api/dashboard/reports    # Generate reports
```

---

## 🐛 Troubleshooting Quick Fixes

### Backend Issues

**Error: Port 5000 already in use**
```bash
# Find and kill process
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or change PORT in .env
PORT=5001
```

**Error: Cannot connect to MongoDB**
```bash
# Check MongoDB is running
mongosh

# Or update .env with correct URI
MONGO_URI=mongodb://localhost:27017/boutique-app
```

**Error: Module not found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Frontend Issues

**Error: Port 3000 already in use**
```bash
# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or run on different port
PORT=3001 npm start
```

**Error: Cannot connect to backend API**
```bash
# Ensure backend is running on port 5000
# Check CORS proxy in package.json: "proxy": "http://localhost:5000"
# Clear browser cache and try again
```

**Error: Login not working**
```bash
# Clear localStorage
localStorage.clear()

# Check if admin user exists in MongoDB
# Verify password hashing is working
```

### Network Issues

**CORS Error**
```javascript
// Backend issue - check src/index.js
app.use(cors()); // Should be enabled

// Frontend issue - check package.json has proxy
"proxy": "http://localhost:5000"
```

**Authentication Error**
```bash
# Check token in browser
# DevTools > Application > Local Storage > token

# If token expired, login again
# Token expires in 24 hours (set in JWT_EXPIRE)
```

---

## 📲 Testing the App

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@boutique.com","password":"Admin@123"}'
```

### Test API with Token
```bash
# Copy token from login response
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/customers
```

### Test Customer Creation
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "phone": "+919876543210",
    "email": "rajesh@email.com",
    "address": "123 Main St, City"
  }'
```

---

## 🛠️ Development Tips

### Hot Reload
```bash
# Backend has hot reload with:
npm run dev  # Uses --watch flag

# Frontend has hot reload by default
npm start
```

### Debugging

**Backend (Node.js)**
```bash
# Start with debugger
node --inspect src/index.js

# Open chrome://inspect in Chrome
```

**Frontend (React)**
```bash
# Use React Developer Tools extension
# DevTools > Components tab to inspect state
```

### Testing API Integration

**Using Postman**
1. Import endpoints manually or use collection
2. Set Bearer token in Authorization
3. Test each endpoint

**Using Thunder Client (VS Code)**
1. Install extension
2. Copy endpoint URLs
3. Add Bearer token
4. Test

---

## 📦 Available npm Scripts

### Server
```bash
npm run dev    # Start with auto-reload
npm start      # Start production
npm test       # Run tests (if added)
```

### Client
```bash
npm start      # Start development
npm build      # Build for production
npm test       # Run tests
npm eject      # Eject (not recommended)
```

---

## 🎨 Customization Quick Guide

### Change Primary Color
Edit `client/tailwind.config.js`:
```javascript
colors: {
  primary: '#YOUR_COLOR_CODE',  // Change this
}
```

### Add New Menu Item
Edit `client/src/components/Layout.js`:
```javascript
const menuItems = [
  { name: 'Dashboard', path: '/', icon: '📊' },
  { name: 'Your New Item', path: '/your-path', icon: '🎯' },  // Add here
];
```

### Create New Page
```javascript
// Create client/src/pages/YourPage.js
import React from 'react';

const YourPage = () => {
  return <div className="p-6">Your content here</div>;
};

export default YourPage;

// Add route in App.js
<Route path="/your-path" element={<YourPage />} />
```

---

## 📊 Database Quick Reference

### Collections Created Automatically
- `users` - User accounts
- `customers` - Customer data
- `orders` - Order information
- `payments` - Payment records
- `inventories` - Inventory items
- `notifications` - Notifications

### Check MongoDB
```bash
# Connect to local MongoDB
mongosh

# Show all collections
show collections

# Count documents
db.users.countDocuments()

# View documents
db.customers.find().pretty()
```

---

## 🚀 Deployment Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected successfully
- [ ] Can login with admin credentials
- [ ] Can create customer
- [ ] Can create order
- [ ] Can record payment
- [ ] Dashboard shows correct stats
- [ ] Responsive design works on mobile
- [ ] All API endpoints tested

---

## 📞 Emergency Fixes

**Everything broken?**
```bash
# Complete reset
cd server
rm -rf node_modules package-lock.json
npm install
npm run dev

# In another terminal
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

**Database corrupted?**
```bash
# Delete and recreate
# Connect to MongoDB
mongosh
# drop database
db.dropDatabase()

# Restart application - collections recreate automatically
```

---

## 💡 Pro Tips

1. **Use Postman** for API testing - saves time
2. **Use VS Code** - Built-in terminal is convenient
3. **Keep .env safe** - Never commit to GitHub
4. **Test on mobile** - Use Chrome DevTools device emulation
5. **Check console** - Browser console shows API errors
6. **Monitor data** - Use MongoDB Compass for database inspection

---

## 📚 Next Steps After Running

1. Create admin account
2. Login to application
3. Add a test customer
4. Create an order for customer
5. Record a payment
6. Check dashboard stats
7. Explore all pages
8. Test on mobile view
9. Customize colors
10. Deploy to production

---

**Happy Coding! 🎉**

For detailed information, see:
- README.md - Full documentation
- SETUP_GUIDE.md - Installation guide
- CSS_RESPONSIVE_GUIDE.md - Design guide
