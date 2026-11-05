"""Write logic for brands, members and invitations. Views stay thin."""
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.audit.services import record

from .models import Brand, Invitation, Membership, Role

INVITE_TTL = timedelta(days=7)


@transaction.atomic
def create_brand(*, user, name: str, timezone_name: str = "Asia/Kolkata", request=None) -> Brand:
    brand = Brand.objects.create(name=name.strip(), timezone=timezone_name)
    Membership.objects.create(brand=brand, user=user, role=Role.OWNER)
    record(brand=brand, actor=user, action="brand.created", target=brand, request=request)
    return brand


def _guard_owner_assignment(actor_membership: Membership, role: str) -> None:
    if role == Role.OWNER and actor_membership.role != Role.OWNER:
        raise PermissionDenied("Only an Owner can make someone an Owner.")


@transaction.atomic
def invite_member(*, actor_membership: Membership, email: str, role: str, request=None):
    _guard_owner_assignment(actor_membership, role)
    brand = actor_membership.brand
    email = email.strip().lower()
    if Membership.objects.for_brand(brand).filter(user__email=email).exists():
        raise ValidationError({"email": "This person is already a member of this brand."})
    Invitation.objects.for_brand(brand).filter(email=email, status="pending").update(
        status=Invitation.Status.REVOKED
    )
    invitation = Invitation.objects.create(
        brand=brand,
        email=email,
        role=role,
        token=secrets.token_urlsafe(32),
        invited_by=actor_membership.user,
        expires_at=timezone.now() + INVITE_TTL,
    )
    link = f"{settings.FRONTEND_URL}/invitations/{invitation.token}"
    send_mail(
        subject=f"You're invited to {brand.name} on RetentionOS",
        message=f"{actor_membership.user.email} invited you to join {brand.name} as "
        f"{invitation.get_role_display()}.\n\nAccept: {link}\n\nThis link expires in 7 days.",
        from_email=None,
        recipient_list=[email],
    )
    record(brand=brand, actor=actor_membership.user, action="member.invited", target=invitation,
           metadata={"email": email, "role": role}, request=request)
    return invitation


@transaction.atomic
def accept_invitation(*, user, token: str, request=None) -> Membership:
    invitation = (
        Invitation.objects.unscoped().select_for_update().filter(token=token).first()
    )
    if invitation is None or invitation.status != Invitation.Status.PENDING:
        raise ValidationError({"token": "This invitation is no longer valid."})
    if invitation.expires_at < timezone.now():
        raise ValidationError({"token": "This invitation has expired. Ask for a new one."})
    if invitation.email.lower() != user.email.lower():
        raise ValidationError({"token": "This invitation was sent to a different email address."})
    membership, _ = Membership.objects.for_brand(invitation.brand).get_or_create(
        brand=invitation.brand, user=user, defaults={"role": invitation.role}
    )
    invitation.status = Invitation.Status.ACCEPTED
    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["status", "accepted_at", "updated_at"])
    record(brand=invitation.brand, actor=user, action="member.joined", target=membership,
           metadata={"role": membership.role}, request=request)
    return membership


@transaction.atomic
def change_role(*, actor_membership: Membership, membership: Membership, role: str, request=None):
    _guard_owner_assignment(actor_membership, role)
    if membership.role == Role.OWNER and actor_membership.role != Role.OWNER:
        raise PermissionDenied("Only an Owner can change another Owner's role.")
    _ensure_not_last_owner(membership, new_role=role)
    old = membership.role
    membership.role = role
    membership.save(update_fields=["role", "updated_at"])
    record(brand=membership.brand, actor=actor_membership.user, action="member.role_changed",
           target=membership, metadata={"from": old, "to": role}, request=request)
    return membership


@transaction.atomic
def remove_member(*, actor_membership: Membership, membership: Membership, request=None):
    if membership.role == Role.OWNER and actor_membership.role != Role.OWNER:
        raise PermissionDenied("Only an Owner can remove another Owner.")
    _ensure_not_last_owner(membership, new_role=None)
    record(brand=membership.brand, actor=actor_membership.user, action="member.removed",
           target=membership, metadata={"email": membership.user.email}, request=request)
    membership.delete()


def _ensure_not_last_owner(membership: Membership, new_role) -> None:
    if membership.role != Role.OWNER or new_role == Role.OWNER:
        return
    owners = Membership.objects.for_brand(membership.brand).filter(role=Role.OWNER).count()
    if owners <= 1:
        raise ValidationError({"role": "A brand must always have at least one Owner."})
