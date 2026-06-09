import logging
import logging.handlers
import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
LOG_FILE = os.path.join(PROJECT_ROOT, "bot.log")

# Standard formatter
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# RotatingFileHandler: prevents log file from growing indefinitely
# and avoids file lock contention across multiple Celery workers on Windows
file_handler = logging.handlers.RotatingFileHandler(
    LOG_FILE,
    maxBytes=10 * 1024 * 1024,  # 10MB per file
    backupCount=5,
    encoding='utf-8',
)
file_handler.setFormatter(formatter)

# Console output (visible in uvicorn/celery logs)
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)


def get_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers when called multiple times
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(stream_handler)
        # Disable propagation to avoid duplicate logs with uvicorn's root logger
        logger.propagate = False

    return logger
