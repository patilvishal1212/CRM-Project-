import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../services/leaveApi';

const LeavePortal = () => {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

  // Active view tab ('approvals' or 'apply')
  const [activeTab, setActiveTab] = useState(isAdminOrHR ? 'approvals' : 'apply');

  // Balances State
  const [balances, setBalances] = useState({
    casual_total: 12,
    casual_used: 0,
    casual_remaining: 12,
    sick_total: 10,
    sick_used: 0,
    sick_remaining: 10,
    unpaid_used: 0,
  });

  // Employee Apply Form State
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Personal Requests State
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // HR/Admin Pending Queue State
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchBalances();
    fetchMyRequests();
    if (isAdminOrHR) {
      fetchPendingQueue();
    }
  }, [isAdminOrHR]);

  const fetchBalances = async () => {
    try {
      const data = await leaveService.getBalances();
      if (data) setBalances(data);
    } catch (err) {
      console.error('Failed to load leave balances:', err);
    }
  };

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await leaveService.getMyRequests();
      setMyRequests(data || []);
    } catch (err) {
      console.error('Failed to load personal leave requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchPendingQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await leaveService.getPendingRequests();
      setPendingQueue(data || []);
    } catch (err) {
      console.error('Failed to load pending queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  // Calculate requested days preview
  const calcDaysPreview = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const daysCount = calcDaysPreview();
    if (daysCount <= 0) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Please provide a reason description for your leave application.');
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveService.applyLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      setFormSuccess('Leave application submitted successfully for review!');
      setReason('');
      fetchBalances();
      fetchMyRequests();
      if (isAdminOrHR) {
        fetchPendingQueue();
      }
    } catch (err) {
      console.error('Leave application failed:', err);
      setFormError(err.response?.data?.detail || 'Failed to submit leave application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // HR & Admin Action Handlers
  const handleReviewAction = async (id, actionStatus) => {
    setProcessingId(id);
    try {
      await leaveService.reviewLeave(id, actionStatus);
      fetchPendingQueue();
      fetchBalances();
      fetchMyRequests();
    } catch (err) {
      console.error(`Failed to update leave status to ${actionStatus}:`, err);
      alert(`Failed to mark leave request as ${actionStatus}.`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              Enterprise Leave System
            </span>
            <span className="text-xs text-slate-400">Isolated Workday & Absence Matrix</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Leave Management Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Submit time-off requests, track remaining quota balances, and execute administrative approval loops.</p>
        </div>

        {/* Tab Toggle for Admin / HR */}
        {isAdminOrHR && (
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'approvals'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Approval Matrix Queue
            </button>
            <button
              onClick={() => setActiveTab('apply')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'apply'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Apply / My Leaves
            </button>
          </div>
        )}
      </div>

      {/* LEAVE BALANCES SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Casual Leave Balance */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Casual Leave Remaining</span>
            <span className="text-xs text-slate-400">Quota: {balances.casual_total} Days/yr</span>
          </div>
          <div className="text-3xl font-black text-white font-mono mt-3">
            {balances.casual_remaining} <span className="text-sm font-semibold text-slate-400">Days</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (balances.casual_remaining / balances.casual_total) * 100)}%` }}
            />
          </div>
        </div>

        {/* Sick Leave Balance */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Sick Leave Remaining</span>
            <span className="text-xs text-slate-400">Quota: {balances.sick_total} Days/yr</span>
          </div>
          <div className="text-3xl font-black text-white font-mono mt-3">
            {balances.sick_remaining} <span className="text-sm font-semibold text-slate-400">Days</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (balances.sick_remaining / balances.sick_total) * 100)}%` }}
            />
          </div>
        </div>

        {/* Unpaid Leaves Count */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Unpaid Leaves Logged</span>
            <span className="text-xs text-rose-400 font-semibold">Deduction Tier</span>
          </div>
          <div className="text-3xl font-black text-rose-300 font-mono mt-3">
            {balances.unpaid_used} <span className="text-sm font-semibold text-slate-400">Days</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Deducted from monthly basic compensation</span>
        </div>
      </div>

      {/* VIEW 1: HR & ADMIN APPROVAL INTERFACE */}
      {isAdminOrHR && activeTab === 'approvals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-200 text-sm">Workforce Leave Request Approval Array</h2>
            <span className="text-xs text-slate-400 font-medium">Pending & Recent Requests ({pendingQueue.length})</span>
          </div>

          {loadingQueue ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-emerald-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading leave approval queue...</span>
            </div>
          ) : pendingQueue.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-semibold">No pending leave requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Employee Name</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Leave Type</th>
                    <th className="px-6 py-3.5">Date Boundaries</th>
                    <th className="px-6 py-3.5 text-center">Duration</th>
                    <th className="px-6 py-3.5">Reason Description</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-center">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {pendingQueue.map((req) => {
                    const isPending = req.status === 'pending';
                    const isProcessing = processingId === req.id;

                    return (
                      <tr key={req.id} className="transition-colors hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-sm">{req.employee_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{req.employee_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-indigo-300 border border-slate-700">
                            {req.employee_role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-200">{req.leave_type}</td>
                        <td className="px-6 py-4 font-mono text-slate-300 text-xs">
                          {req.start_date} <span className="text-slate-500">to</span> {req.end_date}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-white">
                          {req.total_days} {req.total_days === 1 ? 'Day' : 'Days'}
                        </td>
                        <td className="px-6 py-4 max-w-xs text-slate-400 truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {req.status === 'approved' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                              [ Approved ]
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">
                              [ Rejected ]
                            </span>
                          )}
                          {req.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              [ Pending Review ]
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isPending ? (
                            <div className="flex items-center justify-center gap-2">
                              {/* Approve Leave Badge */}
                              <button
                                onClick={() => handleReviewAction(req.id, 'approved')}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                              >
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve Leave
                              </button>

                              {/* Reject Leave Badge */}
                              <button
                                onClick={() => handleReviewAction(req.id, 'rejected')}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                              >
                                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject Leave
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">
                              Reviewed by {req.reviewed_by_name || 'Admin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: EMPLOYEE WORKVIEW (APPLY FORM & PERSONAL HISTORY) */}
      {(!isAdminOrHR || activeTab === 'apply') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Leave Application Form */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-fit">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className="font-bold text-slate-200 text-base">Apply for Leave</h2>
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

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-semibold rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="Casual Leave">Casual Leave (Remaining: {balances.casual_remaining}d)</option>
                  <option value="Sick Leave">Sick Leave (Remaining: {balances.sick_remaining}d)</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-semibold rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-semibold rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Total Duration Requested:</span>
                <span className="font-bold text-white font-mono">{calcDaysPreview()} {calcDaysPreview() === 1 ? 'Day' : 'Days'}</span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason Description</label>
                <textarea
                  rows="3"
                  placeholder="State your reason for leave request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-medium rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Leave Request'}
              </button>
            </form>
          </div>

          {/* Personal Leave Requests Timeline */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-200 text-sm">My Leave Application History</h2>
              <span className="text-xs text-slate-400 font-medium">Showing {myRequests.length} Applications</span>
            </div>

            {loadingRequests ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <svg className="w-8 h-8 text-indigo-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Fetching leave applications...</span>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-sm font-semibold">No leave applications found. Use the form to apply for leave.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Leave Type</th>
                      <th className="px-6 py-3.5">Date Boundaries</th>
                      <th className="px-6 py-3.5 text-center">Days</th>
                      <th className="px-6 py-3.5">Reason</th>
                      <th className="px-6 py-3.5 text-center">Status Pill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {myRequests.map((req) => (
                      <tr key={req.id} className="transition-colors hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-bold text-white">{req.leave_type}</td>
                        <td className="px-6 py-4 font-mono text-slate-300">
                          {req.start_date} <span className="text-slate-500">to</span> {req.end_date}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-200">{req.total_days}</td>
                        <td className="px-6 py-4 max-w-xs text-slate-400 truncate" title={req.reason}>{req.reason}</td>
                        <td className="px-6 py-4 text-center">
                          {req.status === 'approved' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                              [ Approved ]
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">
                              [ Rejected ]
                            </span>
                          )}
                          {req.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              [ Pending ]
                            </span>
                          )}
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

    </div>
  );
};

export default LeavePortal;
