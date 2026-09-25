import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { dashboardAPI } from '../services/api';
import TablePagination from '../components/TablePagination';

const COLORS = ['#0f766e', '#d97706', '#be123c', '#2563eb', '#7c3aed', '#475569'];
const REPORT_TYPES = [
  { value: 'revenue', label: 'Revenue pulse', description: 'Collections and order value' },
  { value: 'pendingPayments', label: 'Payment watch', description: 'Outstanding customer balances' },
  { value: 'delivery', label: 'Delivery desk', description: 'Production pipeline and due work' },
  { value: 'staffWorkload', label: 'Team workload', description: 'Orders by assigned maker' }
];

const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const monthName = value => new Date(2024, value - 1, 1).toLocaleString('en-IN', { month: 'short' });

const ReportsPage = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [reportType, setReportType] = useState('revenue');
  const [month, setMonth] = useState('all');
  const [year, setYear] = useState(String(currentYear));
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getReports();
        setReport(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load report data');
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  const filtered = useMemo(() => {
    if (!report) return { orders: [], payments: [], customers: [], inventory: [] };
    const matchesPeriod = item => {
      const date = item.orderDate || item.paymentDate || item.dateAdded || item.createdAt;
      if (!date) return true;
      const parsed = new Date(date);
      return (year === 'all' || parsed.getFullYear() === Number(year))
        && (month === 'all' || parsed.getMonth() + 1 === Number(month));
    };
    const query = search.trim().toLowerCase();
    const matchesSearch = item => !query || JSON.stringify(item).toLowerCase().includes(query);
    const orders = (report.orders || []).filter(order => matchesPeriod(order)
      && (status === 'all' || order.status === status) && matchesSearch(order));
    const orderIds = new Set(orders.map(order => order.id));
    const payments = (report.payments || []).filter(payment => matchesPeriod(payment)
      && orderIds.has(payment.orderId) && matchesSearch(payment));
    const customers = (report.customers || []).filter(customer => matchesPeriod(customer) && matchesSearch(customer));
    return { orders, payments, customers, inventory: report.inventory || [] };
  }, [report, month, year, status, search]);

  useEffect(() => {
    setPage(1);
  }, [month, year, status, search]);

  const visibleOrders = filtered.orders.slice((page - 1) * pageSize, page * pageSize);

  const metrics = useMemo(() => {
    const revenue = filtered.payments.reduce((sum, payment) => sum + Number(payment.amount || payment.advancePaid || 0), 0);
    const orderValue = filtered.orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const outstanding = filtered.orders.reduce((sum, order) => sum + Number(order.balanceAmount || 0), 0);
    const delivered = filtered.orders.filter(order => order.status === 'Delivered').length;
    const uniqueCustomers = new Set(filtered.orders.map(order => order.customerId).filter(Boolean)).size;
    return { revenue, orderValue, outstanding, delivered, uniqueCustomers };
  }, [filtered]);

  const statusData = useMemo(() => {
    const counts = filtered.orders.reduce((result, order) => {
      result[order.status || 'Unassigned'] = (result[order.status || 'Unassigned'] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered.orders]);

  const monthlyData = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentYear, currentMonth - 5 + index, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const payments = filtered.payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate || payment.createdAt);
      return `${paymentDate.getFullYear()}-${paymentDate.getMonth()}` === key;
    });
    return { month: date.toLocaleString('en-IN', { month: 'short' }), revenue: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) };
  }), [filtered.payments, currentYear, currentMonth]);

  const workloadData = useMemo(() => {
    const workload = filtered.orders.reduce((result, order) => {
      const name = order.assignedTo || 'Unassigned';
      result[name] = (result[name] || 0) + 1;
      return result;
    }, {});
    return Object.entries(workload).map(([name, orders]) => ({ name, orders })).sort((a, b) => b.orders - a.orders).slice(0, 8);
  }, [filtered.orders]);

  const pendingCustomers = useMemo(() => {
    const balances = filtered.orders.reduce((result, order) => {
      const name = order.customerName || 'Unknown customer';
      result[name] = (result[name] || 0) + Number(order.balanceAmount || 0);
      return result;
    }, {});
    return Object.entries(balances).map(([name, balance]) => ({ name, balance })).sort((a, b) => b.balance - a.balance).slice(0, 8);
  }, [filtered.orders]);

  const exportReport = () => {
    const rows = [['Order', 'Customer', 'Status', 'Assigned To', 'Amount', 'Balance'], ...filtered.orders.map(order => [order.orderId, order.customerName, order.status, order.assignedTo, order.amount, order.balanceAmount])];
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `boutique-${reportType}-${year}-${month}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const resetFilters = () => { setMonth('all'); setYear(String(currentYear)); setStatus('all'); setSearch(''); };
  const activeReport = REPORT_TYPES.find(item => item.value === reportType);

  if (loading) return <div className="flex min-h-[420px] items-center justify-center text-slate-500">Loading your live report data...</div>;

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-7 text-white shadow-xl md:px-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[28px] border-amber-400/20" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Atelier intelligence</p><h1 className="text-3xl font-bold md:text-4xl">Reports & Analytics</h1><p className="mt-2 max-w-xl text-sm text-slate-300">A live view of your boutique performance, production flow, and cash position.</p></div>
          <button type="button" onClick={exportReport} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">Export filtered CSV</button>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h2 className="text-lg font-bold text-slate-900">Build your view</h2><p className="text-sm text-slate-500">Every number and chart below updates as you refine the filters.</p></div><button type="button" onClick={resetFilters} className="text-sm font-semibold text-teal-700 hover:text-teal-900">Reset filters</button></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <label className="lg:col-span-2"><span className="label">Search orders or customers</span><input value={search} onChange={event => setSearch(event.target.value)} className="input-field" placeholder="Try a name, order ID, or status" /></label>
          <label><span className="label">Year</span><select value={year} onChange={event => setYear(event.target.value)} className="input-field"><option value="all">All years</option>{Array.from({ length: 5 }, (_, index) => <option key={index} value={currentYear - index}>{currentYear - index}</option>)}</select></label>
          <label><span className="label">Month</span><select value={month} onChange={event => setMonth(event.target.value)} className="input-field"><option value="all">All months</option>{Array.from({ length: 12 }, (_, index) => <option key={index} value={index + 1}>{monthName(index + 1)}</option>)}</select></label>
          <label><span className="label">Order status</span><select value={status} onChange={event => setStatus(event.target.value)} className="input-field"><option value="all">All statuses</option>{['New', 'In Stitching', 'Trial Done', 'Alteration', 'Ready', 'Delivered'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[['Filtered orders', filtered.orders.length, 'from your selected view', 'text-teal-700'], ['Collected revenue', money(metrics.revenue), 'payments received', 'text-emerald-700'], ['Outstanding balance', money(metrics.outstanding), 'still to collect', 'text-rose-700'], ['Delivered orders', `${metrics.delivered} / ${filtered.orders.length}`, `${metrics.uniqueCustomers} active customers`, 'text-amber-700']].map(([label, value, detail, color]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px">{REPORT_TYPES.map(item => <button key={item.value} type="button" onClick={() => setReportType(item.value)} className={`min-w-max border-b-2 px-3 py-3 text-left transition ${reportType === item.value ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}><span className="block text-sm font-bold">{item.label}</span><span className="block text-xs">{item.description}</span></button>)}</div>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-lg font-bold text-slate-900">{activeReport.label}</h2><p className="text-sm text-slate-500">{activeReport.description}</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{filtered.orders.length} rows</span></div>
          <div className="h-72">{reportType === 'revenue' ? <ResponsiveContainer><LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="month" /><YAxis tickFormatter={value => `₹${value / 1000}k`} /><Tooltip formatter={value => [money(value), 'Revenue']} /><Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={3} dot={{ r: 4, fill: '#d97706' }} /></LineChart></ResponsiveContainer> : reportType === 'staffWorkload' ? <ResponsiveContainer><BarChart data={workloadData} layout="vertical" margin={{ left: 20, right: 16 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="orders" fill="#0f766e" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer> : reportType === 'pendingPayments' ? <ResponsiveContainer><BarChart data={pendingCustomers} margin={{ bottom: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-20} textAnchor="end" height={55} tick={{ fontSize: 10 }} /><YAxis tickFormatter={value => `₹${value / 1000}k`} /><Tooltip formatter={value => [money(value), 'Balance']} /><Bar dataKey="balance" fill="#be123c" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={88} innerRadius={52} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>{statusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:col-span-2"><h2 className="text-lg font-bold text-slate-900">Report snapshot</h2><p className="mt-1 text-sm text-slate-500">{year === 'all' ? 'All years' : year} · {month === 'all' ? 'All months' : monthName(Number(month))} · {status === 'all' ? 'All statuses' : status}</p><div className="mt-6 space-y-4">{[['Order value', money(metrics.orderValue)], ['Collected', money(metrics.revenue)], ['Collection rate', metrics.orderValue ? `${Math.round((metrics.revenue / metrics.orderValue) * 100)}%` : '0%'], ['Inventory on hand', money(filtered.inventory.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0))]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-slate-200 pb-3"><span className="text-sm text-slate-600">{label}</span><strong className="text-slate-900">{value}</strong></div>)}</div><div className="mt-8 rounded-xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Quick read</p><p className="mt-2 text-sm leading-6 text-slate-600">{metrics.outstanding > 0 ? `${money(metrics.outstanding)} is currently tied up in outstanding orders.` : 'Your filtered orders have no outstanding balance.'} {metrics.delivered > 0 ? `${metrics.delivered} orders have reached delivery.` : 'No delivered orders match this view yet.'}</p></div></div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
          <div><h2 className="text-lg font-bold text-slate-900">Filtered order ledger</h2><p className="mt-1 text-sm text-slate-500">Showing {filtered.orders.length} matching orders with live calculated values.</p></div>
          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">{filtered.orders.length} orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-300"><tr><th className="px-5 py-3 font-semibold">Order</th><th className="px-5 py-3 font-semibold">Customer</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Assigned to</th><th className="px-5 py-3 text-right font-semibold">Value</th><th className="px-5 py-3 text-right font-semibold">Balance</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{visibleOrders.map(order => <tr key={order.id} className="transition hover:bg-teal-50/40"><td className="whitespace-nowrap px-5 py-4 font-bold text-teal-800">{order.orderId}</td><td className="px-5 py-4 font-medium text-slate-800">{order.customerName || 'Unknown'}</td><td className="px-5 py-4"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{order.status}</span></td><td className="px-5 py-4 text-slate-600">{order.assignedTo || 'Unassigned'}</td><td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-800">{money(order.amount)}</td><td className={`whitespace-nowrap px-5 py-4 text-right font-bold ${Number(order.balanceAmount) > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{money(order.balanceAmount)}</td></tr>)}</tbody>
          </table>
          {filtered.orders.length === 0 && <div className="px-5 py-14 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-400">—</div><p className="font-semibold text-slate-700">No matching orders</p><p className="mt-1 text-sm text-slate-500">Try broadening the date, status, or search filters.</p></div>}
        </div>
        {filtered.orders.length > 0 && <div className="border-t border-slate-100 px-5 py-3"><TablePagination totalItems={filtered.orders.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} /></div>}
      </section>
    </div>
  );
};

export default ReportsPage;