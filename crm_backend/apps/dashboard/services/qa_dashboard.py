# apps/dashboard/services/qa_dashboard.py

import datetime

from django.utils import timezone
from django.db.models import Sum

from apps.leads.models import Lead
from apps.campaigns.models import Campaign

from apps.dashboard.utils import (
    get_monthly_trends
)

from .activity_service import (
    ActivityService
)
from .campaign_service import (
    CampaignService
)


class QaDashboardService:

    @staticmethod
    def get_dashboard(request):
        user = request.user
        now = timezone.now()

        today = now.date()

        week_ago = now - datetime.timedelta(
            days=7
        )

        my_leads = Lead.objects.filter(
            assigned_qa=user
        )

        my_reviews = Lead.objects.filter(
            reviewed_by=user
        )

        total_reviewed = my_reviews.count()

        qualified = my_reviews.filter(
            qa_status="qualified"
        ).count()

        quality_score = round(
            qualified /
            total_reviewed *
            100,
            1
        ) if total_reviewed else 0

        review_queue = []

        for lead in Lead.objects.filter(
            qa_status="pending",
            assigned_qa=user
        ).select_related(
            "assigned_to",
            "campaign"
        ).order_by(
            "created_at"
        )[:10]:

            review_queue.append({
                "id": lead.id,
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "company_name":
                    lead.company_name or "N/A",
                "job_title":
                    lead.job_title,
                "qa_status":
                    lead.qa_status,
                "created_at":
                    lead.created_at.isoformat(),
                "assigned_to_name":
                    lead.assigned_to.full_name
                    if lead.assigned_to
                    else "Unassigned",
                "campaign_name":
                    lead.campaign.name
                    if lead.campaign
                    else "N/A",
                "call_recording":
                    request.build_absolute_uri(lead.call_recording.url)
                    if lead.call_recording
                    else None,
            })

        # Campaign metrics for QA
        campaigns_qs = Campaign.objects.filter(leads__assigned_qa=user).distinct()
        active_campaigns = campaigns_qs.filter(status="active").count()
        total_budget = float(
            campaigns_qs.aggregate(
                total_budget=Sum("budget")
            )["total_budget"] or 0
        )

        return {
            "role": "qa",

            "metrics": {
                "pending_reviews":
                    my_leads.filter(
                        qa_status="pending"
                    ).count(),

                "approved_leads":
                    my_leads.filter(
                        qa_status="qualified"
                    ).count(),

                "rejected_leads":
                    my_leads.filter(
                        qa_status="disqualified"
                    ).count(),

                "rework_leads":
                    my_leads.filter(
                        qa_status="rework"
                    ).count(),

                "in_progress_leads":
                    my_leads.filter(
                        qa_status="in progress"
                    ).count(),

                "today_reviews":
                    my_reviews.filter(
                        updated_at__date=today
                    ).count(),

                "weekly_reviews":
                    my_reviews.filter(
                        updated_at__gte=week_ago
                    ).count(),

                "total_reviewed_by_me":
                    total_reviewed,

                "quality_score":
                    quality_score,

                "total_leads":
                    my_leads.count(),

                "active_campaigns":
                    active_campaigns,

                "total_budget":
                    total_budget,
            },

            "review_queue":
                review_queue,

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
                ActivityService.qa_activities(),
        }