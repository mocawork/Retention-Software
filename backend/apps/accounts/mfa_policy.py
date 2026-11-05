"""When 2-step login (TOTP) is mandatory. D-039; U-4 is still open.

The rule is configuration only, so the founders' later decision needs no code change:

* MFA_ENFORCEMENT = "off"            -> optional for everyone
* MFA_ENFORCEMENT = "signup"         -> must be set up before using the app
* MFA_ENFORCEMENT = "within_7_days"  -> must be set up within MFA_GRACE_DAYS of sign-up
* MFA_ENFORCED_ROLES                 -> which brand roles the rule applies to

A user who has no brand yet is treated as a future Owner (they're about to create one).
"""

from dataclasses import dataclass
from datetime import datetime, timedelta

from allauth.mfa.models import Authenticator
from django.conf import settings
from django.utils import timezone


@dataclass(frozen=True)
class MfaStatus:
    enabled: bool
    required: bool
    deadline: datetime | None  # when it becomes blocking (None = never)
    blocked: bool  # True = must set up 2-step login before continuing


def has_mfa(user) -> bool:
    return Authenticator.objects.filter(user=user, type=Authenticator.Type.TOTP).exists()


def _applies_to(user) -> bool:
    from apps.brands.models import Membership

    roles = set(getattr(settings, "MFA_ENFORCED_ROLES", []))
    user_roles = set(Membership.objects.unscoped().filter(user=user).values_list("role", flat=True))
    if not user_roles:
        return "owner" in roles
    return bool(user_roles & roles)


def mfa_status(user, now: datetime | None = None) -> MfaStatus:
    now = now or timezone.now()
    enabled = has_mfa(user)
    policy = getattr(settings, "MFA_ENFORCEMENT", "off")
    if policy == "off" or not _applies_to(user):
        return MfaStatus(enabled=enabled, required=False, deadline=None, blocked=False)
    if policy == "signup":
        deadline = user.created_at
    elif policy == "within_7_days":
        deadline = user.created_at + timedelta(days=getattr(settings, "MFA_GRACE_DAYS", 7))
    else:
        raise ValueError(f"Unknown MFA_ENFORCEMENT value: {policy!r}")
    return MfaStatus(
        enabled=enabled,
        required=True,
        deadline=deadline,
        blocked=(not enabled) and now >= deadline,
    )
