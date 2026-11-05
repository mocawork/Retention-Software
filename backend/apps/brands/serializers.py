from zoneinfo import available_timezones

from rest_framework import serializers

from .models import Brand, Invitation, Membership, Role


class BrandSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = ["id", "name", "timezone", "currency", "platform", "status", "my_role",
                  "created_at"]
        read_only_fields = ["id", "currency", "platform", "status", "my_role", "created_at"]

    def get_my_role(self, obj) -> str | None:
        return getattr(obj, "my_role", None) or self.context.get("my_role")

    def validate_timezone(self, value):
        if value not in available_timezones():
            raise serializers.ValidationError("Unknown timezone.")
        return value

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Brand name can't be empty.")
        return value.strip()


class MembershipSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Membership
        fields = ["id", "email", "full_name", "role", "created_at"]
        read_only_fields = ["id", "email", "full_name", "created_at"]


class InvitationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    role = serializers.ChoiceField(choices=Role.choices)

    class Meta:
        model = Invitation
        fields = ["id", "email", "role", "status", "expires_at", "created_at"]
        read_only_fields = ["id", "status", "expires_at", "created_at"]


class AcceptInvitationSerializer(serializers.Serializer):
    token = serializers.CharField()


class OnboardingStepSerializer(serializers.Serializer):
    key = serializers.CharField()
    title = serializers.CharField()
    state = serializers.ChoiceField(choices=["done", "current", "coming_next", "locked"])
    description = serializers.CharField()


class OnboardingSerializer(serializers.Serializer):
    steps = OnboardingStepSerializer(many=True)
