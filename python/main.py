"""SnapDev AI - Python Backend Entrypoint.

Starts the FastAPI server with Uvicorn for local on-device operation.
Controlled and supervised by the Electron Process Manager.
"""

import argparse
import os
import sys
import uvicorn

# Ensure python/ directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from config import get_config


def parse_args():
    config = get_config()
    parser = argparse.ArgumentParser(description="Rain Code Studio Local Backend Server")
    parser.add_argument(
        "--host",
        type=str,
        default=config.api_host,
        help=f"Host address to bind (default: {config.api_host})"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=config.api_port,
        help=f"Port to bind (default: {config.api_port})"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        default=False,
        help="Enable auto-reload for development"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    config = get_config()
    config.api_host = args.host
    config.api_port = args.port

    print(f"[Rain Code Studio Backend] Starting on http://{args.host}:{args.port}")
    print(f"[Rain Code Studio Backend] Environment: {config.environment}")
    print(f"[Rain Code Studio Backend] Model Device: {config.model_device} (Phase 5 Local AI)")

    uvicorn.run(
        "api:app",
        host=args.host,
        port=args.port,
        log_level=config.log_level.lower(),
        access_log=True,
        reload=args.reload
    )


if __name__ == "__main__":
    main()
