# apps/dashboard/services/admin_dashboard.py

from django.utils import timezone
from django.db.models import Sum

from .metrics_service import MetricsService
from .campaign_service import CampaignService
from .employee_service import EmployeeService
from .activity_service import ActivityService

from apps.leads.models import Lead, EmployeePerformance
from apps.campaigns.models import Campaign

from apps.dashboard.utils import (
    get_monthly_trends,
    build_lead_funnel
)


class AdminDashboardService:

    @staticmethod
    def get_dashboard(request):
        leads_qs = Lead.objects.all()
        campaigns_qs = Campaign.objects.all()

        metrics = MetricsService.admin_metrics()
        
        # Add leads submitted today to metrics
        today = timezone.now().date()
        metrics["leads_submitted_today"] = Lead.objects.filter(
            created_at__date=today
        ).count()

        # Employee-wise daily performance counts
        employee_wise_daily = []
        for record in EmployeePerformance.objects.all().order_by('-date', '-total_leads_submitted'):
            employee_wise_daily.append({
                "employee_id": record.employee_id,
                "employee_name": record.employee_name,
                "date": record.date.isoformat(),
                "day": record.day,
                "total_leads_submitted": record.total_leads_submitted
            })

        # Date-wise statistics (leads per date across all employees)
        date_stats = EmployeePerformance.objects.values('date', 'day').annotate(
            total_leads=Sum('total_leads_submitted')
        ).order_by('-date')

        date_wise_statistics = []
        for stat in date_stats:
            date_wise_statistics.append({
                "date": stat['date'].isoformat(),
                "day": stat['day'],
                "total_leads": stat['total_leads']
            })

        return {
            "role": "admin",

            "metrics": metrics,

            "trends":
                get_monthly_trends(
                    leads_qs
                ),

            "campaigns":
                CampaignService.get_campaigns_data(
                    campaigns_qs
                ),

            "activities":
                ActivityService.admin_activities(),

            "employees":
                EmployeeService.get_employees(),

            "employee_performance":
                EmployeeService.get_employee_performance(),

            "employee_wise_daily_counts":
                employee_wise_daily,

            "date_wise_statistics":
                date_wise_statistics,

            "lead_funnel":
                build_lead_funnel(
                    metrics["total_leads"],
                    metrics["pending_leads"],
                    metrics["in_progress_leads"],
                    metrics["rework_leads"],
                    metrics["qualified_leads"],
                    metrics["disqualified_leads"],
                ),
        }