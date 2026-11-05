from rest_framework import generics, serializers

from apps.brands.models import Role
from apps.brands.permissions import BrandScopedMixin

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    actor_email = serializers.EmailField(source="actor.email", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = ["id", "action", "actor_email", "target_type", "target_id", "metadata",
                  "created_at"]


class AuditLogListView(BrandScopedMixin, generics.ListAPIView):
    serializer_class = AuditLogSerializer
    min_role_read = Role.ADMIN

    def get_queryset(self):
        return AuditLog.objects.for_brand(self.brand).select_related("actor")[:200]
