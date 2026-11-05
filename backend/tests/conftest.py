import re

import pytest
from django.core import mail
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.brands.models import Role
from apps.brands.services import create_brand

PASSWORD = "a-Strong-passw0rd!"


@pytest.fixture(autouse=True)
def _fresh_cache():
    """Throttles, rate limits and used 2-step codes live in the cache: start each test clean."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def make_user(db):
    def _make(email="founder@example.com"):
        user = User.objects.create_user(email=email, password=PASSWORD)
        from allauth.account.models import EmailAddress

        EmailAddress.objects.create(user=user, email=email, verified=True, primary=True)
        return user

    return _make


@pytest.fixture
def client_for():
    def _client(user):
        c = APIClient()
        c.force_authenticate(user)
        return c

    return _client


@pytest.fixture
def brand_with(make_user):
    """brand_with(role) -> (brand, user with that role in brand)."""

    def _make(role=Role.OWNER, email=None, brand=None):
        if brand is None:
            owner = make_user(email or f"owner{id(object())}@example.com")
            brand = create_brand(user=owner, name="Acme Herbals")
            if role == Role.OWNER:
                return brand, owner
        from apps.brands.models import Membership

        u = make_user(email or f"{role}{id(object())}@example.com")
        Membership.objects.create(brand=brand, user=u, role=role)
        return brand, u

    return _make


def last_mail_link() -> str:
    match = re.search(r"https?://\S+", str(mail.outbox[-1].body))
    assert match, "no link in the last email"
    return match.group(0)
