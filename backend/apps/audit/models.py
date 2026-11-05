"""Append-only audit log: who changed what and when (project.md §3.13)."""
from django.conf import settings
from django.db import models

from apps.core.models import TenantModel


class AuditLog(TenantModel):
    PUBLIC_ID_PREFIX = "aud"
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    action = models.CharField(max_length=64)  # e.g. "brand.created", "member.role_changed"
    target_type = models.CharField(max_length=64, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["brand", "-created_at"])]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValueError("Audit log entries are append-only and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Audit log entries cannot be deleted.")
