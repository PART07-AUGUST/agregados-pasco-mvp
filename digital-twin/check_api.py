"""Smoke-test the protected Node-RED HTTP contract (local or Render)."""

from __future__ import annotations

import argparse
import base64
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Node-RED origin, for example http://127.0.0.1:1880")
    args = parser.parse_args()
    credentials = json.loads(
        (Path(__file__).resolve().parent / ".local" / "credentials.json").read_text()
    )
    token = base64.b64encode(
        f"{credentials['node_red_bridge_user']}:{credentials['node_red_bridge_password']}".encode()
    ).decode()

    def request(method: str, path: str, payload: dict | None = None, auth: bool = True):
        headers = {"Content-Type": "application/json"}
        if auth:
            headers["Authorization"] = f"Basic {token}"
        body = json.dumps(payload).encode() if payload is not None else None
        try:
            with urlopen(
                Request(args.url.rstrip("/") + path, data=body, method=method, headers=headers),
                timeout=30,
            ) as response:
                return response.status, json.load(response)
        except HTTPError as exc:
            try:
                return exc.code, json.load(exc)
            except json.JSONDecodeError:
                return exc.code, {}

    status, _ = request("GET", "/plc/command", auth=False)
    assert status == 401, f"Unauthenticated command request returned {status}"

    status, command = request("GET", "/plc/command")
    assert status == 200 and type(command.get("desired")) is bool
    assert type(command.get("version")) is int

    status, payload = request("POST", "/plc/telemetry", {"pulse": "wrong"})
    assert status == 400 and payload.get("error") == "invalid_telemetry"

    status, payload = request(
        "POST",
        "/plc/telemetry",
        {
            "pulse": False,
            "command": False,
            "ack": False,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert status == 200 and payload.get("ok") is True

    status, payload = request(
        "POST",
        "/plc/ack",
        {"desired": command["desired"], "observed": command["desired"], "version": command["version"]},
    )
    assert status == 200 and payload.get("ok") is True
    print(f"Node-RED contract OK; desired={command['desired']}, version={command['version']}")


if __name__ == "__main__":
    main()
