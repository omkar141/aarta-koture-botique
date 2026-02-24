# Aarta Kouture - Boutique Management System

A comprehensive web-based management system for boutique owners to manage customers, orders, payments, inventory, and roles. Built with React and Tailwind CSS with frontend-only architecture using localStorage for data persistence.

**Current Version:** Frontend V1.0  
**Branch:** `Frontend-VersionV1.0`  
**Status:** ✅ Fully Functional and Production Ready

## Key Highlights

- 🚀 **Frontend-Only Architecture** - No backend required, uses localStorage for persistence
- 🎨 **Aarta Kouture Branding** - Custom brand colors, logo, and professional styling
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- 🔐 **Role-Based Access Control** - Admin, Staff, and Accountant roles with dynamic permissions
- 📊 **Complete CRUD Operations** - Customers, Orders, Payments, and Inventory management
- 🎯 **Advanced Order Management** - Status tracking, staff assignment, and interactive timeline
- 💾 **Data Persistence** - All data automatically saved to browser localStorage

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
- ✅ Create and manage orders with auto-generated IDs
- ✅ 6-status tracking: New → In Stitching → Trial Done → Alteration → Ready → Delivered
- ✅ Assign orders to staff members (dynamically from created roles)
- ✅ Interactive order timeline with status progression visualization
- ✅ Modal dialogs for status changes, staff assignment, and timeline viewing
- ✅ Add order notes, track dates (order, trial, delivery)

### Module 5: Payment Management
- ✅ Record payments with modes (Cash, UPI, Card)
- ✅ Auto-populate customer and amount from order selection
- ✅ Auto-calculate balance amount
- ✅ Track payment status (Pending, Partial, Completed)
- ✅ Preserve customer information in payment records
- ✅ Search and filter payments

### Module 6: Inventory Management
- ✅ Add inventory items with categories (Fabric, Lace, Button, Thread, Zipper, Other)
- ✅ Track quantity with low stock alerts
- ✅ Set minimum stock levels and item unit preferences
- ✅ Search and filter by name, category, and status
- ✅ Update quantities with real-time stock status

### Module 7: Access Control Management (Owner Only)
- ✅ Create custom roles with specific permissions
- ✅ Edit role descriptions and module access
- ✅ Cannot delete default roles
- ✅ Newly created roles available in order assignment dropdown

### Module 8: Profile Management
- ✅ View and edit user profile information
- ✅ Change password with validation
- ✅ View user-level statistics (orders, customers, revenue)
- ✅ Phone number and address management

## Tech Stack

### Frontend
- **React 18.2.0** - UI component framework
- **React Router v6** - Client-side routing with role-based access
- **Tailwind CSS 3.3.0** - Responsive utility-first styling
- **Context API** - State management (AuthContext)
- **localStorage API** - Data persistence layer

### Architecture
- **Frontend-Only** - No backend required for MVP
- **Mock Data API** - API layer using localStorage CRUD operations
- **Modal Components** - Reusable modal system for all forms and dialogs
- CSS Variables** - Dynamic theming support

## Installation & Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Frontend Setup (Frontend-Only Version)

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

The app comes with pre-configured demo users for testing. All passwords are: `password123`

| Email | Role | Password |
|-------|------|----------|
| admin@aarta.com | Admin (Owner) | password123 |
| staff@aarta.com | Staff | password123 |
| accountant@aarta.com | Accountant | password123 |

**Test Accounts:**
- Admin: Full access to all features including Access Control and Settings
- Staff: Can view/manage assigned orders and customers
- Accountant: Can manage payments and generate reports

## Data Persistence

All data is automatically saved to the browser's **localStorage**. This means:
- ✅ Data persists between browser sessions
- ✅ No backend server required
- ✅ Works offline
- ⚠️ Data is limited to one browser profile (not synced across devices)

To reset all data:
```javascript
// Clear localStorage (in browser console)
localStorage.clear();
location.reload();
```

## Features in Detail

### Order Management System
- **Create Orders:** Add new orders with customer selection, dress type, fabric, and dates
- **Status Tracking:** 6-step status progression with visual indicators
- **Staff Assignment:** Assign orders to staff via dynamic roles from Access Control
- **Interactive Timeline:** Visual timeline showing order progression through all statuses
- **Modal Dialogs:** 
  - Status Change Modal - Select new status with highlighted current status
  - Assign Staff Modal - Choose from dynamically loaded roles
  - Order Timeline Modal - Beautiful visual timeline with status dates
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
