from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Campaign
from .serializers import CampaignSerializer


class CampaignListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        campaigns = Campaign.objects.all().order_by('-created_at')
        serializer = CampaignSerializer(campaigns, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admin users can create campaigns."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = CampaignSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CampaignDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Campaign.objects.get(pk=pk)
        except Campaign.DoesNotExist:
            return None

    def get(self, request, pk):
        campaign = self.get_object(pk)
        if campaign is None:
            return Response(
                {"error": "Campaign not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CampaignSerializer(campaign)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admin users can update campaigns."},
                status=status.HTTP_403_FORBIDDEN
            )
        campaign = self.get_object(pk)
        if campaign is None:
            return Response(
                {"error": "Campaign not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CampaignSerializer(campaign, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admin users can delete campaigns."},
                status=status.HTTP_403_FORBIDDEN
            )
        campaign = self.get_object(pk)
        if campaign is None:
            return Response(
                {"error": "Campaign not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        campaign.delete()
        return Response(
            {"message": "Campaign deleted successfully."},
            status=status.HTTP_200_OK
        )


class ActiveCampaignsAPIView(APIView):
    """
    Returns a minimal list of all campaigns for use in dropdowns.
    All authenticated users can access this to populate form selectors.
    GET /api/campaigns/dropdown/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        campaigns = Campaign.objects.all().order_by('name').values(
            'id', 'name', 'status'
        )
        return Response(list(campaigns), status=status.HTTP_200_OK)