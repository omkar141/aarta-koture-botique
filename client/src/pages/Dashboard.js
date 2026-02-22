import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerAPI, orderAPI, paymentAPI, inventoryAPI } from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, paymentsRes, customersRes, inventoryRes] = await Promise.all([
        orderAPI.getAll(),
        paymentAPI.getAll(),
        customerAPI.getAll(),
        inventoryAPI.getAll()
      ]);

      setOrders(ordersRes.data.orders || []);
      setPayments(paymentsRes.data.payments || []);
      setCustomers(customersRes.data.customers || []);
      setInventory(inventoryRes.data.inventory || []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Chart Colors
  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a'];

  // Calculate Statistics
  const stats = {
    totalCustomers: customers.length,
    totalOrders: orders.length,
    totalRevenue: payments.reduce((sum, p) => sum + (parseFloat(p.advancePaid) || 0), 0),
    pendingAmount: payments.reduce((sum, p) => sum + (parseFloat(p.balanceAmount) || 0), 0),
    lowStockItems: inventory.filter(i => parseFloat(i.quantity) <= parseFloat(i.minStock)).length,
    outOfStockItems: inventory.filter(i => parseFloat(i.quantity) === 0).length,
  };

  // Order Status Data for Pie Chart
  const orderStatusData = [
    { name: 'New', value: orders.filter(o => o.status === 'New').length },
    { name: 'In Stitching', value: orders.filter(o => o.status === 'In Stitching').length },
    { name: 'Trial Done', value: orders.filter(o => o.status === 'Trial Done').length },
    { name: 'Alteration', value: orders.filter(o => o.status === 'Alteration').length },
    { name: 'Ready', value: orders.filter(o => o.status === 'Ready').length },
    { name: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length }
  ].filter(item => item.value > 0);

  // Payment Status Data
  const paymentStatusData = [
    { name: 'Pending', value: payments.filter(p => parseFloat(p.balanceAmount) === parseFloat(p.totalAmount)).length },
    { name: 'Partial', value: payments.filter(p => parseFloat(p.balanceAmount) > 0 && parseFloat(p.balanceAmount) !== parseFloat(p.totalAmount)).length },
    { name: 'Completed', value: payments.filter(p => parseFloat(p.balanceAmount) <= 0).length }
  ];

  // Dress Type Distribution
  const dressTypeData = {};
  orders.forEach(order => {
    dressTypeData[order.dressType] = (dressTypeData[order.dressType] || 0) + 1;
  });
  const dressTypeChartData = Object.keys(dressTypeData).map(type => ({
    name: type,
    orders: dressTypeData[type]
  })).sort((a, b) => b.orders - a.orders).slice(0, 6);

  // Top Customers
  const customerOrderCount = {};
  orders.forEach(order => {
    customerOrderCount[order.customerName] = (customerOrderCount[order.customerName] || 0) + 1;
  });
  const topCustomers = Object.keys(customerOrderCount)
    .map(name => ({ name, orders: customerOrderCount[name] }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  // Inventory Status
  const inventoryStatusData = [
    { name: 'In Stock', value: inventory.filter(i => parseFloat(i.quantity) > parseFloat(i.minStock)).length },
    { name: 'Low Stock', value: inventory.filter(i => parseFloat(i.quantity) <= parseFloat(i.minStock) && parseFloat(i.quantity) > 0).length },
    { name: 'Out of Stock', value: inventory.filter(i => parseFloat(i.quantity) === 0).length }
  ];

  if (loading) {
    return <div className="text-center py-8"><p className="text-gray-600">Loading dashboard...</p></div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalCustomers}</p>
          <p className="text-xs text-gray-500 mt-2">Active customers</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalOrders}</p>
          <p className="text-xs text-gray-500 mt-2">All orders</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">₹{stats.totalRevenue.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-2">Amount received</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Pending Amount</h3>
          <p className="text-3xl font-bold text-red-600">₹{stats.pendingAmount.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-2">Outstanding</p>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Low Stock Items</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.lowStockItems}</p>
          <p className="text-xs text-gray-500 mt-2">Need replenishment</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Out of Stock</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.outOfStockItems}</p>
          <p className="text-xs text-gray-500 mt-2">Unavailable</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Inventory</h3>
          <p className="text-3xl font-bold text-gray-800">{inventory.length}</p>
          <p className="text-xs text-gray-500 mt-2">Items in stock</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Order Status Distribution</h2>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-center py-8">No orders yet</p>
          )}
        </div>

        {/* Payment Status Distribution */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dress Type Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top Dress Types Ordered</h2>
          {dressTypeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dressTypeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#667eea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-center py-8">No order data</p>
          )}
        </div>

        {/* Inventory Status */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Inventory Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#764ba2" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top 5 Customers</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCustomers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#43e97b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
