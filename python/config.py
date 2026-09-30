"""SnapDev AI - Python Backend Configuration.

Phase 1: Foundation configuration placeholders.
NOTE: Do NOT download or load AI models in Phase 1.
This file provides configuration schema for the FastAPI service and future Snapdragon NPU AI runtime.
"""

from dataclasses import dataclass, field
import os
from typing import Optional


@dataclass
class BackendConfig:
    """Backend server and future AI runtime configuration parameters."""

    # API Server configuration
    api_host: str = field(
        default_factory=lambda: os.getenv("SNAPDEV_API_HOST", "127.0.0.1")
    )
    api_port: int = field(
        default_factory=lambda: int(os.getenv("SNAPDEV_API_PORT", "8765"))
    )
    environment: str = field(
        default_factory=lambda: os.getenv("SNAPDEV_ENV", "development")
    )

    # Phase 5: Local AI Model configuration
    model_path: str = field(
        default_factory=lambda: os.getenv("MODEL_PATH", os.getenv("SNAPDEV_MODEL_PATH", "models/local-code"))
    )
    model_name: str = field(
        default_factory=lambda: os.getenv("MODEL_NAME", os.getenv("SNAPDEV_MODEL_NAME", "snapdev-local-code-q4"))
    )
    model_device: str = field(
        default_factory=lambda: os.getenv("MODEL_DEVICE", os.getenv("SNAPDEV_MODEL_DEVICE", "cpu"))
    )
    model_format: str = field(
        default_factory=lambda: os.getenv("MODEL_FORMAT", "safetensors")
    )
    model_context_length: int = field(
        default_factory=lambda: int(os.getenv("MODEL_CONTEXT_LENGTH", "4096"))
    )
    model_quantization: str = field(
        default_factory=lambda: os.getenv("MODEL_QUANTIZATION", "q4_k_m")
    )
    model_temperature: float = field(
        default_factory=lambda: float(os.getenv("MODEL_TEMPERATURE", "0.2"))
    )
    model_max_tokens: int = field(
        default_factory=lambda: int(os.getenv("MODEL_MAX_TOKENS", "1024"))
    )

    # Logging and diagnostics
    log_level: str = field(
        default_factory=lambda: os.getenv("SNAPDEV_LOG_LEVEL", "info")
    )

    # Phase 4: Local RAG, Embedding & Vector Store configuration
    embedding_model: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_MODEL", "local-code-mini-384")
    )
    embedding_model_path: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_MODEL_PATH", "models/embeddings")
    )
    embedding_dimension: int = field(
        default_factory=lambda: int(os.getenv("EMBEDDING_DIMENSION", "384"))
    )
    embedding_device: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_DEVICE", "cpu")
    )
    embedding_batch_size: int = field(
        default_factory=lambda: int(os.getenv("EMBEDDING_BATCH_SIZE", "32"))
    )
    vector_indexes_path: str = field(
        default_factory=lambda: os.getenv("SNAPDEV_INDEXES_PATH", "indexes")
    )

    # Context limits
    max_context_chunks: int = field(
        default_factory=lambda: int(os.getenv("MAX_CONTEXT_CHUNKS", "8"))
    )
    max_context_characters: int = field(
        default_factory=lambda: int(os.getenv("MAX_CONTEXT_CHARACTERS", "8000"))
    )
    max_context_tokens: int = field(
        default_factory=lambda: int(os.getenv("MAX_CONTEXT_TOKENS", "2048"))
    )


# Singleton instance
settings = BackendConfig()


def get_config() -> BackendConfig:
    """Retrieve current backend configuration."""
    return settings
