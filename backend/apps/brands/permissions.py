"""One permission path for every brand-scoped endpoint (technical.md §4.3).

Brand comes from the URL (/api/v1/brands/{brand_id}/...). A user who is not a member
gets 404 (not 403), so they can't even learn that the brand exists.
"""

from typing import TYPE_CHECKING, Any

from django.http import Http404
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request

from apps.accounts.mfa_policy import mfa_status

from .models import ROLE_RANK, Brand, Membership, Role

# The mixins below sit in front of DRF's APIView in the class hierarchy. Telling the type
# checker so lets it see the `initial()` method they extend; at runtime they stay plain.
if TYPE_CHECKING:
    from rest_framework.views import APIView as _ViewBase
else:
    _ViewBase = object


class MfaSetupRequired(PermissionDenied):
    default_detail = "Please set up 2-step login to continue."
    default_code = "mfa_setup_required"


def enforce_mfa(user: Any) -> None:
    """Blocks app endpoints once the 2-step login deadline has passed (D-039)."""
    if mfa_status(user).blocked:
        raise MfaSetupRequired()


class MfaEnforcedMixin(_ViewBase):
    """Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
    exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages)."""

    def initial(self, request: Request, *args: Any, **kwargs: Any) -> None:
        super().initial(request, *args, **kwargs)
        enforce_mfa(request.user)


class BrandScopedMixin(MfaEnforcedMixin):
    #: Minimum role per HTTP method. Override in views.
    min_role_read: str = Role.VIEWER
    min_role_write: str = Role.ADMIN

    brand: Brand
    membership: Membership

    def initial(self, request: Request, *args: Any, **kwargs: Any) -> None:
        super().initial(request, *args, **kwargs)  # authentication + 2-step login rule
        brand_id = kwargs.get("brand_id")
        membership = (
            Membership.objects.unscoped()
            .select_related("brand")
            .filter(brand__public_id=brand_id, user=request.user)
            .first()
        )
        if membership is None:
            raise Http404
        self.brand = membership.brand
        self.membership = membership
        needed = (
            self.min_role_read
            if request.method in ("GET", "HEAD", "OPTIONS")
            else self.min_role_write
        )
        if ROLE_RANK[membership.role] < ROLE_RANK[needed]:
            raise PermissionDenied("Your role doesn't allow this action.")
