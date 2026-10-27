from django.urls import path
from .views import (
    ApplyLeaveAPIView,
    MyLeaveRequestsAPIView,
    LeaveBalancesAPIView,
    PendingLeavesAPIView,
    ReviewLeaveAPIView,
)

urlpatterns = [
    path('apply/', ApplyLeaveAPIView.as_view(), name='leave-apply'),
    path('my-requests/', MyLeaveRequestsAPIView.as_view(), name='leave-my-requests'),
    path('balances/', LeaveBalancesAPIView.as_view(), name='leave-balances'),
    path('pending/', PendingLeavesAPIView.as_view(), name='leave-pending'),
    path('pending-list/', PendingLeavesAPIView.as_view(), name='leave-pending-list'),
    path('<int:pk>/review/', ReviewLeaveAPIView.as_view(), name='leave-review'),
    path('review/<int:pk>/', ReviewLeaveAPIView.as_view(), name='leave-review-alt'),
]

