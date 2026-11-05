"""Tenancy base classes. Every brand-owned row inherits TenantModel (technical.md §4.3)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Self

from django.conf import settings
from django.db import models

from .ids import new_public_id

if TYPE_CHECKING:
    from apps.brands.models import Brand


class UnscopedTenantQuery(Exception):
    """Raised (in strict mode) when tenant data is read without a brand scope."""


class TenantQuerySet[M: models.Model](models.QuerySet[M]):
    _brand_scoped = False

    def for_brand(self, brand: Brand) -> Self:
        qs = self.filter(brand=brand)
        qs._brand_scoped = True
        return qs

    def unscoped(self) -> Self:
        """Explicit escape hatch for admin/maintenance code. Use sparingly."""
        qs = self.all()
        qs._brand_scoped = True
        return qs

    # Django copies a queryset on every .filter()/.order_by() via the private _clone();
    # the flag must travel with the copy. django-stubs doesn't declare _clone (private API,
    # stable since Django 1.x), hence the targeted ignore.
    def _clone(self) -> Self:
        c: Self = super()._clone()  # type: ignore[misc]
        c._brand_scoped = self._brand_scoped
        return c

    def _fetch_all(self) -> None:
        if getattr(settings, "TENANT_STRICT", False) and not self._brand_scoped:
            raise UnscopedTenantQuery(
                f"{self.model.__name__} queried without .for_brand(brand). "
                "Use .for_brand() or .unscoped() explicitly."
            )
        super()._fetch_all()


TenantManager = models.Manager.from_queryset(TenantQuerySet)


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

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.public_id:
            self.public_id = new_public_id(self.PUBLIC_ID_PREFIX)
        super().save(*args, **kwargs)


class TenantModel(PublicIdModel):
    brand = models.ForeignKey("brands.Brand", on_delete=models.CASCADE, db_index=True)

    objects = TenantManager()

    class Meta:
        abstract = True
