"""2-step login (TOTP + recovery codes) end to end through allauth's headless browser API.

This is exactly what the frontend does. Codes are computed with allauth's own TOTP maths.
"""

import time

import pytest
from allauth.mfa import app_settings as mfa_settings
from allauth.mfa.totp.internal.auth import format_hotp_value, hotp_value
from django.test import Client, override_settings

from apps.audit.models import SecurityEvent
from tests.conftest import PASSWORD

BASE = "/_allauth/browser/v1"
JSON = "application/json"


def totp_code(secret: str) -> str:
    counter = int(time.time()) // mfa_settings.TOTP_PERIOD
    return format_hotp_value(hotp_value(secret, counter))


def wrong_code(secret: str) -> str:
    return f"{(int(totp_code(secret)) + 1) % 10**6:06d}"


def login(c: Client, email: str = "asha@brand.in", password: str = PASSWORD):
    return c.post(f"{BASE}/auth/login", {"email": email, "password": password}, content_type=JSON)


def pending_flows(response) -> list[str]:
    return [f["id"] for f in response.json()["data"]["flows"] if f.get("is_pending")]


def with_reauth(c: Client, send):
    """allauth asks for the password again before sensitive changes (401 + 'reauthenticate'
    flow). The frontend shows a password box, posts it, then retries the same request."""
    r = send()
    if r.status_code == 401:
        assert "reauthenticate" in [f["id"] for f in r.json()["data"]["flows"]]
        rr = c.post(f"{BASE}/auth/reauthenticate", {"password": PASSWORD}, content_type=JSON)
        assert rr.status_code == 200, rr.content
        r = send()
    return r


def set_up_totp(c: Client, capture) -> str:
    r = c.get(f"{BASE}/account/authenticators/totp")
    assert r.status_code == 404  # "not set up yet" + a fresh secret to show as a QR code
    meta = r.json()["meta"]
    assert meta["totp_url"].startswith("otpauth://totp/")
    assert "issuer=RetentionOS" in meta["totp_url"]
    secret = meta["secret"]
    with capture(execute=True):  # allauth sends its signals after the DB commit
        r = with_reauth(
            c,
            lambda: c.post(
                f"{BASE}/account/authenticators/totp",
                {"code": totp_code(secret)},
                content_type=JSON,
            ),
        )
    assert r.status_code == 200, r.content
    assert r.json()["data"]["type"] == "totp"
    return secret


@pytest.mark.django_db
@override_settings(MFA_TOTP_TOLERANCE=1)  # don't fail when a test crosses a 30-second edge
def test_two_step_login_end_to_end(make_user, django_capture_on_commit_callbacks):
    user = make_user("asha@brand.in")
    c = Client()
    assert login(c).status_code == 200
    assert c.get("/api/v1/me/").json()["mfa"]["enabled"] is False

    secret = set_up_totp(c, django_capture_on_commit_callbacks)
    assert c.get("/api/v1/me/").json()["mfa"]["enabled"] is True

    # Recovery codes were created automatically; the user can view them once set up.
    r = with_reauth(c, lambda: c.get(f"{BASE}/account/authenticators/recovery-codes"))
    assert r.status_code == 200, r.content
    rc = r.json()["data"]
    assert rc["type"] == "recovery_codes"
    assert len(rc["unused_codes"]) == rc["total_code_count"] == 10

    # Log out, log in again: password alone is not enough any more.
    assert c.delete(f"{BASE}/auth/session").status_code == 401
    r = login(c)
    assert r.status_code == 401
    assert pending_flows(r) == ["mfa_authenticate"]
    assert c.get("/api/v1/me/").status_code in (401, 403)

    # A wrong code is refused (and recorded); the right code logs in.
    r = c.post(f"{BASE}/auth/2fa/authenticate", {"code": wrong_code(secret)}, content_type=JSON)
    assert r.status_code == 400
    code = totp_code(secret)
    r = c.post(f"{BASE}/auth/2fa/authenticate", {"code": code}, content_type=JSON)
    assert r.status_code == 200, r.content
    assert r.json()["meta"]["is_authenticated"] is True
    assert c.get("/api/v1/me/").status_code == 200

    # The same code can't be replayed; a recovery code works instead (once).
    c.delete(f"{BASE}/auth/session")
    assert login(c).status_code == 401
    r = c.post(f"{BASE}/auth/2fa/authenticate", {"code": code}, content_type=JSON)
    assert r.status_code == 400
    recovery = rc["unused_codes"][0]
    r = c.post(f"{BASE}/auth/2fa/authenticate", {"code": recovery}, content_type=JSON)
    assert r.status_code == 200, r.content
    c.delete(f"{BASE}/auth/session")
    assert login(c).status_code == 401
    r = c.post(f"{BASE}/auth/2fa/authenticate", {"code": recovery}, content_type=JSON)
    assert r.status_code == 400

    # The security log tells the story.
    types = list(SecurityEvent.objects.filter(user=user).values_list("type", flat=True))
    assert {"mfa_enabled", "recovery_codes_generated"} <= set(types)
    assert types.count("login_failed") == 3
    failed = SecurityEvent.objects.filter(user=user, type="login_failed").first()
    assert failed is not None and failed.metadata["stage"] == "mfa"
    last_login = SecurityEvent.objects.filter(user=user, type="login").first()
    assert last_login is not None and last_login.metadata["methods"] == ["password", "mfa"]
    r = c.post(f"{BASE}/auth/2fa/authenticate", {"code": rc["unused_codes"][1]}, content_type=JSON)
    assert r.status_code == 200, r.content
    listed = [e["description"] for e in c.get("/api/v1/me/security-events/").json()]
    assert "Wrong 2-step code entered" in listed
    assert "Logged in with password and 2-step code" in listed


@pytest.mark.django_db
@override_settings(MFA_ENFORCEMENT="signup", MFA_TOTP_TOLERANCE=1)
def test_blocked_user_can_still_reach_allauth_and_set_up(
    make_user, django_capture_on_commit_callbacks
):
    make_user("asha@brand.in")
    c = Client()
    assert login(c).status_code == 200
    me = c.get("/api/v1/me/").json()
    assert me["mfa"]["blocked"] is True
    r = c.get("/api/v1/brands/")
    assert (r.status_code, r.json()["code"]) == (403, "mfa_setup_required")

    # Everything needed to set up 2-step login stays reachable.
    assert c.get(f"{BASE}/auth/session").status_code == 200
    assert c.get(f"{BASE}/account/authenticators").status_code == 200
    assert c.get("/api/v1/me/security-events/").status_code == 200
    set_up_totp(c, django_capture_on_commit_callbacks)

    assert c.get("/api/v1/me/").json()["mfa"]["blocked"] is False
    assert c.get("/api/v1/brands/").status_code == 200
