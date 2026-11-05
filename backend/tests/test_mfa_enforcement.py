"""Meta-test: every /api/v1/ route enforces the 2-step login rule, or is on this list.

Adding a new endpoint? Use BrandScopedMixin or MfaEnforcedMixin. Only add a route to
EXEMPT if a user must reach it *before* setting up 2-step login (and say why).
"""

import re

import pytest
from django.test import override_settings
from django.urls import URLPattern, URLResolver, get_resolver

from apps.brands.permissions import MfaEnforcedMixin

EXEMPT = {
    "api/v1/health/": "uptime checks; no user data",
    "api/v1/me/": "the app reads mfa.blocked here to show the setup screen",
    "api/v1/me/security-events/": "the person's own security history",
    "api/v1/schema/": "API description",
    "api/v1/docs/": "API documentation page",
    "api/v1/invitations/<str:token>/": "public invitation preview, before any login",
}


def _walk(patterns, prefix=""):
    for p in patterns:
        if isinstance(p, URLResolver):
            yield from _walk(p.url_patterns, prefix + str(p.pattern))
        elif isinstance(p, URLPattern):
            yield prefix + str(p.pattern), p


def api_routes() -> list[tuple[str, URLPattern]]:
    return [(r, p) for r, p in _walk(get_resolver().url_patterns) if r.startswith("api/v1/")]


def test_every_api_route_is_enforced_or_exempt():
    routes = api_routes()
    assert len(routes) > 10
    for route, pattern in routes:
        view_cls = getattr(pattern.callback, "cls", None)
        enforced = view_cls is not None and issubclass(view_cls, MfaEnforcedMixin)
        assert enforced != (route in EXEMPT), f"{route}: enforced={enforced}"
    assert set(EXEMPT) <= {r for r, _ in routes}, "EXEMPT lists a route that no longer exists"


@pytest.mark.django_db
@override_settings(MFA_ENFORCEMENT="signup")
def test_blocked_user_is_stopped_on_every_enforced_route(brand_with, client_for):
    brand, owner = brand_with()  # no 2-step login set up -> blocked immediately
    c = client_for(owner)
    for route, _ in api_routes():
        url = "/" + re.sub(
            r"<str:(\w+)>", lambda m: brand.public_id if m.group(1) == "brand_id" else "x", route
        )
        responses = {m: getattr(c, m)(url, {}, format="json") for m in ("get", "post", "delete")}
        if route in EXEMPT:
            for r in responses.values():
                assert b"mfa_setup_required" not in r.content, url
            continue
        for method, r in responses.items():
            assert r.status_code == 403, (method, url, r.status_code)
            assert r.json()["code"] == "mfa_setup_required", (method, url)
