"""One permission path for every brand-scoped endpoint (technical.md §4.3).

Brand comes from the URL (/api/v1/brands/{brand_id}/...). A user who is not a member
gets 404 (not 403), so they can't even learn that the brand exists.
"""
from django.http import Http404
from rest_framework.exceptions import PermissionDenied

from apps.accounts.mfa_policy import mfa_status

from .models import ROLE_RANK, Brand, Membership, Role


class MfaSetupRequired(PermissionDenied):
    default_detail = "Please set up 2-step login to continue."
    default_code = "mfa_setup_required"


def enforce_mfa(user) -> None:
    """Blocks app endpoints once the 2-step login deadline has passed (D-039)."""
    if mfa_status(user).blocked:
        raise MfaSetupRequired()


class MfaEnforcedMixin:
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        enforce_mfa(request.user)


class BrandScopedMixin:
    #: Minimum role per HTTP method. Override in views.
    min_role_read = Role.VIEWER
    min_role_write = Role.ADMIN

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        enforce_mfa(request.user)
        brand_id = kwargs.get("brand_id")
        membership = (
            Membership.objects.unscoped()
            .select_related("brand")
            .filter(brand__public_id=brand_id, user=request.user)
            .first()
        )
        if membership is None:
            raise Http404
        self.brand: Brand = membership.brand
        self.membership: Membership = membership
        needed = self.min_role_read if request.method in ("GET", "HEAD", "OPTIONS") else (
            self.min_role_write
        )
        if ROLE_RANK[membership.role] < ROLE_RANK[needed]:
            raise PermissionDenied("Your role doesn't allow this action.")
