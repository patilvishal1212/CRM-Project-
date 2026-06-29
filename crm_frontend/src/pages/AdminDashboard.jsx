import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService, employeeService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = ['admin', 'employee', 'qa'];

const EMPTY_EMP_FORM = {
  full_name: '',
  email: '',
  username: '',
  role: 'employee',
  password: '',
};

const getRoleBadge = (role) => {
  switch (role) {
    case 'admin': return 'bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-200/50 dark:border-violet-900/50';
    case 'qa': return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50';
    default: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50';
  }
};

const getStatusBadge = (qa_status) => {
  switch (qa_status) {
    case 'qualified': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
    case 'disqualified': return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
    case 'rework': return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
    default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  }
};

const renderTrendChart = (trends) => {
  if (!trends || trends.length === 0) return null;
  const width = 500, height = 160, pL = 36, pR = 16, pT = 16, pB = 28;
  const cW = width - pL - pR, cH = height - pT - pB;
  const maxVal = Math.max(...trends.map(t => Math.max(t.total, 5)));
  const pts = trends.map((item, i) => ({
    x: pL + (i / (trends.length - 1)) * cW,
    y: pT + cH - (item.total / maxVal) * cH,
    ...item,
  }));
  const qPts = trends.map((item, i) => ({
    x: pL + (i / (trends.length - 1)) * cW,
    y: pT + cH - (item.qualified / maxVal) * cH,
  }));
  const pathStr = (points) => points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = prev.x + (p.x - prev.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');
  const linePath = pathStr(pts);
  const qualPath = pathStr(qPts);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pT + cH} L ${pts[0].x} ${pT + cH} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((r) => (
        <line key={r} x1={pL} y1={pT + r * cH} x2={width - pR} y2={pT + r * cH}
          className="stroke-slate-100 dark:stroke-slate-800" strokeWidth={1} />
      ))}
      <path d={areaPath} fill="url(#ag2)" />
      <path d={linePath} fill="none" className="stroke-indigo-600 dark:stroke-indigo-400" strokeWidth={2.5} strokeLinecap="round" />
      <path d={qualPath} fill="none" className="stroke-emerald-500" strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
      {pts.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={3.5} className="fill-indigo-600 dark:fill-indigo-400" stroke="white" strokeWidth={1.5} />
          <title>{`${pt.month}: ${pt.total} total, ${pt.qualified} qualified`}</title>
        </g>
      ))}
      {pts.map((pt, i) => (
        <text key={i} x={pt.x} y={height - 6} className="fill-slate-400 dark:fill-slate-500" fontSize="9" textAnchor="middle" fontWeight="600">
          {pt.month}
        </text>
      ))}
    </svg>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Employee management state
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [empFormData, setEmpFormData] = useState(EMPTY_EMP_FORM);
  const [empFormLoading, setEmpFormLoading] = useState(false);
  const [empFormError, setEmpFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [empToast, setEmpToast] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [empSearch, setEmpSearch] = useState('');

  const showToast = (msg) => {
    setEmpToast(msg);
    setTimeout(() => setEmpToast(''), 3000);
  };

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await dashboardService.getSummary();
      setData(stats);
    } catch (err) {
      setError('Failed to load dashboard. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setEmpLoading(true);
      const emp = await employeeService.getAll();
      setEmployees(Array.isArray(emp) ? emp : []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setEmpLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchEmployees();
  }, [fetchDashboard, fetchEmployees]);

  // Employee CRUD handlers
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setEmpFormData(EMPTY_EMP_FORM);
    setEmpFormError('');
    setShowEmpModal(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setEmpFormData({
      full_name: emp.full_name,
      email: emp.email,
      username: emp.username,
      role: emp.role,
      password: '',
    });
    setEmpFormError('');
    setShowEmpModal(true);
  };

  const handleCloseModal = () => {
    setShowEmpModal(false);
    setEditingEmployee(null);
    setEmpFormData(EMPTY_EMP_FORM);
    setEmpFormError('');
  };

  const handleEmpFormChange = (e) => {
    const { name, value } = e.target;
    setEmpFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    setEmpFormLoading(true);
    setEmpFormError('');
    try {
      const payload = { ...empFormData };
      if (editingEmployee && !payload.password) delete payload.password;

      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, payload);
        showToast(`${payload.full_name} updated successfully.`);
      } else {
        await employeeService.create(payload);
        showToast(`${payload.full_name} created successfully.`);
      }
      handleCloseModal();
      fetchEmployees();
      fetchDashboard();
    } catch (err) {
      const msg = err?.full_name?.[0] || err?.email?.[0] || err?.username?.[0] ||
        err?.password?.[0] || err?.error || 'Failed to save user. Please check the form.';
      setEmpFormError(msg);
    } finally {
      setEmpFormLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await employeeService.delete(id);
      showToast('User deleted successfully.');
      setDeleteConfirmId(null);
      fetchEmployees();
      fetchDashboard();
    } catch (err) {
      showToast(err?.error || 'Failed to delete user.');
      setDeleteConfirmId(null);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await employeeService.toggleActive(id);
      showToast(res.message || 'Status updated.');
      fetchEmployees();
      fetchDashboard();
    } catch (err) {
      showToast(err?.error || 'Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
        <h3 className="font-bold text-base">Dashboard Error</h3>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const { metrics, trends, campaigns, activities, employees: dashEmp, employee_performance, lead_funnel, employee_wise_daily_counts, date_wise_statistics } = data || {};
  const filteredEmployees = employees.filter(e =>
    `${e.full_name} ${e.email} ${e.role}`.toLowerCase().includes(empSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {empToast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm rounded-2xl shadow-xl animate-slideOver">
          {empToast}
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-indigo-900/90 to-violet-900/90 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-800/40 dark:border-indigo-900/30 shadow-lg">
        <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white">Admin Control Center</h3>
            <p className="mt-1 text-sm text-indigo-200 dark:text-indigo-300">
              Welcome, {user?.name} — complete visibility and control over the system.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 text-xs font-bold text-indigo-200 bg-indigo-800/40 rounded-xl border border-indigo-700/50">
              Role: <span className="capitalize text-white font-mono">Admin</span>
            </span>
            <span className="px-4 py-2 text-xs font-bold text-emerald-300 bg-emerald-900/30 rounded-xl border border-emerald-700/40">
              {metrics?.active_employees} Active Users
            </span>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: metrics?.total_leads, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'indigo', sub: `${metrics?.conversion_rate}% conversion rate` },
          { label: 'Qualified Leads', value: metrics?.qualified_leads, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'emerald', sub: `${metrics?.pending_leads} pending review` },
          { label: 'Active Campaigns', value: metrics?.active_campaigns, icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', color: 'violet', sub: `${metrics?.total_campaigns} total campaigns` },
          { label: 'Total Employees', value: metrics?.total_employees, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'blue', sub: `${metrics?.active_employees} active · ${metrics?.qa_users_count} QA` },
        ].map(({ label, value, icon, color, sub }) => (
          <div key={label} className="flex flex-col p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{label}</span>
              <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-${color}-50 dark:bg-${color}-950/40 text-${color}-600 dark:text-${color}-400`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
            </div>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-3">{value ?? '—'}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{sub}</span>
          </div>
        ))}
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Disqualified', value: metrics?.disqualified_leads, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20' },
          { label: 'Rework Required', value: metrics?.rework_leads, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Monthly Growth', value: `${metrics?.monthly_growth > 0 ? '+' : ''}${metrics?.monthly_growth}%`, color: metrics?.monthly_growth >= 0 ? 'text-emerald-600' : 'text-rose-500', bg: 'bg-slate-50 dark:bg-slate-900' },
          { label: 'Total Budget', value: `$${(metrics?.total_budget || 0).toLocaleString()}`, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`flex flex-col p-4 ${bg} border border-slate-100 dark:border-slate-800 rounded-2xl`}>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{label}</span>
            <span className={`text-2xl font-extrabold mt-1.5 ${color}`}>{value ?? '—'}</span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white">Monthly Lead Trends</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Total vs. Qualified — last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /><span className="text-slate-500 dark:text-slate-400">Total</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-slate-500 dark:text-slate-400">Qualified</span></div>
            </div>
          </div>
          <div className="h-[160px] w-full">{renderTrendChart(trends)}</div>
        </div>

        {/* Lead Funnel */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Lead Funnel</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Pipeline stage distribution</p>
          <div className="space-y-3">
            {(lead_funnel || []).map((stage) => (
              <div key={stage.stage}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-400">{stage.stage}</span>
                  <span className="text-slate-800 dark:text-white">{stage.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${metrics?.total_leads > 0 ? Math.min((stage.count / metrics.total_leads) * 100, 100) : 0}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Campaign Performance</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Top 5 campaigns by leads</p>
        <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
          {(campaigns || []).length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No campaigns yet.</p>
          ) : (
            (campaigns || []).map((camp) => (
              <div key={camp.id} className="pt-4 first:pt-0">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{camp.name}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">Budget: ${camp.budget.toLocaleString()}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                         capitalize ${camp.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {camp.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{camp.leads_count} Leads</span>
                    <p className="text-[10px] text-emerald-500 font-bold">{camp.qualified_count} Qualified</p>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${camp.leads_count > 0 ? Math.min((camp.qualified_count / camp.leads_count) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800">
        {[
          { key: 'overview', label: 'Activity Feed' },
          { key: 'employees', label: 'Employee Management' },
          { key: 'performance', label: 'Employee Performance' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${activeSection === tab.key
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      {activeSection === 'overview' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Recent System Activity</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Latest lead updates across all employees</p>
          <div className="space-y-5 relative before:absolute before:left-3 before:top-2
           before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
            {(activities || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 pl-8">No recent activity.</p>
            ) : (
              (activities || []).map((act) => (
                <div key={act.id} className="relative pl-8">
                  <span className={`absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${act.qa_status === 'qualified' ? 'bg-emerald-500' :
                    act.qa_status === 'disqualified' ? 'bg-rose-500' :
                      act.qa_status === 'rework' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{act.first_name} {act.last_name}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {act.company_name} · {act.campaign_name} ·
                        <span className="text-slate-400 font-normal"> By {act.assigned_to_name}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(act.qa_status)}`}>
                        {act.qa_status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {new Date(act.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* mployee Management */}
      {activeSection === 'employees' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white">User Management</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Add, edit and manage all system users</p>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search users..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300 w-48"
              />
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-tr from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add User
              </button>
            </div>
          </div>

          {empLoading ? (
            <div className="py-16 text-center">
              <svg className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-slate-400">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="py-3.5 px-6">Name / Email</th>
                    <th className="py-3.5 px-6">Username</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Joined</th>
                    <th className="py-3.5 px-6">Last Login</th>
                    <th className="py-3.5 px-6">Leads</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEmployees.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">No users found.</td></tr>
                  ) : filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {emp.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{emp.full_name}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-xs font-mono text-slate-500 dark:text-slate-400">{emp.username}</td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getRoleBadge(emp.role)}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${emp.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">{new Date(emp.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">{emp.last_login ? new Date(emp.last_login).toLocaleDateString() : 'Never'}</td>
                      <td className="py-3.5 px-6 text-sm font-bold text-slate-700 dark:text-slate-300">{emp.leads_count}</td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEditModal(emp)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer">Edit</button>
                          <button onClick={() => handleToggleActive(emp.id)} className={`text-xs font-semibold cursor-pointer ${emp.is_active ? 'text-amber-600 hover:text-amber-800 dark:text-amber-400' : 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400'}`}>
                            {emp.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => setDeleteConfirmId(emp.id)} className="text-xs font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-400 cursor-pointer">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* Employee Performance */}
      {activeSection === 'performance' && (
        <div className="space-y-6">
          {/* Top Performers */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Top Performers</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Ranked by total leads submitted</p>
            <div className="space-y-4">
              {(employee_performance || []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No employee performance data available.</p>
              ) : (
                (employee_performance || []).map((emp, idx) => (
                  <div key={emp.id} className="flex items-center gap-4">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm font-semibold mb-1">
                        <span className="text-slate-800 dark:text-slate-200 truncate">{emp.name}</span>
                        <span className="text-slate-600 dark:text-slate-400 shrink-0 ml-2">{emp.total_leads} leads · {emp.qualified_leads} qualified</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                          style={{ width: `${emp.total_leads > 0 ? Math.min((emp.total_leads / (employee_performance[0]?.total_leads || 1)) * 105, 100) : 0}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{emp.conversion_rate}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date-wise Lead Submission counts */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
              <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Daily Lead Submission Metrics</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Total lead entries submitted per day across all channels</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Day</th>
                      <th className="py-2.5 px-4 text-right">Total Submissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {!date_wise_statistics || date_wise_statistics.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-xs text-slate-400">No submissions logged yet.</td></tr>
                    ) : date_wise_statistics.map((stat, idx) => (
                      <tr key={idx} className="text-xs hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{new Date(stat.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-slate-500">{stat.day}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-805 dark:text-slate-200">{stat.total_leads} leads</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Employee-wise Daily Performance Table */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
              <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Daily Representative Contributions</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Granular performance counts per representative by date</p>

              <div className="overflow-y-auto max-h-[350px] scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sticky top-0 bg-white dark:bg-slate-900 z-10">
                      <th className="py-2.5 px-4">Representative</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4 text-right">Submissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {!employee_wise_daily_counts || employee_wise_daily_counts.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-xs text-slate-400">No representative data found.</td></tr>
                    ) : employee_wise_daily_counts.map((record, idx) => (
                      <tr key={idx} className="text-xs hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-705 dark:text-slate-300">{record.employee_name}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{new Date(record.date).toLocaleDateString()} ({record.day.slice(0, 3)})</td>
                        <td className="py-3 px-4 text-right font-extrabold text-indigo-650 dark:text-indigo-400">{record.total_leads_submitted} leads</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {showEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">{editingEmployee ? 'Edit User' : 'Add New User'}</h4>
                <p className="text-xs text-slate-400">{editingEmployee ? 'Update user details below.' : 'Create a new system user.'}</p>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEmpSubmit} className="p-6 space-y-4">
              {empFormError && (
                <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {empFormError}
                </div>
              )}
              {[
                { label: 'Full Name', name: 'full_name', type: 'text', required: true, placeholder: 'John Doe' },
                { label: 'Email Address', name: 'email', type: 'email', required: true, placeholder: 'john@example.com' },
                { label: 'Username', name: 'username', type: 'text', required: true, placeholder: 'johndoe' },
              ].map(({ label, name, type, required, placeholder }) => (
                <div key={name} className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}{required ? ' *' : ''}</label>
                  <input
                    type={type} name={name} required={required} placeholder={placeholder}
                    value={empFormData[name]}
                    onChange={handleEmpFormChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-300"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role *</label>
                <select name="role" required value={empFormData.role} onChange={handleEmpFormChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-300">
                  {ROLE_OPTIONS.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password {editingEmployee ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password" name="password" placeholder="Min. 6 characters"
                  required={!editingEmployee}
                  value={empFormData.password}
                  onChange={handleEmpFormChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-300"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={empFormLoading} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-tr from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm rounded-xl cursor-pointer disabled:opacity-50">
                  {empFormLoading ? 'Saving...' : (editingEmployee ? 'Save Changes' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">Delete User?</h4>
            <p className="text-sm text-slate-400 mb-5">This action cannot be undone. All associated data will be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-sm cursor-pointer">
                Cancel
              </button>
              <button onClick={() => handleDeleteEmployee(deleteConfirmId)} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm rounded-xl cursor-pointer transition-colors">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
