from django.contrib import admin

from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["email", "full_name", "is_active", "is_staff", "created_at"]
    search_fields = ["email", "full_name"]
    readonly_fields = ["public_id", "last_login", "created_at"]
    exclude = ["password"]
