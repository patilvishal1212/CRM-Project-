from django.urls import path
from .views import LeadListCreateAPIView, LeadQAReviewAPIView, LeadExportCSVAPIView

urlpatterns = [
    path('', LeadListCreateAPIView.as_view(), name='lead-list-create'),
    path('export/', LeadExportCSVAPIView.as_view(), name='lead-export-csv'),
    path('<int:pk>/qa-review/', LeadQAReviewAPIView.as_view(), name='lead-qa-review'),
]