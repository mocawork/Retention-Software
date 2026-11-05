"""Masking personal data before it reaches logs, Sentry or the security log.

technical.md §16 (no PII where it isn't needed) and §18 (no PII in log events).
Masked values keep just enough to recognise them ("p***@brand.in", "+**********10").
"""

import re
from collections.abc import Mapping
from typing import Any

REDACTED = "[redacted]"

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+")
# Indian-style phone numbers: optional +CC or trunk 0, then 10 digits (5+5, spaces/dashes ok).
# Deliberately strict so dates ("2026-11-05") and IDs are left alone.
_PHONE_RE = re.compile(r"(?<![\w.+-])(?:\+\d{1,3}[\s-]?|0)?\d{5}[\s-]?\d{5}(?![\w.-])")

#: Keys whose values are secrets: never logged, not even masked.
SECRET_KEYS = frozenset(
    {
        "password",
        "password1",
        "password2",
        "new_password",
        "token",
        "key",
        "code",
        "secret",
        "otp",
        "authorization",
        "cookie",
        "session",
        "sessionid",
        "csrftoken",
        "x-session-token",
        "recovery_codes",
    }
)
#: Keys whose values are personal data: logged masked.
PII_KEYS = frozenset(
    {
        "email",
        "phone",
        "identifier",
        "to",
        "recipient",
        "name",
        "full_name",
        "first_name",
        "last_name",
        "address",
    }
)
#: Keys we add ourselves that never hold personal data (left as they are).
SAFE_KEYS = frozenset(
    {"timestamp", "level", "logger", "request_id", "user_id", "brand_id", "route", "method"}
)


def mask_email(value: str) -> str:
    local, sep, domain = value.strip().partition("@")
    if not sep or not local or not domain:
        return _mask_word(value)
    return f"{local[0]}***@{domain.lower()}"


def mask_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) < 4:
        return "***"
    prefix = "+" if value.strip().startswith("+") else ""
    return f"{prefix}{'*' * (len(digits) - 2)}{digits[-2:]}"


def mask_identifier(value: str | None) -> str:
    """Whatever someone typed into a login box: an email, a phone number, or anything."""
    if not value:
        return ""
    text = str(value).strip()
    if "@" in text:
        return mask_email(text)
    if _PHONE_RE.fullmatch(text):
        return mask_phone(text)
    return _mask_word(text)


def mask_text(text: str) -> str:
    """Masks emails and phone numbers that appear inside free text (e.g. log messages)."""
    text = _EMAIL_RE.sub(lambda m: mask_email(m.group(0)), text)
    return _PHONE_RE.sub(lambda m: mask_phone(m.group(0)), text)


def mask_mapping(data: Mapping[str, Any]) -> dict[str, Any]:
    """A copy that is safe to log: secrets removed, personal fields masked, nested too."""
    out: dict[str, Any] = {}
    for key, value in data.items():
        lowered = str(key).lower()
        if lowered in SAFE_KEYS:
            out[key] = value
        elif lowered in SECRET_KEYS:
            out[key] = REDACTED
        elif lowered in PII_KEYS and value not in (None, ""):
            out[key] = _mask_pii_value(lowered, value)
        elif isinstance(value, Mapping):
            out[key] = mask_mapping(value)
        elif isinstance(value, str):
            out[key] = mask_text(value)
        else:
            out[key] = value
    return out


def structlog_processor(logger: Any, method_name: str, event_dict: Any) -> Any:
    """structlog processor: runs mask_mapping on every log event (see core/logging.py)."""
    return mask_mapping(event_dict)


def _mask_pii_value(key: str, value: Any) -> str:
    if not isinstance(value, str):
        return REDACTED
    if key == "phone":
        return mask_phone(value)
    if key in {"email", "identifier", "to", "recipient"}:
        return mask_identifier(value)
    return _mask_word(value)


def _mask_word(value: str) -> str:
    value = value.strip()
    return f"{value[:1]}***" if value else ""
