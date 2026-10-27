from django.contrib.auth import authenticate

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer, EmployeeSerializer, CreateEmployeeSerializer, UpdateEmployeeSerializer
from .permissions import IsAdmin, IsHR


class LoginAPIView(APIView):

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(
            username=email,
            password=password
        )

        if user is None:
            return Response(
                {'error': 'Invalid Credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Your account is deactivated. Please contact an administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'name': user.full_name,
                'email': user.email,
                'role': user.role
            }
        })


class ProfileAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'id': request.user.id,
            'name': request.user.full_name,
            'email': request.user.email,
            'role': request.user.role
        })


class EmployeeListAPIView(APIView):
    """
    Admin-only: List all users or create a new user.
    GET  /api/accounts/employees/
    POST /api/accounts/employees/
    """
    permission_classes = [IsAuthenticated, IsAdmin | IsHR]

    def get(self, request):
        employees = User.objects.all().order_by('-created_at')
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CreateEmployeeSerializer(data=request.data)
        if serializer.is_valid():
            employee = serializer.save()
            return Response(
                EmployeeSerializer(employee).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeDetailAPIView(APIView):
    """
    Admin-only: Retrieve, update or delete a user.
    GET    /api/accounts/employees/<pk>/
    PUT    /api/accounts/employees/<pk>/
    DELETE /api/accounts/employees/<pk>/
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        employee = self.get_object(pk)
        if not employee:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = EmployeeSerializer(employee)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        employee = self.get_object(pk)
        if not employee:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = UpdateEmployeeSerializer(employee, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(
                EmployeeSerializer(updated).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        employee = self.get_object(pk)
        if not employee:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        if employee.pk == request.user.pk:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        employee.delete()
        return Response(
            {'message': 'User deleted successfully.'},
            status=status.HTTP_200_OK
        )


class EmployeeToggleActiveAPIView(APIView):
    """
    Admin-only: Toggle a user's is_active status.
    POST /api/accounts/employees/<pk>/toggle-active/
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            employee = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if employee.pk == request.user.pk:
            return Response(
                {'error': 'You cannot deactivate your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        employee.is_active = not employee.is_active
        employee.save()

        return Response({
            'message': f'User {"activated" if employee.is_active else "deactivated"} successfully.',
            'is_active': employee.is_active,
            'user_id': employee.id,
        }, status=status.HTTP_200_OK)