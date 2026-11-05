"""Read the current connection and acknowledgement reported by Node-RED."""

from __future__ import annotations

import argparse
import base64
import json
from pathlib import Path
from urllib.request import Request, urlopen


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Node-RED origin")
    args = parser.parse_args()
    credentials = json.loads(
        (Path(__file__).resolve().parent / ".local" / "credentials.json").read_text()
    )
    auth = base64.b64encode(
        f"{credentials['node_red_bridge_user']}:{credentials['node_red_bridge_password']}".encode()
    ).decode()
    request = Request(
        args.url.rstrip("/") + "/plc/status",
        headers={"Authorization": "Basic " + auth},
    )
    with urlopen(request, timeout=30) as response:
        print(json.dumps(json.load(response), indent=2))


if __name__ == "__main__":
    main()
