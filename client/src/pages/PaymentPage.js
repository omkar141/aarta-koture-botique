import React, { useState, useEffect } from 'react';
import { paymentAPI, orderAPI, customerAPI } from '../services/api';

const PaymentPage = () => {
  const [payments, setPayments] = useState([]);
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
    orderId: '',
    customerName: '',
    totalAmount: '',
    advancePaid: '',
    balanceAmount: '',
    paymentMode: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const paymentModes = ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'];

  useEffect(() => {
    fetchPayments();
    fetchOrders();
    fetchCustomers();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await paymentAPI.getAll();
      setPayments(response.data.payments || []);
    } catch (err) {
      setError('Failed to load payments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
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
    
    if (name === 'orderId') {
      const order = orders.find(o => o._id === value);
      setFormData(prev => ({
        ...prev,
        orderId: value,
        customerName: order ? order.customerName : '',
        totalAmount: order ? order.amount || '' : '',
        balanceAmount: order && prev.advancePaid 
          ? (order.amount || 0) - parseFloat(prev.advancePaid || 0)
          : order ? order.amount || '' : ''
      }));
    } else if (name === 'advancePaid') {
      const totalAmount = parseFloat(formData.totalAmount || 0);
      const advancePaid = parseFloat(value || 0);
      const balance = totalAmount - advancePaid;
      setFormData(prev => ({
        ...prev,
        advancePaid: value,
        balanceAmount: balance > 0 ? balance.toFixed(2) : '0.00'
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.orderId || !formData.advancePaid) {
      setError('Please select an order and enter amount paid');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        advancePaid: parseFloat(formData.advancePaid),
        balanceAmount: parseFloat(formData.balanceAmount || 0)
      };

      if (editingId) {
        await paymentAPI.update(editingId, submitData);
        setSuccess('Payment updated successfully!');
      } else {
        await paymentAPI.create(submitData);
        setSuccess('Payment recorded successfully!');
      }
      resetForm();
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment) => {
    setFormData({
      orderId: payment.orderId,
      customerName: payment.customerName,
      totalAmount: payment.totalAmount,
      advancePaid: payment.advancePaid,
      balanceAmount: payment.balanceAmount,
      paymentMode: payment.paymentMode,
      paymentDate: payment.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      notes: payment.notes || ''
    });
    setEditingId(payment._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      setLoading(true);
      try {
        await paymentAPI.delete(id);
        setSuccess('Payment deleted successfully!');
        fetchPayments();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete payment');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      customerName: '',
      totalAmount: '',
      advancePaid: '',
      balanceAmount: '',
      paymentMode: 'Cash',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getPaymentStatus = (payment) => {
    if (payment.balanceAmount <= 0) return 'Completed';
    if (payment.advancePaid > 0) return 'Partial';
    return 'Pending';
  };

  const filteredPayments = payments.filter(payment => {
    const status = getPaymentStatus(payment);
    const matchStatus = filterStatus === 'All' || status === filterStatus;
    const matchSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getStatusBadgeClass = (payment) => {
    const status = getPaymentStatus(payment);
    const badgeClasses = {
      'Completed': 'badge-completed',
      'Partial': 'badge-pending',
      'Pending': 'badge-new'
    };
    return badgeClasses[status] || 'badge-new';
  };

  const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.advancePaid || 0), 0);
  const pendingAmount = payments.reduce((sum, p) => sum + parseFloat(p.balanceAmount || 0), 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Payment Management</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); resetForm(); }}
            className="btn btn-primary"
          >
            + Record Payment
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Pending Amount</h3>
          <p className="text-3xl font-bold text-red-600">₹{pendingAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Payments</h3>
          <p className="text-3xl font-bold text-blue-600">{payments.length}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-container fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingId ? 'Edit Payment' : 'Record Payment'}
            </h2>
            <button onClick={resetForm} className="text-gray-600 text-2xl">×</button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Payment Selection Section */}
            <div className="form-section">
              <h3>Select Order</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Order <span className="required">*</span></label>
                  <select
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Order</option>
                    {orders.map(o => (
                      <option key={o._id} value={o._id}>
                        {o.orderId || o._id.substring(0, 8)} - {o.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Customer</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Amount Section */}
            <div className="form-section">
              <h3>Payment Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Total Order Amount</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    disabled
                    className="bg-gray-100"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Amount Paid <span className="required">*</span></label>
                  <input
                    type="number"
                    name="advancePaid"
                    value={formData.advancePaid}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Balance Amount (Auto-Calculated)</label>
                  <input
                    type="number"
                    value={formData.balanceAmount}
                    disabled
                    className="bg-gray-100"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Mode</label>
                  <select
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                  >
                    {paymentModes.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Date & Notes Section */}
            <div className="form-section">
              <h3>Additional Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Payment Date</label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group mt-4">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes..."
                  rows="2"
                />
              </div>
            </div>

            <div className="btn-container">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Payment' : 'Record Payment'}
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
          {['All', 'Pending', 'Partial', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn btn-small ${
                filterStatus === status 
                  ? 'btn-success' 
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
          placeholder="Search by customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Payments Table */}
      {loading && !showForm ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading payments...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Payment Mode</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map(payment => (
                  <tr key={payment._id}>
                    <td><strong>{payment.customerName}</strong></td>
                    <td>₹{parseFloat(payment.totalAmount || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(payment.advancePaid || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(payment.balanceAmount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(payment)}`}>
                        {getPaymentStatus(payment)}
                      </span>
                    </td>
                    <td>{payment.paymentMode}</td>
                    <td>{new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(payment)}
                          className="btn btn-small btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(payment._id)}
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
                    {searchTerm ? 'No payments found matching your search.' : 'No payments recorded yet.'}
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

export default PaymentPage;
