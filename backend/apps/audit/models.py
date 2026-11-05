"""Append-only audit log: who changed what and when (project.md §3.13)."""

from typing import Any

from django.conf import settings
from django.db import models

from apps.core.models import PublicIdModel, TenantModel


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

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.pk is not None:
            raise ValueError("Audit log entries are append-only and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> Any:
        raise ValueError("Audit log entries cannot be deleted.")


class SecurityEvent(PublicIdModel):
    """A person's own account-security history: logins, password and 2-step changes.

    Not brand data (a login belongs to a person, not to a brand), so it is not a
    TenantModel and is only ever shown to that person (/api/v1/me/security-events/).
    Append-only, like AuditLog. Deleted together with the user (their personal data).
    """

    PUBLIC_ID_PREFIX = "sev"

    class Type(models.TextChoices):
        LOGIN = "login", "Logged in"
        LOGIN_FAILED = "login_failed", "Failed login attempt"
        LOGOUT = "logout", "Logged out"
        EMAIL_VERIFIED = "email_verified", "Email address verified"
        PASSWORD_RESET = "password_reset", "Password reset by email link"
        PASSWORD_CHANGED = "password_changed", "Password changed"
        MFA_ENABLED = "mfa_enabled", "2-step login turned on"
        MFA_DISABLED = "mfa_disabled", "2-step login turned off"
        RECOVERY_CODES_GENERATED = "recovery_codes_generated", "New recovery codes created"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="security_events",
        help_text="Empty for failed logins with an email that has no account.",
    )
    type = models.CharField(max_length=32, choices=Type.choices)
    # Failed logins only: what was typed into the email box, masked ("p***@brand.in").
    identifier_masked = models.CharField(max_length=254, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=256, blank=True)
    # Non-personal extras only, e.g. {"stage": "mfa"} or {"methods": ["password", "mfa"]}.
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["type", "-created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.type} {self.created_at:%Y-%m-%d %H:%M}"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.pk is not None:
            raise ValueError("Security events are append-only and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> Any:
        raise ValueError("Security events cannot be deleted.")

    @property
    def description(self) -> str:
        """Plain-English line for the user's security page."""
        if self.type == self.Type.LOGIN_FAILED and self.metadata.get("stage") == "mfa":
            return "Wrong 2-step code entered"
        if self.type == self.Type.LOGIN and "mfa" in self.metadata.get("methods", []):
            return "Logged in with password and 2-step code"
        return str(self.Type(self.type).label)
