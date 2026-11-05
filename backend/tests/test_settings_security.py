"""Settings hardening: rate-limit keys, session length, CSRF for the same-origin proxy."""

import pytest
from allauth.account import app_settings as account_settings
from allauth.core.internal.ratelimit import parse_rate
from django.conf import settings
from django.test import Client, override_settings

from config.settings import base
from tests.conftest import PASSWORD

BASE = "/_allauth/browser/v1"
JSON = "application/json"


def test_rate_limit_keys_exist_in_installed_allauth():
    assert isinstance(base.ACCOUNT_RATE_LIMITS, dict) and base.ACCOUNT_RATE_LIMITS
    with override_settings(ACCOUNT_RATE_LIMITS={}):
        known = set(account_settings.RATE_LIMITS)  # allauth's own defaults
    assert "login_failed" in known
    for key, value in base.ACCOUNT_RATE_LIMITS.items():
        assert key in known, f"allauth has no rate limit called {key!r}"
        for rate in value.split(","):
            parse_rate(rate)  # raises on a typo such as "5/5min/ip"


def test_session_lasts_seven_days():
    assert settings.SESSION_COOKIE_AGE == 7 * 24 * 60 * 60
    assert settings.SESSION_COOKIE_HTTPONLY and settings.SESSION_COOKIE_SAMESITE == "Lax"


@pytest.mark.django_db
def test_login_cookie_uses_the_session_age(make_user):
    make_user("asha@brand.in")
    c = Client()
    c.post(
        f"{BASE}/auth/login", {"email": "asha@brand.in", "password": PASSWORD}, content_type=JSON
    )
    assert int(c.cookies["sessionid"]["max-age"]) == settings.SESSION_COOKIE_AGE


@pytest.mark.django_db
def test_session_endpoint_sets_csrf_cookie():
    c = Client(enforce_csrf_checks=True)
    r = c.get(f"{BASE}/auth/session")
    assert r.status_code == 401  # not logged in, but...
    assert c.cookies["csrftoken"].value  # ...the app now has a CSRF token to send back


@pytest.mark.django_db
def test_unsafe_requests_need_the_csrf_header(make_user):
    make_user("asha@brand.in")
    c = Client(enforce_csrf_checks=True)
    c.get(f"{BASE}/auth/session")
    creds = {"email": "asha@brand.in", "password": PASSWORD}

    r = c.post(f"{BASE}/auth/login", creds, content_type=JSON)
    assert r.status_code == 403  # no X-CSRFToken header: refused before anything happens

    token = c.cookies["csrftoken"].value
    r = c.post(f"{BASE}/auth/login", creds, content_type=JSON, HTTP_X_CSRFTOKEN=token)
    assert r.status_code == 200, r.content

    # Our own API (session cookie) checks it too. Login rotates the token: read it again.
    token = c.cookies["csrftoken"].value
    r = c.post("/api/v1/brands/", {"name": "Zest Foods"}, content_type=JSON)
    assert r.status_code == 403
    assert r.json()["code"] == "permission_denied"
    r = c.post("/api/v1/brands/", {"name": "Zest Foods"}, content_type=JSON, HTTP_X_CSRFTOKEN=token)
    assert r.status_code == 201, r.content
