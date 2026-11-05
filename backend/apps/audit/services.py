"""Write logic for the brand audit log and the per-person security log."""

from typing import Any

import structlog
from django.db import DatabaseError, transaction

from apps.core.http import client_ip, user_agent
from apps.core.pii import mask_identifier

from .models import AuditLog, SecurityEvent

logger = structlog.get_logger(__name__)


def record(*, brand, actor, action, target=None, metadata=None, request=None) -> AuditLog:
    return AuditLog.objects.create(
        brand=brand,
        actor=actor,
        action=action,
        target_type=type(target).__name__ if target is not None else "",
        target_id=getattr(target, "public_id", "") if target is not None else "",
        metadata=metadata or {},
        ip_address=client_ip(request),
    )


def record_security_event(
    event_type: str,
    *,
    user: Any = None,
    request: Any = None,
    identifier: str = "",
    metadata: dict[str, Any] | None = None,
) -> SecurityEvent | None:
    """Adds one line to a person's security history.

    Never breaks the login/logout it describes: if the row can't be saved, the problem is
    logged (without personal data) and the user carries on.
    """
    if user is not None and not getattr(user, "pk", None):
        user = None  # anonymous / unsaved users are not linked
    try:
        with transaction.atomic():
            return SecurityEvent.objects.create(
                type=event_type,
                user=user,
                identifier_masked=mask_identifier(identifier),
                ip_address=client_ip(request),
                user_agent=user_agent(request),
                metadata=metadata or {},
            )
    except DatabaseError:
        logger.exception("security_event_not_saved", event_type=event_type)
        return None
