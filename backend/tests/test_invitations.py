"""Invitations: revoke, expiry, public preview, email wording (M0 scope: accept/expire/revoke)."""

from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.brands.models import Invitation, Role
from apps.brands.views import InvitationPreviewThrottle


def _invite(client, brand, email="priya@brand.in", role="marketer"):
    r = client.post(
        f"/api/v1/brands/{brand.public_id}/invitations/",
        {"email": email, "role": role},
        format="json",
    )
    assert r.status_code == 201, r.content
    return Invitation.objects.for_brand(brand).get(public_id=r.json()["id"])


def _revoke_url(brand, invitation):
    return f"/api/v1/brands/{brand.public_id}/invitations/{invitation.public_id}/"


@pytest.mark.django_db
def test_owner_revokes_invitation_and_link_stops_working(brand_with, make_user, client_for):
    brand, owner = brand_with()
    c = client_for(owner)
    inv = _invite(c, brand)

    r = c.delete(_revoke_url(brand, inv))
    assert r.status_code == 204, r.content
    inv.refresh_from_db()
    assert inv.status == Invitation.Status.REVOKED
    entry = AuditLog.objects.for_brand(brand).get(action="member.invitation_revoked")
    assert entry.actor == owner and entry.target_id == inv.public_id

    # Revoking again is harmless and not logged twice.
    assert c.delete(_revoke_url(brand, inv)).status_code == 204
    assert AuditLog.objects.for_brand(brand).filter(action="member.invitation_revoked").count() == 1

    # The list no longer shows it, the link can't be accepted, the preview says revoked.
    assert c.get(f"/api/v1/brands/{brand.public_id}/invitations/").json() == []
    priya = make_user("priya@brand.in")
    r = client_for(priya).post("/api/v1/invitations/accept/", {"token": inv.token}, format="json")
    assert r.status_code == 400
    assert r.json()["code"] == "invitation_invalid"
    assert APIClient().get(f"/api/v1/invitations/{inv.token}/").json()["status"] == "revoked"


@pytest.mark.django_db
def test_who_can_revoke(brand_with, client_for):
    brand, owner = brand_with()
    owner_invite = _invite(client_for(owner), brand, "boss@brand.in", "owner")
    viewer_invite = _invite(client_for(owner), brand, "v@brand.in", "viewer")
    _, admin = brand_with(Role.ADMIN, brand=brand)
    for role in (Role.MARKETER, Role.VIEWER):
        _, u = brand_with(role, brand=brand)
        assert client_for(u).delete(_revoke_url(brand, viewer_invite)).status_code == 403
    # An Admin can't cancel an invitation to become Owner, but can cancel others.
    r = client_for(admin).delete(_revoke_url(brand, owner_invite))
    assert r.status_code == 403
    assert client_for(admin).delete(_revoke_url(brand, viewer_invite)).status_code == 204
    assert client_for(owner).delete(_revoke_url(brand, owner_invite)).status_code == 204


@pytest.mark.django_db
def test_cannot_revoke_an_accepted_invitation(brand_with, make_user, client_for):
    brand, owner = brand_with()
    inv = _invite(client_for(owner), brand)
    priya = make_user("priya@brand.in")
    client_for(priya).post("/api/v1/invitations/accept/", {"token": inv.token}, format="json")
    r = client_for(owner).delete(_revoke_url(brand, inv))
    assert r.status_code == 400
    assert r.json()["code"] == "invitation_already_accepted"


@pytest.mark.django_db
def test_expired_invitation_is_reported_and_never_accepted(brand_with, make_user, client_for):
    brand, owner = brand_with()
    inv = _invite(client_for(owner), brand)
    Invitation.objects.for_brand(brand).filter(pk=inv.pk).update(
        expires_at=timezone.now() - timedelta(minutes=1)
    )
    listed = client_for(owner).get(f"/api/v1/brands/{brand.public_id}/invitations/").json()
    assert [(i["id"], i["status"]) for i in listed] == [(inv.public_id, "expired")]

    priya = make_user("priya@brand.in")
    r = client_for(priya).post("/api/v1/invitations/accept/", {"token": inv.token}, format="json")
    assert r.status_code == 400
    assert r.json()["code"] == "invitation_expired"
    assert APIClient().get(f"/api/v1/invitations/{inv.token}/").json()["status"] == "expired"
    inv.refresh_from_db()
    assert inv.status == Invitation.Status.PENDING  # stored status untouched; reported expired


@pytest.mark.django_db
def test_accept_errors_have_clear_codes(brand_with, make_user, client_for):
    brand, owner = brand_with()
    inv = _invite(client_for(owner), brand)
    other = make_user("other@brand.in")
    r = client_for(other).post("/api/v1/invitations/accept/", {"token": inv.token}, format="json")
    assert (r.status_code, r.json()["code"]) == (400, "invitation_email_mismatch")
    r = client_for(other).post("/api/v1/invitations/accept/", {"token": "nope"}, format="json")
    assert (r.status_code, r.json()["code"]) == (400, "invitation_invalid")


@pytest.mark.django_db
def test_public_preview_without_login(brand_with, client_for):
    brand, owner = brand_with()
    owner.full_name = "Asha Rao"
    owner.save()
    inv = _invite(client_for(owner), brand, "Priya@Brand.in", "viewer")
    r = APIClient().get(f"/api/v1/invitations/{inv.token}/")
    assert r.status_code == 200, r.content
    body = r.json()
    assert body == {
        "brand_name": "Acme Herbals",
        "role": "viewer",
        "email": "priya@brand.in",
        "invited_by_name": "Asha Rao",
        "status": "pending",
        "expires_at": body["expires_at"],
    }


@pytest.mark.django_db
def test_preview_unknown_token_is_a_plain_404(brand_with):
    r = APIClient().get("/api/v1/invitations/not-a-real-token/")
    assert r.status_code == 404
    assert r.json() == {"code": "not_found", "message": "Not found.", "details": {}}
    assert "brand" not in r.content.decode().lower()


@pytest.mark.django_db
def test_preview_is_throttled(monkeypatch):
    monkeypatch.setattr(InvitationPreviewThrottle, "rate", "2/min")
    c = APIClient()
    codes = [c.get(f"/api/v1/invitations/guess-{i}/").status_code for i in range(3)]
    assert codes == [404, 404, 429]
    assert c.get("/api/v1/invitations/guess-x/").json()["code"] == "throttled"


@pytest.mark.django_db
def test_invitation_email_is_plain_english(brand_with, client_for):
    brand, owner = brand_with()
    owner.full_name = "Asha Rao"
    owner.save()
    inv = _invite(client_for(owner), brand, "priya@brand.in", "marketer")
    msg = mail.outbox[-1]
    assert msg.to == ["priya@brand.in"]
    assert msg.subject == "Asha Rao invited you to Acme Herbals on RetentionOS"
    assert "Asha Rao has invited you to join Acme Herbals on RetentionOS as Marketer." in msg.body
    assert f"http://localhost:3000/invitations/{inv.token}" in msg.body
    assert "works for 7 days" in msg.body
    for boilerplate in ("Hello from", "example.com", "testserver", "&amp;"):
        assert boilerplate not in msg.body
