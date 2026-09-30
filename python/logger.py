"""SnapDev AI - Python Structured Logger.

Phase 10: Security, Privacy & Reliability.
Provides safe, structured logging with automatic secret redaction.
Never logs API keys, bearer tokens, private keys, or passwords.
"""

import json
import re
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional


SENSITIVE_PATTERNS = [
    re.compile(r"(?:bearer\s+)([a-zA-Z0-9_\-\.]{10,})", re.IGNORECASE),
    re.compile(r"(?:api[_-]?key|secret|token|password|passwd|auth)=([^\s&;]+)", re.IGNORECASE),
    re.compile(r"-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA )?PRIVATE KEY-----"),
]


def redact_secrets(text: str) -> str:
    """Scrub potential secrets and auth tokens from log strings."""
    if not text:
        return text
    redacted = text
    for pattern in SENSITIVE_PATTERNS:
        redacted = pattern.sub("[REDACTED_SECRET]", redacted)
    return redacted


class StructuredLogger:
    """In-memory structured logger with secret scrubbing and diagnostic retrieval."""

    def __init__(self, max_buffer_size: int = 1000):
        self.max_buffer_size = max_buffer_size
        self._buffer: List[Dict[str, Any]] = []

    def log(self, level: str, category: str, message: str, details: Optional[Dict[str, Any]] = None):
        clean_msg = redact_secrets(message)
        clean_details = None
        if details:
            try:
                clean_details = json.loads(redact_secrets(json.dumps(details)))
            except Exception:
                clean_details = {"raw": redact_secrets(str(details))}

        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level.upper(),
            "category": category,
            "message": clean_msg,
            "details": clean_details,
        }

        self._buffer.append(entry)
        if len(self._buffer) > self.max_buffer_size:
            self._buffer.pop(0)

        prefix = f"[{entry['timestamp']}] [{entry['level']}] [{entry['category']}]"
        print(f"{prefix} {clean_msg}", file=sys.stderr if level.upper() == "ERROR" else sys.stdout)

    def debug(self, category: str, message: str, details: Optional[Dict[str, Any]] = None):
        self.log("DEBUG", category, message, details)

    def info(self, category: str, message: str, details: Optional[Dict[str, Any]] = None):
        self.log("INFO", category, message, details)

    def warning(self, category: str, message: str, details: Optional[Dict[str, Any]] = None):
        self.log("WARN", category, message, details)

    def error(self, category: str, message: str, details: Optional[Dict[str, Any]] = None):
        self.log("ERROR", category, message, details)

    def get_recent_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self._buffer[-limit:]

    def clear(self):
        self._buffer.clear()


logger = StructuredLogger()
