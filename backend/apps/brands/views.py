from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import record

from . import services
from .models import Invitation, Membership, Role
from .permissions import BrandScopedMixin, MfaEnforcedMixin
from .selectors import brands_for_user, onboarding_steps
from .serializers import (
    AcceptInvitationSerializer,
    BrandSerializer,
    InvitationSerializer,
    MembershipSerializer,
    OnboardingSerializer,
)


class BrandListCreateView(MfaEnforcedMixin, generics.ListCreateAPIView):
    """Brands I belong to; create a new brand (I become its Owner)."""

    serializer_class = BrandSerializer
    pagination_class = None

    def get_queryset(self):
        return brands_for_user(self.request.user)

    def perform_create(self, serializer):
        d = serializer.validated_data
        brand = services.create_brand(
            user=self.request.user, name=d["name"],
            timezone_name=d.get("timezone", "Asia/Kolkata"), request=self.request,
        )
        brand.my_role = Role.OWNER
        serializer.instance = brand


class BrandDetailView(BrandScopedMixin, generics.RetrieveUpdateAPIView):
    serializer_class = BrandSerializer
    http_method_names = ["get", "patch"]

    def get_object(self):
        self.brand.my_role = self.membership.role
        return self.brand

    def perform_update(self, serializer):
        before = {k: getattr(self.brand, k) for k in serializer.validated_data}
        serializer.save()
        record(brand=self.brand, actor=self.request.user, action="brand.updated",
               target=self.brand, metadata={"before": before, "after": serializer.validated_data},
               request=self.request)


class OnboardingView(BrandScopedMixin, APIView):
    @extend_schema(responses=OnboardingSerializer)
    def get(self, request, brand_id):
        return Response({"steps": onboarding_steps(self.brand)})


class MemberListView(BrandScopedMixin, generics.ListAPIView):
    serializer_class = MembershipSerializer
    pagination_class = None

    def get_queryset(self):
        return Membership.objects.for_brand(self.brand).select_related("user").order_by(
            "created_at"
        )


class MemberDetailView(BrandScopedMixin, generics.UpdateAPIView, generics.DestroyAPIView):
    serializer_class = MembershipSerializer
    lookup_field = "public_id"
    lookup_url_kwarg = "member_id"
    http_method_names = ["patch", "delete"]

    def get_queryset(self):
        return Membership.objects.for_brand(self.brand).select_related("user")

    def perform_update(self, serializer):
        serializer.instance = services.change_role(
            actor_membership=self.membership, membership=serializer.instance,
            role=serializer.validated_data["role"], request=self.request,
        )

    def perform_destroy(self, instance):
        services.remove_member(actor_membership=self.membership, membership=instance,
                               request=self.request)


class InvitationListCreateView(BrandScopedMixin, generics.ListCreateAPIView):
    serializer_class = InvitationSerializer
    pagination_class = None
    min_role_read = Role.ADMIN

    def get_queryset(self):
        return Invitation.objects.for_brand(self.brand).filter(
            status=Invitation.Status.PENDING
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.instance = services.invite_member(
            actor_membership=self.membership, email=serializer.validated_data["email"],
            role=serializer.validated_data["role"], request=self.request,
        )


class AcceptInvitationView(MfaEnforcedMixin, APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=AcceptInvitationSerializer, responses={201: BrandSerializer})
    def post(self, request):
        s = AcceptInvitationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        membership = services.accept_invitation(
            user=request.user, token=s.validated_data["token"], request=request
        )
        brand = membership.brand
        brand.my_role = membership.role
        return Response(BrandSerializer(brand).data, status=status.HTTP_201_CREATED)
