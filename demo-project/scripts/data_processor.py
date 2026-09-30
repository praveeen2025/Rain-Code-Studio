"""Data Processor Module for demo workspace."""

import os
import sys
from typing import List, Dict, Any

DEFAULT_CHUNK_SIZE = 500
MAX_BATCH_LIMIT = 10000


class DataProcessor:
    """Batch data ingestion and validation engine."""

    def __init__(self, batch_size: int = DEFAULT_CHUNK_SIZE):
        self.batch_size = batch_size
        self.processed_count = 0

    def process_records(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter and normalize incoming data records."""
        valid_records = []
        for r in records:
            if "id" in r and r.get("active", True):
                valid_records.append(r)
        self.processed_count += len(valid_records)
        return valid_records

    def get_summary(self) -> Dict[str, Any]:
        """Return execution statistics."""
        return {
            "batch_size": self.batch_size,
            "total_processed": self.processed_count
        }


def calculate_metrics(values: List[float]) -> Dict[str, float]:
    """Calculate basic statistical metrics for float series."""
    if not values:
        return {"count": 0, "sum": 0.0, "avg": 0.0}
    total = sum(values)
    return {
        "count": len(values),
        "sum": total,
        "avg": total / len(values)
    }
