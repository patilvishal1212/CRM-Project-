from django.urls import path

from .views import (
    CampaignListCreateAPIView,
    CampaignDetailAPIView,
    ActiveCampaignsAPIView,
)

urlpatterns = [
    path(
        '',
        CampaignListCreateAPIView.as_view(),
        name='campaign-list-create'
    ),

    path(
        'dropdown/',
        ActiveCampaignsAPIView.as_view(),
        name='campaign-dropdown'
    ),

    path(
        '<int:pk>/',
        CampaignDetailAPIView.as_view(),
        name='campaign-detail'
    ),
]