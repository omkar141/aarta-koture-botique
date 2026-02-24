import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, roleAPI } from '../services/api';

const AccessControlPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    roleId: '',
    role: ''
  });

  const [roleFormData, setRoleFormData] = useState({
    displayName: '',
    description: '',
    modules: [],
    permissions: []
  });

  const availableModules = [
    'dashboard',
    'customers',
    'orders',
    'payments',
    'inventory',
    'reports',
    'users',
    'roles'
  ];

  const availablePermissions = ['read', 'create', 'update', 'delete', 'all'];

  useEffect(() => {
    if (currentUser?.role === 'owner') {
      fetchUsers();
      fetchRoles();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.users || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
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

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'roleId') {
      const selectedRole = roles.find(r => r.id === parseInt(value));
      setUserFormData(prev => ({
        ...prev,
        roleId: value,
        role: selectedRole ? selectedRole.name : ''
      }));
    } else {
      setUserFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRoleInputChange = (e) => {
    const { name, value } = e.target;
    setRoleFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModuleToggle = (module) => {
    setRoleFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter(m => m !== module)
        : [...prev.modules, module]
    }));
  };

  const handlePermissionToggle = (permission) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingUser) {
        await userAPI.update(editingUser.id, userFormData);
        setSuccess('User updated successfully!');
      } else {
        await userAPI.create(userFormData);
        setSuccess('User created successfully!');
      }
      resetUserForm();
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingRole) {
        await roleAPI.update(editingRole.id, roleFormData);
        setSuccess('Role updated successfully!');
      } else {
        await roleAPI.create(roleFormData);
        setSuccess('Role created successfully!');
      }
      resetRoleForm();
      fetchRoles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      address: user.address || '',
      roleId: user.roleId,
      role: user.role
    });
    setShowUserForm(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({
      displayName: role.displayName,
      description: role.description,
      modules: role.modules || [],
      permissions: role.permissions || []
    });
    setShowRoleForm(true);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setLoading(true);
      try {
        await userAPI.delete(id);
        setSuccess('User deleted successfully!');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleUserStatus = async (id) => {
    setLoading(true);
    try {
      await userAPI.toggleStatus(id);
      setSuccess('User status updated!');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      setLoading(true);
      try {
        await roleAPI.delete(id);
        setSuccess('Role deleted successfully!');
        fetchRoles();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete role');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      roleId: '',
      role: ''
    });
    setEditingUser(null);
    setShowUserForm(false);
  };

  const resetRoleForm = () => {
    setRoleFormData({
      displayName: '',
      description: '',
      modules: [],
      permissions: []
    });
    setEditingRole(null);
    setShowRoleForm(false);
  };

  if (currentUser?.role !== 'owner') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>Only owners can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Access Control Management</h1>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'roles'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Roles
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-6">
            {!showUserForm && (
              <button
                onClick={() => setShowUserForm(true)}
                className="btn btn-primary mb-6"
              >
                + Create New User
              </button>
            )}

            {/* User Form */}
            {showUserForm && (
              <div className="form-container fade-in mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h2>
                  <button onClick={resetUserForm} className="text-gray-600 text-2xl">×</button>
                </div>

                <form onSubmit={handleUserSubmit}>
                  <div className="form-section">
                    <h3>User Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Full Name <span className="required">*</span></label>
                        <input
                          type="text"
                          name="name"
                          value={userFormData.name}
                          onChange={handleUserInputChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Email <span className="required">*</span></label>
                        <input
                          type="email"
                          name="email"
                          value={userFormData.email}
                          onChange={handleUserInputChange}
                          required
                          disabled={!!editingUser}
                          className={editingUser ? 'bg-gray-100' : ''}
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Password {!editingUser && <span className="required">*</span>}
                          {editingUser && <span className="text-xs text-gray-500">(Leave blank to keep current)</span>}
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={userFormData.password}
                          onChange={handleUserInputChange}
                          required={!editingUser}
                        />
                      </div>

                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={userFormData.phone}
                          onChange={handleUserInputChange}
                          placeholder="+91 XXXXXXXXXX"
                        />
                      </div>

                      <div className="form-group">
                        <label>Role <span className="required">*</span></label>
                        <select
                          name="roleId"
                          value={userFormData.roleId}
                          onChange={handleUserInputChange}
                          required
                        >
                          <option value="">Select Role</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group mt-4">
                      <label>Address</label>
                      <textarea
                        name="address"
                        value={userFormData.address}
                        onChange={handleUserInputChange}
                        rows="2"
                        placeholder="Full Address"
                      />
                    </div>
                  </div>

                  <div className="btn-container">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                    </button>
                    <button type="button" onClick={resetUserForm} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            {loading && !showUserForm ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map(user => (
                        <tr key={user.id}>
                          <td><strong>{user.name}</strong></td>
                          <td>{user.email}</td>
                          <td>{user.phone || '-'}</td>
                          <td>
                            <span className="badge badge-primary">{user.role?.toUpperCase()}</span>
                          </td>
                          <td>
                            <span className={`badge ${user.status === 'active' ? 'badge-completed' : 'badge-pending'}`}>
                              {user.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                          </td>
                          <td>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="btn btn-small btn-primary"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(user.id)}
                                className={`btn btn-small ${user.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                              >
                                {user.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              {user.id !== currentUser.id && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="btn btn-small btn-danger"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-gray-600">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="p-6">
            {!showRoleForm && (
              <button
                onClick={() => setShowRoleForm(true)}
                className="btn btn-primary mb-6"
              >
                + Create New Role
              </button>
            )}

            {/* Role Form */}
            {showRoleForm && (
              <div className="form-container fade-in mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingRole ? 'Edit Role' : 'Create New Role'}
                  </h2>
                  <button onClick={resetRoleForm} className="text-gray-600 text-2xl">×</button>
                </div>

                <form onSubmit={handleRoleSubmit}>
                  <div className="form-section">
                    <h3>Role Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Role Name <span className="required">*</span></label>
                        <input
                          type="text"
                          name="displayName"
                          value={roleFormData.displayName}
                          onChange={handleRoleInputChange}
                          placeholder="e.g., Manager"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Description</label>
                        <input
                          type="text"
                          name="description"
                          value={roleFormData.description}
                          onChange={handleRoleInputChange}
                          placeholder="Brief description"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block mb-2 font-semibold">Assign Modules</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableModules.map(module => (
                          <label key={module} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={roleFormData.modules.includes(module)}
                              onChange={() => handleModuleToggle(module)}
                            />
                            <span className="capitalize">{module}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block mb-2 font-semibold">Assign Permissions</label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {availablePermissions.map(permission => (
                          <label key={permission} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={roleFormData.permissions.includes(permission)}
                              onChange={() => handlePermissionToggle(permission)}
                            />
                            <span className="capitalize">{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="btn-container">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                    </button>
                    <button type="button" onClick={resetRoleForm} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Roles Table */}
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Modules</th>
                    <th>Permissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length > 0 ? (
                    roles.map(role => (
                      <tr key={role.id}>
                        <td><strong>{role.displayName}</strong></td>
                        <td>{role.description || '-'}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {role.modules?.map(module => (
                              <span key={module} className="badge badge-primary text-xs">
                                {module}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions?.map(permission => (
                              <span key={permission} className="badge badge-secondary text-xs">
                                {permission}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRole(role)}
                              className="btn btn-small btn-primary"
                            >
                              Edit
                            </button>
                            {role.name !== 'owner' && (
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="btn btn-small btn-danger"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-gray-600">
                        No roles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessControlPage;
