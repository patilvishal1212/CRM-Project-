from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from apps.campaigns.models import Campaign

def validate_audio_size(value):
    if value:
        max_size = 50 * 1024 * 1024 
        if value.size > max_size:
            raise ValidationError("Audio file size must be less than 50MB.")


class Lead(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='leads')

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='leads'
    )

    data = models.DateField(auto_now_add=True)

    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    job_title = models.CharField(max_length=255)
    email = models.EmailField()
    prospect_linkedin = models.URLField(max_length=500)
    contact_number = models.CharField(max_length=20)
    direct_number = models.CharField(max_length=20, blank=True, null=True)

    industry = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    company_linkedin = models.URLField(max_length=500)
    company_size = models.CharField(max_length=255)
    address = models.CharField(blank=True, null=True)

    call_recording = models.FileField(
        upload_to='call_recordings/',
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=['mp3', 'wav', 'm4a']),
            validate_audio_size
        ]
    )

    comments = models.TextField(blank=True, null=True)

    # QA logic
    QA_STATUS_CHOICES = (
        ('pending', 'Pending QA Review'),
        ('qualified', 'Qualified by QA'),
        ('disqualified', 'Disqualified by QA'),
        ('in progress', 'Progress by QA'),
        ('tbd', 'TBD by QA'),
        ('rework', 'Rework by QA'),
    )

    qa_status = models.CharField(max_length=20, choices=QA_STATUS_CHOICES, default='pending')
    qa_comments = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_leads'
    )
    assigned_qa = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_qa_leads',
        limit_choices_to={'role': 'qa'}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):  
        return f"{self.first_name} {self.last_name} - {self.company_name if hasattr(self, 'company_name') else self.industry}"    


class EmployeePerformance(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='performances'
    )
    employee_name = models.CharField(max_length=255)
    date = models.DateField()
    day = models.CharField(max_length=20)
    total_leads_submitted = models.IntegerField(default=0)

    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee_name} - {self.date} - {self.total_leads_submitted} leads"


# Signals for automation
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

@receiver(pre_save, sender=Lead)
def auto_assign_qa(sender, instance, **kwargs):
    if not instance.assigned_qa:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        qas = User.objects.filter(role='qa', is_active=True)
        if qas.exists():
            import random
            instance.assigned_qa = random.choice(list(qas))


@receiver(post_save, sender=Lead)
def update_employee_performance(sender, instance, created, **kwargs):
    if created and instance.assigned_to:
        from django.utils import timezone
        today = timezone.now().date()
        perf, created_perf = EmployeePerformance.objects.get_or_create(
            employee=instance.assigned_to,
            date=today,
            defaults={
                'employee_name': instance.assigned_to.full_name,
                'day': today.strftime('%A'),
                'total_leads_submitted': 0
            }
        )
        perf.total_leads_submitted = Lead.objects.filter(
            assigned_to=instance.assigned_to,
            created_at__date=today
        ).count()
        perf.save()

    