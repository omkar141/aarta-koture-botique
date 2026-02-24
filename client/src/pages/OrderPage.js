import React, { useState, useEffect } from 'react';
import { orderAPI, customerAPI, roleAPI } from '../services/api';
import Modal from '../components/Modal';

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showTimeline, setShowTimeline] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(null);
  
  const [formData, setFormData] = useState({
    orderId: '',
    customerId: '',
    customerName: '',
    dressType: '',
    fabricType: '',
    orderDate: new Date().toISOString().split('T')[0],
    trialDate: '',
    deliveryDate: '',
    status: 'New',
    assignedTo: '',
    notes: '',
    amount: ''
  });

  const dressTypes = ['Saree', 'Lehenga', 'Salwar', 'Gown', 'Blouse', 'Kurti', 'Dupatta', 'Shirt', 'Trouser', 'Suit', 'Other'];
  const fabricTypes = ['Cotton', 'Silk', 'Georgette', 'Chiffon', 'Satin', 'Net', 'Velvet', 'Linen', 'Wool', 'Polyester'];
  const statuses = ['New', 'In Stitching', 'Trial Done', 'Alteration', 'Ready', 'Delivered'];

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchRoles();
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

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data.roles || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
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
      orderId: order.orderId || order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      dressType: order.dressType,
      fabricType: order.fabricType,
      orderDate: order.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      trialDate: order.trialDate?.split('T')[0] || '',
      deliveryDate: order.deliveryDate?.split('T')[0] || '',
      status: order.status,
      assignedTo: order.assignedTo || '',
      notes: order.notes || '',
      amount: order.amount || ''
    });
    setEditingId(order._id || order.id);
    setShowForm(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await orderAPI.changeStatus(orderId, newStatus, '');
      setSuccess(`Order status changed to ${newStatus}`);
      fetchOrders();
      setShowStatusModal(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async (orderId, staffName) => {
    setLoading(true);
    try {
      await orderAPI.assign(orderId, staffName);
      setSuccess(`Order assigned to ${staffName}`);
      fetchOrders();
      setShowAssignModal(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to assign staff');
    } finally {
      setLoading(false);
    }
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

  const resetForm = () => {
    setFormData({
      orderId: '',
      customerId: '',
      customerName: '',
      dressType: '',
      fabricType: '',
      orderDate: new Date().toISOString().split('T')[0],
      trialDate: '',
      deliveryDate: '',
      status: 'New',
      assignedTo: '',
      notes: '',
      amount: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchSearch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       order.orderId?.toString().includes(searchTerm) ||
                       order.id?.toString().includes(searchTerm);
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
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn btn-primary"
          >
            + Create New Order
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingId ? 'Edit Order' : 'Create New Order'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          {/* Order Details Section */}
          <div className="form-section">
            <h3>Order Details</h3>
            <div className="form-grid">
              {editingId && (
                <div className="form-group">
                  <label>Order ID</label>
                  <input
                    type="text"
                    value={formData.orderId || editingId}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              )}

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
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
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
                <label>Delivery Date</label>
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

              <div className="form-group">
                <label>Assigned To</label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                >
                  <option value="">Unassigned</option>
                  {roles.length > 0 ? (
                    roles.map(role => (
                      <option key={role.id} value={role.name}>{role.displayName || role.name}</option>
                    ))
                  ) : (
                    <option disabled>No roles available</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Order Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes..."
              rows="3"
            />
          </div>

          <div className="btn-container">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : editingId ? 'Update Order' : 'Create Order'}
            </button>
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal !== null}
        onClose={() => setShowStatusModal(null)}
        title={showStatusModal ? `Change Order Status - ${showStatusModal.orderId}` : 'Change Status'}
        size="md"
      >
        {showStatusModal && (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">Select new status for this order:</p>
            <div className="grid grid-cols-2 gap-3">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(showStatusModal._id || showStatusModal.id, status)}
                  className={`btn ${showStatusModal.status === status ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={loading}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t">
              <button onClick={() => setShowStatusModal(null)} className="btn btn-secondary w-full">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={showAssignModal !== null}
        onClose={() => setShowAssignModal(null)}
        title={showAssignModal ? `Assign Staff - ${showAssignModal.orderId}` : 'Assign Staff'}
        size="md"
      >
        {showAssignModal && (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">Select staff member to assign:</p>
            {roles.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => handleAssignStaff(showAssignModal._id || showAssignModal.id, role.name)}
                    className={`btn ${showAssignModal.assignedTo === role.name ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={loading}
                  >
                    {role.displayName || role.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No roles available. Create roles in Access Control first.</p>
            )}
            <div className="mt-6 pt-4 border-t">
              <button onClick={() => setShowAssignModal(null)} className="btn btn-secondary w-full">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Timeline Modal */}
      <Modal
        isOpen={showTimeline !== null}
        onClose={() => setShowTimeline(null)}
        title={showTimeline ? `Order Timeline - ${showTimeline.orderId}` : 'Order Timeline'}
        size="lg"
      >
        {showTimeline && (
          <div className="space-y-6">
            {/* Order Placed */}
            <div className="flex">
              <div className="w-24 flex-shrink-0">
                <div className="w-4 h-4 bg-blue-500 rounded-full mx-2 mt-1.5"></div>
              </div>
              <div className="flex-grow pb-8 border-l-2 border-gray-300 pl-6">
                <h4 className="font-semibold text-gray-800">Order Placed</h4>
                <p className="text-sm text-gray-600">
                  {showTimeline.orderDate ? new Date(showTimeline.orderDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>

            {/* Trial Scheduled */}
            <div className="flex">
              <div className="w-24 flex-shrink-0">
                <div className={`w-4 h-4 rounded-full mx-2 mt-1.5 ${showTimeline.trialDate ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
              </div>
              <div className="flex-grow pb-8 border-l-2 border-gray-300 pl-6">
                <h4 className="font-semibold text-gray-800">Trial Scheduled</h4>
                <p className="text-sm text-gray-600">
                  {showTimeline.trialDate ? new Date(showTimeline.trialDate).toLocaleDateString() : 'Not scheduled'}
                </p>
              </div>
            </div>

            {/* Delivery */}
            <div className="flex">
              <div className="w-24 flex-shrink-0">
                <div className={`w-4 h-4 rounded-full mx-2 mt-1.5 ${showTimeline.deliveryDate ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              </div>
              <div className="flex-grow pl-6">
                <h4 className="font-semibold text-gray-800">Delivery</h4>
                <p className="text-sm text-gray-600">
                  {showTimeline.deliveryDate ? new Date(showTimeline.deliveryDate).toLocaleDateString() : 'Not scheduled'}
                </p>
              </div>
            </div>

            {/* Current Status */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-2">Current Status</h4>
              <p className="text-blue-700 font-medium">{showTimeline.status}</p>
            </div>

            {/* Assigned Staff */}
            {showTimeline.assignedTo && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-gray-800 mb-2">Assigned To</h4>
                <p className="text-amber-700">{showTimeline.assignedTo}</p>
              </div>
            )}

            {/* Details */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">Order Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">Dress Type:</span> <span className="font-medium">{showTimeline.dressType}</span></p>
                <p><span className="text-gray-600">Fabric Type:</span> <span className="font-medium">{showTimeline.fabricType}</span></p>
                <p><span className="text-gray-600">Amount:</span> <span className="font-medium">₹{showTimeline.amount || '0'}</span></p>
                {showTimeline.notes && <p><span className="text-gray-600">Notes:</span> <span className="font-medium">{showTimeline.notes}</span></p>}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <button onClick={() => setShowTimeline(null)} className="btn btn-secondary w-full">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

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
                <th>Assigned To</th>
                <th>Delivery Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order._id || order.id}>
                    <td><strong>{order.orderId || order.id}</strong></td>
                    <td>{order.customerName}</td>
                    <td>{order.dressType}</td>
                    <td>{order.fabricType}</td>
                    <td>₹{order.amount || '0'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.assignedTo || '-'}</td>
                    <td>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleEdit(order)}
                          className="btn btn-small btn-primary"
                          title="Edit Order"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setShowStatusModal(order)}
                          className="btn btn-small btn-warning"
                          title="Change Status"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => setShowAssignModal(order)}
                          className="btn btn-small btn-secondary"
                          title="Assign to Staff"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => setShowTimeline(order)}
                          className="btn btn-small"
                          style={{ backgroundColor: '#6366f1', color: 'white' }}
                          title="View Timeline"
                        >
                          Timeline
                        </button>
                        <button
                          onClick={() => handleDelete(order._id || order.id)}
                          className="btn btn-small btn-danger"
                          title="Delete Order"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-gray-600">
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
