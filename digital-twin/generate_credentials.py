"""Generate local-only credentials for the OpenPLC/Node-RED demo.

Requires ``bcrypt`` in the Python environment used to run this script.
The output directory is excluded from Git.
"""

from __future__ import annotations

import json
import secrets
from pathlib import Path

import bcrypt


def main() -> None:
    target = Path(__file__).resolve().parent / ".local"
    target.mkdir(mode=0o700, exist_ok=True)
    secrets_path = target / "credentials.json"
    render_path = target / "render-env.json"
    env_path = target / "node-red.env"
    if secrets_path.exists() or render_path.exists() or env_path.exists():
        raise SystemExit("Credentials already exist; refusing to overwrite them")

    credentials = {
        "node_red_admin_user": "admin",
        "node_red_admin_password": secrets.token_urlsafe(32),
        "node_red_bridge_user": "plc-bridge",
        "node_red_bridge_password": secrets.token_urlsafe(32),
    }
    render_env = {
        "PORT": "1880",
        "NODE_RED_CREDENTIAL_SECRET": secrets.token_urlsafe(48),
        "NODE_RED_ADMIN_USER": credentials["node_red_admin_user"],
        "NODE_RED_ADMIN_PASSWORD_HASH": bcrypt.hashpw(
            credentials["node_red_admin_password"].encode(), bcrypt.gensalt()
        ).decode(),
        "NODE_RED_BRIDGE_USER": credentials["node_red_bridge_user"],
        "NODE_RED_BRIDGE_PASSWORD_HASH": bcrypt.hashpw(
            credentials["node_red_bridge_password"].encode(), bcrypt.gensalt()
        ).decode(),
    }
    secrets_path.write_text(json.dumps(credentials, indent=2) + "\n", encoding="utf-8")
    render_path.write_text(json.dumps(render_env, indent=2) + "\n", encoding="utf-8")
    env_path.write_text(
        "".join(f"{key}={value}\n" for key, value in render_env.items()), encoding="utf-8"
    )
    print("Created ignored credential files in digital-twin/.local/")


if __name__ == "__main__":
    main()
