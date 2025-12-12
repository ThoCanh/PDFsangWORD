from __future__ import annotations

import logging
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock


@dataclass(frozen=True)
class LogItem:
    id: int
    time: str
    level: str
    logger: str
    message: str


_lock = Lock()
_buffer: deque[LogItem] = deque(maxlen=500)
_next_id = 1


class LogBufferHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        global _next_id

        try:
            msg = record.getMessage()
        except Exception:
            msg = str(record.msg)

        now = datetime.now(timezone.utc).isoformat()
        item = LogItem(
            id=_next_id,
            time=now,
            level=record.levelname,
            logger=record.name,
            message=msg,
        )

        with _lock:
            _buffer.append(item)
            _next_id += 1


def install_log_buffer(level: int = logging.INFO) -> None:
    root = logging.getLogger()

    for h in root.handlers:
        if isinstance(h, LogBufferHandler):
            return

    handler = LogBufferHandler(level=level)
    root.addHandler(handler)


def get_log_items(limit: int = 200) -> list[LogItem]:
    with _lock:
        items = list(_buffer)
    if limit <= 0:
        return []
    return items[-limit:]
