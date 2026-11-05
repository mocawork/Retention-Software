"""Consistent error format {code, message, details} (technical.md §13)."""
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
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
