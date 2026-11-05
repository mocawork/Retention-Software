from .base import *  # noqa: F401,F403
from .base import LOG_LEVEL, env, logging_config

DEBUG = True
# Readable coloured log lines on your own machine (JSON everywhere else).
LOG_FORMAT = env("LOG_FORMAT", "console")
LOGGING = logging_config(json_logs=LOG_FORMAT == "json", level=LOG_LEVEL)
