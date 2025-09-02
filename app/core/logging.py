from __future__ import annotations
import logging
import sys
import json
import uuid
import time
from typing import Callable, Any


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # noqa: D401
        base = {
            "ts": f"{record.created:.3f}",
            "level": record.levelname,
            "msg": record.getMessage(),
            "logger": record.name,
        }
        extra = getattr(record, "extra", None)
        if isinstance(extra, dict):
            for k, v in extra.items():
                if k not in base:
                    base[k] = v
        return json.dumps(base, ensure_ascii=False)


def setup_logging(level: str) -> None:
    root = logging.getLogger()
    root.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root.addHandler(handler)
    root.setLevel(level)


def new_request_id() -> str:
    return uuid.uuid4().hex[:8]


def timed(fn: Callable[..., Any]) -> Callable[..., Any]:
    def wrapper(*a, **kw):
        start = time.perf_counter()
        try:
            return fn(*a, **kw)
        finally:
            logging.getLogger("timing").info(
                fn.__name__, extra={"extra": {"duration_ms": int((time.perf_counter() - start) * 1000)}}
            )
    return wrapper
