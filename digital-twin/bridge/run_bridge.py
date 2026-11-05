"""Run the local bridge unattended with its ignored .env and rotating logs."""

from __future__ import annotations

import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

from bridge import main


def run() -> int:
    bridge_dir = Path(__file__).resolve().parent
    env_file = bridge_dir / ".env"
    for line in env_file.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        key, separator, value = stripped.partition("=")
        if not separator or not key:
            raise ValueError(f"Invalid environment line in {env_file}")
        os.environ[key] = value

    log_dir = bridge_dir.parent / ".local"
    log_dir.mkdir(exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            RotatingFileHandler(
                log_dir / "bridge-service.log",
                maxBytes=2_000_000,
                backupCount=2,
                encoding="utf-8",
            )
        ],
    )
    try:
        return main()
    except Exception:
        logging.exception("Bridge stopped unexpectedly")
        raise


if __name__ == "__main__":
    raise SystemExit(run())
