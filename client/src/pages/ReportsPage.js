import React, { useState } from 'react';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('revenue');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports & Analytics</h1>

      <div className="card mb-6">
        <h2 className="text-2xl font-bold mb-4">Report Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="revenue">Monthly Revenue</option>
              <option value="pendingPayments">Pending Payments</option>
              <option value="delivery">Delivery Report</option>
              <option value="staffWorkload">Staff Workload</option>
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="input-field">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="input-field">
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="btn-primary w-full">Generate Report</button>
            <button className="btn-secondary w-full">Export PDF</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Report Results</h2>
        <div className="text-center py-8 text-gray-600">
          Select report type and date to generate report
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
