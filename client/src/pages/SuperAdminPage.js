import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { integrationSettingsAPI, superAdminAPI } from '../services/api';

const modules = ['dashboard', 'customers', 'orders', 'payments', 'inventory', 'reports', 'users', 'roles'];
const actions = ['read', 'create', 'update', 'delete', 'all'];
const defaultPolicies = () => [
  { name: 'owner', displayName: 'Tenant Admin', description: 'Primary tenant administrator', modules: [...modules], permissions: ['all'] },
  { name: 'staff', displayName: 'Staff', description: 'Boutique operations', modules: ['dashboard', 'customers', 'orders', 'inventory'], permissions: ['read', 'create', 'update'] },
  { name: 'accountant', displayName: 'Accountant', description: 'Payments and reporting', modules: ['dashboard', 'payments', 'reports'], permissions: ['read', 'create', 'update'] }
];
const mergePolicies = existing => {
  const base = defaultPolicies();
  for (const role of existing || []) {
    const index = base.findIndex(item => item.name === role.name);
    if (index >= 0) base[index] = { ...base[index], ...role };
    else base.push(role);
  }
  return base;
};
const emptyIntegrations = {
  mailHost: '', mailPort: 587, mailSecure: false, mailUser: '', mailFrom: '', mailNotifyEmails: '', mailPassword: '',
  mailPasswordConfigured: false, razorpayKeyId: '', razorpayKeySecret: '', razorpayWebhookSecret: '',
  razorpayKeySecretConfigured: false, razorpayWebhookSecretConfigured: false
};

