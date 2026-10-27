import React, { useState, useEffect, useMemo } from 'react';
import { payrollService } from '../services/payrollApi';
import SalarySlipModal from '../components/SalarySlipModal';

const getMonthName = (m) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[(m - 1) % 12] || 'July';
};

const AdminReview = () => {
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [notification, setNotification] = useState(null);

  // Modal inspection state
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const data = await payrollService.getAdminPendingReviews();
      setPendingItems(data);
      setSelectedIds(data.map((item) => item.id));
    } catch (err) {
      console.error('Failed to fetch pending reviews:', err);
      showNotification('Failed to fetch pending payroll reviews.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      const res = await payrollService.reviewPayrollItem(id, action);
      showNotification(res.message || `Payroll item ${action === 'approve' ? 'approved' : 'sent for rework'} successfully!`, 'success');
      
      // Update local state by removing processed item
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      console.error(`Action ${action} failed for item ${id}:`, err);
      showNotification(`Action failed for record #${id}.`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      showNotification('Please select at least one record for bulk action.', 'error');
      return;
    }

    setProcessingId('bulk');
    let count = 0;
    try {
      for (const id of selectedIds) {
        await payrollService.reviewPayrollItem(id, action);
        count++;
      }
      showNotification(`Bulk ${action === 'approve' ? 'approved' : 'flagged for rework'} ${count} payroll records!`, 'success');
      setPendingItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk action failed:', err);
      showNotification('Bulk processing encountered an error.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleSelectId = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingItems.map((item) => item.id));
    }
  };

  const handlePreviewSlip = (item) => {
    setSelectedSlip(item);
    setIsModalOpen(true);
  };

  // Analytics Metrics Calculation
  const metrics = useMemo(() => {
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    pendingItems.forEach((item) => {
      totalGross += Number(item.gross_earnings || 0);
      totalDeductions += Number(item.total_deductions || 0);
      totalNet += Number(item.net_salary_payable || 0);
    });

    return { totalGross, totalDeductions, totalNet };
  }, [pendingItems]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-900/60 text-purple-300 border border-purple-700/50">
              Admin Authorization Gateway
            </span>
            <span className="text-xs text-slate-400">Payroll Cross-Check & Lock Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Payroll Review & Approval</h1>
          <p className="text-xs text-slate-400 mt-1">Cross-check HR submissions, verify calculated net payables, and publish live payslips.</p>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleBulkAction('rework')}
            disabled={processingId !== null || selectedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Send Selected for Rework ({selectedIds.length})
          </button>

          <button
            onClick={() => handleBulkAction('approve')}
            disabled={processingId !== null || selectedIds.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Approve & Release Selected ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          notification.type === 'error' ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Summary Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Pending Requests */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending Review Queue</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white">{pendingItems.length}</span>
            <span className="text-xs text-slate-400 font-medium">Submissions</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Awaiting Admin Sign-off</span>
        </div>

        {/* Card 2: Total Gross Earnings */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Outflow Baseline</span>
          <div className="text-2xl font-black text-white font-mono mt-2">
            ₹{metrics.totalGross.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Before Statutory Deductions</span>
        </div>

        {/* Card 3: Total Deductions */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Withheld Deductions</span>
          <div className="text-2xl font-black text-rose-300 font-mono mt-2">
            ₹{metrics.totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-rose-500/80 mt-2">PF + PT + Attendance Loss</span>
        </div>

        {/* Card 4: Net Salary Payable Pool */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Net Payable Outflow Pool</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
            ₹{metrics.totalNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-emerald-500 font-medium mt-2">Direct Bank Transfer Total</span>
        </div>
      </div>

      {/* Read-Only Analytics Dashboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-200 text-sm">HR Submitted Compensation Reviews</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800">
              Pending Validation
            </span>
          </div>

          {pendingItems.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all-admin"
                checked={selectedIds.length === pendingItems.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded accent-indigo-600 bg-slate-950 border-slate-700 cursor-pointer"
              />
              <label htmlFor="select-all-admin" className="text-xs text-slate-400 font-medium cursor-pointer">
                Select All
              </label>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-purple-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Fetching pending payroll submissions...</span>
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-300 text-sm">All Pending Submissions Processed!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">No payroll evaluations are currently waiting for admin review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-center w-10">Select</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3 text-center">Unpaid / Half Days</th>
                  <th className="px-4 py-3 text-right">Incentives</th>
                  <th className="px-4 py-3 text-right">Gross Earnings</th>
                  <th className="px-4 py-3 text-right">Total Deductions</th>
                  <th className="px-4 py-3 text-right">Net Salary Payable</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {pendingItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isProcessing = processingId === item.id;

                  return (
                    <tr key={item.id} className={`transition-colors hover:bg-slate-800/40 ${isSelected ? 'bg-purple-950/10' : ''}`}>
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectId(item.id)}
                          className="w-4 h-4 rounded accent-indigo-600 bg-slate-950 border-slate-700 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{item.employee_name || item.employee_email?.split('@')[0]}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.employee_email}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-indigo-300">
                          {getMonthName(item.month)} {item.year}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="font-mono text-slate-200">
                          <span className={item.unpaid_leaves > 0 ? 'text-rose-400 font-bold' : ''}>{item.unpaid_leaves || 0}d unpaid</span>
                          {' / '}
                          <span className={item.half_day_leaves > 0 ? 'text-amber-400 font-bold' : ''}>{item.half_day_leaves || 0}d half</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-emerald-400 font-semibold">
                        +₹{(Number(item.incentives || 0) + Number(item.performance_allowance || 0)).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-slate-200">
                        ₹{Number(item.gross_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-rose-400 font-semibold">
                        -₹{Number(item.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                        ₹{Number(item.net_salary_payable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Preview Slip Button */}
                          <button
                            onClick={() => handlePreviewSlip(item)}
                            title="Preview Printable Slip Sheet"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Approve & Release */}
                          <button
                            onClick={() => handleAction(item.id, 'approve')}
                            disabled={isProcessing}
                            title="Approve & Release Slip"
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>

                          {/* Reject & Send for Rework */}
                          <button
                            onClick={() => handleAction(item.id, 'rework')}
                            disabled={isProcessing}
                            title="Reject & Send for Rework"
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Salary Slip Modal Inspection */}
      <SalarySlipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slipData={selectedSlip}
      />

    </div>
  );
};

export default AdminReview;
