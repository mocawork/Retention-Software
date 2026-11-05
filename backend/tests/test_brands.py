import pytest
from django.core import mail

from apps.audit.models import AuditLog
from apps.brands.models import Membership, Role


@pytest.mark.django_db
def test_create_brand_makes_me_owner_and_audits(make_user, client_for):
    user = make_user()
    c = client_for(user)
    r = c.post("/api/v1/brands/", {"name": "  Acme Herbals "}, format="json")
    assert r.status_code == 201, r.content
    body = r.json()
    assert body["id"].startswith("brd_")
    assert body["name"] == "Acme Herbals"
    assert body["timezone"] == "Asia/Kolkata"
    assert body["my_role"] == "owner"
    r = c.get("/api/v1/brands/")
    assert [b["id"] for b in r.json()] == [body["id"]]
    assert AuditLog.objects.unscoped().filter(action="brand.created").count() == 1


@pytest.mark.django_db
def test_rejects_unknown_timezone(make_user, client_for):
    r = client_for(make_user()).post(
        "/api/v1/brands/", {"name": "X", "timezone": "Mars/Base"}, format="json"
    )
    assert r.status_code == 400
    assert r.json()["code"] == "invalid"


@pytest.mark.django_db
def test_onboarding_checklist_shows_connect_store_as_coming_next(brand_with, client_for):
    brand, owner = brand_with()
    r = client_for(owner).get(f"/api/v1/brands/{brand.public_id}/onboarding/")
    states = {s["key"]: s["state"] for s in r.json()["steps"]}
    assert states["account"] == "done"
    assert states["brand"] == "done"
    assert states["connect_store"] == "coming_next"
    assert states["questionnaire"] == "locked"


@pytest.mark.django_db
def test_invitation_flow(brand_with, make_user, client_for):
    brand, owner = brand_with()
    c = client_for(owner)
    r = c.post(
        f"/api/v1/brands/{brand.public_id}/invitations/",
        {"email": "Priya@Brand.in", "role": "marketer"},
        format="json",
    )
    assert r.status_code == 201, r.content
    token = mail.outbox[-1].body.split("/invitations/")[1].split()[0]

    wrong = make_user("someone@else.in")
    assert (
        client_for(wrong)
        .post("/api/v1/invitations/accept/", {"token": token}, format="json")
        .status_code
        == 400
    )

    priya = make_user("priya@brand.in")
    r = client_for(priya).post("/api/v1/invitations/accept/", {"token": token}, format="json")
    assert r.status_code == 201
    assert r.json()["my_role"] == "marketer"
    # Token can't be reused
    assert (
        client_for(priya)
        .post("/api/v1/invitations/accept/", {"token": token}, format="json")
        .status_code
        == 400
    )


@pytest.mark.django_db
def test_only_owner_can_create_owner(brand_with, client_for):
    brand, admin = brand_with(Role.ADMIN)
    r = client_for(admin).post(
        f"/api/v1/brands/{brand.public_id}/invitations/",
        {"email": "x@y.in", "role": "owner"},
        format="json",
    )
    assert r.status_code == 403


@pytest.mark.django_db
def test_viewer_and_marketer_cannot_edit_brand_or_invite(brand_with, client_for):
    brand, _ = brand_with()
    for role in (Role.VIEWER, Role.MARKETER):
        _, u = brand_with(role, brand=brand)
        c = client_for(u)
        assert c.get(f"/api/v1/brands/{brand.public_id}/").status_code == 200
        assert (
            c.patch(
                f"/api/v1/brands/{brand.public_id}/", {"name": "Hacked"}, format="json"
            ).status_code
            == 403
        )
        assert (
            c.post(
                f"/api/v1/brands/{brand.public_id}/invitations/",
                {"email": "a@b.in", "role": "viewer"},
                format="json",
            ).status_code
            == 403
        )


@pytest.mark.django_db
def test_cannot_remove_last_owner(brand_with, client_for):
    brand, owner = brand_with()
    m = Membership.objects.for_brand(brand).get(user=owner)
    r = client_for(owner).delete(f"/api/v1/brands/{brand.public_id}/members/{m.public_id}/")
    assert r.status_code == 400


@pytest.mark.django_db
def test_admin_changes_role_and_it_is_audited(brand_with, client_for):
    brand, owner = brand_with()
    _, viewer = brand_with(Role.VIEWER, brand=brand)
    m = Membership.objects.for_brand(brand).get(user=viewer)
    r = client_for(owner).patch(
        f"/api/v1/brands/{brand.public_id}/members/{m.public_id}/",
        {"role": "marketer"},
        format="json",
    )
    assert r.status_code == 200, r.content
    log = client_for(owner).get(f"/api/v1/brands/{brand.public_id}/audit-log/").json()
    actions = (
        [e["action"] for e in log["results"]]
        if isinstance(log, dict)
        else [e["action"] for e in log]
    )
    assert "member.role_changed" in actions
