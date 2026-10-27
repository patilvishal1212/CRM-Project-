from rest_framework import serializers
from .models import DailyCount
from apps.campaigns.models import Campaign


class CampaignSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ['id', 'name', 'status']


class DailyCountSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    role = serializers.CharField(source='employee.role', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    campaign_detail = CampaignSimpleSerializer(source='campaign', read_only=True)

    class Meta:
        model = DailyCount
        fields = [
            'id',
            'employee',
            'employee_name',
            'employee_email',
            'role',
            'campaign',
            'campaign_name',
            'campaign_detail',
            'count',
            'logged_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'employee', 'created_at', 'updated_at']
