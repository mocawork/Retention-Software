"""Base settings shared by every environment. Secrets come only from environment variables."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if value is None:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def env_bool(name: str, default: bool = False) -> bool:
    return os.environ.get(name, str(default)).lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [v.strip() for v in os.environ.get(name, default).split(",") if v.strip()]


SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "django_celery_beat",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.mfa",
    "allauth.headless",
    "apps.core",
    "apps.accounts",
    "apps.brands",
    "apps.audit",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", "retentionos"),
        "USER": env("POSTGRES_USER", "retentionos"),
        "PASSWORD": env("POSTGRES_PASSWORD", "retentionos"),
        "HOST": env("POSTGRES_HOST", "localhost"),
        "PORT": env("POSTGRES_PORT", "5432"),
        "OPTIONS": {"pool": True},
    }
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
# Raise when tenant rows are read without a brand scope (on in tests).
TENANT_STRICT = env_bool("TENANT_STRICT", False)
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

LANGUAGE_CODE = "en-in"
TIME_ZONE = "UTC"  # Always store UTC; brand timezone is used for day/hour logic.
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# --- Redis / Celery (technical.md §14) ---
REDIS_URL = env("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = None
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_BROKER_TRANSPORT_OPTIONS = {"visibility_timeout": 6 * 60 * 60}
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TIMEZONE = "UTC"

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": env("REDIS_CACHE_URL", "redis://localhost:6379/1"),
    }
}

# --- DRF / OpenAPI (technical.md §13) ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "allauth.headless.contrib.rest_framework.authentication.XSessionTokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.exceptions.exception_handler",
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.UserRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {"user": "600/min"},
}
SPECTACULAR_SETTINGS = {
    "TITLE": "RetentionOS API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# --- Accounts: django-allauth headless (technical.md §13, §16.1) ---
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*"]
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_VERIFICATION = "mandatory"
# Clicking the email link in the same browser right after sign-up logs the founder in.
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_LOGIN_BY_CODE_ENABLED = False
ACCOUNT_RATE_LIMITS = {"login_failed": "5/5m/ip,5/5m/key"}
HEADLESS_ONLY = True
FRONTEND_URL = env("FRONTEND_URL", "http://localhost:3000")
HEADLESS_FRONTEND_URLS = {
    "account_confirm_email": f"{FRONTEND_URL}/verify-email/{{key}}",
    "account_reset_password_from_key": f"{FRONTEND_URL}/reset-password/{{key}}",
    "account_signup": f"{FRONTEND_URL}/signup",
}
MFA_SUPPORTED_TYPES = ["totp", "recovery_codes"]
MFA_TOTP_ISSUER = "RetentionOS"

# D-039 / U-4 (open): *when* 2-step login becomes mandatory is a setting, not code.
#   "off"           = optional for everyone
#   "signup"        = must be set up before using the app
#   "within_7_days" = must be set up within 7 days of sign-up (Claude's suggestion in U-4)
MFA_ENFORCEMENT = env("MFA_ENFORCEMENT", "within_7_days")
MFA_GRACE_DAYS = int(env("MFA_GRACE_DAYS", "7"))
# Which roles the rule applies to. Default: everyone (D-039). technical.md §16.1 suggests
# narrowing to "owner,admin"; that is a founder choice and only needs this setting changed.
MFA_ENFORCED_ROLES = env_list("MFA_ENFORCED_ROLES", "owner,admin,marketer,viewer")

# Google login is wired but OFF until credentials exist (M0 scope).
GOOGLE_LOGIN_ENABLED = env_bool("GOOGLE_LOGIN_ENABLED", False)
SOCIALACCOUNT_PROVIDERS = (
    {
        "google": {
            "APP": {
                "client_id": env("GOOGLE_CLIENT_ID", ""),
                "secret": env("GOOGLE_CLIENT_SECRET", ""),
            },
            "SCOPE": ["profile", "email"],
        }
    }
    if GOOGLE_LOGIN_ENABLED
    else {}
)

# --- CORS / cookies: app.<domain> <-> api.<domain> (O-11 domains still open) ---
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", FRONTEND_URL)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", FRONTEND_URL)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_DOMAIN = os.environ.get("SESSION_COOKIE_DOMAIN") or None
CSRF_COOKIE_DOMAIN = SESSION_COOKIE_DOMAIN

EMAIL_BACKEND = env("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "RetentionOS <no-reply@localhost>")

