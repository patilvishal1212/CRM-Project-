from rest_framework import serializers
from .models import Lead
from apps.campaigns.models import Campaign

class LeadSerializer(serializers.ModelSerializer):

    campaign = serializers.SlugRelatedField(
        slug_field='name',
        queryset=Campaign.objects.all()
    )


    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    

    class Meta:
        model = Lead
        fields = '__all__'
        extra_kwargs = {
            'assigned_to': {'required': False},
            'reviewed_by': {'required': False}
        }    