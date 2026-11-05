"""Celery app. Queues follow technical.md §14. No business tasks yet (M0)."""
import os

from celery import Celery
from kombu import Queue

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

app = Celery("retentionos")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.conf.task_queues = [
    Queue(name) for name in ("webhooks", "sync", "analytics", "messaging", "explain", "default")
]
app.conf.task_default_queue = "default"
app.autodiscover_tasks()


@app.task(name="core.ping")
def ping() -> str:
    """Health-check task used to prove worker wiring."""
    return "pong"
