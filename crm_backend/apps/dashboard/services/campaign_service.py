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

            campaigns_data.append({
                "id": campaign.id,
                "name": campaign.name,
                "budget": float(campaign.budget),
                "status": campaign.status,
                "leads_count": camp_leads.count(),
                "qualified_count": camp_leads.filter(
                    qa_status="qualified"
                ).count(),
                "start_date":
                    campaign.start_date.isoformat(),
                "end_date":
                    campaign.end_date.isoformat(),
            })

        return campaigns_data