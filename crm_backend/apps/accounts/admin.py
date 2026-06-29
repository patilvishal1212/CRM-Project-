from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User

# Register your models here.

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = ('id', 'full_name', 'email', 'username', 'role', 'is_active')
    list_filter = ('role', 'is_active')

    ordering = ('id',)
    search_fields = ('full_name', 'email', 'username')

    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'full_name', 'password')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, { 
            'classes': ('wide',),
            'fields': ('email', 'username', 'full_name', 'password1', 'password2', 'role', 'is_active', 'is_staff'),
        }),
    )
