import React from 'react';
import myLogo from '../../assets/vite.png';

// Helper to convert number to words (Indian Currency System)
const numberToWords = (num) => {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const rounded = Math.round(num);
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
    return str;
  };

  const words = inWords(rounded);
  return (words ? words.trim() : 'Zero') + ' Rupees Only';
};

// Month name helper
const getMonthName = (monthNum) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[(monthNum - 1) % 12] || 'July';
};

const SalarySlipModal = ({ isOpen, onClose, slipData }) => {
  if (!isOpen || !slipData) return null;

  const handlePrint = () => {
    window.print();
  };

  // Derive slip fields with fallback safety
  const monthName = getMonthName(slipData.month || 7);
  const year = slipData.year || 2026;
  const financialPeriod = `${year}-${(year + 1).toString().slice(-2)}`;

  // Calculate breakdown components (HRA EXCLUDED COMPLETELY)
  const incentives = Number(slipData.incentives || 0);
  const perfAllowance = Number(slipData.performance_allowance || 0);
  const grossPay = Number(slipData.gross_earnings || 0);
  const basicSalary = Number(slipData.base_salary || Math.max(0, grossPay - incentives - perfAllowance));

  const pfDeduction = Number(slipData.pf_deduction || 1800);
  const profTax = Number(slipData.professional_tax || 200);

  // Unpaid & half day leave deductions calculation
  const unpaidLeavesCount = Number(slipData.unpaid_leaves || 0);
  const halfDayCount = Number(slipData.half_day_leaves || 0);
  const dailyRate = basicSalary / 30;
  const unpaidLeaveDeduction = Math.round(unpaidLeavesCount * dailyRate);
  const halfDayDeduction = Math.round(halfDayCount * 0.5 * dailyRate);

  const totalDeductions = Number(slipData.total_deductions || (pfDeduction + profTax + unpaidLeaveDeduction + halfDayDeduction));
  const netPayable = Number(slipData.net_salary_payable || (grossPay - totalDeductions));

  // EXPLICIT EMPLOYEE NAME BINDING
  const empName = slipData.employee_name || slipData.employee_email?.split('@')[0].toUpperCase() || 'Employee Name';
  const empId = `EMP-${(slipData.employee || 100).toString().padStart(4, '0')}`;
  const designation = slipData.designation || 'Specialist';
  const genderStatus = slipData.gender_status || 'Regular / Active';
  const joiningDate = slipData.joining_date || '15-Mar-2023';
  const bankAcc = slipData.bank_account || 'XXXX-XXXX-8921';
  const bankName = slipData.bank_name || 'HDFC Bank Ltd';
  const pan = slipData.pan_number || slipData.pan || 'ABCDE1234F';
  const location = slipData.location || 'Mumbai HQ';
  const uan = slipData.uan_number || slipData.uan || '101293847561';
  const esic = slipData.esic_number || slipData.esic || '31-00-123456-000-0001';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">

      {/* Print Specific CSS Override */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #salary-slip-modal-content, #salary-slip-modal-content * {
            visibility: visible !important;
          }
          #salary-slip-modal-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:bg-white print:my-0">

        {/* Top Floating Control Bar (Hidden during Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-slate-200 text-sm">Official Corporate Payslip Inspector</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable A4 Paper Layout Container */}
        <div id="salary-slip-modal-content" className="p-8 bg-white text-slate-900 font-sans leading-relaxed text-xs">

          {/* COMPANY HEADER */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl p-1">
                <img src={myLogo} alt="Proedge CRM Branding" className="w-14 h-14 object-contain" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight text-yellow-600">ProEdge Media Solutions Pvt Ltd</h1>
                <p className="text-[13px] font-semibold text-black">Proedge CRM Operations & Enterprise Technology Hub</p>
                <p className="text-[13px] text-black font-semibold">
                  Divine Coworking Space S.No :82, Suman Ankur, Sahyadri Farms, Lalit Estate,<br /> Baner, Pune, Maharashtra 411045
                </p>  0000000000000000000............
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-slate-800 uppercase tracking-wide text-[12px] mb-1">
                Financial Period {financialPeriod}
              </div>
              <h2 className="font-bold text-sm text-indigo-900">PAY SLIP FOR THE MONTH OF {monthName.toUpperCase()} {year}</h2>
              <p className="text-[13px] text-black font-semibold">Ref Doc: PAY-{year}{(slipData.month || 7).toString().padStart(2, '0')}-{empId}</p>
            </div>
          </div>

          {/* REVISED ASSOCIATE DETAILS GRID (Balanced 2-Column Tabular Grid) */}
          <div className="my-6 border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-300">
              Associate Identification & Banking Profile
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-300 p-3 bg-slate-50/50 text-[14px]">
              {/* Left Column Items: [Employee ID, Employee Name, Date of Joining, Payable Days, Days Worked, Bank A/C Number, Bank Name] */}
              <div className="space-y-2 pr-4">
                <div className="flex justify-between"><span className="text-black font-medium">Employee ID:</span> <span className="font-bold text-slate-900">{empId}</span></div>
                <div className="flex justify-between items-center"><span className="text-black font-medium">Employee Name:</span> <span className="font-semibold text-indigo-950 text-sm tracking-tight">{empName}</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">Date of Joining:</span> <span className="font-semibold text-slate-800">{joiningDate}</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">Payable Days:</span> <span className="font-bold text-slate-900">30 Days</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">Days Worked:</span> <span className="font-bold text-emerald-700">{(30 - unpaidLeavesCount - (halfDayCount * 0.5)).toFixed(1)} Days</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">Bank A/C Number:</span> <span className="font-mono font-semibold text-slate-900">{bankAcc}</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">Bank Name:</span> <span className="font-semibold text-slate-800">{bankName}</span></div>
              </div>

              {/* Right Column Items: [Designation, Gender/Status, PAN Number, Location, UAN Number, ESIC Number] */}
              <div className="space-y-2 pl-4">
                <div className="flex justify-between"><span className="text-black font-medium">Designation:</span> <span className="font-bold text-indigo-900">{designation}</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">Gender / Status:</span> <span className="font-semibold text-slate-800">{genderStatus}</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">PAN Number:</span> <span className="font-mono font-bold text-slate-900">{pan}</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">Workplace Location:</span> <span className="font-semibold text-slate-800">{location}</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">UAN Number:</span> <span className="font-mono font-semibold text-slate-800">{uan}</span></div>
                <div className="flex justify-between"><span className="text-black font-medium">ESIC Number:</span> <span className="font-mono font-semibold text-slate-800">{esic}</span></div>
              </div>
            </div>
          </div>

          {/* NO-HRA BREAKDOWN MATRIX */}
          <div className="my-6 border border-slate-300 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-slate-300 text-center font-bold uppercase text-[11px] bg-slate-100 border-b border-slate-300">
              <div className="py-2 text-indigo-950">Earnings Matrix (A)</div>
              <div className="py-2 text-rose-950">Deductions Ledger (B)</div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-300 text-[15px]">
              {/* Left Column (Earnings: Basic Salary, Incentives, Performance Allowance - NO HRA!) */}
              <div className="p-3 space-y-2 flex flex-col justify-between">
                <div className="space-y-2 ">
                  <div className="flex justify-between"><span className="text-black">Basic Salary</span> <span className="font-mono font-semibold text-slate-900">₹{basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-black">Incentives & Campaign Bonus</span> <span className="font-mono font-semibold text-emerald-700">+ ₹{incentives.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-black">Performance Allowance</span> <span className="font-mono font-semibold text-emerald-700">+ ₹{perfAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                </div>

                {/* Gross Pay Highlight Strip */}
                <div className="pt-3 mt-3 border-t border-slate-300 flex justify-between items-center font-extrabold text-slate-900 bg-emerald-50/60 p-2 rounded">
                  <span className="text-emerald-950 uppercase text-[10px]">Gross Earnings (A)</span>
                  <span className="font-mono text-sm text-emerald-900">₹{grossPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Right Column (Deductions: Provident Fund, Professional Tax, Unpaid Leaves Deduction) */}
              <div className="p-3 space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-black">Provident Fund (Employee PF)</span> <span className="font-mono font-semibold text-slate-900">₹{pfDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-black">Professional Tax (PT)</span> <span className="font-mono font-semibold text-slate-900">₹{profTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  {unpaidLeavesCount > 0 && (
                    <div className="flex justify-between"><span className="text-black">Unpaid Leaves Deduction ({unpaidLeavesCount}d)</span> <span className="font-mono font-semibold text-rose-600">₹{unpaidLeaveDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  )}
                  {halfDayCount > 0 && (
                    <div className="flex justify-between"><span className="text-black">Half Day Deduction ({halfDayCount}d)</span> <span className="font-mono font-semibold text-rose-600">₹{halfDayDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  )}
                  {unpaidLeavesCount === 0 && halfDayCount === 0 && (
                    <div className="flex justify-between"><span className="text-black">Attendance Loss Deduction</span> <span className="font-mono font-semibold text-slate-900">₹0.00</span></div>
                  )}
                </div>

                {/* Total Deductions Highlight Strip */}
                <div className="pt-3 mt-3 border-t border-slate-300 flex justify-between items-center font-extrabold text-slate-900 bg-rose-50/60 p-2 rounded">
                  <span className="text-rose-950 uppercase text-[10px]">Total Deductions (B)</span>
                  <span className="font-mono text-sm text-rose-900">₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NET BANNER PAYABLE CARD */}
          <div className="my-6 text-black bg-slate-100 rounded-xl p-7 flex flex-col md:flex-row items-center justify-between gap-9 shadow-md print:bg-slate-900 print:text-white">
            <div>
              <span className="text-[14px] uppercase font-bold text-black tracking-wider">NET SALARY PAYABLE (A - B)</span>
              <p className="text-xs text-indigo-600 font-medium italic mt-0.5">
                Amount in Words: <span className="font-bold text-black uppercase">{numberToWords(netPayable)}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight gap-2">
                ₹{netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="block text-[11px] text-black uppercase font-semibold gap-2">Direct Deposit Confirmed</span>
            </div>
          </div>

          {/* CORPORATE SIGNATURE & DISCLAIMER */}
          <div className="pt-6 mt-6 border-t border-slate-200 flex items-end justify-between text-[14px] text-slate-500">
            <div className="max-w-md">
              <p className="font-semibold text-black">Authorised Signatory Notes:</p>
              <p className='text-black'>1. This document is a computer-generated salary advice statement issued by Proedge CRM Payroll Operations.</p>
              <p className='text-black'>2. Any discrepancy must be reported to hr@proedgemedia.com within 5 working days.</p>
            </div>
            <div className="text-right">
              <div className="w-32 h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1">
                <span className="font-serif italic text-indigo-900 font-bold text-xs">PROEDGE PAYROLL</span>
              </div>
              <p className="font-bold text-black uppercase">Authorised Officer</p>
              <p className="text-[13px] text-black">Payroll & Benefits Dept</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SalarySlipModal;
