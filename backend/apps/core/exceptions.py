"""Consistent error format {code, message, details} (technical.md §13)."""

from typing import Any

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    # Django's own 404/403 become DRF's generic ones, so the app always gets a stable
    # `code` ("not_found", "permission_denied") and messages never name internal models.
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = exceptions.PermissionDenied()
    response = drf_exception_handler(exc, context)
    if response is None:
        return None
    data = response.data
    code = getattr(exc, "default_code", "error")
    if isinstance(data, dict) and "detail" in data and len(data) == 1:
        message, details = str(data["detail"]), {}
    else:
        message, details = "Some fields need attention.", data
    response.data = {"code": code, "message": message, "details": details}
    return response
