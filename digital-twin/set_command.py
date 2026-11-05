"""Trigger the demo's ON/OFF inject node through Node-RED's secured Admin API."""

from __future__ import annotations

import argparse
import base64
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Node-RED origin")
    parser.add_argument("desired", choices=["on", "off"])
    args = parser.parse_args()
    origin = args.url.rstrip("/")
    credentials = json.loads(
        (Path(__file__).resolve().parent / ".local" / "credentials.json").read_text()
    )
    form = urlencode(
        {
            "client_id": "node-red-admin",
            "grant_type": "password",
            "scope": "*",
            "username": credentials["node_red_admin_user"],
            "password": credentials["node_red_admin_password"],
        }
    ).encode()
    with urlopen(
        Request(
            origin + "/editor/auth/token",
            data=form,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        ),
        timeout=30,
    ) as response:
        token = json.load(response)["access_token"]

    node_id = "command_on" if args.desired == "on" else "command_off"
    with urlopen(
        Request(
            origin + "/editor/inject/" + node_id,
            data=b"",
            headers={"Authorization": "Bearer " + token},
        ),
        timeout=30,
    ) as response:
        assert response.status in (200, 204), f"Inject returned {response.status}"

    basic = base64.b64encode(
        f"{credentials['node_red_bridge_user']}:{credentials['node_red_bridge_password']}".encode()
    ).decode()
    with urlopen(
        Request(
            origin + "/plc/command",
            headers={"Authorization": "Basic " + basic},
        ),
        timeout=30,
    ) as response:
        command = json.load(response)
    desired = args.desired == "on"
    assert command["desired"] is desired, f"Unexpected command state: {command}"
    print(f"Command set to {desired}; version={command['version']}")


if __name__ == "__main__":
    main()
