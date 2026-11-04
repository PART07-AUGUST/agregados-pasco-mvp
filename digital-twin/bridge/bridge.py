"""Local-only Modbus to HTTPS bridge for the OpenPLC/Render demonstration."""

from __future__ import annotations

import argparse
import base64
import json
import logging
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

logger = logging.getLogger("plc_bridge")


class BridgeError(Exception):
    """A remote API or local PLC exchange did not complete."""


@dataclass(frozen=True)
class Config:
    render_url: str
    bridge_user: str
    bridge_password: str
    plc_host: str = "127.0.0.1"
    plc_port: int = 1502
    poll_seconds: float = 5.0

    @classmethod
    def from_environment(cls) -> Config:
        render_url = os.environ.get("RENDER_URL", "").rstrip("/")
        parsed = urlparse(render_url)
        if parsed.scheme != "https" and not (
            parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"}
        ):
            raise ValueError("RENDER_URL must use HTTPS (HTTP is allowed only for localhost)")
        if not parsed.hostname or parsed.path not in {"", "/"}:
            raise ValueError("RENDER_URL must be an origin without a path")

        bridge_user = os.environ.get("NODE_RED_BRIDGE_USER", "")
        bridge_password = os.environ.get("NODE_RED_BRIDGE_PASSWORD", "")
        if not bridge_user or not bridge_password:
            raise ValueError("NODE_RED_BRIDGE_USER and NODE_RED_BRIDGE_PASSWORD are required")

        plc_port = int(os.environ.get("PLC_PORT", "1502"))
        poll_seconds = float(os.environ.get("POLL_SECONDS", "5"))
        if not 1 <= plc_port <= 65535 or poll_seconds <= 0:
            raise ValueError("PLC_PORT and POLL_SECONDS must be positive and valid")

        return cls(
            render_url=render_url,
            bridge_user=bridge_user,
            bridge_password=bridge_password,
            plc_host=os.environ.get("PLC_HOST", "127.0.0.1"),
            plc_port=plc_port,
            poll_seconds=poll_seconds,
        )


@dataclass(frozen=True)
class Snapshot:
    pulse: bool
    command: bool
    ack: bool

    def as_payload(self) -> dict[str, bool | str]:
        return {
            "pulse": self.pulse,
            "command": self.command,
            "ack": self.ack,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


class PlcPort(Protocol):
    def read(self) -> Snapshot: ...

    def write_command(self, desired: bool) -> None: ...


class ApiPort(Protocol):
    def post_telemetry(self, snapshot: Snapshot) -> None: ...

    def get_command(self) -> tuple[bool, int]: ...

    def post_ack(self, desired: bool, observed: bool, version: int) -> None: ...


class ModbusPlc:
    def __init__(self, config: Config) -> None:
        from pymodbus.client import ModbusTcpClient

        self.client = ModbusTcpClient(
            config.plc_host, port=config.plc_port, timeout=3, retries=1
        )

    def read(self) -> Snapshot:
        try:
            response = self.client.read_coils(0, count=3, device_id=1)
        except Exception as exc:
            raise BridgeError("Modbus read failed") from exc
        if response is None or response.isError() or len(response.bits) < 3:
            raise BridgeError("Modbus read returned an error or fewer than three coils")
        return Snapshot(*(bool(bit) for bit in response.bits[:3]))

    def write_command(self, desired: bool) -> None:
        try:
            response = self.client.write_coil(1, desired, device_id=1)
        except Exception as exc:
            raise BridgeError("Modbus write failed") from exc
        if response is None or response.isError():
            raise BridgeError("Modbus write returned an error")

    def close(self) -> None:
        self.client.close()


class RenderApi:
    def __init__(self, config: Config) -> None:
        self.base_url = config.render_url
        credentials = f"{config.bridge_user}:{config.bridge_password}".encode("utf-8")
        self.authorization = "Basic " + base64.b64encode(credentials).decode("ascii")

    def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = Request(
            self.base_url + path,
            data=body,
            method=method,
            headers={
                "Authorization": self.authorization,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )
        try:
            with urlopen(request, timeout=12) as response:
                return json.load(response)
        except HTTPError as exc:
            raise BridgeError(f"Render returned HTTP {exc.code} for {path}") from exc
        except (URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise BridgeError(f"Render request failed for {path}") from exc

    def post_telemetry(self, snapshot: Snapshot) -> None:
        response = self._request("POST", "/plc/telemetry", snapshot.as_payload())
        if not isinstance(response, dict) or response.get("ok") is not True:
            raise BridgeError("Render did not accept telemetry")

    def get_command(self) -> tuple[bool, int]:
        response = self._request("GET", "/plc/command")
        if not isinstance(response, dict):
            raise BridgeError("Render returned an invalid command")
        desired = response.get("desired")
        version = response.get("version")
        if type(desired) is not bool or type(version) is not int or version < 0:
            raise BridgeError("Render returned an invalid command")
        return desired, version

    def post_ack(self, desired: bool, observed: bool, version: int) -> None:
        response = self._request(
            "POST",
            "/plc/ack",
            {"desired": desired, "observed": observed, "version": version},
        )
        if not isinstance(response, dict) or response.get("ok") is not True:
            raise BridgeError("Render did not accept the acknowledgement")


class Bridge:
    def __init__(self, plc: PlcPort, api: ApiPort, sleep: Any = time.sleep) -> None:
        self.plc = plc
        self.api = api
        self.sleep = sleep

    def run_once(self) -> Snapshot:
        self.api.post_telemetry(self.plc.read())
        desired, version = self.api.get_command()
        self.plc.write_command(desired)

        observed = False
        for attempt in range(4):
            observed = self.plc.read().ack
            if observed == desired:
                break
            if attempt < 3:
                self.sleep(0.1)
        self.api.post_ack(desired, observed, version)
        if observed != desired:
            raise BridgeError("OpenPLC did not confirm the command")
        return self.plc.read()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--once", action="store_true", help="perform one read/write cycle")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    try:
        config = Config.from_environment()
    except ValueError as exc:
        logger.error("Configuration error: %s", exc)
        return 2

    plc = ModbusPlc(config)
    bridge = Bridge(plc, RenderApi(config))
    try:
        while True:
            started = time.monotonic()
            try:
                snapshot = bridge.run_once()
                logger.info(
                    "Connected: pulse=%s command=%s ack=%s",
                    snapshot.pulse,
                    snapshot.command,
                    snapshot.ack,
                )
            except BridgeError as exc:
                logger.warning("Cycle failed; retrying: %s", exc)
                if args.once:
                    return 1
            if args.once:
                return 0
            time.sleep(max(0, config.poll_seconds - (time.monotonic() - started)))
    except KeyboardInterrupt:
        logger.info("Bridge stopped")
        return 0
    finally:
        plc.close()


if __name__ == "__main__":
    raise SystemExit(main())
