from django.urls import path

from .views import (
    LoginAPIView,
    ProfileAPIView,
    EmployeeListAPIView,
    EmployeeDetailAPIView,
    EmployeeToggleActiveAPIView,
)

urlpatterns = [
    path('login/', LoginAPIView.as_view(), name='login'),
    path('profile/', ProfileAPIView.as_view(), name='profile'),

    # Employee management (Admin only)
    path('employees/', EmployeeListAPIView.as_view(), name='employee-list'),
    path('employees/<int:pk>/', EmployeeDetailAPIView.as_view(), name='employee-detail'),
    path('employees/<int:pk>/toggle-active/', EmployeeToggleActiveAPIView.as_view(), name='employee-toggle-active'),
]