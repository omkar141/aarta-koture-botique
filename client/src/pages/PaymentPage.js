import React, { useState, useEffect } from 'react';
import { paymentAPI, customerAPI, orderAPI } from '../services/api';
import Modal from '../components/Modal';
import TablePagination from '../components/TablePagination';

const PaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState({
    paymentId: '',
    customerId: '',
    orderId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    method: 'Cash',
    notes: ''
  });

  const statusOptions = ['Pending', 'Paid', 'Failed', 'Refunded'];
  const methodOptions = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Wallet'];

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

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

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
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

  const resetForm = () => {
    setFormData({
      paymentId: '',
      customerId: '',
      orderId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      method: 'Cash',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        paymentMethod: formData.method,
        amount: Number(formData.amount) || 0
      };

      if (editingId) {
        await paymentAPI.update(editingId, payload);
        setSuccess('Payment updated successfully!');
      } else {
        await paymentAPI.create(payload);
        setSuccess('Payment created successfully!');
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
      paymentId: payment.paymentId || payment.id,
      customerId: payment.customerId,
      orderId: payment.orderId,
      amount: payment.amount || '',
      paymentDate: payment.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: payment.status,
      method: payment.method || payment.paymentMode || payment.paymentMethod || '',
      notes: payment.notes || ''
    });
    setEditingId(payment._id || payment.id);
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

  const filteredPayments = payments.filter(payment => {
    const matchStatus = filterStatus === 'All' || payment.status === filterStatus;
    const customerName = customers.find(c => c.id === payment.customerId)?.name || '';
    const matchSearch = payment.paymentId?.toString().includes(searchTerm) ||
      payment.orderId?.toString().includes(searchTerm) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const paginatedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const getStatusBadgeClass = (status) => {
    const badgeClasses = {
      Paid: 'badge-completed',
      Pending: 'badge-pending',
      Failed: 'badge-danger',
      Refunded: 'badge-new'
    };
    return badgeClasses[status] || 'badge-new';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Payment Management</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + Add Payment
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Paid</h3>
          <p className="stat-value">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-value">₹{totalPending.toLocaleString()}</p>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={resetForm} title={editingId ? 'Edit Payment' : 'Add Payment'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer</label>
              <select name="customerId" value={formData.customerId} onChange={handleInputChange} required>
                <option value="">Select customer</option>
                {customers.map(customer => (
                  <option key={customer._id || customer.id} value={customer._id || customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Order ID</label>
                <select name="orderId" value={formData.orderId} onChange={handleInputChange} required>
                  <option value="">Select order</option>
                  {orders
                    .filter(order => !formData.customerId || order.customerId === Number(formData.customerId))
                    .map(order => (
                      <option key={order.id} value={order.id}>{order.orderId} - {order.customerName}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required min="0" step="0.01" />
            </div>

            <div className="form-group">
              <label>Payment Date</label>
              <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Method</label>
              <select name="method" value={formData.method} onChange={handleInputChange}>
                {methodOptions.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" placeholder="Payment notes..." />
          </div>

          <div className="btn-container">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Payment' : 'Create Payment'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white rounded-lg p-4 shadow mb-6 overflow-x-auto">
        <div className="flex gap-2 flex-wrap">
          {['All', ...statusOptions].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn btn-small ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="search-box mb-6">
        <input
          type="text"
          placeholder="Search by customer, order ID, or payment ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading payments...</p>
        </div>
      ) : (
        <div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Customer</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.length > 0 ? (
                  paginatedPayments.map(payment => {
                    const customerName = customers.find(c => c.id === payment.customerId)?.name || 'Unknown';
                    return (
                      <tr key={payment._id || payment.id}>
                        <td><strong>{payment.paymentId || payment.id}</strong></td>
                        <td>{customerName}</td>
                        <td>{payment.orderId}</td>
                        <td>₹{Number(payment.amount || 0).toLocaleString()}</td>
                        <td>{payment.method || payment.paymentMode || payment.paymentMethod || '-'}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="flex gap-2 flex-wrap">
                            <button onClick={() => handleEdit(payment)} className="btn btn-small btn-primary">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(payment._id || payment.id)} className="btn btn-small btn-danger">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

          <TablePagination
            page={currentPage}
            pageSize={pageSize}
            totalItems={filteredPayments.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
