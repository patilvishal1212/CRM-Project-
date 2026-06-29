import datetime

from django.utils import timezone

from apps.leads.models import Lead


def get_monthly_trends(leads_qs, months=6):

    now = timezone.now()

    months_data = []

    for i in range(months - 1, -1, -1):

        month_date = now - datetime.timedelta(
            days=i * 30
        )

        year = month_date.year
        month = month_date.month

        start_date = timezone.make_aware(
            datetime.datetime(year, month, 1)
        )

        if month == 12:
            end_date = timezone.make_aware(
                datetime.datetime(year + 1, 1, 1)
            )
        else:
            end_date = timezone.make_aware(
                datetime.datetime(year, month + 1, 1)
            )

        month_leads = leads_qs.filter(
            created_at__gte=start_date,
            created_at__lt=end_date
        )

        months_data.append({
            "month": month_date.strftime("%b"),
            "total": month_leads.count(),
            "qualified": month_leads.filter(
                qa_status="qualified"
            ).count(),
        })

    return months_data


def build_lead_funnel(
    total_leads,
    pending_leads,
    in_progress_leads,
    rework_leads,
    qualified_leads,
    disqualified_leads,
):

    return [
        {
            "stage": "Total Leads",
            "count": total_leads,
            "color": "#6366f1",
        },
        {
            "stage": "In Review",
            "count": pending_leads + in_progress_leads,
            "color": "#f59e0b",
        },
        {
            "stage": "Rework",
            "count": rework_leads,
            "color": "#f97316",
        },
        {
            "stage": "Qualified",
            "count": qualified_leads,
            "color": "#10b981",
        },
        {
            "stage": "Disqualified",
            "count": disqualified_leads,
            "color": "#f43f5e",
        },
    ]