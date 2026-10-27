from django.urls import path 
from .views import (
    SalaryMasterListCreateView,
    SalaryMasterDetailView,
    HRPayrollSubmissionView,
    MonthlyPayrollDetailView,
    MonthlyPayrollListView,
    AdminPayrollReviewView, 
    EmployeePayslipListView,
    DownloadPayslipView,
    DownloadPayslipFileView
)

urlpatterns = [
    path('master/', SalaryMasterListCreateView.as_view(), name='payroll-master'),
    path('master/<int:pk>/', SalaryMasterDetailView.as_view(), name='payroll-master-detail'),

    path('hr-submit/', HRPayrollSubmissionView.as_view(), name='payroll-hr-submit'),
    path('monthly/', MonthlyPayrollListView.as_view(), name='payroll-monthly-list'),
    path('monthly/<int:pk>/', MonthlyPayrollDetailView.as_view(), name='payroll-monthly-detail'),

    path('admin-review/', AdminPayrollReviewView.as_view(), name='payroll-admin-review'),
    path('admin-review/<int:pk>/', AdminPayrollReviewView.as_view(), name='payroll-admin-review-action'),

    path('my-slips/', EmployeePayslipListView.as_view(), name='payroll-employee-slips'),
    path('download/<int:pk>/', DownloadPayslipView.as_view(), name='payroll-download'),
    path('download-slip/<int:pk>/', DownloadPayslipFileView.as_view(), name='payroll-download-slip-stream'),
]