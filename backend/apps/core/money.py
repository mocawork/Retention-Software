"""Money is stored as integer paise (R-6, technical.md §4.3). Convert only through here.

Floats are refused on purpose: 0.1 + 0.2 is not exactly 0.3 in binary, and paise must be
exact. Rounding is ROUND_HALF_UP (half away from zero): 499.995 -> 50000 paise and
-1.005 -> -101 paise.
"""

from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

PAISE_PER_RUPEE = 100


def rupees_to_paise(rupees: Decimal | int | str) -> int:
    if isinstance(rupees, bool | float) or not isinstance(rupees, Decimal | int | str):
        raise TypeError("Pass rupees as Decimal, int or str, never float (R-6).")
    if isinstance(rupees, int):
        return rupees * PAISE_PER_RUPEE
    if isinstance(rupees, str):
        try:
            rupees = Decimal(rupees.strip())
        except InvalidOperation:
            raise ValueError(f"Not an amount: {rupees!r}") from None
    if not rupees.is_finite():
        raise ValueError("Amount must be a finite number.")
    return int((rupees * PAISE_PER_RUPEE).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def paise_to_rupees(paise: int) -> Decimal:
    """For display/export only. 49999 -> Decimal('499.99'). Never store the result."""
    if isinstance(paise, bool) or not isinstance(paise, int):
        raise TypeError("paise must be an int.")
    return (Decimal(paise) / PAISE_PER_RUPEE).quantize(Decimal("0.01"))
