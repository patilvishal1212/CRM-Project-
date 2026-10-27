import React, { useState, useEffect } from 'react';
import { payrollService, payrollAxios } from '../services/payrollApi';
import SalarySlipModal from '../components/SalarySlipModal';

const getMonthName = (m) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[(m - 1) % 12] || 'July';
};

const EmployeePayslips = () => {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMySlips();
  }, []);

  const fetchMySlips = async () => {
    setLoading(true);
    try {
      const data = await payrollService.getMyPayslips();
      setSlips(data || []);
    } catch (err) {
      console.error('Failed to fetch employee payslips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSlipModal = (slip) => {
    setSelectedSlip(slip);
    setIsModalOpen(true);
  };

  // Secure Binary Blob PDF Direct Download Handler
  const handleDownload = async (slipId, month, year) => {
    setDownloadingId(slipId);
    try {
      // Hits the newly matched absolute stream view route path mapping 
      const response = await payrollAxios.get(`/payroll/download-slip/${slipId}/`, { 
        responseType: 'blob' // Enforces raw binary buffer retrieval instead of string parsing
      });
      
      // Bind incoming data payload to an absolute PDF native browser stream pointer
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Salary_Slip_${month}_${year}.pdf`); // Forces local OS storage download sequence
      document.body.appendChild(link);
      link.click();
      
      // Clean up dynamic DOM allocation vectors
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download matrix stream call failed due to endpoint routing mismatch", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadPDF = (slip) => {
    const month = getMonthName(slip.month);
    handleDownload(slip.id, month, slip.year);
  };

  // Filter slips by year and search query
  const filteredSlips = slips.filter((slip) => {
    const matchesYear = selectedYear === 'ALL' || slip.year.toString() === selectedYear;
    const monthName = getMonthName(slip.month).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = monthName.includes(query) || slip.year.toString().includes(query);
    return matchesYear && matchesSearch;
  });

  // Stats summary
  const latestSlip = slips[0];
  const yearToDateEarned = slips.reduce((sum, s) => sum + Number(s.net_salary_payable || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Page Title Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              Personal Financial Vault
            </span>
            <span className="text-xs text-slate-400">Verified Corporate Payslip Records</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">My Salary Slips & History</h1>
          <p className="text-xs text-slate-400 mt-1">Access monthly salary breakdowns, tax withholdings, and download vector A4 payslip statements.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMySlips}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Vault
          </button>
        </div>
      </div>

      {/* Summary Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Latest Take-Home */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest Net Take-Home Pay</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
            ₹{latestSlip ? Number(latestSlip.net_salary_payable).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <span className="text-[10px] text-slate-500 mt-2">
            {latestSlip ? `${getMonthName(latestSlip.month)} ${latestSlip.year}` : 'No slips published yet'}
          </span>
        </div>

        {/* Total Year-to-Date Earned */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Year-To-Date Take-Home Total</span>
          <div className="text-2xl font-black text-white font-mono mt-2">
            ₹{yearToDateEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-indigo-300/80 mt-2">Cumulative Deposited Salary</span>
        </div>

        {/* Total Approved Payslips */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between bg-gradient-to-br from-slate-900 to-emerald-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Approved Payslip Records</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white">{slips.length}</span>
            <span className="text-xs text-slate-400">Monthly Statements</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-medium mt-2">100% Tax & PF Verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Financial Years</option>
              <option value="2026">FY 2026-27</option>
              <option value="2025">FY 2025-26</option>
            </select>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search month or year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Timeline Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-200 text-sm">Monthly Compensation Timeline</h2>
          <span className="text-xs text-slate-400 font-medium">Showing {filteredSlips.length} Statements</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-emerald-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Decrypting salary slips from vault...</span>
          </div>
        ) : filteredSlips.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="font-bold text-slate-300 text-sm">No Published Payslips Found</h4>
            <p className="text-xs text-slate-500 mt-1">Once HR processes and Admin approves your monthly compensation, your slips will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Month & Year</th>
                  <th className="px-6 py-3.5">Paid / Release Date</th>
                  <th className="px-6 py-3.5 text-right">Gross Earnings</th>
                  <th className="px-6 py-3.5 text-right">Total Deductions</th>
                  <th className="px-6 py-3.5 text-right">Net Salary (Take-Home)</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {filteredSlips.map((slip) => {
                  const paidDateFormatted = slip.paid_date || slip.created_at?.split('T')[0] || 'Processed';
                  const isDownloading = downloadingId === slip.id;

                  return (
                    <tr key={slip.id} className="transition-colors hover:bg-slate-800/40">
                      
                      {/* Month & Year */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">
                          {getMonthName(slip.month)} {slip.year}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: PAY-{slip.year}{(slip.month).toString().padStart(2, '0')}-{slip.id}</div>
                      </td>

                      {/* Paid Date */}
                      <td className="px-6 py-4 text-slate-300 font-mono">
                        {paidDateFormatted}
                      </td>

                      {/* Gross Earnings */}
                      <td className="px-6 py-4 text-right font-mono text-slate-300">
                        ₹{Number(slip.gross_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Total Deductions */}
                      <td className="px-6 py-4 text-right font-mono text-rose-400">
                        -₹{Number(slip.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Net Salary (Bolding and Highlight text) */}
                      <td className="px-6 py-4 text-right font-mono font-black text-emerald-400 text-base">
                        ₹{Number(slip.net_salary_payable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status Pill Label */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm shadow-emerald-900/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          [ Paid ]
                        </span>
                      </td>

                      {/* Action Icons */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* 1. View Slip Button */}
                          <button
                            onClick={() => handleOpenSlipModal(slip)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Slip
                          </button>

                          {/* 2. Download PDF Button (Dedicated Binary Blob stream handler) */}
                          <button
                            onClick={() => handleDownloadPDF(slip)}
                            disabled={isDownloading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <svg className="w-4 h-4 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            )}
                            Download PDF
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

      {/* Salary Slip Overlay Dialog Modal */}
      <SalarySlipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slipData={selectedSlip}
      />

    </div>
  );
};

export default EmployeePayslips;
