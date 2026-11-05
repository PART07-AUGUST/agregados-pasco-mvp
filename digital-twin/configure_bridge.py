"""Write the ignored local bridge .env for a chosen Node-RED origin."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlparse


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Render HTTPS origin or local http://127.0.0.1:1880")
    args = parser.parse_args()
    url = args.url.rstrip("/")
    parsed = urlparse(url)
    if not parsed.hostname or parsed.path or not (
        parsed.scheme == "https" or
        (parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"})
    ):
        parser.error("Expected an HTTPS origin (HTTP allowed only for localhost)")
    root = Path(__file__).resolve().parent
    credentials = json.loads((root / ".local" / "credentials.json").read_text())
    destination = root / "bridge" / ".env"
    destination.write_text(
        f"RENDER_URL={url}\n"
        f"NODE_RED_BRIDGE_USER={credentials['node_red_bridge_user']}\n"
        f"NODE_RED_BRIDGE_PASSWORD={credentials['node_red_bridge_password']}\n"
        "PLC_HOST=127.0.0.1\nPLC_PORT=1502\nPOLL_SECONDS=5\n",
        encoding="utf-8",
    )
    print("Wrote ignored digital-twin/bridge/.env")


if __name__ == "__main__":
    main()
