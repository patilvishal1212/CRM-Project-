from django.db import models
from django.conf import settings

# Create your models here.

class SalaryMaster(models.Model):
    employee = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='salary_master'
    )

    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    pf_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    designation = models.CharField(max_length=100, blank=True, null=True, default='Specialist')
    gender_status = models.CharField(max_length=50, blank=True, null=True, default='Regular / Active')
    pan_number = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True, default='Pune HQ')
    uan_number = models.CharField(max_length=30, blank=True, null=True)
    esic_number = models.CharField(max_length=30, blank=True, null=True)
    bank_account = models.CharField(max_length=50, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.email}"


class MonthlyPayroll(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft (HR Entry)'),
        ('pending_review', 'Pending Admin Approval'),
        ('approved', 'Approved & Relaased'),
        ('rework', 'Sent Back to HR'),
    ]

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='monthly_payrolls'
    )
    month = models.IntegerField()
    year = models.IntegerField()


    unpaid_leaves = models.IntegerField(default=0)
    half_day_leaves = models.IntegerField(default=0)
    incentives = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    performance_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Automatically calculated fields
    gross_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_salary_payable = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # workflaow logic keys

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    pdf_slip = models.FileField(upload_to='payroll_slips/', blank=True, null=True)

    processed_by_hr = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='hr_payrolls',
        null=True,
    )

    approved_by_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='admin_payrolls',
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'month', 'year')

    def __str__(self):
        return f"{self.employee.email} - {self.month}/{self.year} - {self.status}"

    
            
