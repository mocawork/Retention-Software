# syntax=docker/dockerfile:1
#
# RetentionOS backend image. The Django API, the Celery worker and Celery beat all run from it.
# Local development builds it through infra/docker-compose.yml (with the dev tools included).
# The default command is Django's development server, which is for local use only. The real
# web server and deployment are chosen later, together with hosting (O-01).
#
# Build arguments:
#   INSTALL_DEV=true   also install the dev tools (pytest, ruff, mypy). Default: false.

# uv, pinned, from Astral's official image (technical.md §2.2: packaging with uv). Keep the
# version in step with UV_VERSION in .github/workflows/ci.yml. It is a named stage because
# Dependabot updates FROM lines (tag and digest), not images named only in COPY --from.
FROM ghcr.io/astral-sh/uv:0.13.5@sha256:32a7bb39b496babbd997b0a39a4d66c126bdaf5661b302bf6f06abda8deca6ff AS uv

# Python 3.12 (technical.md §2.2). The digest pins the exact image; Dependabot keeps it fresh.
FROM python:3.12-slim@sha256:b18b261e1b4974b4f321451ad5251ded85abb22c2b8b262da527dda1d031ab30

COPY --from=uv /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:${PATH}"

# The app runs as this non-root user (uid 1000), never as root.
RUN groupadd --gid 1000 app \
    && useradd --uid 1000 --gid app --create-home --shell /usr/sbin/nologin app

WORKDIR /app

ARG INSTALL_DEV=false

# 1) Packages only, exactly as locked in uv.lock. This slow step is redone only when
#    pyproject.toml or uv.lock change. The packages live in /opt/venv, outside /app, so
#    mounting the code into /app for local development does not hide them.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    if [ "$INSTALL_DEV" = "true" ]; then \
        uv sync --frozen --no-install-project; \
    else \
        uv sync --frozen --no-install-project --no-dev; \
    fi

# 2) The application code (changes often, so it comes last). It stays owned by root, so the
#    app user can read it but not change it.
COPY . .

USER app

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
