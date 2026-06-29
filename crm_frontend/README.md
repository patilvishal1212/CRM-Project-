# TGS CRM - Frontend Portal

A premium, state-of-the-art Single Page Application (SPA) dashboard for marketing campaigns and lead QA review pipelines, built with React, Vite, and Tailwind CSS.

## Features
1. **Premium Responsive UX**: Sleek light/dark mode layouts matching modern design tokens.
2. **Dynamic Chart Aggregations**: Interactive SVG charting showing leads trends and verification metrics.
3. **Role Guards**: Secure routes ensuring only authorised users (`admin`, `employee`, `qa`) view sensitive pages.
4. **Call Evaluation Player**: Play call recordings directly in browser alongside verification action panels.
5. **Interactive Data Tables**: Leads grids supporting full-text search, campaign grouping, status pills, and CSV exports.

---

## Folder Structure
```
crm_frontend/
├── public/                # Static assets
├── src/
│   ├── assets/            # Global images and logos
│   ├── components/        # Reusable components (Navbar, Sidebar)
│   ├── context/           # React Context (Auth, Theme)
│   ├── layouts/           # Container templates (DashboardLayout)
│   ├── pages/             # Route views (Dashboard, Leads, Campaigns, QA Review)
│   ├── routes/            # Route mapping and guards (AppRoutes)
│   ├── services/          # API fetch services (api.js)
│   ├── index.css          # Tailwind imports and animations
│   ├── main.jsx           # App entrypoint hook
│   └── App.jsx            # Router and Provider wrapping
├── vite.config.js         # Vite configuration
├── package.json           # Project dependencies
└── index.html             # Base HTML template
```

---

## Installation Steps
1. Navigate to the frontend workspace:
   ```bash
   cd crm_frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

---

## Environment Variables
Create a `.env` file in the `crm_frontend/` root folder:
```env
VITE_API_URL=http://localhost:8000/api
```

---

## Development Setup
Launch the Vite hot-reloading development server:
```bash
npm run dev
```
The application will boot on `http://localhost:5173/`.

---

## Build Process
Compile assets for production deployments:
```bash
npm run build
```
This builds code into optimized bundles in the `/dist` directory.

---

## Deployment Guide
* **Static hosting**: The compiled `/dist` directory is statically serveable. Deploy to platforms like Vercel, Netlify, Cloudflare Pages, or AWS S3.
* **API Proxy**: Make sure `VITE_API_URL` is set to your production Django domain (e.g. `https://api.tgscrm.com/api`).

---

## Troubleshooting Guide
* **Redirect loops**: If the browser keeps redirecting to `/login`, clear your local storage by opening Developer Console (`F12`), going to Application > Local Storage, and deleting tokens.
* **Call audio not playing**: Verify that the backend media directory is accessible, or check if the recording audio files are uploaded in one of the allowed extensions (`.mp3`, `.wav`, `.m4a`).
* **Tailwind classes not applying**: TGS CRM uses Tailwind v4 with the new `@tailwindcss/vite` plugin. Ensure your CSS imports `@import "tailwindcss";` in `index.css`.
