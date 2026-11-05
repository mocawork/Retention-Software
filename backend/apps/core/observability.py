"""Logs and error reporting (technical.md §18).

* structlog everywhere: JSON lines in staging/production (for CloudWatch), readable
  coloured lines locally. Django's and libraries' own (stdlib) log lines go through the
  same formatter, so every line has the same shape.
* Every line carries request_id / user_id / brand_id when there is a request
  (see core/middleware.py) and passes through the PII mask (core/pii.py).
* Sentry starts only when SENTRY_DSN is set, and never sends personal data.

This module must not import Django models: settings import it.
"""

import logging
from typing import Any

import structlog

from .pii import structlog_processor as mask_pii


def _shared_processors() -> list[Any]:
    """Run for our own (structlog) lines and for stdlib lines alike."""
    return [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
    ]


def build_formatter(json_logs: bool) -> structlog.stdlib.ProcessorFormatter:
    """The one stdlib logging formatter (used by LOGGING and by the tests)."""
    renderer: Any
    if json_logs:
        renderer = structlog.processors.JSONRenderer()
        final = [structlog.processors.format_exc_info, mask_pii, renderer]
    else:
        renderer = structlog.dev.ConsoleRenderer()
        final = [mask_pii, renderer]
    return structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=_shared_processors(),
        processors=[structlog.stdlib.ProcessorFormatter.remove_processors_meta, *final],
    )


class RedactRequestPathFilter(logging.Filter):
    """Django logs 4xx/5xx as "Not Found: <path>". Paths can contain secrets (invitation
    tokens), so the path is swapped for the URL pattern, e.g. invitations/<str:token>/."""

    def filter(self, record: logging.LogRecord) -> bool:
        request = getattr(record, "request", None)
        route = getattr(getattr(request, "resolver_match", None), "route", None)
        if route and isinstance(record.args, tuple):
            path = getattr(request, "path", None)
            record.args = tuple(f"/{route}" if arg == path else arg for arg in record.args)
        return True


def logging_config(*, json_logs: bool, level: str = "INFO") -> dict[str, Any]:
    """Django LOGGING dict: everything goes to stdout through build_formatter()."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "structlog": {"()": f"{__name__}.build_formatter", "json_logs": json_logs},
        },
        "filters": {"redact_request_path": {"()": f"{__name__}.RedactRequestPathFilter"}},
        "handlers": {
            "stdout": {
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
                "formatter": "structlog",
            },
        },
        "root": {"handlers": ["stdout"], "level": level},
        "loggers": {
            "django.request": {"filters": ["redact_request_path"]},
            # Django's own access lines duplicate ours (retentionos.request).
            "django.server": {"level": "WARNING"},
        },
    }


def configure_structlog() -> None:
    """Called once at start-up (CoreConfig.ready)."""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            *_shared_processors(),
            structlog.processors.StackInfoRenderer(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def init_sentry(dsn: str, *, environment: str = "local", traces_sample_rate: float = 0.0) -> bool:
    """Starts Sentry only if a DSN is configured. Returns True if it was started."""
    if not dsn:
        return False
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        send_default_pii=False,  # no emails, IPs, cookies or request bodies (§16, §18)
        traces_sample_rate=traces_sample_rate,
    )
    return True
