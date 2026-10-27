# TGS CRM - Backend Service

The Django-based backend application providing secure API endpoints for the CRM Portal, campaign management, lead auditing workflows, dashboard statistics, daily conversion counts tracking, enterprise leave management, and payroll & salary slip management.

## Tech Stack
* Python 3.10+
* Django & Django REST Framework (DRF)
* PostgreSQL
* Simple JWT (JSON Web Tokens)
* ReportLab (Binary PDF Stream Generation)

---

## Registered Applications & Features

1. **Accounts & Authentication (`apps.accounts`)**: Customized User model with `admin`, `hr`, `employee`, and `qa` roles with JWT security guards.
2. **Campaign Management (`apps.campaigns`)**: Client channels, campaign budgets, target conversion metrics, timeline dates, and dropdown lookup endpoints.
3. **Leads & QA Audits (`apps.leads`)**: Sales representative lead submissions with audio call file uploads, double-verification QA reviews, and qualification scoring.
4. **Analytics Dashboard (`apps.dashboard`)**: Unified role-tailored analytics metrics detailing conversions, budget utilization, and performance trend curves.
5. **Payroll System (`apps.payroll`)**: Master setup with complete employee profiles validation (PAN, UAN, ESIC, Location, Bank details) and Admin 1:1 cross-check authorization view loop patterns.
6. **Independent Daily Conversion Counts Tracker (`apps.daily_tracker`)**: Dynamic lead tracking lists for `['employee', 'hr', 'qa']` matching dynamic campaigns app metrics.
7. **Enterprise Leave Management (`apps.leave_manager`)**: Full workforce leave application processing logic synchronized directly to HR approval pipelines.

---

## Installation Guide

### 1. Prerequisites
Ensure you have Python 3.10+, PostgreSQL 14+, and `pip` installed.

### 2. Environment Configurations
Create a `.env` file in the `crm_backend/` directory:
```env
SECRET_KEY=your_production_secret_key_here
DEBUG=True

# Database Configuration
DB_NAME=proedge_crm_db
DB_USER=postgres
DB_PASSWORD=your_postgresql_password_here
DB_HOST=localhost
DB_PORT=5432
```

### 3. Setup Virtual Environment
Run the following commands inside `crm_backend/`:
```bash
# Create venv
python -m venv venv

# Activate venv (Windows)
.\venv\Scripts\activate

# Activate venv (macOS/Linux)
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
pip install reportlab
```

---

## Database Setup
1. Create the database in PostgreSQL:
   ```sql
   CREATE DATABASE proedge_crm_db;
   ```
2. Generate and apply migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
3. Create a superuser (Admin role):
   ```bash
   python manage.py createsuperuser
   ```

---

## Complete API Endpoint Specifications

### 1. Accounts & Authentication (`apps.accounts`)
* **POST** `/api/accounts/login/` - Authenticate user credentials and return JWT tokens.
* **GET** `/api/accounts/profile/` - Fetch authenticated user profile details.
* **GET** `/api/accounts/employees/` - List active workforce employees (`['employee', 'hr', 'qa']`) for HR & Admin.

### 2. Campaigns API (`apps.campaigns`)
* **GET** `/api/campaigns/` - List all campaigns.
* **POST** `/api/campaigns/` - Create a campaign (Admin only).
* **GET** `/api/campaigns/dropdown/` - Fetch simplified campaign dropdown array (`id`, `name`, `status`).
* **GET** `/api/campaigns/<id>/` - Retrieve campaign detail.
* **PUT** `/api/campaigns/<id>/` - Update campaign metadata.
* **DELETE** `/api/campaigns/<id>/` - Delete campaign.

### 3. Leads & QA Review API (`apps.leads`)
* **GET** `/api/leads/` - List leads (Role-scoped access control).
* **POST** `/api/leads/` - Create lead with multi-part audio file upload (`call_recording`).
* **POST** `/api/leads/<id>/qa-review/` - Audit lead & log QA feedback score (QA & Admin only).

### 4. Analytics Dashboard API (`apps.dashboard`)
* **GET** `/api/dashboard/` - Retrieve role-customized dashboard KPIs, budget breakdowns, and monthly trend curves.

### 5. Payroll System API (`apps.payroll`)
* **GET** `/api/payroll/master/` - List baseline salary master profiles.
* **POST** `/api/payroll/master/` - Create baseline salary master record (HR/Admin).
* **GET** `/api/payroll/master/<id>/` - Retrieve individual salary master detail.
* **PUT** `/api/payroll/master/<id>/` - Update salary master profile (PAN, UAN, ESIC, Location, Bank details).
* **POST** `/api/payroll/hr-submit/` - HR submits monthly payroll parameters for review.
* **GET** `/api/payroll/monthly/?month=X&year=Y` - Filter monthly payroll entries by month/year.
* **GET / PUT / DELETE** `/api/payroll/monthly/<id>/` - Retrieve, update, or remove monthly payroll entries.
* **GET** `/api/payroll/admin-review/` - Fetch pending payroll approval matrix (Admin only).
* **POST** `/api/payroll/admin-review/<id>/` - Execute Admin review action (`{"action": "approve"}` or `{"action": "rework"}`).
* **GET** `/api/payroll/download-slip/<id>/` - Force direct local file download for PDF payslip statement with `Content-Disposition: attachment`.
* **GET** `/api/payroll/my-slips/` - Retrieve published approved payslips for current logged-in employee.

### 6. Daily Conversion Counts Tracker API (`apps.daily_tracker`)
* **POST** `/api/daily-tracker/log-count/` - Log daily lead conversion count for active campaign (Employee, HR, QA).
* **GET** `/api/daily-tracker/workforce-records/` - Retrieve aggregated workforce daily conversion counts and history grid (Admin, HR).

### 7. Enterprise Leave Management API (`apps.leave_manager`)
* **POST** `/api/leaves/apply/` - Employee submits leave request (strictly initialized with `status="pending"`).
* **GET** `/api/leaves/pending-list/` - Wide-open HR/Admin overview endpoint listing all workforce entries where `status == 'pending'`.
* **PATCH** `/api/leaves/review/<id>/` - HR/Admin approves or rejects leave request (`{"status": "approved"}` or `{"status": "rejected"}`).
* **GET** `/api/leaves/my-requests/` - Retrieve employee personal leave history timeline.
* **GET** `/api/leaves/balances/` - Retrieve employee leave quota balances (Casual, Sick, Unpaid).

---

## Running the Development Server
Launch the Django server:
```bash
python manage.py runserver
```
The API backend runs on `http://localhost:8000/`.
