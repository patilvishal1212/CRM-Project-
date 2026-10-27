from django.urls import path
from .views import (
    LogCountAPIView,
    MyDailyLogsAPIView,
    WorkforceRecordsAPIView,
    WorkforceRecordDetailAPIView,
)

urlpatterns = [
    path('log-count/', LogCountAPIView.as_view(), name='daily-tracker-log-count'),
    path('my-logs/', MyDailyLogsAPIView.as_view(), name='daily-tracker-my-logs'),
    path('workforce-records/', WorkforceRecordsAPIView.as_view(), name='daily-tracker-workforce-records'),
    path('workforce-records/<int:pk>/', WorkforceRecordDetailAPIView.as_view(), name='daily-tracker-workforce-detail'),
]
