import React, { useState, useEffect } from 'react';
import { orderAPI, customerAPI } from '../services/api';

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    dressType: '',
    fabricType: '',
    orderDate: new Date().toISOString().split('T')[0],
    trialDate: '',
    deliveryDate: '',
    status: 'New',
    notes: '',
    amount: ''
  });

  const dressTypes = ['Saree', 'Lehenga', 'Salwar', 'Gown', 'Blouse', 'Kurti', 'Dupatta', 'Other'];
  const fabricTypes = ['Cotton', 'Silk', 'Georgette', 'Chiffon', 'Satin', 'Net', 'Velvet', 'Linen', 'Wool', 'Polyester'];
  const statuses = ['New', 'In Stitching', 'Trial Done', 'Alteration', 'Ready', 'Delivered'];

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getAll();
      setOrders(response.data.orders || []);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customerId') {
      const customer = customers.find(c => c._id === value);
      setFormData(prev => ({
        ...prev,
        customerId: value,
        customerName: customer ? customer.name : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingId) {
        await orderAPI.update(editingId, formData);
        setSuccess('Order updated successfully!');
      } else {
        await orderAPI.create(formData);
        setSuccess('Order created successfully!');
      }
      resetForm();
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    setFormData({
      customerId: order.customerId,
      customerName: order.customerName,
      dressType: order.dressType,
      fabricType: order.fabricType,
      orderDate: order.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      trialDate: order.trialDate?.split('T')[0] || '',
      deliveryDate: order.deliveryDate?.split('T')[0] || '',
      status: order.status,
      notes: order.notes || '',
      amount: order.amount || ''
    });
    setEditingId(order._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      setLoading(true);
      try {
        await orderAPI.delete(id);
        setSuccess('Order deleted successfully!');
        fetchOrders();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete order');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await orderAPI.changeStatus(orderId, newStatus, '');
      setSuccess(`Order status changed to ${newStatus}`);
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      dressType: '',
      fabricType: '',
      orderDate: new Date().toISOString().split('T')[0],
      trialDate: '',
      deliveryDate: '',
      status: 'New',
      notes: '',
      amount: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       order.orderId?.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const getStatusBadgeClass = (status) => {
    const badgeClasses = {
      'New': 'badge-new',
      'In Stitching': 'badge-in-progress',
      'Trial Done': 'badge-pending',
      'Alteration': 'badge-pending',
      'Ready': 'badge-pending',
      'Delivered': 'badge-completed'
    };
    return badgeClasses[status] || 'badge-new';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); resetForm(); }}
            className="btn btn-primary"
          >
            + Create New Order
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-container fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingId ? 'Edit Order' : 'Create New Order'}
            </h2>
            <button onClick={resetForm} className="text-gray-600 text-2xl">×</button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Order Details Section */}
            <div className="form-section">
              <h3>Order Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer <span className="required">*</span></label>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Dress Type <span className="required">*</span></label>
                  <select
                    name="dressType"
                    value={formData.dressType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Dress Type</option>
                    {dressTypes.map(dt => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fabric Type <span className="required">*</span></label>
                  <select
                    name="fabricType"
                    value={formData.fabricType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Fabric Type</option>
                    {fabricTypes.map(ft => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Order Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="form-section">
              <h3>Important Dates</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Order Date</label>
                  <input
                    type="date"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Trial Date</label>
                  <input
                    type="date"
                    name="trialDate"
                    value={formData.trialDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Expected Delivery Date</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="form-section">
              <h3>Additional Information</h3>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Special instructions or notes..."
                  rows="3"
                />
              </div>
            </div>

            <div className="btn-container">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Order' : 'Create Order'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Filter */}
      <div className="bg-white rounded-lg p-4 shadow mb-6 overflow-x-auto">
        <div className="flex gap-2 flex-wrap">
          {['All', ...statuses].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn btn-small ${
                filterStatus === status 
                  ? 'btn-primary' 
                  : 'btn-secondary'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-box mb-6">
        <input
          type="text"
          placeholder="Search by customer name or order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Orders Table */}
      {loading && !showForm ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Dress Type</th>
                <th>Fabric</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Delivery Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order._id}>
                    <td><strong>{order.orderId || order._id.substring(0, 8)}</strong></td>
                    <td>{order.customerName}</td>
                    <td>{order.dressType}</td>
                    <td>{order.fabricType}</td>
                    <td>₹{order.amount || '0'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="btn btn-small btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="btn btn-small btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-600">
                    {searchTerm ? 'No orders found matching your search.' : 'No orders yet. Create one to get started!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
