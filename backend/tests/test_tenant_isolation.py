"""A user of brand A must get 404 for every brand-B endpoint (technical.md §4.3, §19).

Add every new brand-scoped URL to BRAND_URLS. test_every_brand_route_is_covered fails
if a brand route exists that this suite doesn't hit.
"""
import pytest
from django.urls import get_resolver

from apps.audit.models import AuditLog
from apps.core.models import UnscopedTenantQuery

BRAND_URLS = [
    ("get", "/api/v1/brands/{b}/"),
    ("patch", "/api/v1/brands/{b}/"),
    ("get", "/api/v1/brands/{b}/onboarding/"),
    ("get", "/api/v1/brands/{b}/members/"),
    ("patch", "/api/v1/brands/{b}/members/{m}/"),
    ("delete", "/api/v1/brands/{b}/members/{m}/"),
    ("get", "/api/v1/brands/{b}/invitations/"),
    ("post", "/api/v1/brands/{b}/invitations/"),
    ("get", "/api/v1/brands/{b}/audit-log/"),
]


@pytest.mark.django_db
@pytest.mark.parametrize("method,url", BRAND_URLS)
def test_other_brand_returns_404(method, url, brand_with, client_for):
    from apps.brands.models import Membership

    brand_a, owner_a = brand_with(email="a@a.in")
    brand_b, owner_b = brand_with(email="b@b.in")
    member_b = Membership.objects.for_brand(brand_b).get(user=owner_b)
    c = client_for(owner_a)
    r = getattr(c, method)(url.format(b=brand_b.public_id, m=member_b.public_id),
                           {"name": "x", "email": "x@x.in", "role": "viewer"}, format="json")
    assert r.status_code == 404, (method, url, r.status_code)


def test_every_brand_route_is_covered():
    covered = {u.split("{b}/")[1] for _, u in BRAND_URLS}
    resolver = get_resolver()
    found = set()
    for p in resolver.url_patterns:
        if str(p.pattern) != "api/v1/":
            continue
        for sub in p.url_patterns:
            if str(sub.pattern).startswith("brands/<str:brand_id>/"):
                for leaf in sub.url_patterns:
                    found.add(str(leaf.pattern).replace("<str:member_id>", "{m}"))
    assert found <= covered, f"Add to BRAND_URLS: {found - covered}"


@pytest.mark.django_db
def test_unscoped_tenant_query_raises_in_tests(brand_with):
    brand, _ = brand_with()
    with pytest.raises(UnscopedTenantQuery):
        list(AuditLog.objects.all())
    assert AuditLog.objects.for_brand(brand).count() >= 1


@pytest.mark.django_db
def test_audit_log_is_append_only(brand_with):
    brand, _ = brand_with()
    entry = AuditLog.objects.for_brand(brand).first()
    entry.action = "tampered"
    with pytest.raises(ValueError):
        entry.save()
    with pytest.raises(ValueError):
        entry.delete()


@pytest.mark.django_db
def test_public_ids_are_not_sequential(brand_with):
    b1, _ = brand_with(email="one@x.in")
    b2, _ = brand_with(email="two@x.in")
    assert b1.public_id.startswith("brd_") and len(b1.public_id) == 24
    assert b1.public_id != b2.public_id
