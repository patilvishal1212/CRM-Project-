from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import DailyCount
from .serializers import DailyCountSerializer


class IsAdminOrHR(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', '') in ['admin', 'hr']


class LogCountAPIView(generics.ListCreateAPIView):
    """
    POST /api/daily-tracker/log-count/ -> Log count for employee
    GET /api/daily-tracker/log-count/ or /api/daily-tracker/my-logs/ -> Personal history
    """
    serializer_class = DailyCountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DailyCount.objects.filter(employee=self.request.user).order_by('-logged_date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)


class MyDailyLogsAPIView(generics.ListAPIView):
    """
    GET /api/daily-tracker/my-logs/ -> Personal history
    """
    serializer_class = DailyCountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DailyCount.objects.filter(employee=self.request.user).order_by('-logged_date', '-created_at')


class WorkforceRecordsAPIView(generics.ListAPIView):
    """
    GET /api/daily-tracker/workforce-records/ -> Admin & HR master grid view
    """
    serializer_class = DailyCountSerializer
    permission_classes = [IsAdminOrHR]

    def get_queryset(self):
        return DailyCount.objects.select_related('employee', 'campaign').all().order_by(
            '-logged_date', 'employee__full_name', 'employee__role', 'campaign__name', '-count'
        )


class WorkforceRecordDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET, PUT, PATCH, DELETE /api/daily-tracker/workforce-records/<id>/ -> Inline management by Admin/HR
    """
    queryset = DailyCount.objects.all()
    serializer_class = DailyCountSerializer
    permission_classes = [IsAdminOrHR]
