# apps/dashboard/services/activity_service.py

from apps.leads.models import Lead


class ActivityService:

    @staticmethod
    def admin_activities():

        activities = []

        recent_leads = Lead.objects.select_related(
            "assigned_to",
            "reviewed_by",
            "campaign"
        ).order_by(
            "-updated_at"
        )[:10]

        for lead in recent_leads:

            activities.append({
                "id": lead.id,
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "company_name":
                    lead.company_name
                    or lead.industry
                    or "N/A",
                "qa_status": lead.qa_status,
                "updated_at":
                    lead.updated_at.isoformat(),
                "created_at":
                    lead.created_at.isoformat(),
                "assigned_to_name":
                    lead.assigned_to.full_name
                    if lead.assigned_to
                    else "Unassigned",
                "reviewed_by_name":
                    lead.reviewed_by.full_name
                    if lead.reviewed_by
                    else None,
                "campaign_name":
                    lead.campaign.name
                    if lead.campaign
                    else "N/A",
            })

        return activities

    @staticmethod
    def qa_activities():

        activities = []

        leads = Lead.objects.exclude(
            qa_status="pending"
        ).select_related(
            "reviewed_by"
        ).order_by(
            "-updated_at"
        )[:10]

        for lead in leads:

            activities.append({
                "id": lead.id,
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "company_name":
                    lead.company_name or "N/A",
                "qa_status":
                    lead.qa_status,
                "updated_at":
                    lead.updated_at.isoformat(),
                "reviewed_by_name":
                    lead.reviewed_by.full_name
                    if lead.reviewed_by
                    else "N/A",
            })

        return activities

    @staticmethod
    def employee_activities(user):

        activities = []

        leads = Lead.objects.filter(
            assigned_to=user
        ).select_related(
            "campaign"
        ).order_by(
            "-updated_at"
        )[:8]

        for lead in leads:

            activities.append({
                "id": lead.id,
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "company_name":
                    lead.company_name or "N/A",
                "qa_status":
                    lead.qa_status,
                "updated_at":
                    lead.updated_at.isoformat(),
                "campaign_name":
                    lead.campaign.name
                    if lead.campaign
                    else "N/A",
            })

        return activities