from rest_framework import serializers


class ErrorSerializer(serializers.Serializer):
    """Every API error has this shape (apps/core/exceptions.py)."""

    code = serializers.CharField(help_text='Stable machine code, e.g. "not_found".')
    message = serializers.CharField(help_text="Plain-English message that can be shown.")
    details = serializers.JSONField(help_text="Field errors, or {} when there are none.")
