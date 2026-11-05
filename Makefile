# RetentionOS: everyday commands.
# Type `make` (or `make help`) to see them all with a plain-English description.
# Each command is a short recipe below; nothing here is magic.

SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help
MAKEFLAGS += --no-print-directory

COMPOSE ?= docker compose -f infra/docker-compose.yml
UV ?= uv
PNPM ?= pnpm
# The tool that runs the safety checks before each commit (.pre-commit-config.yaml).
PRE_COMMIT_VERSION := 4.7.0
# Background-job queues (technical.md §15); the same list as the Docker worker.
CELERY_QUEUES := webhooks,sync,analytics,messaging,explain,default
# Fixed, non-secret key so the API description is the same on every computer and in CI.
SCHEMA_ENV := DJANGO_SECRET_KEY=schema-only-not-secret
# Files that are generated from the code and committed (the OpenAPI drift check).
GENERATED := backend/openapi.json backend/allauth-openapi.json \
	frontend/src/lib/api/schema.ts frontend/src/lib/api/auth-schema.ts
HAS_FRONTEND := $(wildcard frontend/package.json)

.PHONY: help setup services up down logs migrate run run-frontend worker test lint format \
	typecheck schema client check-drift check

##@ Getting started

help: ## Show this list of commands
	@awk 'BEGIN { FS = ":.*## "; print "\nRetentionOS commands. Type make <command>, for example: make up" } \
		/^##@/ { printf "\n%s\n", substr($$0, 5) } \
		/^[a-zA-Z_-]+:.*## / { printf "  make %-13s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo

setup: backend/.env ## First-time setup: settings files, backend and website tools, commit checks
	@command -v $(UV) >/dev/null || { echo "uv is missing. Install it first (see README.md, Prerequisites)."; exit 1; }
	cd backend && $(UV) sync
ifneq ($(HAS_FRONTEND),)
	@command -v $(PNPM) >/dev/null || { echo "pnpm is missing. Run 'corepack enable' once (see README.md)."; exit 1; }
	@test -f frontend/.env.local || { cp frontend/.env.example frontend/.env.local && echo "Created frontend/.env.local"; }
	$(PNPM) --dir frontend install --frozen-lockfile
endif
	$(UV) tool install --quiet "pre-commit==$(PRE_COMMIT_VERSION)"
	"$$($(UV) tool dir --bin)/pre-commit" install
	@echo "Setup done. Next: make up, then make run-frontend."

backend/.env: backend/.env.example
	@if [ -f $@ ]; then \
		echo "Note: backend/.env.example changed since your backend/.env. Compare the two files."; \
		touch $@; \
	else \
		cp $< $@ && echo "Created backend/.env from backend/.env.example (local values only)."; \
	fi

##@ Running it on your computer

services: ## Start only the database (Postgres) and Redis, in Docker
	$(COMPOSE) up -d --wait --wait-timeout 120 postgres redis

up: ## Start the whole backend in Docker: database, Redis, API (localhost:8000), worker, scheduler
	$(COMPOSE) up -d --build --wait --wait-timeout 300
	@echo "Backend is running: http://localhost:8000/api/v1/docs/  Next: make run-frontend"

down: ## Stop everything started by make up or make services (your data is kept)
	$(COMPOSE) down

logs: ## Follow the backend logs; sign-up and invitation emails are printed here (Ctrl+C to stop)
	$(COMPOSE) logs -f --tail=200

migrate: backend/.env ## Apply database changes (migrations); make up also does this by itself
	cd backend && $(UV) run --env-file .env python manage.py migrate

run: backend/.env ## Run the API on this computer at http://localhost:8000 (use instead of make up)
	cd backend && $(UV) run --env-file .env python manage.py runserver 8000

run-frontend: ## Run the website at http://localhost:3000
	$(PNPM) --dir frontend dev

worker: backend/.env ## Run a background-job worker on this computer (use instead of make up)
	cd backend && $(UV) run --env-file .env celery -A config worker -Q $(CELERY_QUEUES) -l info

##@ Checks (the same ones CI runs on every pull request)

test: ## Run all automatic tests (the database must be running: make services or make up)
	cd backend && $(UV) run pytest
ifneq ($(HAS_FRONTEND),)
	$(PNPM) --dir frontend test
endif

lint: ## Check code style without changing anything
	cd backend && $(UV) run ruff check . && $(UV) run ruff format --check .
ifneq ($(HAS_FRONTEND),)
	$(PNPM) --dir frontend lint
endif

format: ## Fix code style automatically
	cd backend && $(UV) run ruff check --fix . && $(UV) run ruff format .
ifneq ($(HAS_FRONTEND),)
	$(PNPM) --dir frontend format
endif

typecheck: ## Check types: mypy for the backend, TypeScript for the website
	cd backend && $(UV) run mypy .
ifneq ($(HAS_FRONTEND),)
	$(PNPM) --dir frontend typecheck
endif

check: lint typecheck test check-drift ## Run every check above, in the same order as CI

##@ API contract (backend and website must agree)

schema: ## Re-create the API description files backend/openapi.json and backend/allauth-openapi.json
	cd backend && $(SCHEMA_ENV) $(UV) run python manage.py spectacular --file openapi.json --validate
	cd backend && $(SCHEMA_ENV) $(UV) run python manage.py export_auth_schema --file allauth-openapi.json

client: ## Re-create the website's typed API client (frontend/src/lib/api) from those files
	$(PNPM) --dir frontend generate:api

check-drift: ## Fail if database changes, API description or API client are out of date
	cd backend && $(SCHEMA_ENV) $(UV) run python manage.py makemigrations --check --dry-run
	$(MAKE) schema
ifneq ($(HAS_FRONTEND),)
	$(MAKE) client
endif
	@if [ -n "$$(git status --porcelain -- $(GENERATED))" ]; then \
		git status --short -- $(GENERATED); \
		echo "Generated files are out of date or not committed. Commit the files listed above."; \
		exit 1; \
	fi
	@echo "No drift: migrations, API description and API client are up to date."
