import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('branding');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [businessTagline, setBusinessTagline] = useState('');
  const [theme, setTheme] = useState('pink');
  const [saveMessage, setSaveMessage] = useState('');

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setBusinessName(settings.businessName || 'Aarta Kouture');
      setBusinessTagline(settings.businessTagline || 'By Shruti Reddy');
      setTheme(settings.theme || 'pink');
      if (settings.customLogo) {
        setLogoPreview(settings.customLogo);
      }
    } else {
      // Set defaults
      setBusinessName('Aarta Kouture');
      setBusinessTagline('By Shruti Reddy');
    }
  }, []);

  // Check if user is owner
  if (user?.role !== 'owner') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
        <p className="text-red-600">Only owners can access settings.</p>
      </div>
    );
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Logo file size must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = () => {
    const settings = {
      businessName,
      businessTagline,
      customLogo: logoPreview,
      theme,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email
    };

    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaveMessage('Branding settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);

    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleSaveTheme = () => {
    const savedSettings = localStorage.getItem('appSettings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    
    settings.theme = theme;
    settings.updatedAt = new Date().toISOString();
    settings.updatedBy = user.email;

    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaveMessage('Theme saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);

    // Reload page to apply theme changes
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleResetLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      delete settings.customLogo;
      localStorage.setItem('appSettings', JSON.stringify(settings));
    }
    setSaveMessage('Logo reset to default!');
    setTimeout(() => setSaveMessage(''), 3000);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const themes = [
    { id: 'pink', name: 'Pink & Gold', primary: '#ec4899', secondary: '#D4AF37', description: 'Default Aarta Kouture theme' },
    { id: 'purple', name: 'Purple Elegance', primary: '#9333ea', secondary: '#a855f7', description: 'Royal purple theme' },
    { id: 'blue', name: 'Ocean Blue', primary: '#3b82f6', secondary: '#60a5fa', description: 'Professional blue theme' },
    { id: 'emerald', name: 'Emerald Green', primary: '#10b981', secondary: '#34d399', description: 'Fresh green theme' },
    { id: 'rose', name: 'Rose Wine', primary: '#e11d48', secondary: '#f43f5e', description: 'Bold rose theme' },
    { id: 'amber', name: 'Amber Gold', primary: '#f59e0b', secondary: '#fbbf24', description: 'Warm amber theme' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-primary-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              ⚙️ Settings
            </h1>
            <p className="text-gray-600 mt-1">Customize your application appearance and branding</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Owner Access Only</p>
            <p className="text-xs text-gray-400">Changes apply to all users</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-center font-medium animate-pulse">
          ✓ {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex-1 px-6 py-4 font-semibold transition ${
              activeTab === 'branding'
                ? 'bg-primary-500 text-white border-b-4 border-brand-gold'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            🎨 Branding & Logo
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 px-6 py-4 font-semibold transition ${
              activeTab === 'theme'
                ? 'bg-primary-500 text-white border-b-4 border-brand-gold'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            🎨 Theme Selection
          </button>
        </div>

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logo Upload Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-primary-600 border-b-2 border-brand-gold pb-2">
                  Upload Custom Logo
                </h3>
                
                {/* Current Logo Preview */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6 border-2 border-brand-gold">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Current Logo:</p>
                  <div className="flex justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Custom Logo" className="max-h-32 rounded-lg shadow-lg" />
                    ) : (
                      <Logo size="lg" />
                    )}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload New Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: PNG or JPG, max 2MB, transparent background preferred
                  </p>
                </div>

                {/* Logo Preview */}
                {logoFile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-700 mb-2">New Logo Preview:</p>
                    <div className="flex justify-center bg-white rounded-lg p-4">
                      <img src={logoPreview} alt="Preview" className="max-h-32 rounded-lg" />
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                {logoPreview && (
                  <button
                    onClick={handleResetLogo}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition font-semibold"
                  >
                    🔄 Reset to Default Logo
                  </button>
                )}
              </div>

              {/* Business Info Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-primary-600 border-b-2 border-brand-gold pb-2">
                  Business Information
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={businessTagline}
                    onChange={(e) => setBusinessTagline(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., By Shruti Reddy"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-800 mb-2">📢 Important Note:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Changes will apply to all users in the system</li>
                    <li>Logo will appear on all pages and login screen</li>
                    <li>Page will reload automatically after saving</li>
                  </ul>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveBranding}
                  disabled={!businessName}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:shadow-lg text-white py-3 rounded-lg transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💾 Save Branding Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Theme Selection Tab */}
        {activeTab === 'theme' && (
          <div className="p-6 space-y-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-primary-600 border-b-2 border-brand-gold pb-2 mb-4">
                Choose Application Theme
              </h3>
              <p className="text-gray-600">
                Select a color theme for your application. This will change the primary colors throughout the system.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`cursor-pointer rounded-lg p-5 border-3 transition transform hover:scale-105 ${
                    theme === t.id
                      ? 'border-brand-gold shadow-xl ring-4 ring-brand-gold/30'
                      : 'border-gray-200 hover:border-gray-300 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-lg text-gray-800">{t.name}</h4>
                    {theme === t.id && (
                      <span className="text-2xl">✓</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <div
                      className="w-12 h-12 rounded-lg shadow-md border-2 border-white"
                      style={{ backgroundColor: t.primary }}
                    ></div>
                    <div
                      className="w-12 h-12 rounded-lg shadow-md border-2 border-white"
                      style={{ backgroundColor: t.secondary }}
                    ></div>
                    <div className="w-12 h-12 rounded-lg shadow-md border-2 border-white bg-brand-gold"></div>
                  </div>
                  
                  <p className="text-sm text-gray-600">{t.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="font-bold text-blue-800 mb-2">ℹ️ Theme Information:</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Theme changes affect sidebar, buttons, and accent colors</li>
                <li>Gold accent color remains consistent across all themes</li>
                <li>All users will see the selected theme</li>
                <li>Page will reload to apply theme changes</li>
              </ul>
            </div>

            <button
              onClick={handleSaveTheme}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:shadow-lg text-white py-3 rounded-lg transition font-bold text-lg"
            >
              💾 Save Theme Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
