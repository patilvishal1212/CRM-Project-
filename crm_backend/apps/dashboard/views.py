

# apps/dashboard/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services.admin_dashboard import (
    AdminDashboardService
)

from .services.qa_dashboard import (
    QaDashboardService
)

from .services.employee_dashboard import (
    EmployeeDashboardService
)


class DashboardAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        if user.role == "admin":
            data = (
                AdminDashboardService
                .get_dashboard(request)
            )

        elif user.role == "qa":
            data = (
                QaDashboardService
                .get_dashboard(request)
            )

        else:
            data = (
                EmployeeDashboardService
                .get_dashboard(request)
            )

        return Response(data)
