import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, userAPI } from '../services/api';

const ProfilePage = () => {
  const { user: currentUser, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userStats, setUserStats] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
      });
      fetchUserStats();
    }
  }, [currentUser]);

  const fetchUserStats = async () => {
    try {
      const response = await userAPI.getUserStats(currentUser.id);
      setUserStats(response.data);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate phone
    if (formData.phone && !formData.phone.match(/^(\+91[\s]?)?[0-9]{10}$/)) {
      setError('Please enter a valid phone number with +91');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.updateProfile(currentUser.id, formData);
      const token = localStorage.getItem('token');
      login(response.data, token);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate new password
    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(
        currentUser.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setSuccess('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      owner: 'bg-purple-500',
      staff: 'bg-blue-500',
      accountant: 'bg-green-500'
    };
    return classes[role] || 'bg-gray-500';
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Profile</h1>

        {error && <div className="alert alert-error mb-4">{error}</div>}
        {success && <div className="alert alert-success mb-4">{success}</div>}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {currentUser.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-800">{currentUser.name}</h2>
                <p className="text-gray-600">{currentUser.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-white text-sm ${getRoleBadgeClass(currentUser.role)}`}>
                  {currentUser.role?.toUpperCase()}
                </span>
              </div>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="btn btn-primary"
              >
                Edit Profile
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleProfileSubmit}>
              <div className="form-section">
                <h3>Edit Profile Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email (Read-only)</label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>

                  <div className="form-group">
                    <label>Role (Read-only)</label>
                    <input
                      type="text"
                      value={currentUser.role?.toUpperCase()}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                <div className="form-group mt-4">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Full Address"
                  />
                </div>
              </div>

              <div className="btn-container">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      name: currentUser.name || '',
                      phone: currentUser.phone || '',
                      address: currentUser.address || ''
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="text-lg font-semibold">{currentUser.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="text-lg font-semibold capitalize">{currentUser.status || 'Active'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Login</p>
                <p className="text-lg font-semibold">
                  {currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString() : 'No login recorded'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-lg font-semibold">
                  {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-lg font-semibold">{currentUser.address || 'Not provided'}</p>
              </div>
            </div>
          )}
        </div>

        {/* User Statistics */}
        {userStats && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">My Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.totalOrders}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{userStats.completedOrders}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{userStats.pendingOrders}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-purple-600">{userStats.totalCustomers}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-indigo-600">₹{userStats.totalRevenue}</p>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Button */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Security</h3>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn btn-warning"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setError('');
                }}
                className="text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group mb-4">
                <label>Current Password <span className="required">*</span></label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label>
                  New Password <span className="required">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Min 8 chars, 1 uppercase, 1 number)</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label>Confirm New Password <span className="required">*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="btn-container">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setError('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