const RolePolicyEditor = ({ value, onChange }) => (
  <div className="space-y-3">
    {value.map(role => (
      <details key={role.name} open={role.name === 'owner'} className="border-t border-slate-200 py-3">
        <summary className="cursor-pointer font-semibold text-slate-800">{role.displayName || role.name}</summary>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Modules</legend>
            <div className="grid grid-cols-2 gap-2">
              {modules.map(module => (
                <label key={module} className="flex items-center gap-2 text-sm capitalize text-slate-700">
                  <input type="checkbox" checked={role.modules.includes(module)} onChange={() => onChange(role.name, 'modules', module)} />{module}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {actions.map(action => (
                <label key={action} className="flex items-center gap-2 text-sm capitalize text-slate-700">
                  <input type="checkbox" checked={role.permissions.includes(action)} onChange={() => onChange(role.name, 'permissions', action)} />{action}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </details>
    ))}
  </div>
);

const SuperAdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tenants');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tenantForm, setTenantForm] = useState({ name: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' });
  const [newPolicies, setNewPolicies] = useState(defaultPolicies());
  const [editingTenant, setEditingTenant] = useState(null);
  const [editingPolicies, setEditingPolicies] = useState([]);
  const [integrationSettings, setIntegrationSettings] = useState(emptyIntegrations);

  const loadPlatformData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tenantResponse, integrationResponse] = await Promise.all([superAdminAPI.getTenants(), integrationSettingsAPI.get()]);
      setTenants(tenantResponse.data || []);
      setIntegrationSettings(current => ({ ...current, ...integrationResponse.data }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlatformData(); }, []);

  const changePolicy = (policies, setPolicies, roleName, field, value) => setPolicies(current => current.map(role => {
    if (role.name !== roleName) return role;
    const values = role[field].includes(value) ? role[field].filter(item => item !== value) : [...role[field], value];
    return { ...role, [field]: values };
  }));

  const handleCreateTenant = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await superAdminAPI.createTenant({
        name: tenantForm.name,
        admin: { name: tenantForm.adminName, email: tenantForm.adminEmail, password: tenantForm.adminPassword, phone: tenantForm.adminPhone },
        roles: newPolicies
      });
      setTenantForm({ name: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' });
      setNewPolicies(defaultPolicies());
      setNotice('Tenant and tenant admin created.');
      await loadPlatformData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create tenant.');
    } finally {
      setSaving(false);
    }
  };

  const openTenantEditor = tenant => {
    setEditingTenant({ id: tenant.id, name: tenant.name, status: tenant.status });
    setEditingPolicies(mergePolicies(tenant.roles));
  };

  const handleUpdateTenant = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await superAdminAPI.updateTenant(editingTenant.id, { ...editingTenant, roles: editingPolicies });
      setEditingTenant(null);
      setNotice('Tenant settings updated.');
      await loadPlatformData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update tenant.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIntegrations = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await integrationSettingsAPI.save({
        mailHost: integrationSettings.mailHost,
        mailPort: Number(integrationSettings.mailPort),
        mailSecure: integrationSettings.mailSecure,
        mailUser: integrationSettings.mailUser,
        mailFrom: integrationSettings.mailFrom,
        mailNotifyEmails: integrationSettings.mailNotifyEmails,
        mailPassword: integrationSettings.mailPassword,
        razorpayKeyId: integrationSettings.razorpayKeyId,
        razorpayKeySecret: integrationSettings.razorpayKeySecret,
        razorpayWebhookSecret: integrationSettings.razorpayWebhookSecret
      });
      setIntegrationSettings(current => ({ ...current, ...data, mailPassword: '', razorpayKeySecret: '', razorpayWebhookSecret: '' }));
      setNotice('Platform integrations saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save integration settings.');
    } finally {
      setSaving(false);
    }
  };

  const updateIntegration = (field, value) => setIntegrationSettings(current => ({ ...current, [field]: value }));
  const handleLogout = () => { logout(); navigate('/super-admin/login'); };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div><p className="text-xs uppercase tracking-widest text-amber-300">Platform administration</p><h1 className="mt-1 text-xl font-semibold">Tenant Control</h1></div>
          <div className="flex items-center gap-4"><span className="hidden text-sm text-slate-300 sm:inline">{user?.name}</span><button onClick={handleLogout} className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">Sign out</button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm text-slate-500">Super admin</p><h2 className="mt-1 text-2xl font-semibold">Tenants, access and platform services</h2></div>
          <div className="flex border-b border-slate-300" role="tablist">
            <button onClick={() => setActiveTab('tenants')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'tenants' ? 'border-b-2 border-amber-500 text-slate-950' : 'text-slate-500'}`}>Tenants</button>
            <button onClick={() => setActiveTab('integrations')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'integrations' ? 'border-b-2 border-amber-500 text-slate-950' : 'text-slate-500'}`}>Platform integrations</button>
          </div>
        </div>
        {error && <div role="alert" className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
        {loading ? <p className="py-12 text-slate-500">Loading platform data...</p> : activeTab === 'tenants' ? (
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
            <section>
              <div className="mb-4 flex items-baseline justify-between"><h3 className="text-lg font-semibold">Tenant accounts</h3><span className="text-sm text-slate-500">{tenants.length} total</span></div>
              <div className="divide-y divide-slate-300 border-y border-slate-300">
                {tenants.map(tenant => (
                  <article key={tenant.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h4 className="font-semibold">{tenant.name}</h4><p className="mt-1 text-xs text-slate-500">{tenant.slug} · created {new Date(tenant.createdAt).toLocaleDateString()}</p><p className="mt-2 text-sm text-slate-700">Admin: {tenant.admin?.name || 'Not assigned'} <span className="text-slate-500">{tenant.admin?.email || ''}</span></p></div>
                      <div className="flex items-center gap-3"><span className={`text-xs font-semibold uppercase ${tenant.status === 'active' ? 'text-emerald-700' : 'text-red-700'}`}>{tenant.status}</span><button onClick={() => openTenantEditor(tenant)} className="rounded-md border border-slate-400 px-3 py-2 text-sm hover:bg-white">Access policy</button></div>
                    </div>
                  </article>
                ))}
                {!tenants.length && <p className="py-8 text-sm text-slate-500">No tenants created yet.</p>}
              </div>
              {editingTenant && (
                <form onSubmit={handleUpdateTenant} className="mt-6 border-t-2 border-slate-900 pt-5">
                  <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{editingTenant.name} access policy</h3><button type="button" onClick={() => setEditingTenant(null)} className="text-sm underline">Close</button></div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium">Tenant name<input required value={editingTenant.name} onChange={event => setEditingTenant(current => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
                    <label className="text-sm font-medium">Status<select value={editingTenant.status} onChange={event => setEditingTenant(current => ({ ...current, status: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                  </div>
                  <div className="mt-4"><RolePolicyEditor value={editingPolicies} onChange={(...args) => changePolicy(editingPolicies, setEditingPolicies, ...args)} /></div>
                  <button disabled={saving} className="mt-5 rounded-md bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50">Save tenant policy</button>
                </form>
              )}
            </section>

            <section className="border-t-2 border-amber-500 pt-5 xl:border-l xl:border-t-0 xl:border-slate-300 xl:pl-8">
              <h3 className="text-lg font-semibold">Create tenant</h3>
              <form onSubmit={handleCreateTenant} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium sm:col-span-2">Boutique / tenant name<input required minLength="2" value={tenantForm.name} onChange={event => setTenantForm(current => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
                  <label className="text-sm font-medium">First admin name<input required value={tenantForm.adminName} onChange={event => setTenantForm(current => ({ ...current, adminName: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
                  <label className="text-sm font-medium">Admin email<input type="email" required value={tenantForm.adminEmail} onChange={event => setTenantForm(current => ({ ...current, adminEmail: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
                  <label className="text-sm font-medium">Temporary password<input type="password" required minLength="12" autoComplete="new-password" value={tenantForm.adminPassword} onChange={event => setTenantForm(current => ({ ...current, adminPassword: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
                  <label className="text-sm font-medium">Phone<input type="tel" value={tenantForm.adminPhone} onChange={event => setTenantForm(current => ({ ...current, adminPhone: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
                </div>
                <div className="border-t border-slate-300 pt-4"><p className="mb-3 text-sm font-semibold">Initial role privileges</p><RolePolicyEditor value={newPolicies} onChange={(...args) => changePolicy(newPolicies, setNewPolicies, ...args)} /></div>
                <button disabled={saving} className="w-full rounded-md bg-amber-500 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50">{saving ? 'Creating...' : 'Create tenant and admin'}</button>
              </form>
            </section>
          </div>
        ) : (
          <form onSubmit={handleSaveIntegrations} className="max-w-4xl space-y-8">
            <section className="border-t-2 border-slate-900 pt-4">
              <h3 className="text-lg font-semibold">SMTP email</h3><p className="mt-1 text-sm text-slate-500">Used for all tenant notifications. Stored secrets are not returned to the browser.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">SMTP host<input value={integrationSettings.mailHost} onChange={event => updateIntegration('mailHost', event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="smtp.example.com" /></label>
                <label className="text-sm font-medium">Port<input type="number" min="1" max="65535" value={integrationSettings.mailPort} onChange={event => updateIntegration('mailPort', event.target.value === '' ? '' : Number(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm font-medium">SMTP username<input autoComplete="username" value={integrationSettings.mailUser} onChange={event => updateIntegration('mailUser', event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm font-medium">From address<input value={integrationSettings.mailFrom} onChange={event => updateIntegration('mailFrom', event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm font-medium sm:col-span-2">Fallback notification recipients<input value={integrationSettings.mailNotifyEmails} onChange={event => updateIntegration('mailNotifyEmails', event.target.value)} placeholder="admin@example.com, finance@example.com" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm font-medium">SMTP password<input type="password" autoComplete="new-password" value={integrationSettings.mailPassword} onChange={event => updateIntegration('mailPassword', event.target.value)} placeholder={integrationSettings.mailPasswordConfigured ? 'Saved; blank keeps current' : 'Enter SMTP password'} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={integrationSettings.mailSecure} onChange={event => updateIntegration('mailSecure', event.target.checked)} />Use secure TLS connection</label>
              </div>
            </section>
            <section className="border-t-2 border-slate-900 pt-4">
              <h3 className="text-lg font-semibold">Razorpay</h3><p className="mt-1 text-sm text-slate-500">One platform payment gateway shared by active tenants.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">Key ID<input value={integrationSettings.razorpayKeyId} onChange={event => updateIntegration('razorpayKeyId', event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm font-medium">Key secret<input type="password" autoComplete="new-password" value={integrationSettings.razorpayKeySecret} onChange={event => updateIntegration('razorpayKeySecret', event.target.value)} placeholder={integrationSettings.razorpayKeySecretConfigured ? 'Saved; blank keeps current' : 'Enter key secret'} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm font-medium sm:col-span-2">Webhook secret<input type="password" autoComplete="new-password" value={integrationSettings.razorpayWebhookSecret} onChange={event => updateIntegration('razorpayWebhookSecret', event.target.value)} placeholder={integrationSettings.razorpayWebhookSecretConfigured ? 'Saved; blank keeps current' : 'Enter webhook secret'} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              </div>
            </section>
            <button disabled={saving} className="rounded-md bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save platform integrations'}</button>
          </form>
        )}
      </main>
    </div>
  );
};

export default SuperAdminPage;