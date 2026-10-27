from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.campaigns.models import Campaign


class DailyCount(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='daily_counts'
    )
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.CASCADE,
        related_name='daily_counts'
    )
    count = models.PositiveIntegerField(default=0)
    logged_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-logged_date', '-created_at']

    def __str__(self):
        emp_name = getattr(self.employee, 'full_name', self.employee.email)
        return f"{emp_name} - {self.campaign.name} ({self.count}) on {self.logged_date}"
