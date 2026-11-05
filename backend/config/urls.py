from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts.views import MeView
from apps.audit.views import AuditLogListView
from apps.brands import views as brand_views
from apps.core.views import health

brand_patterns = [
    path("", brand_views.BrandDetailView.as_view(), name="brand-detail"),
    path("onboarding/", brand_views.OnboardingView.as_view(), name="brand-onboarding"),
    path("members/", brand_views.MemberListView.as_view(), name="brand-members"),
    path("members/<str:member_id>/", brand_views.MemberDetailView.as_view(),
         name="brand-member-detail"),
    path("invitations/", brand_views.InvitationListCreateView.as_view(),
         name="brand-invitations"),
    path("audit-log/", AuditLogListView.as_view(), name="brand-audit-log"),
]

api_v1 = [
    path("health/", health, name="health"),
    path("me/", MeView.as_view(), name="me"),
    path("brands/", brand_views.BrandListCreateView.as_view(), name="brand-list"),
    path("brands/<str:brand_id>/", include(brand_patterns)),
    path("invitations/accept/", brand_views.AcceptInvitationView.as_view(),
         name="invitation-accept"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("_allauth/", include("allauth.headless.urls")),
    path("api/v1/", include(api_v1)),
]
