# Boutique Management System

A comprehensive web-based management system for boutique owners to manage customers, orders, payments, inventory, and deliveries.

## Features

### Module 1: User Login & Security
- Email + Password authentication
- Role-based access (Admin, Staff, Accountant)
- JWT-based token authentication
- Auto-logout after 15 minutes of inactivity
- Minimum 8-character password requirement

### Module 2: Dashboard
- **Owner Dashboard**: Total orders, pending orders, delivered orders, today's deliveries, monthly revenue, pending payments
- **Staff Dashboard**: Assigned orders, today's work, delivery reminders
- Real-time statistics and visual cards

### Module 3: Customer Management
- Add, edit, delete customers
- Store customer measurements (shoulder, bust, waist, hip, sleeve length, dress length)
- Search by name or phone number
- View customer order history
- Auto-generated Customer IDs

### Module 4: Order Management
- Create and manage orders
- Track order status (New, In Stitching, Trial Done, Alteration, Ready, Delivered)
- Assign orders to staff members
- Track order timeline with status changes
- Add order notes

### Module 5: Payment Management
- Record payments with modes (Cash, UPI, Card)
- Auto-calculate balance amount
- Track payment status (Pending, Partial, Completed)
- View pending payments report

### Module 6: Inventory Management
- Add inventory items with categories (Fabric, Lace, Button, Thread, Zipper)
- Track quantity and minimum stock levels
- Low stock alerts
- Search and filter inventory

### Module 7: Reports
- Monthly/Quarterly/Yearly revenue reports
- Pending payments report
- Delivery report
- Staff workload analysis
- Export to PDF and Excel (future phase)

### Module 8: Notifications
- Delivery reminders (1 day before)
- Trial date reminders
- Low stock alerts
- Pending payment reminders

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### Frontend
- **React 18** for UI
- **React Router v6** for navigation
- **Tailwind CSS** for responsive styling
- **Axios** for API calls
- **Context API** for state management

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/boutique-app
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=24h
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Default Login Credentials

You need to create an admin account. Run this setup script:

```javascript
// Connect to MongoDB and create first admin
const User = require('./server/src/models/User');
connectDB();
const adminUser = new User({
  userId: 'ADMIN-001',
  name: 'Administrator',
  email: 'admin@boutique.com',
  password: 'password123', // Change this
  role: 'admin'
});
await adminUser.save();
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/:id/measurements` - Add measurements

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Change order status
- `PATCH /api/orders/:id/assign` - Assign to staff
- `DELETE /api/orders/:id` - Delete order

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Record payment
- `GET /api/payments/:id` - Get payment details
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Inventory
- `GET /api/inventory` - Get all items
- `POST /api/inventory` - Create item
- `GET /api/inventory/low-stock` - Get low stock items
- `PATCH /api/inventory/:id/quantity` - Update quantity

### Dashboard
- `GET /api/dashboard/owner` - Owner dashboard stats
- `GET /api/dashboard/staff` - Staff dashboard
- `GET /api/dashboard/reports` - Generate reports

## Responsive Design

The application uses **Tailwind CSS** with:
- Mobile-first approach
- Responsive grid layouts
- Flexible navigation sidebar
- Touch-friendly buttons and inputs
- Optimized for screens 320px to 2560px

## CSS Best Practices Implemented

1. **Utility-First CSS**: Tailwind CSS for quick development
2. **Custom Components**: Reusable button and card classes
3. **Smooth Animations**: Fade-in effects and transitions
4. **Color Schemes**: Professional blues, greens, and reds
5. **Typography**: Clear hierarchy and readability
6. **Accessibility**: Proper contrast ratios and semantic HTML
7. **Performance**: Minimal CSS and optimized selectors

## Recommended CSS Resources

1. **Tailwind CSS Documentation**: https://tailwindcss.com/docs
2. **Tailwind UI Components**: https://tailwindui.com/
3. **Tailwind Color Palette**: https://tailwindcss.com/docs/customizing-colors
4. **CSS-Tricks**: https://css-tricks.com/
5. **MDN CSS Documentation**: https://developer.mozilla.org/en-US/docs/Web/CSS

## Project Structure

```
boutique-app/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Customer.js
│   │   │   ├── Order.js
│   │   │   ├── Payment.js
│   │   │   ├── Inventory.js
│   │   │   └── Notification.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.js
│   ├── .env
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CustomerPage.js
│   │   │   ├── OrderPage.js
│   │   │   ├── PaymentPage.js
│   │   │   ├── InventoryPage.js
│   │   │   └── ReportsPage.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── package.json (root)
```

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS**: Cross-origin resource sharing
- **Role-based Access** Control (RBAC)
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: MongoDB with mongoose

## Performance Optimizations

- Lazy loading of components
- API caching strategies
- Optimized database queries with indexing
- Responsive images
- CSS minification with Tailwind
- Bundle optimization

## Future Enhancements

- [ ] Email notifications
- [ ] SMS notifications
- [ ] PDF export functionality
- [ ] Excel export functionality
- [ ] Advanced reporting with charts
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSockets)
- [ ] Backup and restore functionality

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for commercial purposes

## Support

For issues or questions, please create an issue in the repository.

---

**Happy Coding! 🚀**
