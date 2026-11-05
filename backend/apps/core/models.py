"""Tenancy base classes. Every brand-owned row inherits TenantModel (technical.md §4.3)."""
from django.conf import settings
from django.db import models

from .ids import new_public_id


class UnscopedTenantQuery(Exception):
    """Raised (in strict mode) when tenant data is read without a brand scope."""


class TenantQuerySet(models.QuerySet):
    _brand_scoped = False

    def for_brand(self, brand):
        qs = self.filter(brand=brand)
        qs._brand_scoped = True
        return qs

    def unscoped(self):
        """Explicit escape hatch for admin/maintenance code. Use sparingly."""
        qs = self._chain()
        qs._brand_scoped = True
        return qs

    def _clone(self):
        c = super()._clone()
        c._brand_scoped = self._brand_scoped
        return c

    def _fetch_all(self):
        if getattr(settings, "TENANT_STRICT", False) and not self._brand_scoped:
            raise UnscopedTenantQuery(
                f"{self.model.__name__} queried without .for_brand(brand). "
                "Use .for_brand() or .unscoped() explicitly."
            )
        super()._fetch_all()


class TenantManager(models.Manager.from_queryset(TenantQuerySet)):
    pass


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PublicIdModel(TimestampedModel):
    """Adds a non-guessable `public_id`. Subclasses set PUBLIC_ID_PREFIX."""

    PUBLIC_ID_PREFIX = "obj"
    public_id = models.CharField(max_length=32, unique=True, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.public_id:
            self.public_id = new_public_id(self.PUBLIC_ID_PREFIX)
        super().save(*args, **kwargs)


class TenantModel(PublicIdModel):
    brand = models.ForeignKey("brands.Brand", on_delete=models.CASCADE, db_index=True)

    objects = TenantManager()

    class Meta:
        abstract = True
