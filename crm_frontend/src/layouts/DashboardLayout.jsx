import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Dashboard Analytics';
      case '/leads':
        return 'Leads Management';
      case '/campaigns':
        return 'Marketing Campaigns';
      case '/qa-review':
        return 'QA Feedback Queue';
      case '/payroll/hr':
        return 'HR Payroll Matrix';
      case '/payroll/admin-review':
        return 'Payroll Approval Pipeline';
      case '/daily-tracker':
        return 'Daily Count Tracker';
      case '/leave-management':
        return 'Leave Management Portal';
      case '/payroll/my-slips':
        return 'My Salary Slips';
      default:
        return 'CRM Console';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Pane */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-64">
        {/* Header Bar */}
        <Navbar 
          toggleSidebar={toggleSidebar} 
          pageTitle={getPageTitle(location.pathname)} 
        />

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto px-6 py-8 focus:outline-none scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
