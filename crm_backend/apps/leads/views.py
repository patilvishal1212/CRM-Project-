from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Lead
from .serializers import LeadSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


# Create your views here.


class LeadListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        user = request.user

        if user.role == 'admin':
            leads = Lead.objects.all().order_by('-created_at')
        elif user.role == 'qa':
            leads = Lead.objects.filter(assigned_qa=user).order_by('-created_at')
        else:
            leads = Lead.objects.filter(assigned_to=user).order_by('-created_at')

        serializer = LeadSerializer(leads, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


    def post(self, request):
        serializer = LeadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(assigned_to=request.user)
            return Response({"message": "Lead created successfully", "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeadQAReviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        user = request.user

        if user.role not in ['qa', 'admin']:
            return Response(
                {"error": "Only QA or Admin users can review leads."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            lead = Lead.objects.get(pk=pk)

        except Lead.DoesNotExist:
            return Response(
                {"error": "Lead not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        qa_status = request.data.get('qa_status')
        qa_comments = request.data.get('qa_comments')

        allowed_statuses = [
            'pending',
            'qualified',
            'disqualified',
            'in progress',
            'tbd',
            'rework'
        ]

        if qa_status and qa_status not in allowed_statuses:
            return Response(
                {"error": "Invalid QA status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if qa_status:
            lead.qa_status = qa_status

        if qa_comments:
            lead.qa_comments = qa_comments

        lead.reviewed_by = user
        lead.save()

        return Response(
            {
                "message": "Lead reviewed successfully",
                "lead_id": lead.id,
                "qa_status": lead.qa_status,
                "qa_comments": lead.qa_comments,
                "reviewed_by": user.full_name,
            },
            status=status.HTTP_200_OK
        )