"""Time rules (R-6, technical.md §4.3): store and compute in UTC; use the brand's own
timezone (default Asia/Kolkata) only for "which day / which hour" questions."""

from datetime import UTC, date, datetime
from typing import Protocol
from zoneinfo import ZoneInfo


class HasTimezone(Protocol):
    timezone: str  # an IANA name, e.g. "Asia/Kolkata" (Brand.timezone)


def utc_now() -> datetime:
    """The current moment, timezone-aware, in UTC."""
    return datetime.now(UTC)


def _zone(brand_or_tz: HasTimezone | str) -> ZoneInfo:
    name = brand_or_tz if isinstance(brand_or_tz, str) else brand_or_tz.timezone
    if not name:
        raise ValueError("No timezone given; we never guess one.")
    return ZoneInfo(name)


def to_brand_local(moment: datetime, brand_or_tz: HasTimezone | str) -> datetime:
    """The same moment on the brand's wall clock. Naive datetimes are refused."""
    if moment.tzinfo is None or moment.utcoffset() is None:
        raise ValueError("Naive datetime: pass a timezone-aware (UTC) datetime (R-6).")
    return moment.astimezone(_zone(brand_or_tz))


def brand_local_date(moment: datetime, brand_or_tz: HasTimezone | str) -> date:
    """Which calendar day it is for the brand (e.g. 18:30 UTC is already tomorrow in IST)."""
    return to_brand_local(moment, brand_or_tz).date()
