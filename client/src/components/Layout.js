import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊', roles: ['owner', 'staff', 'accountant'] },
    { name: 'Customers', path: '/customers', icon: '👥', roles: ['owner', 'staff'] },
    { name: 'Orders', path: '/orders', icon: '📦', roles: ['owner', 'staff'] },
    { name: 'Payments', path: '/payments', icon: '💰', roles: ['owner', 'accountant'] },
    { name: 'Inventory', path: '/inventory', icon: '🏪', roles: ['owner', 'staff'] },
    { name: 'Reports', path: '/reports', icon: '📈', roles: ['owner', 'accountant'] },
    { name: 'Profile', path: '/profile', icon: '👤', roles: ['owner', 'staff', 'accountant'] },
    { name: 'Access Control', path: '/access-control', icon: '🔐', roles: ['owner'] },
    { name: 'Settings', path: '/settings', icon: '⚙️', roles: ['owner'] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} text-white transition-all duration-300 overflow-hidden shadow-2xl`}
        style={{
          background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))'
        }}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-white/20 bg-white/10">
          {sidebarOpen ? (
            <Logo className="mb-2" size="md" />
          ) : (
            <Logo variant="icon" className="mb-2" size="sm" />
          )}
        </div>

        {/* Toggle Button */}
        <div className="px-4 py-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="w-full p-2 hover:bg-white/10 rounded-lg transition flex items-center justify-center"
          >
            {sidebarOpen ? '← Collapse' : '→'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 transition flex items-center ${
                  isActive 
                    ? 'bg-white/20 border-l-4 border-brand-gold shadow-lg' 
                    : 'hover:bg-white/10 border-l-4 border-transparent'
                }`}
                title={sidebarOpen ? '' : item.name}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo variant="text" />
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium">Welcome back</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{user?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-brand-gold/10 text-brand-gold rounded-full text-sm font-medium border border-brand-gold/30">
                {user?.role?.toUpperCase()}
              </div>
              <Link 
                to="/profile" 
                className="text-gray-700 hover:text-primary-500 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                style={{ '--tw-text-opacity': '1' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
              >
                <span className="text-xl">👤</span>
                <span className="font-medium">Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-white px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg font-medium"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
