from django.db.models import F

from .models import Brand


def brands_for_user(user):
    return (
        Brand.objects.filter(membership__user=user)
        .annotate(my_role=F("membership__role"))
        .order_by("name")
    )


def onboarding_steps(brand: Brand) -> list[dict]:
    """The setup checklist. Flow from project.md §3.1.

    M0 stop line (docs/milestones/M0-scope.md): "Connect store" is shown as coming next;
    later steps stay locked until their milestones ship.
    """
    store_state = "coming_next"

    return [
        {"key": "account", "title": "Create your account", "state": "done",
         "description": "You're signed in and your email is verified."},
        {"key": "brand", "title": "Create your brand", "state": "done",
         "description": f"{brand.name} is set up."},
        {"key": "connect_store", "title": "Connect your store", "state": store_state,
         "description": "Connect Shopify or upload a CSV so we can learn from your orders."},
        {"key": "questionnaire", "title": "Tell us about your brand", "state": "locked",
         "description": "A short questionnaire you can fill in while your data syncs."},
        {"key": "data_quality", "title": "Review your data-quality report", "state": "locked",
         "description": "See what we found in your data, in plain English."},
        {"key": "whatsapp", "title": "Connect WhatsApp", "state": "locked",
         "description": "Link your own WhatsApp Business account. You pay Meta directly."},
        {"key": "first_campaign", "title": "Launch your first campaign", "state": "locked",
         "description": "Pick an opportunity and send it in a few clicks."},
    ]
