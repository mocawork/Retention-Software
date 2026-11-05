from rest_framework import generics

from apps.brands.models import Role
from apps.brands.permissions import BrandScopedMixin

from .models import AuditLog
from .selectors import security_events_for_user
from .serializers import AuditLogSerializer, SecurityEventSerializer


class AuditLogListView(BrandScopedMixin, generics.ListAPIView):
    serializer_class = AuditLogSerializer
    min_role_read = Role.ADMIN

    def get_queryset(self):
        return AuditLog.objects.for_brand(self.brand).select_related("actor")[:200]


class MySecurityEventsView(generics.ListAPIView):
    """My own latest 50 security events (logins, failed attempts, password and 2-step
    changes). Reachable before 2-step login is set up, like /me/."""

    serializer_class = SecurityEventSerializer
    pagination_class = None

    def get_queryset(self):
        return security_events_for_user(self.request.user)
