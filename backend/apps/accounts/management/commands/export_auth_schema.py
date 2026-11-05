"""Writes django-allauth's headless API description to a file.

The frontend generates its typed login/sign-up client from this file (CLAUDE.md R-9),
the same way it uses backend/openapi.json for our own API. CI regenerates it and fails
if the committed copy is out of date.
"""
import json
from pathlib import Path

from allauth.headless.spec.internal.schema import get_schema
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Export the django-allauth headless OpenAPI schema (JSON)."

    def add_arguments(self, parser):
        parser.add_argument("--file", default="allauth-openapi.json")

    def handle(self, *args, **options):
        spec = get_schema()
        Path(options["file"]).write_text(json.dumps(spec, indent=2, sort_keys=True) + "\n")
        self.stdout.write(f"Wrote {options['file']} ({len(spec.get('paths', {}))} paths)")
