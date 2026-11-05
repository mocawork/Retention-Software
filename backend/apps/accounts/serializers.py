from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .mfa_policy import mfa_status
from .models import User


class MfaStatusSerializer(serializers.Serializer):
    enabled = serializers.BooleanField(help_text="2-step login is set up.")
    required = serializers.BooleanField(help_text="The current policy requires it.")
    deadline = serializers.DateTimeField(
        allow_null=True, help_text="When it becomes blocking. Null = never."
    )
    blocked = serializers.BooleanField(
        help_text="True = the user must set up 2-step login before continuing."
    )


class MeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    mfa = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "mfa"]
        read_only_fields = ["id", "email"]

    @extend_schema_field(MfaStatusSerializer)
    def get_mfa(self, obj):
        return MfaStatusSerializer(mfa_status(obj)).data
