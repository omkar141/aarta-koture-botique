import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CustomerPage from './pages/CustomerPage';
import OrderPage from './pages/OrderPage';
import PaymentPage from './pages/PaymentPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import AccessControlPage from './pages/AccessControlPage';
import SettingsPage from './pages/SettingsPage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminPage from './pages/SuperAdminPage';
import Layout from './components/Layout';
import applyTheme from './utils/theme';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const TenantRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'super_admin' ? <Navigate to="/super-admin" replace /> : children;
};

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/super-admin/login" replace />;
  return user.role === 'super_admin' ? children : <Navigate to="/" replace />;
};

function App() {
  // Apply theme on app load
  useEffect(() => {
    applyTheme();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
          <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <TenantRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/customers" element={<CustomerPage />} />
                      <Route path="/orders" element={<OrderPage />} />
                      <Route path="/payments" element={<PaymentPage />} />
                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/access-control" element={<AccessControlPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </Layout>
                </TenantRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

