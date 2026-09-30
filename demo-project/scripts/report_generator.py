"""Report generation script."""

import json
from typing import Dict, Any


class ReportGenerator:
    """Formats processed records into human-readable or JSON outputs."""

    def __init__(self, title: str):
        self.title = title

    def format_json(self, data: Dict[str, Any]) -> str:
        """Serialize data to formatted JSON string."""
        return json.dumps({"report": self.title, "data": data}, indent=2)


async def generate_async_report(title: str, payload: Dict[str, Any]) -> str:
    """Asynchronous report creation utility."""
    generator = ReportGenerator(title)
    return generator.format_json(payload)
