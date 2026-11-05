"""Logs: structlog JSON with request context, stdlib routed through it, PII masked; Sentry."""

import io
import json
import logging

import pytest
import structlog
from rest_framework.test import APIClient

from apps.core import observability
from apps.core.observability import build_formatter, init_sentry
from apps.core.pii import mask_email, mask_identifier, mask_mapping, mask_phone, mask_text


@pytest.fixture
def json_logs():
    """Collects what the production (JSON) formatter would print."""
    stream = io.StringIO()
    handler = logging.StreamHandler(stream)
    handler.setFormatter(build_formatter(json_logs=True))
    root = logging.getLogger()
    root.addHandler(handler)

    def lines():
        return [json.loads(line) for line in stream.getvalue().splitlines() if line.strip()]

    yield lines
    root.removeHandler(handler)


# --- PII masking -------------------------------------------------------------------


def test_mask_email_and_phone():
    assert mask_email("Priya.Sharma@Brand.in") == "P***@brand.in"
    assert mask_email("not-an-email") == "n***"
    assert mask_phone("+91 98765 43210") == "+**********10"
    assert mask_phone("98765-43210") == "********10"
    assert mask_phone("12") == "***"


def test_mask_identifier_handles_any_login_input():
    assert mask_identifier("asha@brand.in") == "a***@brand.in"
    assert mask_identifier("+919876543210") == "+**********10"
    assert mask_identifier("asha") == "a***"
    assert mask_identifier("") == "" and mask_identifier(None) == ""


def test_mask_text_leaves_dates_and_ids_alone():
    text = "Order brd_7k2m on 2026-11-05T18:29:59Z for priya@brand.in, call 9876543210"
    assert mask_text(text) == (
        "Order brd_7k2m on 2026-11-05T18:29:59Z for p***@brand.in, call ********10"
    )


def test_mask_mapping_redacts_secrets_and_masks_nested_pii():
    out = mask_mapping(
        {
            "password": "hunter2",
            "token": "abc",
            "email": "asha@brand.in",
            "full_name": "Asha Rao",
            "nested": {"phone": "9876543210", "count": 3},
            "request_id": "req-1",
            "note": "mail asha@brand.in",
        }
    )
    assert out == {
        "password": "[redacted]",
        "token": "[redacted]",
        "email": "a***@brand.in",
        "full_name": "A***",
        "nested": {"phone": "********10", "count": 3},
        "request_id": "req-1",
        "note": "mail a***@brand.in",
    }


# --- Request context -----------------------------------------------------------------


@pytest.mark.django_db
def test_request_id_is_echoed_or_generated():
    c = APIClient()
    r = c.get("/api/v1/health/", HTTP_X_REQUEST_ID="cf-abc.123")
    assert r["X-Request-ID"] == "cf-abc.123"
    generated = c.get("/api/v1/health/")["X-Request-ID"]
    assert len(generated) == 32
    bad = c.get("/api/v1/health/", HTTP_X_REQUEST_ID="bad id\nwith=junk")["X-Request-ID"]
    assert bad != "bad id\nwith=junk" and len(bad) == 32


@pytest.mark.django_db
def test_access_line_has_request_user_and_brand(json_logs, brand_with, client_for):
    brand, owner = brand_with()
    r = client_for(owner).get(
        f"/api/v1/brands/{brand.public_id}/members/", HTTP_X_REQUEST_ID="req-42"
    )
    assert r.status_code == 200
    line = next(e for e in json_logs() if e["event"] == "request_finished")
    assert line["request_id"] == "req-42"
    assert line["user_id"] == owner.public_id
    assert line["brand_id"] == brand.public_id
    assert line["route"] == "api/v1/brands/<str:brand_id>/members/"
    assert (line["method"], line["status"], line["level"]) == ("GET", 200, "info")
    assert "timestamp" in line and "duration_ms" in line


@pytest.mark.django_db
def test_invitation_token_never_reaches_the_logs(json_logs):
    APIClient().get("/api/v1/invitations/secret-token-value/")
    out = json.dumps(json_logs())
    assert "request_finished" in out
    assert "secret-token-value" not in out
    assert "Not Found: /api/v1/invitations/<str:token>/" in out
    access = [e for e in json_logs() if e["event"] == "request_finished"][0]
    assert access["route"] == "api/v1/invitations/<str:token>/"


def test_stdlib_logs_go_through_structlog_and_are_masked(json_logs):
    structlog.contextvars.bind_contextvars(request_id="req-7")
    try:
        logging.getLogger("some.library").warning("could not mail %s", "asha@brand.in")
    finally:
        structlog.contextvars.clear_contextvars()
    line = json_logs()[-1]
    assert line["event"] == "could not mail a***@brand.in"
    assert (line["logger"], line["level"], line["request_id"]) == (
        "some.library",
        "warning",
        "req-7",
    )


def test_structlog_lines_are_masked(json_logs):
    structlog.get_logger("retentionos.test").info("signed_up", email="asha@brand.in", code="123")
    line = json_logs()[-1]
    assert (line["event"], line["email"], line["code"]) == (
        "signed_up",
        "a***@brand.in",
        "[redacted]",
    )


# --- Sentry --------------------------------------------------------------------------


def test_sentry_only_with_a_dsn_and_never_with_pii(monkeypatch):
    calls: list[dict] = []
    monkeypatch.setattr("sentry_sdk.init", lambda **kw: calls.append(kw))
    assert init_sentry("") is False
    assert calls == []
    assert init_sentry("https://public@o0.ingest.sentry.io/1", environment="staging") is True
    assert calls[0]["send_default_pii"] is False
    assert calls[0]["environment"] == "staging"


def test_sentry_is_off_in_tests():
    from django.conf import settings

    assert settings.SENTRY_ENABLED is False
    assert observability.logging_config(json_logs=True)["root"]["handlers"] == ["stdout"]
