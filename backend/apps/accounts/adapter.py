"""Small django-allauth adapter: lets our email templates say how long links stay valid.

The numbers come from the same settings allauth uses, so an email can't promise a
different expiry from the one that is actually enforced.
"""

from typing import Any

from allauth.account import app_settings as account_settings
from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings


def duration_text(seconds: int) -> str:
    """3 days / 1 day / 12 hours / 30 minutes (plain English for emails)."""
    for unit_seconds, unit in ((86400, "day"), (3600, "hour"), (60, "minute")):
        if seconds >= unit_seconds and seconds % unit_seconds == 0:
            count = seconds // unit_seconds
            return f"{count} {unit}{'' if count == 1 else 's'}"
    return f"{seconds} seconds"


class AccountAdapter(DefaultAccountAdapter):
    def send_mail(self, template_prefix: str, email: str, context: dict[str, Any]) -> None:
        context = {
            **context,
            "confirmation_valid_for": duration_text(
                account_settings.EMAIL_CONFIRMATION_EXPIRE_DAYS * 86400
            ),
            "reset_valid_for": duration_text(settings.PASSWORD_RESET_TIMEOUT),
        }
        super().send_mail(template_prefix, email, context)
