from rest_framework import serializers

from .models import AuditLog, SecurityEvent


class AuditLogSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    actor_email = serializers.EmailField(source="actor.email", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "action",
            "actor_email",
            "target_type",
            "target_id",
            "metadata",
            "created_at",
        ]


class SecurityEventSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    type = serializers.ChoiceField(choices=SecurityEvent.Type.choices, read_only=True)
    description = serializers.CharField(
        read_only=True, help_text="Plain-English line to show, e.g. 'Logged in'."
    )

    class Meta:
        model = SecurityEvent
        fields = ["id", "type", "description", "created_at", "ip_address", "user_agent"]
        read_only_fields = fields
