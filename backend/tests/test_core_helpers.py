"""Money (integer paise) and time (UTC + brand timezone) helpers (R-6)."""

import time
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import pytest

from apps.brands.models import Brand
from apps.core.money import paise_to_rupees, rupees_to_paise
from apps.core.timeutils import brand_local_date, to_brand_local, utc_now


@pytest.mark.parametrize(
    "rupees,paise",
    [
        (Decimal("499.99"), 49999),
        ("499.995", 50000),  # half rounds up
        ("499.994", 49999),
        ("0.005", 1),
        ("0.004", 0),
        (" 1299 ", 129900),
        (10, 1000),
        (0, 0),
        ("-1.005", -101),  # refunds: half rounds away from zero
        (Decimal("12345678901.23"), 1234567890123),  # big amounts stay exact
    ],
)
def test_rupees_to_paise(rupees, paise):
    assert rupees_to_paise(rupees) == paise
    assert type(rupees_to_paise(rupees)) is int


@pytest.mark.parametrize("bad", [0.1, 499.99, True, None, [1]])
def test_rupees_to_paise_refuses_floats_and_junk_types(bad):
    with pytest.raises(TypeError):
        rupees_to_paise(bad)


@pytest.mark.parametrize("bad", ["abc", "", "1,299.00", "NaN", "Infinity"])
def test_rupees_to_paise_refuses_non_amounts(bad):
    with pytest.raises(ValueError):
        rupees_to_paise(bad)


def test_paise_to_rupees():
    assert paise_to_rupees(49999) == Decimal("499.99")
    assert str(paise_to_rupees(0)) == "0.00"
    assert paise_to_rupees(-150) == Decimal("-1.50")
    for bad in (1.5, True, "100"):
        with pytest.raises(TypeError):
            paise_to_rupees(bad)  # type: ignore[arg-type]
    for paise in range(-1005, 1005, 7):
        assert rupees_to_paise(paise_to_rupees(paise)) == paise


def test_utc_now_is_aware_utc():
    now = utc_now()
    assert now.tzinfo is UTC
    assert abs(now.timestamp() - time.time()) < 5


def test_ist_date_boundary():
    brand = Brand(name="Any brand", timezone="Asia/Kolkata")  # IST = UTC+05:30
    before = datetime(2026, 11, 5, 18, 29, 59, tzinfo=UTC)
    after = before + timedelta(seconds=1)
    assert to_brand_local(before, brand).isoformat() == "2026-11-05T23:59:59+05:30"
    assert to_brand_local(after, brand).isoformat() == "2026-11-06T00:00:00+05:30"
    assert brand_local_date(before, brand) == date(2026, 11, 5)
    assert brand_local_date(after, brand) == date(2026, 11, 6)
    assert after.date() == date(2026, 11, 5)  # the UTC date would be wrong for the brand
    assert brand_local_date(after, "UTC") == date(2026, 11, 5)


def test_to_brand_local_refuses_naive_datetimes_and_missing_zone():
    with pytest.raises(ValueError):
        to_brand_local(datetime(2026, 11, 5, 12, 0), "Asia/Kolkata")
    with pytest.raises(ValueError):
        to_brand_local(utc_now(), Brand(name="x", timezone=""))
