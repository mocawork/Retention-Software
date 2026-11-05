"""Connects login and account-security signals to the security log (SecurityEvent).

Which signal is used for what (django-allauth 65.x + Django):

* login / logout / login_failed (password): Django's own auth signals. They fire for every
  login path (allauth headless, admin) and only once the login is complete, i.e. after
  the 2-step code when 2-step login is on.
* login_failed (2-step code): allauth.mfa `authentication_failed`.
* email_verified, password_reset, password_changed: allauth.account signals.
* mfa_enabled / mfa_disabled / recovery_codes_generated: allauth.mfa authenticator signals
  (allauth sends these after the database transaction commits).
"""

from typing import Any

from allauth.account import signals as account_signals
from allauth.mfa import signals as mfa_signals
from allauth.mfa.models import Authenticator
from django.contrib.auth import get_user_model
from django.contrib.auth import signals as auth_signals

from .models import SecurityEvent
from .services import record_security_event

Type = SecurityEvent.Type

# Where allauth keeps the list of methods used in this login ("password", "mfa", ...).
_AUTH_METHODS_SESSION_KEY = "account_authentication_methods"


def _login_methods(request: Any) -> list[str]:
    try:
        records = request.session.get(_AUTH_METHODS_SESSION_KEY, [])
    except AttributeError:
        return []
    methods = [str(r["method"]) for r in records if isinstance(r, dict) and r.get("method")]
    return list(dict.fromkeys(methods))  # unique, in order


def on_logged_in(sender: Any, request: Any, user: Any, **kwargs: Any) -> None:
    methods = _login_methods(request)
    record_security_event(
        Type.LOGIN, user=user, request=request, metadata={"methods": methods} if methods else {}
    )


def on_logged_out(sender: Any, request: Any, user: Any, **kwargs: Any) -> None:
    if user is not None:
        record_security_event(Type.LOGOUT, user=user, request=request)


def on_login_failed(sender: Any, credentials: dict, request: Any = None, **kwargs: Any) -> None:
    identifier = str(credentials.get("email") or credentials.get("username") or "")
    user = get_user_model().objects.filter(email__iexact=identifier).first() if identifier else None
    record_security_event(
        Type.LOGIN_FAILED,
        user=user,
        request=request,
        identifier=identifier,
        metadata={"stage": "password"},
    )


def on_mfa_failed(sender: Any, request: Any, user: Any, **kwargs: Any) -> None:
    metadata = {"stage": "mfa"}
    if kwargs.get("reauthentication"):
        metadata["reauthentication"] = "true"
    record_security_event(Type.LOGIN_FAILED, user=user, request=request, metadata=metadata)


def on_email_confirmed(sender: Any, request: Any, email_address: Any, **kwargs: Any) -> None:
    record_security_event(Type.EMAIL_VERIFIED, user=email_address.user, request=request)


def on_password_reset(sender: Any, request: Any, user: Any, **kwargs: Any) -> None:
    record_security_event(Type.PASSWORD_RESET, user=user, request=request)


def on_password_changed(sender: Any, request: Any, user: Any, **kwargs: Any) -> None:
    record_security_event(Type.PASSWORD_CHANGED, user=user, request=request)


def on_password_set(sender: Any, request: Any, user: Any, **kwargs: Any) -> None:
    record_security_event(
        Type.PASSWORD_CHANGED, user=user, request=request, metadata={"first_password": "true"}
    )


def on_authenticator_added(
    sender: Any, request: Any, user: Any, authenticator: Authenticator, **kwargs: Any
) -> None:
    if authenticator.type == Authenticator.Type.TOTP:
        record_security_event(Type.MFA_ENABLED, user=user, request=request)
    elif authenticator.type == Authenticator.Type.RECOVERY_CODES:
        record_security_event(Type.RECOVERY_CODES_GENERATED, user=user, request=request)


def on_authenticator_reset(
    sender: Any, request: Any, user: Any, authenticator: Authenticator, **kwargs: Any
) -> None:
    if authenticator.type == Authenticator.Type.RECOVERY_CODES:
        record_security_event(Type.RECOVERY_CODES_GENERATED, user=user, request=request)


def on_authenticator_removed(
    sender: Any, request: Any, user: Any, authenticator: Authenticator, **kwargs: Any
) -> None:
    # Recovery codes are removed automatically with the last authenticator: not a
    # separate event for the user.
    if authenticator.type == Authenticator.Type.TOTP:
        record_security_event(Type.MFA_DISABLED, user=user, request=request)


def connect() -> None:
    pairs = [
        (auth_signals.user_logged_in, on_logged_in),
        (auth_signals.user_logged_out, on_logged_out),
        (auth_signals.user_login_failed, on_login_failed),
        (mfa_signals.authentication_failed, on_mfa_failed),
        (account_signals.email_confirmed, on_email_confirmed),
        (account_signals.password_reset, on_password_reset),
        (account_signals.password_changed, on_password_changed),
        (account_signals.password_set, on_password_set),
        (mfa_signals.authenticator_added, on_authenticator_added),
        (mfa_signals.authenticator_reset, on_authenticator_reset),
        (mfa_signals.authenticator_removed, on_authenticator_removed),
    ]
    for signal, receiver in pairs:
        signal.connect(receiver, dispatch_uid=f"security_event.{receiver.__name__}")
