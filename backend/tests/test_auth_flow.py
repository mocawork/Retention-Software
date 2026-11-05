"""Sign up -> verify email -> logged in -> password reset (django-allauth headless)."""
import re
from urllib.parse import unquote

import pytest
from django.core import mail
from django.test import Client

from tests.conftest import PASSWORD

BASE = "/_allauth/browser/v1"


def _key_from_mail():
    # The key is URL-encoded in the link (":" -> "%3A"); the frontend must decode it too.
    m = re.search(r"/(?:verify-email|reset-password)/(\S+)", mail.outbox[-1].body)
    return unquote(m.group(1))


@pytest.mark.django_db
def test_signup_requires_email_verification_then_logs_in():
    c = Client()
    r = c.post(f"{BASE}/auth/signup", {"email": "new@brand.in", "password": PASSWORD},
               content_type="application/json")
    assert r.status_code == 401
    pending = [f for f in r.json()["data"]["flows"] if f.get("is_pending")]
    assert pending[0]["id"] == "verify_email"

    # Not usable until verified
    assert c.get("/api/v1/me/").status_code in (401, 403)

    key = _key_from_mail()
    r = c.post(f"{BASE}/auth/email/verify", {"key": key}, content_type="application/json")
    assert r.status_code == 200, r.content
    me = c.get("/api/v1/me/")
    assert me.status_code == 200
    assert me.json()["email"] == "new@brand.in"
    assert me.json()["id"].startswith("usr_")


@pytest.mark.django_db
def test_login_and_password_reset(make_user):
    make_user("reset@brand.in")
    c = Client()
    r = c.post(f"{BASE}/auth/login", {"email": "reset@brand.in", "password": "wrong-password1"},
               content_type="application/json")
    assert r.status_code == 400

    r = c.post(f"{BASE}/auth/password/request", {"email": "reset@brand.in"},
               content_type="application/json")
    assert r.status_code == 200
    key = _key_from_mail()
    new_pw = "Another-strong-pw-42"
    r = c.post(f"{BASE}/auth/password/reset", {"key": key, "password": new_pw},
               content_type="application/json")
    assert r.status_code in (200, 401), r.content

    c2 = Client()
    r = c2.post(f"{BASE}/auth/login", {"email": "reset@brand.in", "password": new_pw},
                content_type="application/json")
    assert r.status_code == 200, r.content
