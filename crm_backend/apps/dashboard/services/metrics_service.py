import datetime

from django.db.models import Sum
from django.utils import timezone

from apps.accounts.models import User
from apps.campaigns.models import Campaign
from apps.leads.models import Lead


class MetricsService:

    @staticmethod
    def admin_metrics():

        leads_qs = Lead.objects.all()

        campaigns_qs = Campaign.objects.all()

        total_leads = leads_qs.count()

        qualified_leads = leads_qs.filter(
            qa_status="qualified"
        ).count()

        disqualified_leads = leads_qs.filter(
            qa_status="disqualified"
        ).count()

        pending_leads = leads_qs.filter(
            qa_status="pending"
        ).count()

        rework_leads = leads_qs.filter(
            qa_status="rework"
        ).count()

        in_progress_leads = leads_qs.filter(
            qa_status="in progress"
        ).count()

        tbd_leads = leads_qs.filter(
            qa_status="tbd"
        ).count()

        active_leads = (
            pending_leads +
            rework_leads +
            in_progress_leads +
            tbd_leads
        )

        active_campaigns = campaigns_qs.filter(
            status="active"
        ).count()

        total_campaigns = campaigns_qs.count()

        total_budget = float(
            campaigns_qs.aggregate(
                total_budget=Sum("budget")
            )["total_budget"] or 0
        )

        total_employees = User.objects.count()

        active_employees = User.objects.filter(
            is_active=True
        ).count()

        qa_users_count = User.objects.filter(
            role="qa"
        ).count()

        employee_users_count = User.objects.filter(
            role="employee"
        ).count()

        admin_users_count = User.objects.filter(
            role="admin"
        ).count()

        conversion_rate = round(
            (
                qualified_leads /
                total_leads * 100
            ),
            2
        ) if total_leads else 0

        now = timezone.now()

        curr_month_start = timezone.make_aware(
            datetime.datetime(
                now.year,
                now.month,
                1
            )
        )

        prev_month_start = curr_month_start - datetime.timedelta(
            days=1
        )

        prev_month_start = timezone.make_aware(
            datetime.datetime(
                prev_month_start.year,
                prev_month_start.month,
                1
            )
        )

        curr_month_leads = leads_qs.filter(
            created_at__gte=curr_month_start
        ).count()

        prev_month_leads = leads_qs.filter(
            created_at__gte=prev_month_start,
            created_at__lt=curr_month_start
        ).count()

        monthly_growth = round(
            (
                (
                    curr_month_leads -
                    prev_month_leads
                )
                /
                prev_month_leads
            ) * 100,
            1
        ) if prev_month_leads else (
            100.0 if curr_month_leads else 0
        )

        return {
            "total_leads": total_leads,
            "active_leads": active_leads,
            "qualified_leads": qualified_leads,
            "disqualified_leads": disqualified_leads,
            "pending_leads": pending_leads,
            "rework_leads": rework_leads,
            "in_progress_leads": in_progress_leads,
            "tbd_leads": tbd_leads,
            "active_campaigns": active_campaigns,
            "total_campaigns": total_campaigns,
            "total_budget": total_budget,
            "total_employees": total_employees,
            "active_employees": active_employees,
            "qa_users_count": qa_users_count,
            "employee_users_count": employee_users_count,
            "admin_users_count": admin_users_count,
            "conversion_rate": conversion_rate,
            "monthly_growth": monthly_growth,
            "curr_month_leads": curr_month_leads,
        }