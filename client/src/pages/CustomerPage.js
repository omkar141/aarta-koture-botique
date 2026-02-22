import React, { useState, useEffect } from 'react';
import { customerAPI } from '../services/api';

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    dateAdded: new Date().toISOString().split('T')[0]
  });
  const [measurements, setMeasurements] = useState({
    shoulder: '',
    bust: '',
    waist: '',
    hip: '',
    sleeveLength: '',
    dressLength: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);

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
    setMeasurements(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingId) {
        await customerAPI.update(editingId, formData);
        setSuccess('Customer updated successfully!');
      } else {
        await customerAPI.create(formData);
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

  const handleAddMeasurement = async (customerId) => {
    if (!measurements.shoulder || !measurements.bust) {
      setError('Please fill at least shoulder and bust measurements');
      return;
    }
    
    setLoading(true);
    try {
      await customerAPI.addMeasurement(customerId, measurements);
      setSuccess('Measurement added successfully!');
      setMeasurements({
        shoulder: '',
        bust: '',
        waist: '',
        hip: '',
        sleeveLength: '',
        dressLength: '',
        notes: ''
      });
      setShowMeasurements(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add measurement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      dateAdded: customer.dateAdded?.split('T')[0] || new Date().toISOString().split('T')[0]
    });
    setEditingId(customer._id);
    setShowForm(true);
    setShowMeasurements(false);
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
      name: '',
      phone: '',
      email: '',
      address: '',
      dateAdded: new Date().toISOString().split('T')[0]
    });
    setMeasurements({
      shoulder: '',
      bust: '',
      waist: '',
      hip: '',
      sleeveLength: '',
      dressLength: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); resetForm(); }}
            className="btn btn-primary"
          >
            + Add New Customer
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
              {editingId ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <button onClick={resetForm} className="text-gray-600 text-2xl">×</button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
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
                  <label>Phone <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 XXXXXXXXXX"
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
                  <label>Date Added</label>
                  <input
                    type="date"
                    name="dateAdded"
                    value={formData.dateAdded}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group mt-4">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Full Address"
                  rows="3"
                />
              </div>
            </div>

            <div className="btn-container">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Customer' : 'Add Customer'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Measurements Form */}
      {showMeasurements && editingId && (
        <div className="form-container fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Add Measurements</h2>
            <button onClick={() => setShowMeasurements(false)} className="text-gray-600 text-2xl">×</button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddMeasurement(editingId);
          }}>
            <div className="form-section">
              <h3>Body Measurements (in inches)</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Shoulder <span className="required">*</span></label>
                  <input
                    type="number"
                    name="shoulder"
                    value={measurements.shoulder}
                    onChange={handleMeasurementChange}
                    placeholder="0.0"
                    step="0.1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bust/Chest <span className="required">*</span></label>
                  <input
                    type="number"
                    name="bust"
                    value={measurements.bust}
                    onChange={handleMeasurementChange}
                    placeholder="0.0"
                    step="0.1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Waist</label>
                  <input
                    type="number"
                    name="waist"
                    value={measurements.waist}
                    onChange={handleMeasurementChange}
                    placeholder="0.0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Hip</label>
                  <input
                    type="number"
                    name="hip"
                    value={measurements.hip}
                    onChange={handleMeasurementChange}
                    placeholder="0.0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Sleeve Length</label>
                  <input
                    type="number"
                    name="sleeveLength"
                    value={measurements.sleeveLength}
                    onChange={handleMeasurementChange}
                    placeholder="0.0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Dress Length</label>
                  <input
                    type="number"
                    name="dressLength"
                    value={measurements.dressLength}
                    onChange={handleMeasurementChange}
                    placeholder="0.0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-group mt-4">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={measurements.notes}
                  onChange={handleMeasurementChange}
                  placeholder="Additional notes about measurements"
                  rows="2"
                />
              </div>
            </div>

            <div className="btn-container">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Measurement'}
              </button>
              <button type="button" onClick={() => setShowMeasurements(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-box mb-6">
        <input
          type="text"
          placeholder="Search by name or phone..."
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
                  <tr key={customer._id}>
                    <td><strong>{customer.name}</strong></td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.address || '-'}</td>
                    <td>{new Date(customer.dateAdded || customer.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleEdit(customer);
                            setShowMeasurements(false);
                          }}
                          className="btn btn-small btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(customer._id);
                            setShowForm(false);
                            setShowMeasurements(true);
                          }}
                          className="btn btn-small btn-warning"
                        >
                          Measure
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id)}
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
                  <td colSpan="6" className="text-center py-4 text-gray-600">
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
