"""Non-guessable public IDs (technical.md §4.3). Internal PKs stay BigAutoField."""

import secrets

_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz"  # Crockford-ish base32, lowercase


def new_public_id(prefix: str, length: int = 20) -> str:
    return f"{prefix}_" + "".join(secrets.choice(_ALPHABET) for _ in range(length))
