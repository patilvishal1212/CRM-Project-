import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dailyTrackerService } from '../services/dailyTrackerApi';

const DailyTrackerPortal = () => {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

  // Active view tab for Admin/HR ('overseer' or 'log_entry')
  const [activeTab, setActiveTab] = useState(isAdminOrHR ? 'overseer' : 'log_entry');

  // Form State
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [countInput, setCountInput] = useState('');
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Personal Logs State
  const [myLogs, setMyLogs] = useState([]);
  const [loadingMyLogs, setLoadingMyLogs] = useState(false);

  // Overseer Master Grid State (Admin/HR)
  const [workforceRecords, setWorkforceRecords] = useState([]);
  const [loadingWorkforce, setLoadingWorkforce] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editCount, setEditCount] = useState('');
  const [editCampaign, setEditCampaign] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchMyLogs();
    if (isAdminOrHR) {
      fetchWorkforceRecords();
    }
  }, [isAdminOrHR]);

  const fetchCampaigns = async () => {
    try {
      const data = await dailyTrackerService.getCampaigns();
      setCampaigns(data || []);
      if (data && data.length > 0) {
        setSelectedCampaign(data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    }
  };

  const fetchMyLogs = async () => {
    setLoadingMyLogs(true);
    try {
      const data = await dailyTrackerService.getMyLogs();
      setMyLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch personal logs:', err);
    } finally {
      setLoadingMyLogs(false);
    }
  };

  const fetchWorkforceRecords = async () => {
    setLoadingWorkforce(true);
    try {
      const data = await dailyTrackerService.getWorkforceRecords();
      setWorkforceRecords(data || []);
    } catch (err) {
      console.error('Failed to fetch workforce records:', err);
    } finally {
      setLoadingWorkforce(false);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedCampaign) {
      setFormError('Please select a campaign channel.');
      return;
    }
    if (!countInput || isNaN(countInput) || Number(countInput) < 0) {
      setFormError('Please enter a valid positive conversion integer count.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dailyTrackerService.logCount({
        campaign: parseInt(selectedCampaign, 10),
        count: parseInt(countInput, 10),
        logged_date: loggedDate,
      });
      setFormSuccess('Daily conversion count recorded successfully!');
      setCountInput('');
      fetchMyLogs();
      if (isAdminOrHR) {
        fetchWorkforceRecords();
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setFormError(err.response?.data?.detail || 'Failed to record count log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Overseer Actions: Edit & Delete
  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setEditCount(record.count.toString());
    setEditCampaign(record.campaign.toString());
    setEditDate(record.logged_date);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setIsSavingEdit(true);
    try {
      await dailyTrackerService.updateWorkforceRecord(editingRecord.id, {
        campaign: parseInt(editCampaign, 10),
        count: parseInt(editCount, 10),
        logged_date: editDate,
      });
      setEditingRecord(null);
      fetchWorkforceRecords();
      fetchMyLogs();
    } catch (err) {
      console.error('Failed to update record:', err);
      alert('Failed to update record. Please check inputs.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workforce record entry?')) return;
    try {
      await dailyTrackerService.deleteWorkforceRecord(id);
      fetchWorkforceRecords();
      fetchMyLogs();
    } catch (err) {
      console.error('Failed to delete record:', err);
      alert('Failed to delete record.');
    }
  };

  // Overseer filtering
  const filteredWorkforce = workforceRecords.filter((rec) => {
    const matchesSearch =
      rec.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.logged_date?.includes(searchQuery);
    const matchesRole = roleFilter === 'ALL' || rec.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
              Workforce Conversion Analytics
            </span>
            <span className="text-xs text-slate-400">Independent Daily Track System</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Daily Conversion Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">Log daily lead conversions, campaign outputs, and monitor workforce metric records.</p>
        </div>

        {/* Tab Toggle for Admin / HR */}
        {isAdminOrHR && (
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('overseer')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'overseer'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overseer Dashboard
            </button>
            <button
              onClick={() => setActiveTab('log_entry')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'log_entry'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log Count Entry
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: OVERSEER DASHBOARD GRID (ADMIN / HR) */}
      {isAdminOrHR && activeTab === 'overseer' && (
        <div className="space-y-6">
          
          {/* Filters & Search Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-400">Role Filter:</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="qa">QA</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search employee, campaign, date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Workforce Master Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-200 text-sm">Master Workforce Daily Logs</h2>
              <span className="text-xs text-slate-400 font-medium">Showing {filteredWorkforce.length} Logged Entries</span>
            </div>

            {loadingWorkforce ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <svg className="w-8 h-8 text-indigo-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Fetching workforce daily logs...</span>
              </div>
            ) : filteredWorkforce.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-sm font-semibold">No daily logs found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Logged Date</th>
                      <th className="px-6 py-3.5">Employee Name</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Campaign Channel</th>
                      <th className="px-6 py-3.5 text-right">Count Parameter</th>
                      <th className="px-6 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {filteredWorkforce.map((rec) => (
                      <tr key={rec.id} className="transition-colors hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-mono text-slate-200 font-bold">{rec.logged_date}</td>
                        <td className="px-6 py-4 font-semibold text-white">{rec.employee_name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-indigo-300 border border-slate-700">
                            {rec.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-300">{rec.campaign_name}</td>
                        <td className="px-6 py-4 text-right font-mono font-black text-emerald-400 text-base">
                          {rec.count}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(rec)}
                              className="px-3 py-1 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 rounded-lg font-semibold transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="px-3 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg font-semibold transition-all cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: EMPLOYEE LOGGING INTERFACE */}
      {(!isAdminOrHR || activeTab === 'log_entry') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Submission Form View */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-fit">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-bold text-slate-200 text-base">Submit Conversion Count</h2>
            </div>

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl">
                {formSuccess}
              </div>
            )}
            {formError && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleLogSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Campaign Channel</label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-semibold rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {campaigns.length === 0 ? (
                    <option value="">No Campaigns Available</option>
                  ) : (
                    campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Logged Date</label>
                <input
                  type="date"
                  value={loggedDate}
                  onChange={(e) => setLoggedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-semibold rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Integer Count Parameter</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 15"
                  value={countInput}
                  onChange={(e) => setCountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-mono font-bold text-base rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Recording Log...' : 'Submit Daily Count'}
              </button>
            </form>
          </div>

          {/* Isolated Timeline Grid (Personal Logging History) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-200 text-sm">Personal Logging History</h2>
              <span className="text-xs text-slate-400 font-medium">Showing {myLogs.length} Entries</span>
            </div>

            {loadingMyLogs ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <svg className="w-8 h-8 text-indigo-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading your timeline...</span>
              </div>
            ) : myLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-sm font-semibold">No logs recorded yet. Use the form to submit your first daily count!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Campaign Channel</th>
                      <th className="px-6 py-3.5 text-right">Count Recorded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {myLogs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-mono text-slate-200 font-bold">{log.logged_date}</td>
                        <td className="px-6 py-4 font-semibold text-white">{log.campaign_name}</td>
                        <td className="px-6 py-4 text-right font-mono font-black text-emerald-400 text-base">
                          {log.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Edit Modal (Admin / HR) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit Workforce Entry Errors</h3>
            <p className="text-xs text-slate-400">Updating record for {editingRecord.employee_name}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Campaign Channel</label>
                <select
                  value={editCampaign}
                  onChange={(e) => setEditCampaign(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Logged Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Count Parameter</label>
                <input
                  type="number"
                  value={editCount}
                  onChange={(e) => setEditCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold rounded-xl p-2.5 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyTrackerPortal;
