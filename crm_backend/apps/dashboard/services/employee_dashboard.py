# apps/dashboard/services/employee_dashboard.py

import datetime

from django.utils import timezone
from django.db.models import Sum

from apps.leads.models import Lead
from apps.campaigns.models import Campaign

from apps.dashboard.utils import (
    get_monthly_trends
)

from .campaign_service import (
    CampaignService
)

from .activity_service import (
    ActivityService
)


class EmployeeDashboardService:

    @staticmethod
    def get_dashboard(request):
        user = request.user
        now = timezone.now()

        week_ago = now - datetime.timedelta(
            days=7
        )

        my_leads = Lead.objects.filter(
            assigned_to=user
        )

        campaigns_qs = Campaign.objects.filter(
            leads__assigned_to=user
        ).distinct()

        total_assigned = my_leads.count()

        qualified_leads = my_leads.filter(
            qa_status="qualified"
        ).count()

        active_campaigns = campaigns_qs.filter(status="active").count()
        total_budget = float(
            campaigns_qs.aggregate(
                total_budget=Sum("budget")
            )["total_budget"] or 0
        )

        return {
            "role": "employee",

            "metrics": {

                "total_assigned":
                    total_assigned,

                "total_leads":
                    total_assigned, # Map for frontend uniformity

                "today_leads":
                    my_leads.filter(
                        data=now.date()
                    ).count(),

                "pending_followups":
                    my_leads.filter(
                        qa_status="pending"
                    ).count(),

                "pending_leads":
                    my_leads.filter(
                        qa_status="pending"
                    ).count(), # Map for frontend uniformity

                "rework_followups":
                    my_leads.filter(
                        qa_status="rework"
                    ).count(),

                "rework_leads":
                    my_leads.filter(
                        qa_status="rework"
                    ).count(),

                "qualified_leads":
                    qualified_leads,

                "disqualified_leads":
                    my_leads.filter(
                        qa_status="disqualified"
                    ).count(),

                "monthly_leads":
                    my_leads.filter(
                        created_at__month=
                        now.month
                    ).count(),

                "monthly_qualified":
                    my_leads.filter(
                        created_at__month=
                        now.month,
                        qa_status="qualified"
                    ).count(),

                "weekly_leads":
                    my_leads.filter(
                        created_at__gte=
                        week_ago
                    ).count(),

                "conversion_rate":
                    round(
                        qualified_leads /
                        total_assigned *
                        100,
                        2
                    )
                    if total_assigned
                    else 0,

                "total_campaigns":
                    campaigns_qs.count(),

                "active_campaigns":
                    active_campaigns,

                "total_budget":
                    total_budget,
            },

            "campaigns":
                CampaignService.get_campaigns_data(
                    campaigns_qs,
                    user
                ),

            "trends":
                get_monthly_trends(
                    my_leads
                ),

            "activities":
                ActivityService.employee_activities(
                    user
                ),
        }