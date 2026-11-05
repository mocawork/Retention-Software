from django.db.models import QuerySet

from .models import SecurityEvent

SECURITY_EVENTS_SHOWN = 50


def security_events_for_user(user) -> QuerySet[SecurityEvent]:
    """The person's own latest security events, newest first."""
    return SecurityEvent.objects.filter(user=user).order_by("-created_at", "-id")[
        :SECURITY_EVENTS_SHOWN
    ]
