import pytest

from config.celery import ping


@pytest.mark.django_db
def test_health(client):
    assert client.get("/api/v1/health/").json() == {"status": "ok"}


def test_celery_wiring():
    assert ping.delay().get() == "pong"


@pytest.mark.django_db
def test_openapi_schema_builds(client, django_user_model):
    r = client.get("/api/v1/schema/?format=json")
    assert r.status_code in (200, 401, 403)
