from django.contrib import admin
from .models import Lead

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'first_name',
        'last_name',
        'email',
        'company_name',
        'qa_status',
        'campaign',
        'assigned_to',
        'created_at'
    )
    search_fields = (
        'first_name',
        'last_name',
        'email',
        'company_name'
    )
    list_filter = (
        'qa_status',
        'campaign',
        'assigned_to'
    )

