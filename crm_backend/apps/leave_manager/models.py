from django.db import models
from django.conf import settings


class LeaveRequest(models.Model):
    LEAVE_TYPE_CHOICES = (
        ('Casual Leave', 'Casual Leave'),
        ('Sick Leave', 'Sick Leave'),
        ('Unpaid Leave', 'Unpaid Leave'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='leave_requests'
    )
    leave_type = models.CharField(max_length=50, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.IntegerField(default=1)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_leaves'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        emp_name = getattr(self.employee, 'full_name', self.employee.email)
        return f"{emp_name} - {self.leave_type} ({self.total_days}d) [{self.status}]"
