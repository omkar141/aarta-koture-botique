import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const SuperAdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.loginSuperAdmin(email, password);
      login(response.data.user, response.data.token);
      navigate('/super-admin');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="mb-8 border-l-4 border-amber-400 pl-4">
          <p className="text-xs uppercase tracking-widest text-amber-300">Platform console</p>
          <h1 className="mt-2 text-3xl font-semibold">Super admin</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in to manage boutique tenants and platform services.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 border-t border-slate-700 pt-6">
          {error && <div role="alert" className="border border-red-400/50 bg-red-950/60 p-3 text-sm text-red-200">{error}</div>}
          <label className="block text-sm text-slate-200">Email address
            <input type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-3 text-white focus:border-amber-400 focus:outline-none" />
          </label>
          <label className="block text-sm text-slate-200">Password
            <input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-3 text-white focus:border-amber-400 focus:outline-none" />
          </label>
          <button type="submit" disabled={loading} className="w-full rounded-md bg-amber-400 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign in to platform'}
          </button>
        </form>
        <Link to="/login" className="mt-6 inline-block text-sm text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-white">Tenant sign in</Link>
      </div>
    </main>
  );
};

export default SuperAdminLoginPage;