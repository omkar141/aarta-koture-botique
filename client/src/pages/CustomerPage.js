import React, { useState, useEffect } from 'react';
import { customerAPI } from '../services/api';
import Modal from '../components/Modal';

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    dateAdded: new Date().toISOString().split('T')[0],
    measurements: {
      shoulder: '',
      bust: '',
      waist: '',
      hip: '',
      sleeveLength: '',
      dressLength: '',
      notes: ''
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingOrders, setViewingOrders] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.customers || []);
    } catch (err) {
      setError('Failed to load customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMeasurementChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const dataToSend = { ...formData };
      if (editingId) {
        await customerAPI.update(editingId, dataToSend);
        setSuccess('Customer updated successfully!');
      } else {
        await customerAPI.create(dataToSend);
        setSuccess('Customer added successfully!');
      }
      resetForm();
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrders = async (customerId) => {
    setLoading(true);
    try {
      const response = await customerAPI.getOrders(customerId);
      setCustomerOrders(response.data);
      setViewingOrders(customerId);
    } catch (err) {
      setError('Failed to load customer orders');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      customerId: customer.customerId || customer._id || customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      dateAdded: customer.dateAdded?.split('T')[0] || new Date().toISOString().split('T')[0],
      measurements: customer.measurements || {
        shoulder: '',
        bust: '',
        waist: '',
        hip: '',
        sleeveLength: '',
        dressLength: '',
        notes: ''
      }
    });
    setEditingId(customer._id || customer.id);
    setShowForm(true);
    setViewingOrders(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setLoading(true);
      try {
        await customerAPI.delete(id);
        setSuccess('Customer deleted successfully!');
        fetchCustomers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete customer');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      dateAdded: new Date().toISOString().split('T')[0],
      measurements: {
        shoulder: '',
        bust: '',
        waist: '',
        hip: '',
        sleeveLength: '',
        dressLength: '',
        notes: ''
      }
    });
    setEditingId(null);
    setShowForm(false);
    setViewingOrders(null);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.customerId && c.customerId.toString().includes(searchTerm)) ||
    (c.id && c.id.toString().includes(searchTerm))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn btn-primary"
          >
            + Add New Customer
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingId ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              {editingId && (
                <div className="form-group">
                  <label>Customer ID</label>
                  <input
                    type="text"
                    value={formData.customerId || editingId}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXXXXXXX"
                  pattern="^(\+91[\s]?)?[0-9]{10}$"
                  title="Please enter a valid phone number with +91"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Full Address"
                />
              </div>

              <div className="form-group">
                <label>Date Added</label>
                <input
                  type="date"
                  name="dateAdded"
                  value={formData.dateAdded}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Measurements Section */}
          <div className="form-section">
            <h3>Measurements (in cm)</h3>
            <div className="form-grid">
              {['shoulder', 'bust', 'waist', 'hip', 'sleeveLength', 'dressLength'].map(field => (
                <div key={field} className="form-group">
                  <label>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type="number"
                    name={field}
                    value={formData.measurements[field]}
                    onChange={handleMeasurementChange}
                    placeholder="0"
                    step="0.1"
                  />
                </div>
              ))}
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.measurements.notes}
                onChange={handleMeasurementChange}
                placeholder="Any special notes about measurements..."
                rows="3"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="btn-container">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : editingId ? 'Update Customer' : 'Add Customer'}
            </button>
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* View Orders Modal */}
      <Modal
        isOpen={viewingOrders !== null}
        onClose={() => setViewingOrders(null)}
        title="Customer Orders"
        size="lg"
      >
        {customerOrders && customerOrders.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Dress Type</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {customerOrders.map(order => (
                  <tr key={order._id || order.id}>
                    <td><strong>{order.orderId || order.id}</strong></td>
                    <td>{order.dressType || order.orderType}</td>
                    <td>
                      <span className="badge badge-primary">{order.status}</span>
                    </td>
                    <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}</td>
                    <td>{order.deliveryDate || order.dueDate ? new Date(order.deliveryDate || order.dueDate).toLocaleDateString() : '-'}</td>
                    <td>₹{order.amount || order.totalAmount || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">No orders found for this customer.</p>
        )}
        <div className="btn-container mt-6">
          <button onClick={() => setViewingOrders(null)} className="btn btn-secondary">
            Close
          </button>
        </div>
      </Modal>

      {/* Search Bar */}
      <div className="search-box mb-6">
        <input
          type="text"
          placeholder="Search by Customer ID, name, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Customers Table */}
      {loading && !showForm ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading customers...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <tr key={customer._id || customer.id}>
                    <td><strong>{customer.customerId || customer.id}</strong></td>
                    <td><strong>{customer.name}</strong></td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.address || '-'}</td>
                    <td>{new Date(customer.dateAdded || customer.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="btn btn-small btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleViewOrders(customer._id || customer.id)}
                          className="btn btn-small btn-warning"
                        >
                          View Orders
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id || customer.id)}
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
                  <td colSpan="7" className="text-center py-4 text-gray-600">
                    {searchTerm ? 'No customers found matching your search.' : 'No customers yet. Add one to get started!'}
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

export default CustomerPage;
