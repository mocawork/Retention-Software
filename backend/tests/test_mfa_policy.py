from datetime import timedelta

import pytest
from django.test import override_settings
from django.utils import timezone

from apps.accounts.mfa_policy import mfa_status
from apps.brands.models import Role


@pytest.mark.django_db
def test_off_means_optional(brand_with):
    _, owner = brand_with()
    with override_settings(MFA_ENFORCEMENT="off"):
        s = mfa_status(owner)
    assert (s.required, s.blocked, s.deadline) == (False, False, None)


@pytest.mark.django_db
def test_signup_blocks_immediately(brand_with, client_for):
    brand, owner = brand_with()
    with override_settings(MFA_ENFORCEMENT="signup"):
        assert mfa_status(owner).blocked
        r = client_for(owner).get(f"/api/v1/brands/{brand.public_id}/")
        assert r.status_code == 403
        assert r.json()["code"] == "mfa_setup_required"
        # /me stays reachable so the app can show the setup screen
        me = client_for(owner).get("/api/v1/me/")
        assert me.status_code == 200
        assert me.json()["mfa"]["blocked"] is True


@pytest.mark.django_db
def test_within_7_days_has_grace_period(brand_with):
    _, owner = brand_with()
    with override_settings(MFA_ENFORCEMENT="within_7_days", MFA_GRACE_DAYS=7):
        s = mfa_status(owner)
        assert s.required and not s.blocked
        assert s.deadline == owner.created_at + timedelta(days=7)
        assert mfa_status(owner, now=timezone.now() + timedelta(days=8)).blocked


@pytest.mark.django_db
def test_roles_setting_narrows_who_must(brand_with):
    brand, owner = brand_with()
    _, viewer = brand_with(Role.VIEWER, brand=brand)
    with override_settings(MFA_ENFORCEMENT="signup", MFA_ENFORCED_ROLES=["owner", "admin"]):
        assert mfa_status(owner).required
        assert not mfa_status(viewer).required


@pytest.mark.django_db
def test_totp_enabled_unblocks(brand_with):
    from allauth.mfa.models import Authenticator

    _, owner = brand_with()
    Authenticator.objects.create(user=owner, type=Authenticator.Type.TOTP, data={"secret": "x"})
    with override_settings(MFA_ENFORCEMENT="signup"):
        s = mfa_status(owner)
    assert s.enabled and not s.blocked
