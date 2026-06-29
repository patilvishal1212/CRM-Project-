# TGS CRM - Backend Service

The Django-based backend application providing secure API endpoints for the CRM Portal, campaign management, lead auditing workflows, and dashboard statistics.

## Tech Stack
* Python 3.10+
* Django & Django REST Framework
* PostgreSQL
* Simple JWT (JSON Web Tokens)

---

## Features
1. **Multi-Role Authentication**: Customized User model with `admin`, `employee`, and `qa` roles.
2. **Campaign Tracking**: Manage client channels, budgets, targets, and dates.
3. **Leads Audits**: Sales representative lead entries with audio call files.
4. **QA Verification**: Double-verify calls, log assessments, and update qualification scores.
5. **Dashboard Summaries**: Unified statistics endpoint detailing conversions, budgets, and monthly trend curves.

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
DB_NAME=tgs_crm_db
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
```

---

## Database Setup
1. Create the database in PostgreSQL:
   ```sql
   CREATE DATABASE tgs_crm_db;
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

## API Documentation

### 1. Accounts & Authentication
* **POST** `/api/accounts/login/` - Authenticate credentials.
  * Request Body: `{"email": "...", "password": "..."}`
  * Returns: Access Token, Refresh Token, User profiles.
* **GET** `/api/accounts/profile/` - Fetch profile details (Bearer Token required).

### 2. Campaigns API
* **GET** `/api/campaigns/` - List all campaigns.
* **POST** `/api/campaigns/` - Create a campaign (Admin only).
* **GET** `/api/campaigns/<id>/` - Retrieve a specific campaign.
* **PUT** `/api/campaigns/<id>/` - Update a campaign (Admin only).
* **DELETE** `/api/campaigns/<id>/` - Delete a campaign (Admin only).

### 3. Leads API
* **GET** `/api/leads/` - List leads (Admins see all; employees see assigned leads).
* **POST** `/api/leads/` - Create a lead with Multi-Part Form Data (attaches `call_recording` audio).
* **POST** `/api/leads/<id>/qa-review/` - Audit lead status & log QA comments (QA & Admin only).
  * Request Body: `{"qa_status": "qualified | disqualified | rework", "qa_comments": "..."}`

### 4. Analytics Dashboard
* **GET** `/api/dashboard/` - Get unified analytics metrics, budgets, timelines, and trend charts.

---

## Running the Project
Launch the local development web server:
```bash
python manage.py runserver
```
The server starts on `http://localhost:8000/`.

---

## Troubleshooting Guide
* **CORS Blocked error**: Verify that `corsheaders.middleware.CorsMiddleware` is registered in `MIDDLEWARE` in `settings.py` before `CommonMiddleware` and `CORS_ALLOW_ALL_ORIGINS = True` is declared.
* **Missing attribute reviewed_by**: Apply database migrations (`python manage.py migrate`) to create the columns added during hotfixes.
* **Audio Upload size limit error**: The Lead model enforces a 50MB audio ceiling. Ensure files are compressed wav/mp3.
