from django.contrib import admin

from .models import Brand, Membership


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ["name", "public_id", "status", "timezone", "created_at"]
    search_fields = ["name", "public_id"]
    readonly_fields = ["public_id"]


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ["brand", "user", "role", "created_at"]
    list_filter = ["role"]

    def get_queryset(self, request):
        return Membership.objects.unscoped().select_related("brand", "user")
