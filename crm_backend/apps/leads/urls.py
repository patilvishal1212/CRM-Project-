from django.urls import path
from .views import LeadListCreateAPIView, LeadQAReviewAPIView

urlpatterns = [
    path('', LeadListCreateAPIView.as_view(), name='lead-list-create'),
    path('<int:pk>/qa-review/', LeadQAReviewAPIView.as_view(), name='lead-qa-review'),
]