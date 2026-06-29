from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
# Create your models here.
from .managers import UserManager

class User(AbstractBaseUser, PermissionsMixin):
    ADMIN = 'admin'
    EMPLOYEE = 'employee'
    QA = 'qa'

    ROLE_CHOICES = (
        (ADMIN, 'Admin'),
        (EMPLOYEE, 'Employee'),
        (QA, 'QA'),
    )
    
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    def __str__(self):
        return self.full_name
