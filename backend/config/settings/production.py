"""Staging and production. Hosting (O-01) is still open; this file is config only."""

from .base import *  # noqa: F401,F403
from .base import DEFAULT_FROM_EMAIL, env, env_bool

DEBUG = False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
HEADLESS_SERVE_SPECIFICATION = False

# --- Email: Amazon SES through its SMTP interface (Django's built-in SMTP backend, so no
# extra library). Region defaults to Mumbai (ap-south-1). EMAIL_HOST_USER/PASSWORD are the
# SES *SMTP* credentials (created in the SES console), not an AWS access key. They come
# from the secrets manager as environment variables, never from git (R-11).
EMAIL_BACKEND = env("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", "email-smtp.ap-south-1.amazonaws.com")
EMAIL_PORT = int(env("EMAIL_PORT", "587"))
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", "")
EMAIL_TIMEOUT = int(env("EMAIL_TIMEOUT", "10"))  # seconds; never hang a request on email
SERVER_EMAIL = DEFAULT_FROM_EMAIL  # sender for Django's own error emails
