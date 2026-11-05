"""Account security events: recorded from the signals allauth/Django really send."""

import re
from urllib.parse import unquote

import pytest
from django.core import mail
from django.test import Client

from apps.audit.models import SecurityEvent
from tests.conftest import PASSWORD

BASE = "/_allauth/browser/v1"
JSON = "application/json"


def _login(c, email, password=PASSWORD):
    return c.post(
        f"{BASE}/auth/login",
        {"email": email, "password": password},
        content_type=JSON,
        HTTP_USER_AGENT="TestBrowser/1.0",
    )


def _mail_key(kind: str) -> str:
    match = re.search(rf"/{kind}/(\S+)", str(mail.outbox[-1].body))
    assert match, f"no {kind} link in the last email"
    return unquote(match.group(1))


def _types(user):
    return list(SecurityEvent.objects.filter(user=user).values_list("type", flat=True))


@pytest.mark.django_db
def test_login_logout_and_my_list(make_user):
    user = make_user("asha@brand.in")
    c = Client()
    assert _login(c, "asha@brand.in").status_code == 200
    assert c.delete(f"{BASE}/auth/session").status_code == 401  # 401 = logged out now
    assert _types(user) == ["logout", "login"]

    login = SecurityEvent.objects.get(user=user, type="login")
    assert login.ip_address == "127.0.0.1"
    assert login.user_agent == "TestBrowser/1.0"
    assert login.metadata == {"methods": ["password"]}

    assert _login(c, "asha@brand.in").status_code == 200
    r = c.get("/api/v1/me/security-events/")
    assert r.status_code == 200, r.content
    events = r.json()
    assert [e["type"] for e in events] == ["login", "logout", "login"]
    assert set(events[0]) == {"id", "type", "description", "created_at", "ip_address", "user_agent"}
    assert events[0]["id"].startswith("sev_")
    assert events[0]["description"] == "Logged in"


@pytest.mark.django_db
def test_failed_logins_are_masked(make_user):
    user = make_user("asha@brand.in")
    c = Client()
    assert _login(c, "Asha@Brand.in", "wrong-password-1").status_code == 400
    event = SecurityEvent.objects.get(type="login_failed", user=user)
    assert event.identifier_masked == "a***@brand.in"  # allauth lowercases emails
    assert event.metadata == {"stage": "password"}
    assert "asha" not in event.identifier_masked.lower()

    # Unknown email: kept for security monitoring, linked to nobody, shown to nobody.
    assert _login(c, "nobody@brand.in", "wrong-password-1").status_code == 400
    orphan = SecurityEvent.objects.get(type="login_failed", user=None)
    assert orphan.identifier_masked == "n***@brand.in"

    assert _login(c, "asha@brand.in").status_code == 200
    listed = c.get("/api/v1/me/security-events/").json()
    assert [e["type"] for e in listed] == ["login", "login_failed"]
    assert listed[1]["description"] == "Failed login attempt"


@pytest.mark.django_db
def test_signup_verify_reset_and_change_password():
    c = Client()
    r = c.post(
        f"{BASE}/auth/signup", {"email": "new@brand.in", "password": PASSWORD}, content_type=JSON
    )
    assert r.status_code == 401
    key = _mail_key("verify-email")
    assert c.post(f"{BASE}/auth/email/verify", {"key": key}, content_type=JSON).status_code == 200

    from apps.accounts.models import User

    user = User.objects.get(email="new@brand.in")
    assert _types(user) == ["login", "email_verified"]

    new_pw = "Changed-strong-pw-77"
    r = c.post(
        f"{BASE}/account/password/change",
        {"current_password": PASSWORD, "new_password": new_pw},
        content_type=JSON,
    )
    assert r.status_code == 200, r.content
    assert _types(user)[0] == "password_changed"

    anon = Client()
    anon.post(f"{BASE}/auth/password/request", {"email": "new@brand.in"}, content_type=JSON)
    key = _mail_key("reset-password")
    r = anon.post(
        f"{BASE}/auth/password/reset",
        {"key": key, "password": "Reset-strong-pw-88"},
        content_type=JSON,
    )
    assert r.status_code in (200, 401), r.content
    assert "password_reset" in _types(user)


@pytest.mark.django_db
def test_only_my_events_and_at_most_50(make_user, client_for):
    me, other = make_user("me@brand.in"), make_user("other@brand.in")
    for _ in range(55):
        SecurityEvent.objects.create(user=me, type="login")
    SecurityEvent.objects.create(user=other, type="login")
    r = client_for(me).get("/api/v1/me/security-events/")
    assert r.status_code == 200
    ids = [e["id"] for e in r.json()]
    assert len(ids) == 50
    other_ids = set(SecurityEvent.objects.filter(user=other).values_list("public_id", flat=True))
    assert not other_ids & set(ids)


@pytest.mark.django_db
def test_security_events_are_append_only(make_user):
    event = SecurityEvent.objects.create(user=make_user(), type="login")
    event.type = "logout"
    with pytest.raises(ValueError):
        event.save()
    with pytest.raises(ValueError):
        event.delete()


@pytest.mark.django_db
def test_requires_login():
    assert Client().get("/api/v1/me/security-events/").status_code in (401, 403)
