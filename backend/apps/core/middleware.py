"""Request context for logs: request_id, user_id and brand_id on every log line."""

import re
import time
import uuid
from collections.abc import Callable
from typing import Any

import structlog
from django.http import HttpRequest, HttpResponse

REQUEST_ID_HEADER = "X-Request-ID"
# Accept an incoming ID (e.g. from Cloudflare or the frontend) only if it is short and
# plain; anything else is replaced, so logs can't be polluted through this header.
_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")

access_log = structlog.get_logger("retentionos.request")


class RequestContextMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        structlog.contextvars.clear_contextvars()
        incoming = request.headers.get(REQUEST_ID_HEADER, "")
        request_id = incoming if _VALID_REQUEST_ID.match(incoming) else uuid.uuid4().hex
        request.request_id = request_id  # type: ignore[attr-defined]
        structlog.contextvars.bind_contextvars(request_id=request_id)
        started = time.monotonic()

        response = self.get_response(request)

        response[REQUEST_ID_HEADER] = request_id
        self._bind_user(request)  # API-token logins are only known after the view ran
        match = getattr(request, "resolver_match", None)
        access_log.info(
            "request_finished",
            method=request.method,
            # The URL pattern, not the raw path: paths can contain secrets (invite tokens).
            route=getattr(match, "route", None) or "unmatched",
            status=response.status_code,
            duration_ms=round((time.monotonic() - started) * 1000, 1),
        )
        structlog.contextvars.clear_contextvars()
        return response

    def process_view(
        self,
        request: HttpRequest,
        view_func: Callable[..., Any],
        view_args: tuple[Any, ...],
        view_kwargs: dict[str, Any],
    ) -> None:
        self._bind_user(request)
        brand_id = view_kwargs.get("brand_id")
        if brand_id:
            structlog.contextvars.bind_contextvars(brand_id=str(brand_id)[:40])
        return None

    @staticmethod
    def _bind_user(request: HttpRequest) -> None:
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            structlog.contextvars.bind_contextvars(user_id=getattr(user, "public_id", ""))
