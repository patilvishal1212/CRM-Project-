from datetime import datetime
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer


class IsHRUserOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', '') in ['admin', 'hr']


class ApplyLeaveAPIView(generics.ListCreateAPIView):
    """
    POST /api/leaves/apply/ -> Employee applies for leave
    GET /api/leaves/my-requests/ or /api/leaves/apply/ -> Employee views personal leave requests
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LeaveRequest.objects.filter(employee=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        start_d = serializer.validated_data.get('start_date')
        end_d = serializer.validated_data.get('end_date')
        calc_days = 1
        if start_d and end_d:
            calc_days = max(1, (end_d - start_d).days + 1)
        serializer.save(
            employee=self.request.user,
            total_days=calc_days,
            status='pending'
        )


class MyLeaveRequestsAPIView(generics.ListAPIView):
    """
    GET /api/leaves/my-requests/ -> Employee personal requests timeline
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LeaveRequest.objects.filter(employee=self.request.user).order_by('-created_at')


class LeaveBalancesAPIView(APIView):
    """
    GET /api/leaves/balances/ -> Calculates leave balances for current employee
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        approved_leaves = LeaveRequest.objects.filter(employee=user, status='approved')

        casual_used = approved_leaves.filter(leave_type='Casual Leave').aggregate(total=Sum('total_days'))['total'] or 0
        sick_used = approved_leaves.filter(leave_type='Sick Leave').aggregate(total=Sum('total_days'))['total'] or 0
        unpaid_used = approved_leaves.filter(leave_type='Unpaid Leave').aggregate(total=Sum('total_days'))['total'] or 0

        casual_total = 12
        sick_total = 10

        return Response({
            "casual_total": casual_total,
            "casual_used": casual_used,
            "casual_remaining": max(0, casual_total - casual_used),
            "sick_total": sick_total,
            "sick_used": sick_used,
            "sick_remaining": max(0, sick_total - sick_used),
            "unpaid_used": unpaid_used,
        }, status=status.HTTP_200_OK)


class PendingLeavesAPIView(generics.ListAPIView):
    """
    GET /api/leaves/pending-list/ & /api/leaves/pending/ -> HR overview endpoint wide open to read ALL active workforce entries where status == 'pending'
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LeaveRequest.objects.filter(status='pending').select_related('employee', 'reviewed_by').order_by('-created_at')


class ReviewLeaveAPIView(APIView):
    """
    PATCH or POST /api/leaves/review/<id>/ & /api/leaves/<id>/review/ -> HR/Admin approves or rejects leave request
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        return self._process_review(request, pk)

    def post(self, request, pk):
        return self._process_review(request, pk)

    def _process_review(self, request, pk):
        leave = get_object_or_404(LeaveRequest, pk=pk)
        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({"error": "Status must be either 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

        leave.status = new_status
        leave.reviewed_by = request.user
        leave.save()

        serializer = LeaveRequestSerializer(leave)
        return Response({
            "message": f"Leave request marked as {new_status} successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

