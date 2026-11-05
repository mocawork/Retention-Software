import os

os.environ.setdefault("DJANGO_SECRET_KEY", "test-only-not-secret")
from .base import *  # noqa: E402,F401,F403

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
CELERY_TASK_ALWAYS_EAGER = True
REST_FRAMEWORK = {**REST_FRAMEWORK, "DEFAULT_THROTTLE_CLASSES": []}  # noqa: F405
ACCOUNT_RATE_LIMITS = False
TENANT_STRICT = True
MFA_ENFORCEMENT = "off"
# Parallel test runs (several agents/CI jobs on one Postgres) can pick distinct test DBs.
DATABASES["default"]["TEST"] = {"NAME": os.environ.get("POSTGRES_TEST_DB", "test_retentionos")}  # noqa: F405
