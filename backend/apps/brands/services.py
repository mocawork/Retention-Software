"""Write logic for brands, members and invitations. Views stay thin."""

import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError

from apps.audit.services import record

from .models import Brand, Invitation, Membership, Role

INVITE_TTL = timedelta(days=7)


class InvitationInvalid(APIException):
    """Revoked, already used, or unknown. Each subclass has its own `code` for the app."""

    status_code = 400
    default_code = "invitation_invalid"
    default_detail = "This invitation is no longer valid."


class InvitationExpired(InvitationInvalid):
    default_code = "invitation_expired"
    default_detail = "This invitation has expired. Ask for a new one."


class InvitationEmailMismatch(InvitationInvalid):
    default_code = "invitation_email_mismatch"
    default_detail = "This invitation was sent to a different email address."


class InvitationAlreadyAccepted(InvitationInvalid):
    default_code = "invitation_already_accepted"
    default_detail = "This invitation has already been accepted."


def display_name(user) -> str:
    """How we name a teammate to others: their name, or their email if they have none."""
    if user is None:
        return "A teammate"
    return user.full_name.strip() or user.email


def _send_invitation_email(invitation: Invitation) -> None:
    context = {
        "brand_name": invitation.brand.name,
        "inviter_name": display_name(invitation.invited_by),
        "role_label": invitation.get_role_display(),
        "accept_url": f"{settings.FRONTEND_URL}/invitations/{invitation.token}",
        "expiry_days": INVITE_TTL.days,
    }
    subject = render_to_string("brands/email/invitation_subject.txt", context)
    send_mail(
        subject=" ".join(subject.split()),
        message=render_to_string("brands/email/invitation_message.txt", context),
        from_email=None,
        recipient_list=[invitation.email],
    )


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
    _send_invitation_email(invitation)
    record(
        brand=brand,
        actor=actor_membership.user,
        action="member.invited",
        target=invitation,
        metadata={"email": email, "role": role},
        request=request,
    )
    return invitation


@transaction.atomic
def accept_invitation(*, user, token: str, request=None) -> Membership:
    invitation = Invitation.objects.unscoped().select_for_update().filter(token=token).first()
    if invitation is None:
        raise InvitationInvalid()
    if invitation.status == Invitation.Status.ACCEPTED:
        raise InvitationAlreadyAccepted()
    if invitation.status != Invitation.Status.PENDING:
        raise InvitationInvalid()
    if invitation.is_expired:
        raise InvitationExpired()
    if invitation.email.lower() != user.email.lower():
        raise InvitationEmailMismatch()
    membership, _ = Membership.objects.for_brand(invitation.brand).get_or_create(
        brand=invitation.brand, user=user, defaults={"role": invitation.role}
    )
    invitation.status = Invitation.Status.ACCEPTED
    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["status", "accepted_at", "updated_at"])
    record(
        brand=invitation.brand,
        actor=user,
        action="member.joined",
        target=membership,
        metadata={"role": membership.role},
        request=request,
    )
    return membership


@transaction.atomic
def revoke_invitation(
    *, actor_membership: Membership, invitation: Invitation, request=None
) -> Invitation:
    """Cancels an invitation so its link stops working. Revoking twice is harmless."""
    if invitation.status == Invitation.Status.ACCEPTED:
        raise InvitationAlreadyAccepted()
    if invitation.role == Role.OWNER and actor_membership.role != Role.OWNER:
        raise PermissionDenied("Only an Owner can cancel an invitation to become an Owner.")
    if invitation.status == Invitation.Status.REVOKED:
        return invitation
    invitation.status = Invitation.Status.REVOKED
    invitation.save(update_fields=["status", "updated_at"])
    record(
        brand=invitation.brand,
        actor=actor_membership.user,
        action="member.invitation_revoked",
        target=invitation,
        metadata={"email": invitation.email, "role": invitation.role},
        request=request,
    )
    return invitation


@transaction.atomic
def change_role(*, actor_membership: Membership, membership: Membership, role: str, request=None):
    _guard_owner_assignment(actor_membership, role)
    if membership.role == Role.OWNER and actor_membership.role != Role.OWNER:
        raise PermissionDenied("Only an Owner can change another Owner's role.")
    _ensure_not_last_owner(membership, new_role=role)
    old = membership.role
    membership.role = role
    membership.save(update_fields=["role", "updated_at"])
    record(
        brand=membership.brand,
        actor=actor_membership.user,
        action="member.role_changed",
        target=membership,
        metadata={"from": old, "to": role},
        request=request,
    )
    return membership


@transaction.atomic
def remove_member(*, actor_membership: Membership, membership: Membership, request=None):
    if membership.role == Role.OWNER and actor_membership.role != Role.OWNER:
        raise PermissionDenied("Only an Owner can remove another Owner.")
    _ensure_not_last_owner(membership, new_role=None)
    record(
        brand=membership.brand,
        actor=actor_membership.user,
        action="member.removed",
        target=membership,
        metadata={"email": membership.user.email},
        request=request,
    )
    membership.delete()


def _ensure_not_last_owner(membership: Membership, new_role) -> None:
    if membership.role != Role.OWNER or new_role == Role.OWNER:
        return
    owners = Membership.objects.for_brand(membership.brand).filter(role=Role.OWNER).count()
    if owners <= 1:
        raise ValidationError({"role": "A brand must always have at least one Owner."})
