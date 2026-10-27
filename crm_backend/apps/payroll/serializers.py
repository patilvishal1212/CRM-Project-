from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SalaryMaster, MonthlyPayroll
from decimal import Decimal


User = get_user_model()

class SalaryMasterSerializer(serializers.ModelSerializer):
    employee_email = serializers.ReadOnlyField(source='employee.email')
    employee_name = serializers.ReadOnlyField(source='employee.full_name')

    class Meta:
        model = SalaryMaster
        fields = [
            'id', 'employee', 'employee_email', 'employee_name',
            'base_salary', 'pf_deduction', 'professional_tax',
            'designation', 'gender_status', 'pan_number', 'location',
            'uan_number', 'esic_number', 'bank_account', 'bank_name',
            'updated_at'
        ]


class MonthlyPayrollSerializer(serializers.ModelSerializer):
    employee_email = serializers.ReadOnlyField(source='employee.email')
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    hr_email = serializers.ReadOnlyField(source='processed_by_hr.email')    
    admin_email = serializers.ReadOnlyField(source='approved_by_admin.email')

    # Master details fields for slip modal rendering
    base_salary = serializers.SerializerMethodField()
    pf_deduction = serializers.SerializerMethodField()
    professional_tax = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    gender_status = serializers.SerializerMethodField()
    pan_number = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    uan_number = serializers.SerializerMethodField()
    esic_number = serializers.SerializerMethodField()
    bank_account = serializers.SerializerMethodField()
    bank_name = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyPayroll
        fields = [
            'id', 'employee', 'employee_email', 'employee_name', 'month', 'year',
            'unpaid_leaves', 'half_day_leaves', 'incentives', 'performance_allowance',
            'gross_earnings', 'total_deductions', 'net_salary_payable',
            'status', 'pdf_slip', 'processed_by_hr', 'hr_email', 'approved_by_admin', 'admin_email', 'created_at',
            'base_salary', 'pf_deduction', 'professional_tax', 'designation',
            'gender_status', 'pan_number', 'location', 'uan_number', 'esic_number',
            'bank_account', 'bank_name'
        ]
        read_only_fields = ['gross_earnings', 'total_deductions', 'net_salary_payable', 'pdf_slip', 'processed_by_hr', 'approved_by_admin']

    def _get_master(self, obj):
        try:
            return getattr(obj.employee, 'salary_master', None)
        except Exception:
            return None

    def get_base_salary(self, obj):
        m = self._get_master(obj)
        return float(m.base_salary) if m else 0.0

    def get_pf_deduction(self, obj):
        m = self._get_master(obj)
        return float(m.pf_deduction) if m else 0.0

    def get_professional_tax(self, obj):
        m = self._get_master(obj)
        return float(m.professional_tax) if m else 0.0

    def get_designation(self, obj):
        m = self._get_master(obj)
        return m.designation if (m and m.designation) else 'Specialist'

    def get_gender_status(self, obj):
        m = self._get_master(obj)
        return m.gender_status if (m and m.gender_status) else 'Regular / Active'

    def get_pan_number(self, obj):
        m = self._get_master(obj)
        return m.pan_number if (m and m.pan_number) else ''

    def get_location(self, obj):
        m = self._get_master(obj)
        return m.location if (m and m.location) else 'Mumbai HQ'

    def get_uan_number(self, obj):
        m = self._get_master(obj)
        return m.uan_number if (m and m.uan_number) else ''

    def get_esic_number(self, obj):
        m = self._get_master(obj)
        return m.esic_number if (m and m.esic_number) else ''

    def get_bank_account(self, obj):
        m = self._get_master(obj)
        return m.bank_account if (m and m.bank_account) else ''

    def get_bank_name(self, obj):
        m = self._get_master(obj)
        return m.bank_name if (m and m.bank_name) else ''

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.employee:
            ret['employee_name'] = instance.employee.full_name
            ret['employee_email'] = instance.employee.email
        return ret

    def create(self, validated_data):
        employee = validated_data['employee']

        # 1. Check if Master Profile Exists
        try:
            master = SalaryMaster.objects.get(employee=employee)
        except SalaryMaster.DoesNotExist:
            raise serializers.ValidationError({"error": "Salary Master profile not found for this employee. Setup master entry first."})

        # 2. Daily Rate Calculate Base
        daily_base_salary = master.base_salary / Decimal('30')

        # 3. Attendance Loss Calculations
        leaves_deduction = Decimal(str(validated_data.get('unpaid_leaves', 0))) * daily_base_salary
        half_day_leaves_count = validated_data.get('half_day_leaves', 0)
        half_day_deduction = (Decimal(str(half_day_leaves_count)) * Decimal('0.5')) * daily_base_salary
        attendance_loss = leaves_deduction + half_day_deduction

        # 4. Math Matrix Equations (HRA completely excluded!)
        gross = master.base_salary + Decimal(str(validated_data.get('incentives', 0))) + Decimal(str(validated_data.get('performance_allowance', 0)))
        deductions = master.pf_deduction + master.professional_tax + attendance_loss
        net_payable = gross - deductions

        # 5. Populate Calculated Dynamic Data Columns
        validated_data['gross_earnings'] = round(gross, 2)
        validated_data['total_deductions'] = round(deductions, 2)
        validated_data['net_salary_payable'] = round(net_payable, 2)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        try:
            master = SalaryMaster.objects.get(employee=instance.employee)
        except SalaryMaster.DoesNotExist:
            raise serializers.ValidationError({"error": "Salary Master profile not found for this employee."})

        unpaid_leaves = validated_data.get('unpaid_leaves', instance.unpaid_leaves)
        half_day_leaves = validated_data.get('half_day_leaves', instance.half_day_leaves)
        incentives = validated_data.get('incentives', instance.incentives)
        performance_allowance = validated_data.get('performance_allowance', instance.performance_allowance)

        daily_base_salary = master.base_salary / Decimal('30')
        leaves_deduction = Decimal(str(unpaid_leaves)) * daily_base_salary
        half_day_deduction = (Decimal(str(half_day_leaves)) * Decimal('0.5')) * daily_base_salary
        attendance_loss = leaves_deduction + half_day_deduction

        gross = master.base_salary + Decimal(str(incentives)) + Decimal(str(performance_allowance))
        deductions = master.pf_deduction + master.professional_tax + attendance_loss
        net_payable = gross - deductions

        instance.unpaid_leaves = unpaid_leaves
        instance.half_day_leaves = half_day_leaves
        instance.incentives = incentives
        instance.performance_allowance = performance_allowance
        instance.gross_earnings = round(gross, 2)
        instance.total_deductions = round(deductions, 2)
        instance.net_salary_payable = round(net_payable, 2)
        instance.status = 'pending_review'  # Reset status when HR updates entry
        instance.save()
        return instance
