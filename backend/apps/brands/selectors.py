from django.db.models import F, QuerySet

from .models import Brand, Invitation


def brands_for_user(user):
    return (
        Brand.objects.filter(membership__user=user)
        .annotate(my_role=F("membership__role"))
        .order_by("name")
    )


def open_invitations(brand: Brand) -> QuerySet[Invitation]:
    """Invitations not yet accepted or revoked, newest first. Expired ones are included so
    the team page can show them as expired (status is computed, see Invitation)."""
    return (
        Invitation.objects.for_brand(brand)
        .filter(status=Invitation.Status.PENDING)
        .order_by("-created_at")
    )


def invitation_by_token(token: str) -> Invitation | None:
    """Public lookup for the invitation preview page. The token is the only key: it is
    unguessable (256 bits) and is never exposed in lists or logs."""
    return (
        Invitation.objects.unscoped()
        .select_related("brand", "invited_by")
        .filter(token=token)
        .first()
    )


def onboarding_steps(brand: Brand) -> list[dict]:
    """The setup checklist. Flow from project.md §3.1.

    M0 stop line (docs/milestones/M0-scope.md): "Connect store" is shown as coming next;
    later steps stay locked until their milestones ship.
    """
    store_state = "coming_next"

    return [
        {
            "key": "account",
            "title": "Create your account",
            "state": "done",
            "description": "You're signed in and your email is verified.",
        },
        {
            "key": "brand",
            "title": "Create your brand",
            "state": "done",
            "description": f"{brand.name} is set up.",
        },
        {
            "key": "connect_store",
            "title": "Connect your store",
            "state": store_state,
            "description": "Connect Shopify or upload a CSV so we can learn from your orders.",
        },
        {
            "key": "questionnaire",
            "title": "Tell us about your brand",
            "state": "locked",
            "description": "A short questionnaire you can fill in while your data syncs.",
        },
        {
            "key": "data_quality",
            "title": "Review your data-quality report",
            "state": "locked",
            "description": "See what we found in your data, in plain English.",
        },
        {
            "key": "whatsapp",
            "title": "Connect WhatsApp",
            "state": "locked",
            "description": "Link your own WhatsApp Business account. You pay Meta directly.",
        },
        {
            "key": "first_campaign",
            "title": "Launch your first campaign",
            "state": "locked",
            "description": "Pick an opportunity and send it in a few clicks.",
        },
    ]
