from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to Admin role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "admin"
        )


class IsEmployee(BasePermission):
    """Allow access only to Employee role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "employee"
        )


class IsQA(BasePermission):
    """Allow access only to QA role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "qa"
        )


class IsAdminOrQA(BasePermission):
    """Allow access to Admin or QA role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ["admin", "qa"]
        )


class IsAdminOrEmployee(BasePermission):
    """Allow access to Admin or Employee role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ["admin", "employee"]
        )