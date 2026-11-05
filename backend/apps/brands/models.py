from django.conf import settings
from django.db import models

from apps.core.models import PublicIdModel, TenantModel


class Brand(PublicIdModel):
    """A tenant: one brand's isolated data space."""

    PUBLIC_ID_PREFIX = "brd"

    class Status(models.TextChoices):
        ONBOARDING = "onboarding"
        ACTIVE = "active"
        SUSPENDED = "suspended"

    class Platform(models.TextChoices):
        NONE = "none", "Not connected yet"
        SHOPIFY = "shopify", "Shopify"
        WOOCOMMERCE = "woocommerce", "WooCommerce"
        CSV = "csv", "CSV import"

    name = models.CharField(max_length=120)
    timezone = models.CharField(max_length=64, default="Asia/Kolkata")
    currency = models.CharField(max_length=3, default="INR")
    # Store connection is M1 (waits on O-15 etc., M0-scope stop line). Always "none" in M0.
    platform = models.CharField(max_length=16, choices=Platform.choices, default=Platform.NONE)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ONBOARDING)

    def __str__(self) -> str:
        return self.name


class Role(models.TextChoices):
    OWNER = "owner", "Owner"
    ADMIN = "admin", "Admin"
    MARKETER = "marketer", "Marketer"
    VIEWER = "viewer", "Viewer"


ROLE_RANK = {Role.VIEWER: 1, Role.MARKETER: 2, Role.ADMIN: 3, Role.OWNER: 4}


class Membership(TenantModel):
    PUBLIC_ID_PREFIX = "mem"
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.CharField(max_length=16, choices=Role.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["brand", "user"], name="uniq_membership_brand_user")
        ]

    def has_at_least(self, role: str) -> bool:
        return ROLE_RANK[self.role] >= ROLE_RANK[role]


class Invitation(TenantModel):
    PUBLIC_ID_PREFIX = "inv"

    class Status(models.TextChoices):
        PENDING = "pending"
        ACCEPTED = "accepted"
        REVOKED = "revoked"

    email = models.EmailField()
    role = models.CharField(max_length=16, choices=Role.choices)
    token = models.CharField(max_length=64, unique=True, editable=False)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["brand", "status"])]
