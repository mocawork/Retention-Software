"""Our emails are plain English and RetentionOS-branded (no allauth boilerplate)."""

import importlib

import pytest
from django.core import mail
from django.test import Client

from apps.accounts.adapter import duration_text
from tests.conftest import PASSWORD

BASE = "/_allauth/browser/v1"
JSON = "application/json"
BOILERPLATE = ("Hello from", "Thank you for using", "example.com", "testserver", "[", "&amp;")


def _assert_clean(msg):
    for text in (msg.subject, msg.body):
        for bad in BOILERPLATE:
            assert bad not in text, (bad, text)
    assert msg.body.startswith("Hi,")
    assert "The RetentionOS team" in msg.body


@pytest.mark.django_db
def test_signup_confirmation_email():
    Client().post(
        f"{BASE}/auth/signup", {"email": "new@brand.in", "password": PASSWORD}, content_type=JSON
    )
    msg = mail.outbox[-1]
    assert msg.to == ["new@brand.in"]
    assert msg.subject == "Confirm your email to finish signing up for RetentionOS"
    assert "http://localhost:3000/verify-email/" in msg.body
    assert "The link works for 3 days." in msg.body
    _assert_clean(msg)


@pytest.mark.django_db
def test_password_reset_email(make_user):
    make_user("asha@brand.in")
    Client().post(f"{BASE}/auth/password/request", {"email": "asha@brand.in"}, content_type=JSON)
    msg = mail.outbox[-1]
    assert msg.subject == "Reset your RetentionOS password"
    assert "http://localhost:3000/reset-password/" in msg.body
    assert "works for 3 days and only once" in msg.body
    _assert_clean(msg)


@pytest.mark.django_db
def test_reset_for_unknown_email_says_so_without_an_account():
    Client().post(f"{BASE}/auth/password/request", {"email": "who@brand.in"}, content_type=JSON)
    msg = mail.outbox[-1]
    assert msg.subject == "About your RetentionOS password reset request"
    assert "there is no RetentionOS account with this email address" in msg.body
    assert "http://localhost:3000/signup" in msg.body
    _assert_clean(msg)


@pytest.mark.django_db
def test_signup_with_existing_email_gets_a_heads_up(make_user):
    make_user("asha@brand.in")
    Client().post(
        f"{BASE}/auth/signup", {"email": "asha@brand.in", "password": PASSWORD}, content_type=JSON
    )
    msg = mail.outbox[-1]
    assert msg.subject == "You already have a RetentionOS account"
    assert "http://localhost:3000/forgot-password" in msg.body
    _assert_clean(msg)


def test_duration_text():
    assert duration_text(3 * 86400) == "3 days"
    assert duration_text(86400) == "1 day"
    assert duration_text(12 * 3600) == "12 hours"
    assert duration_text(90) == "90 seconds"


def test_production_sends_through_ses_smtp(monkeypatch):
    monkeypatch.setenv("EMAIL_HOST_USER", "ses-smtp-user")
    monkeypatch.delenv("EMAIL_BACKEND", raising=False)
    prod = importlib.reload(importlib.import_module("config.settings.production"))
    assert prod.EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
    assert prod.EMAIL_HOST == "email-smtp.ap-south-1.amazonaws.com"
    assert (prod.EMAIL_PORT, prod.EMAIL_USE_TLS) == (587, True)
    assert prod.EMAIL_HOST_USER == "ses-smtp-user"
    assert prod.DEBUG is False and prod.SESSION_COOKIE_SECURE is True
