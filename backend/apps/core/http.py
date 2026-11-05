"""Small, safe readers for request metadata (used by the audit and security logs)."""

import ipaddress
from typing import Any

USER_AGENT_MAX = 256


def client_ip(request: Any) -> str | None:
    """The caller's IP address, or None if missing or malformed.

    Uses REMOTE_ADDR only. Once hosting is decided (O-01) and a trusted proxy such as
    Cloudflare sits in front, read its client-IP header here instead (one place).
    """
    if request is None:
        return None
    raw = request.META.get("REMOTE_ADDR") or ""
    try:
        return str(ipaddress.ip_address(raw.strip()))
    except ValueError:
        return None


def user_agent(request: Any) -> str:
    if request is None:
        return ""
    return str(request.META.get("HTTP_USER_AGENT", ""))[:USER_AGENT_MAX]
