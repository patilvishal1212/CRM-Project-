from rest_framework import serializers
from .models import LeaveRequest


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    employee_role = serializers.CharField(source='employee.role', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True, default='')

    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'employee',
            'employee_name',
            'employee_email',
            'employee_role',
            'leave_type',
            'start_date',
            'end_date',
            'total_days',
            'reason',
            'status',
            'reviewed_by',
            'reviewed_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'employee', 'status', 'reviewed_by', 'created_at', 'updated_at']
