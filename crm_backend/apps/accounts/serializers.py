from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'username',
            'role'
        ]


class EmployeeSerializer(serializers.ModelSerializer):
    leads_count = serializers.SerializerMethodField()
    last_login_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'username',
            'role',
            'is_active',
            'created_at',
            'last_login',
            'last_login_display',
            'leads_count',
        ]
        read_only_fields = ['id', 'created_at', 'last_login', 'last_login_display', 'leads_count']

    def get_leads_count(self, obj):
        try:
            return obj.leads.count()
        except Exception:
            return 0

    def get_last_login_display(self, obj):
        if obj.last_login:
            return obj.last_login.isoformat()
        return None


class CreateEmployeeSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'full_name',
            'email',
            'username',
            'role',
            'password',
        ]

    def validate_email(self, value):
        qs = User.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        qs = User.objects.filter(username=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_role(self, value):
        allowed = ['admin', 'employee', 'qa', 'hr']
        if value not in allowed:
            raise serializers.ValidationError(f"Role must be one of: {', '.join(allowed)}")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_active = True
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UpdateEmployeeSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'full_name',
            'email',
            'username',
            'role',
            'password',
        ]

    def validate_email(self, value):
        qs = User.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        qs = User.objects.filter(username=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance