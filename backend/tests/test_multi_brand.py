"""W-7: one login, several brands, different roles; data never mixes."""

import pytest
from django.core import mail

from apps.audit.models import AuditLog


@pytest.mark.django_db
def test_one_login_two_brands_with_different_roles(make_user, client_for):
    asha = make_user("asha@agency.in")
    other_owner = make_user("ravi@kitchen.in")
    a = client_for(asha)
    r = client_for(other_owner)

    brand_a = a.post("/api/v1/brands/", {"name": "Zest Foods"}, format="json").json()
    brand_b = r.post("/api/v1/brands/", {"name": "Bright Kitchen"}, format="json").json()
    r.post(
        f"/api/v1/brands/{brand_b['id']}/invitations/",
        {"email": "asha@agency.in", "role": "viewer"},
        format="json",
    )
    token = str(mail.outbox[-1].body).split("/invitations/")[1].split()[0]
    assert a.post("/api/v1/invitations/accept/", {"token": token}, format="json").status_code == 201

    # The brand switcher list: both brands, my role in each, sorted by name.
    listed = a.get("/api/v1/brands/").json()
    assert [(b["name"], b["my_role"]) for b in listed] == [
        ("Bright Kitchen", "viewer"),
        ("Zest Foods", "owner"),
    ]
    assert a.get(f"/api/v1/brands/{brand_a['id']}/").json()["my_role"] == "owner"
    assert a.get(f"/api/v1/brands/{brand_b['id']}/").json()["my_role"] == "viewer"

    # Role is per brand: owner powers in A don't carry over to B.
    path_a, path_b = f"/api/v1/brands/{brand_a['id']}", f"/api/v1/brands/{brand_b['id']}"
    assert a.patch(f"{path_a}/", {"name": "Zest Foods India"}, format="json").status_code == 200
    assert a.patch(f"{path_b}/", {"name": "Hacked"}, format="json").status_code == 403
    assert a.get(f"{path_b}/invitations/").status_code == 403
    assert a.get(f"{path_b}/audit-log/").status_code == 403

    # No mixing: each brand's lists only hold that brand's rows.
    members_a = {m["email"] for m in a.get(f"{path_a}/members/").json()}
    members_b = {m["email"] for m in a.get(f"{path_b}/members/").json()}
    assert members_a == {"asha@agency.in"}
    assert members_b == {"ravi@kitchen.in", "asha@agency.in"}
    log_a = a.get(f"{path_a}/audit-log/").json()
    entries = log_a["results"] if isinstance(log_a, dict) else log_a
    assert {e["action"] for e in entries} == {"brand.created", "brand.updated"}
    assert AuditLog.objects.unscoped().filter(action="member.joined").count() == 1
    assert {s["description"] for s in a.get(f"{path_b}/onboarding/").json()["steps"]} >= {
        "Bright Kitchen is set up."
    }
