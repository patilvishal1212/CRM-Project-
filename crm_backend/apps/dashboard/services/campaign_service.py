from apps.leads.models import Lead


class CampaignService:

    @staticmethod
    def get_campaigns_data(
        campaigns_qs,
        user=None
    ):

        campaigns_data = []

        for campaign in campaigns_qs[:5]:

            camp_leads = Lead.objects.filter(
                campaign=campaign
            )

            if user:
                if user.role == "employee":
                    camp_leads = camp_leads.filter(
                        assigned_to=user
                    )
                elif user.role == "qa":
                    camp_leads = camp_leads.filter(
                        assigned_qa=user
                    )

            camp_data = {
                "id": campaign.id,
                "name": campaign.name,
                "status": campaign.status,
                "leads_count": camp_leads.count(),
                "qualified_count": camp_leads.filter(
                    qa_status="qualified"
                ).count(),
                "start_date":
                    campaign.start_date.isoformat(),
                "end_date":
                    campaign.end_date.isoformat(),
            }
            if not user or user.role == "admin":
                camp_data["budget"] = float(campaign.budget)

            campaigns_data.append(camp_data)

        return campaigns_data