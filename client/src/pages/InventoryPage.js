import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import Modal from '../components/Modal';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    quantity: '',
    minStock: '10',
    supplierName: '',
    purchaseCost: '',
    unit: 'meters'
  });

  const categories = ['Fabric', 'Lace', 'Button', 'Thread', 'Zipper', 'Ribbon', 'Hook', 'Other'];
  const units = ['meters', 'pieces', 'boxes', 'kg', 'yards', 'packs'];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await inventoryAPI.getAll();
      setItems(Array.isArray(response.data) ? response.data : response.data.inventory || []);
    } catch (err) {
      setError('Failed to load inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStockStatus = (item) => {
    const quantity = parseFloat(item.quantity || 0);
    const minStock = parseFloat(item.minStock || 0);
    
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= minStock) return 'Low Stock';
    return 'In Stock';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.itemName || !formData.category || !formData.quantity) {
      setError('Please fill all required fields');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        minStock: parseFloat(formData.minStock || 0),
        purchaseCost: parseFloat(formData.purchaseCost || 0)
      };

      if (editingId) {
        await inventoryAPI.update(editingId, submitData);
        setSuccess('Inventory item updated successfully!');
      } else {
        await inventoryAPI.create(submitData);
        setSuccess('Inventory item added successfully!');
      }
      resetForm();
      fetchItems();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      minStock: item.minStock || 10,
      supplierName: item.supplierName || '',
      purchaseCost: item.purchaseCost || '',
      unit: item.unit || 'meters'
    });
    setEditingId(item._id || item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setLoading(true);
      try {
        await inventoryAPI.delete(id);
        setSuccess('Item deleted successfully!');
        fetchItems();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete item');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    const item = items.find(i => i._id === id || i.id === parseInt(id));
    if (!item) return;

    setLoading(true);
    try {
      await inventoryAPI.update(id, { ...item, quantity: newQuantity });
      fetchItems();
    } catch (err) {
      setError('Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      itemName: '',
      category: '',
      quantity: '',
      minStock: '10',
      supplierName: '',
      purchaseCost: '',
      unit: 'meters'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredItems = items.filter(item => {
    const status = getStockStatus(item);
    const matchStatus = filterStatus === 'All' || status === filterStatus;
    const itemName = item.itemName || item.name || '';
    const matchSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getStatusBadgeClass = (item) => {
    const status = getStockStatus(item);
    const badgeClasses = {
      'In Stock': 'badge-completed',
      'Low Stock': 'badge-warning',
      'Out of Stock': 'badge-new'
    };
    return badgeClasses[status] || 'badge-new';
  };

  // Summary calculations
  const totalItems = items.length;
  const lowStockItems = items.filter(item => getStockStatus(item) === 'Low Stock').length;
  const outOfStockItems = items.filter(item => getStockStatus(item) === 'Out of Stock').length;
  const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.purchaseCost || 0)), 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn btn-primary"
          >
            + Add Item
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Items</h3>
          <p className="text-3xl font-bold text-blue-600">{totalItems}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Low Stock</h3>
          <p className="text-3xl font-bold text-yellow-600">{lowStockItems}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Out of Stock</h3>
          <p className="text-3xl font-bold text-red-600">{outOfStockItems}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Value</h3>
          <p className="text-3xl font-bold text-green-600">₹{totalValue.toFixed(2)}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add/Edit Form */}
      <Modal 
        isOpen={showForm} 
        onClose={resetForm} 
        title={editingId ? 'Edit Inventory Item' : 'Add New Item'} 
        size="lg"
      >
        <form onSubmit={handleSubmit}>
            {/* Item Details Section */}
            <div className="form-section">
              <h3>Item Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    placeholder="e.g., Cotton Silk Fabric"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category <span className="required">*</span></label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Supplier Name</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    placeholder="Supplier name"
                  />
                </div>
              </div>
            </div>

            {/* Stock & Cost Section */}
            <div className="form-section">
              <h3>Stock & Cost Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Current Quantity <span className="required">*</span></label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Stock Level</label>
                  <input
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleInputChange}
                    placeholder="10"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Cost per Unit</label>
                  <input
                    type="number"
                    name="purchaseCost"
                    value={formData.purchaseCost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="btn-container">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </Modal>

      {/* Stock Status Filter */}
      <div className="bg-white rounded-lg p-4 shadow mb-6 overflow-x-auto">
        <div className="flex gap-2 flex-wrap">
          {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((status) => (
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
          placeholder="Search by item name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Inventory Table */}
      {loading && !showForm ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Min Stock</th>
                <th>Status</th>
                <th>Cost/Unit</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item._id || item.id}>
                    <td><strong>{item.itemName || item.name}</strong></td>
                    <td>{item.category || '-'}</td>
                    <td>{item.quantity || 0} {item.unit || '-'}</td>
                    <td>{item.unit || '-'}</td>
                    <td>{item.minStock || 0}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(item)}`}>
                        {getStockStatus(item)}
                      </span>
                    </td>
                    <td>₹{parseFloat(item.purchaseCost || 0).toFixed(2)}</td>
                    <td>₹{(parseFloat(item.quantity || 0) * parseFloat(item.purchaseCost || 0)).toFixed(2)}</td>
                    <td>{item.supplierName || '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="btn btn-small btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id || item.id)}
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
                  <td colSpan="10" className="text-center py-4 text-gray-600">
                    {searchTerm ? 'No items found matching your search.' : 'No inventory items yet. Add one to get started!'}
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

export default InventoryPage;
