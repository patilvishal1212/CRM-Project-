import React, { useState, useEffect, useMemo } from 'react';
import { payrollService } from '../services/payrollApi';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const YEARS = [2024, 2025, 2026, 2027];

const HRDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(7);
  const [selectedYear, setSelectedYear] = useState(2026);

  // Live non-admin workforce state
  const [employees, setEmployees] = useState([]);
  const [salaryMasters, setSalaryMasters] = useState({});
  const [payrollInputs, setPayrollInputs] = useState({});
  const [existingMonthlyRecords, setExistingMonthlyRecords] = useState({});
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Master Modal State
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [editingMasterId, setEditingMasterId] = useState(null);
  const [masterFormData, setMasterFormData] = useState({
    employee: '',
    base_salary: 50000,
    pf_deduction: 1800,
    professional_tax: 200,
    designation: 'Specialist',
    gender_status: 'Regular / Active',
    pan_number: '',
    location: 'Mumbai HQ',
    uan_number: '',
    esic_number: '',
    bank_account: '',
    bank_name: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchMonthlyRecords(selectedMonth, selectedYear, employees);
    }
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyRecords = async (month, year, nonAdminEmps = employees) => {
    try {
      const records = await payrollService.getMonthlyPayrolls(month, year);
      const monthlyDict = {};
      (records || []).forEach((rec) => {
        monthlyDict[rec.employee] = rec;
      });
      setExistingMonthlyRecords(monthlyDict);

      setPayrollInputs((prev) => {
        const updated = { ...prev };
        (nonAdminEmps || []).forEach((emp) => {
          const rec = monthlyDict[emp.id];
          if (rec) {
            updated[emp.id] = {
              unpaid_leaves: rec.unpaid_leaves || 0,
              half_day_leaves: rec.half_day_leaves || 0,
              incentives: Number(rec.incentives) || 0,
              performance_allowance: Number(rec.performance_allowance) || 0,
            };
          } else if (!updated[emp.id]) {
            updated[emp.id] = {
              unpaid_leaves: 0,
              half_day_leaves: 0,
              incentives: 0,
              performance_allowance: 0,
            };
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('Failed to fetch existing monthly records:', err);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Query live records from existing accounts app
      const [empList, masterList] = await Promise.all([
        payrollService.getEmployees(),
        payrollService.getSalaryMasters(),
      ]);

      // CRITICAL USER FILTER LOGIC: Filter out users where role == 'admin'
      // Includes all other custom corporate profiles: ['employee', 'hr', 'qa']
      const nonAdminEmployees = (empList || []).filter((user) => user.role !== 'admin');
      setEmployees(nonAdminEmployees);

      // Convert master list array to dictionary by employee ID
      const mastersDict = {};
      (masterList || []).forEach((m) => {
        mastersDict[m.employee] = m;
      });
      setSalaryMasters(mastersDict);

      // Initialize table numeric inputs for each non-admin employee
      const initialInputs = {};
      const initialSelected = [];
      nonAdminEmployees.forEach((emp) => {
        initialInputs[emp.id] = {
          unpaid_leaves: 0,
          half_day_leaves: 0,
          incentives: 0,
          performance_allowance: 0,
        };
        initialSelected.push(emp.id);
      });
      setPayrollInputs(initialInputs);
      setSelectedEmpIds(initialSelected);

      if (nonAdminEmployees.length > 0) {
        populateMasterFormForEmp(nonAdminEmployees[0].id, mastersDict);
      }

      await fetchMonthlyRecords(selectedMonth, selectedYear, nonAdminEmployees);
    } catch (err) {
      console.error('Failed to load live workforce data:', err);
      showNotification('Error querying live accounts workforce data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const populateMasterFormForEmp = (empId, mastersDict = salaryMasters) => {
    const existing = mastersDict[empId];
    if (existing) {
      setEditingMasterId(existing.id || null);
      setMasterFormData({
        employee: empId,
        base_salary: existing.base_salary || 50000,
        pf_deduction: existing.pf_deduction || 1800,
        professional_tax: existing.professional_tax || 200,
        designation: existing.designation || 'Specialist',
        gender_status: existing.gender_status || 'Regular / Active',
        pan_number: existing.pan_number || '',
        location: existing.location || 'Mumbai HQ',
        uan_number: existing.uan_number || '',
        esic_number: existing.esic_number || '',
        bank_account: existing.bank_account || '',
        bank_name: existing.bank_name || '',
      });
    } else {
      setEditingMasterId(null);
      setMasterFormData({
        employee: empId,
        base_salary: 50000,
        pf_deduction: 1800,
        professional_tax: 200,
        designation: 'Specialist',
        gender_status: 'Regular / Active',
        pan_number: '',
        location: 'Mumbai HQ',
        uan_number: '',
        esic_number: '',
        bank_account: '',
        bank_name: '',
      });
    }
  };

  const handleOpenEditMaster = async (empId) => {
    const existing = salaryMasters[empId];
    if (existing && existing.id) {
      try {
        const freshMaster = await payrollService.getSalaryMasterById(existing.id);
        setSalaryMasters((prev) => ({ ...prev, [empId]: freshMaster }));
        populateMasterFormForEmp(empId, { ...salaryMasters, [empId]: freshMaster });
      } catch (err) {
        populateMasterFormForEmp(empId);
      }
    } else {
      populateMasterFormForEmp(empId);
    }
    setIsMasterModalOpen(true);
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Matrix input state binder validation fix
  const handleInputChange = (empId, field, value) => {
    const num = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    setPayrollInputs((prev) => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || { unpaid_leaves: 0, half_day_leaves: 0, incentives: 0, performance_allowance: 0 }),
        [field]: num,
      },
    }));
  };

  const toggleSelectEmp = (empId) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEmpIds.length === employees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(employees.map((e) => e.id));
    }
  };

  // Realtime formula calculation (HRA strictly excluded)
  const computedRowValues = (empId) => {
    const empMaster = salaryMasters[empId] || { base_salary: 50000, pf_deduction: 1800, professional_tax: 200 };
    const inputs = payrollInputs[empId] || { unpaid_leaves: 0, half_day_leaves: 0, incentives: 0, performance_allowance: 0 };

    const baseSalary = Number(empMaster.base_salary || 0);
    const pf = Number(empMaster.pf_deduction || 0);
    const pt = Number(empMaster.professional_tax || 0);

    const dailyBase = baseSalary / 30;
    const unpaidLoss = Number(inputs.unpaid_leaves || 0) * dailyBase;
    const halfDayLoss = Number(inputs.half_day_leaves || 0) * 0.5 * dailyBase;
    const attendanceLoss = unpaidLoss + halfDayLoss;

    const gross = baseSalary + Number(inputs.incentives || 0) + Number(inputs.performance_allowance || 0);
    const totalDeductions = pf + pt + attendanceLoss;
    const netPayable = gross - totalDeductions;

    return {
      baseSalary,
      gross,
      totalDeductions,
      netPayable: Math.max(0, netPayable),
    };
  };

  // Submit/Update Monthly Payroll to Admin
  const handleSubmitToAdmin = async () => {
    if (selectedEmpIds.length === 0) {
      showNotification('Please select at least one employee record to submit.', 'error');
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    try {
      for (const empId of selectedEmpIds) {
        const inputs = payrollInputs[empId] || { unpaid_leaves: 0, half_day_leaves: 0, incentives: 0, performance_allowance: 0 };
        const existingRecord = existingMonthlyRecords[empId];

        const payload = {
          employee: empId,
          month: selectedMonth,
          year: selectedYear,
          unpaid_leaves: Number(inputs.unpaid_leaves || 0),
          half_day_leaves: Number(inputs.half_day_leaves || 0),
          incentives: Number(inputs.incentives || 0),
          performance_allowance: Number(inputs.performance_allowance || 0),
        };

        if (existingRecord && existingRecord.id) {
          // Edit existing monthly record via PUT /api/payroll/monthly/<id>/
          await payrollService.updateMonthlyPayroll(existingRecord.id, payload);
        } else {
          // New submission via POST /api/payroll/hr-submit/
          await payrollService.submitHRPayroll(payload);
        }
        successCount++;
      }

      showNotification(
        `Successfully submitted/updated ${successCount} payroll evaluations for ${MONTHS.find((m) => m.value === selectedMonth)?.label} ${selectedYear}!`,
        'success'
      );
      await fetchMonthlyRecords(selectedMonth, selectedYear, employees);
    } catch (err) {
      console.error('HR Submission failed:', err);
      showNotification(err?.response?.data?.error || err?.error || err?.detail || 'Submission failed for some entries.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Save/Update Salary Master Profile Modal submission
  const handleSaveMasterProfile = async (e) => {
    e.preventDefault();
    try {
      const emp = employees.find((e) => e.id === Number(masterFormData.employee));
      const payload = {
        ...masterFormData,
        employee_email: emp?.email || '',
      };

      let result;
      if (editingMasterId) {
        result = await payrollService.updateSalaryMaster(editingMasterId, payload);
      } else {
        result = await payrollService.saveSalaryMaster(payload);
      }

      setSalaryMasters((prev) => ({
        ...prev,
        [masterFormData.employee]: result,
      }));

      showNotification(`Salary Master Profile updated for ${emp?.full_name || emp?.email}!`, 'success');
      setIsMasterModalOpen(false);
    } catch (err) {
      console.error('Save master failed:', err);
      showNotification('Failed to update Salary Master profile.', 'error');
    }
  };

  // Summary Totals
  const summaryTotals = useMemo(() => {
    let grossPool = 0;
    let netPool = 0;
    selectedEmpIds.forEach((id) => {
      const vals = computedRowValues(id);
      grossPool += vals.gross;
      netPool += vals.netPayable;
    });
    return { grossPool, netPool };
  }, [selectedEmpIds, payrollInputs, salaryMasters]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
              HR Data-Entry Terminal
            </span>
            <span className="text-xs text-slate-400">Live Accounts Workforce Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Workforce Payroll Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">Configure baseline salary profiles and log monthly attendance loss & bonus metrics (HRA Excluded).</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (employees.length > 0) populateMasterFormForEmp(employees[0].id);
              setIsMasterModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
          >
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Set Salary Master Profile
          </button>

          <button
            onClick={handleSubmitToAdmin}
            disabled={submitting || selectedEmpIds.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            {submitting ? (
              <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            Submit / Update Admin ({selectedEmpIds.length})
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={notification.type === 'error' ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M5 13l4 4L19 7"} />
            </svg>
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Filter & Summary Header Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Financial Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Earnings Pool</span>
          <div className="text-xl font-black text-white font-mono mt-1">
            ₹{summaryTotals.grossPool.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-slate-500">Selected Non-Admin Workforce</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between bg-gradient-to-br from-slate-900 to-indigo-950/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Est. Net Take-Home Pool</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            ₹{summaryTotals.netPool.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-emerald-500 font-medium">Ready for Authorization</span>
        </div>
      </div>

      {/* Main Workforce Interactive Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-200 text-sm">Monthly Attendance & Incentive Matrix</h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              {employees.length} Active Non-Admin Profiles ('employee', 'hr', 'qa')
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all-hr"
              checked={selectedEmpIds.length === employees.length && employees.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded accent-indigo-600 bg-slate-950 border-slate-700 cursor-pointer"
            />
            <label htmlFor="select-all-hr" className="text-xs text-slate-400 font-medium cursor-pointer">
              Select All Batch
            </label>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-indigo-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Querying live non-admin workforce accounts...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No active non-admin employee records found in live accounts system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-center w-10">Select</th>
                  <th className="px-4 py-3">Employee Name & Role</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Base Salary</th>
                  <th className="px-4 py-3 text-center">Unpaid Leaves</th>
                  <th className="px-4 py-3 text-center">Half Day Leaves</th>
                  <th className="px-4 py-3 text-center">Incentives (₹)</th>
                  <th className="px-4 py-3 text-center">Perf. Allowance (₹)</th>
                  <th className="px-4 py-3 text-right">Gross Earnings</th>
                  <th className="px-4 py-3 text-right">Net Payable</th>
                  <th className="px-4 py-3 text-center">Edit Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {employees.map((emp) => {
                  const isSelected = selectedEmpIds.includes(emp.id);
                  const inputs = payrollInputs[emp.id] || { unpaid_leaves: 0, half_day_leaves: 0, incentives: 0, performance_allowance: 0 };
                  const rowVal = computedRowValues(emp.id);
                  const existingRec = existingMonthlyRecords[emp.id];

                  return (
                    <tr key={emp.id} className={`transition-colors hover:bg-slate-800/40 ${isSelected ? 'bg-indigo-950/10' : ''}`}>
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectEmp(emp.id)}
                          className="w-4 h-4 rounded accent-indigo-600 bg-slate-950 border-slate-700 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{emp.full_name || emp.name || emp.username}</span>
                          <span className="px-2 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-800 text-indigo-300 border border-slate-700">
                            {emp.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{emp.email}</div>
                      </td>

                      {/* Record Status Badge */}
                      <td className="px-3 py-3.5 text-center">
                        {existingRec ? (
                          existingRec.status === 'approved' ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                              Approved
                            </span>
                          ) : existingRec.status === 'rework' ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase animate-pulse">
                              Rework
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                              Pending
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                            New
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        ₹{rowVal.baseSalary.toLocaleString('en-IN')}
                      </td>

                      {/* 1. Unpaid Leaves Input */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={inputs.unpaid_leaves}
                          onChange={(e) => handleInputChange(emp.id, 'unpaid_leaves', e.target.value)}
                          className="w-16 bg-slate-950 border border-slate-700 rounded text-center py-1 text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </td>

                      {/* 2. Half Day Leaves Input */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={inputs.half_day_leaves}
                          onChange={(e) => handleInputChange(emp.id, 'half_day_leaves', e.target.value)}
                          className="w-16 bg-slate-950 border border-slate-700 rounded text-center py-1 text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </td>

                      {/* 3. Incentives Input */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={inputs.incentives}
                          onChange={(e) => handleInputChange(emp.id, 'incentives', e.target.value)}
                          className="w-24 bg-slate-950 border border-slate-700 rounded text-center py-1 text-emerald-400 font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-semibold"
                        />
                      </td>

                      {/* 4. Performance Allowance Input */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={inputs.performance_allowance}
                          onChange={(e) => handleInputChange(emp.id, 'performance_allowance', e.target.value)}
                          className="w-24 bg-slate-950 border border-slate-700 rounded text-center py-1 text-emerald-400 font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-semibold"
                        />
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-slate-200">
                        ₹{rowVal.gross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                        ₹{rowVal.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenEditMaster(emp.id)}
                          title="Edit Employee Master Profile"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Salary Master Profile Modal */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingMasterId ? 'Edit Baseline Salary Master' : 'Configure Baseline Salary Master'}
                </h3>
                <p className="text-[11px] text-slate-400">Configure fixed employee compensation details (HRA Excluded).</p>
              </div>
              <button
                onClick={() => setIsMasterModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveMasterProfile} className="space-y-4 text-xs">
              {/* 1. Employee ID Selection Dropdown */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">1. Non-Admin Employee Selection</label>
                <select
                  value={masterFormData.employee}
                  onChange={(e) => populateMasterFormForEmp(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.name} ({emp.email}) - [{emp.role.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Compensation Baseline (Base Salary, PF, Professional Tax - NO HRA!) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">2. Monthly Base Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={masterFormData.base_salary}
                    onChange={(e) => setMasterFormData({ ...masterFormData, base_salary: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">3. PF Deduction (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={masterFormData.pf_deduction}
                    onChange={(e) => setMasterFormData({ ...masterFormData, pf_deduction: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">4. Professional Tax (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={masterFormData.professional_tax}
                    onChange={(e) => setMasterFormData({ ...masterFormData, professional_tax: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Associate Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">5. Designation</label>
                  <input
                    type="text"
                    placeholder="Specialist"
                    value={masterFormData.designation}
                    onChange={(e) => setMasterFormData({ ...masterFormData, designation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">6. Gender / Status</label>
                  <input
                    type="text"
                    placeholder="Regular / Active"
                    value={masterFormData.gender_status}
                    onChange={(e) => setMasterFormData({ ...masterFormData, gender_status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">7. PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={masterFormData.pan_number}
                    onChange={(e) => setMasterFormData({ ...masterFormData, pan_number: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">8. Workplace Location</label>
                  <input
                    type="text"
                    placeholder="Mumbai HQ"
                    value={masterFormData.location}
                    onChange={(e) => setMasterFormData({ ...masterFormData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">9. UAN Number</label>
                  <input
                    type="text"
                    placeholder="101293847561"
                    value={masterFormData.uan_number}
                    onChange={(e) => setMasterFormData({ ...masterFormData, uan_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">10. ESIC Number</label>
                  <input
                    type="text"
                    placeholder="31-00-123456-000-0001"
                    value={masterFormData.esic_number}
                    onChange={(e) => setMasterFormData({ ...masterFormData, esic_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Banking Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">11. Bank Account Number</label>
                  <input
                    type="text"
                    placeholder="918237465012"
                    value={masterFormData.bank_account}
                    onChange={(e) => setMasterFormData({ ...masterFormData, bank_account: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">12. Bank Name</label>
                  <input
                    type="text"
                    placeholder="HDFC Bank"
                    value={masterFormData.bank_name}
                    onChange={(e) => setMasterFormData({ ...masterFormData, bank_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMasterModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {editingMasterId ? 'Update Master Profile' : 'Save Master Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRDashboard;
