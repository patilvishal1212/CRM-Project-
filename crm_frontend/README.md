# TGS CRM - Frontend Portal

A premium, state-of-the-art Single Page Application (SPA) dashboard for marketing campaigns, lead QA review pipelines, daily conversion count tracking, enterprise leave management, and corporate payroll & salary slip management, built with React, Vite, and Tailwind CSS.

## Key Features

1. **Modern Dark-Mode UX**: High-contrast, sleek corporate UI design tokens with interactive CSS micro-animations.
2. **Dynamic Data Visualization**: Real-time KPI summary cards, budget utilization meters, and trend charts.
3. **Role-Based Guards**: Protected routes ensuring strict permission scoping across `admin`, `hr`, `employee`, and `qa` roles.
4. **Call Evaluation Audio Player**: Embedded custom audio player for inline QA review of call recordings.
5. **Interactive Data Tables**: Full-text search, campaign filtering, status badges, and CSV data export handlers.
6. **Isolated Payroll & Salary Slip Workspace (`src/payroll/`)**:
   - Master Salary Profile editing (PAN, UAN, ESIC, Location, Bank details).
   - Monthly attendance & deduction calculation matrix (`unpaid_leaves`, `half_day_leaves`, `incentives`, `performance_allowance`).
   - Admin approval/rework workflow gateway.
   - Vector A4 print-ready modal overlay (`SalarySlipModal.jsx`).
   - Direct OS file download stream handling (`responseType: 'blob'`).
7. **Daily Conversion Counts Tracker (`src/daily_tracker/`)**:
   - Dynamic active campaigns selector.
   - Real-time conversion count logging for workforce roles (`['employee', 'hr', 'qa']`).
   - Aggregated workforce log history and performance cards.
8. **Enterprise Leave Management Portal (`src/leave_manager/`)**:
   - Quota tracking cards (Casual, Sick, Unpaid leaves).
   - Interactive leave application form with live day duration preview.
   - Real-time HR/Admin approval matrix queue with instant approve/reject toggle actions.

---

## Folder Directory Architecture

```
crm_frontend/
├── public/                # Static assets & favicon
├── src/
│   ├── assets/            # Global brand images and icons
│   ├── components/        # Shared components (Navbar, Sidebar, Audio Players)
│   ├── context/           # React Context Providers (AuthContext, ThemeContext)
│   ├── daily_tracker/     # Isolated Daily Conversion Counts Tracker Workspace
│   │   ├── pages/         # DailyTrackerPortal.jsx
│   │   └── services/      # dailyTrackerApi.js
│   ├── leave_manager/     # Isolated Enterprise Leave Management Workspace
│   │   ├── pages/         # LeavePortal.jsx
│   │   └── services/      # leaveApi.js
│   ├── layouts/           # Container templates (DashboardLayout.jsx)
│   ├── pages/             # Route views (Dashboard, Leads, Campaigns, QA Review, Login)
│   ├── payroll/           # Isolated Payroll & Salary Slip Workspace
│   │   ├── components/    # SalarySlipModal.jsx
│   │   ├── pages/         # HRDashboard.jsx, AdminReview.jsx, EmployeePayslips.jsx
│   │   └── services/      # payrollApi.js
│   ├── routes/            # Route mapping matrix & AuthGuards (AppRoutes.jsx)
│   ├── services/          # Core API HTTP client (api.js)
│   ├── index.css          # Global Tailwind CSS styling & animations
│   ├── main.jsx           # Application entrypoint
│   └── App.jsx            # Router and Context Provider wrapper
├── vite.config.js         # Vite bundler configuration
├── package.json           # Frontend dependencies and scripts
└── README.md              # Documentation
```

---

## Navigation Route Mapping Vectors (`src/components/Sidebar.jsx`)

The navigation bar dynamically renders menu links based on the authenticated user's role:

| Route Path | Navigation Label | Scoped User Roles | Module Description |
| :--- | :--- | :--- | :--- |
| `/` | **Dashboard** | `admin`, `employee`, `qa`, `hr` | Analytics metrics, budgets, and trend charts |
| `/daily-tracker` | **Daily Count Tracker** | `employee`, `hr`, `qa`, `admin` | Dynamic active campaign conversion count logger |
| `/leads` | **Leads** | `admin`, `employee`, `qa`, `hr` | Lead entries grid and audio call recording player |
| `/campaigns` | **Campaigns** | `admin`, `employee`, `qa`, `hr` | Marketing campaign budgets, targets, and dates |
| `/qa-review` | **QA Review** | `admin`, `qa` | Lead qualification audit & QA scoring matrix |
| `/payroll/hr` | **HR Payroll Matrix** | `hr`, `admin` | Salary Master setup and monthly payroll processor |
| `/payroll/admin-review` | **Payroll Approvals** | `admin` | Admin batch payout verification gateway |
| `/leave-management` | **Leave Management** | `admin`, `employee`, `hr`, `qa` | Quota tracker, leave application & HR approval queue |
| `/payroll/my-slips` | **My Payslips** | `employee`, `admin`, `hr`, `qa` | Personal payslip history & direct PDF file downloader |

---

## Development & Build Commands

Launch the Vite hot-reloading development server:
```bash
npm run dev
```

Build the production distribution bundle:
```bash
npm run build
```
