"""Verify the three simulated coils on the local OpenPLC Runtime."""

from __future__ import annotations

import time

from pymodbus.client import ModbusTcpClient


def main() -> None:
    client = ModbusTcpClient("127.0.0.1", port=1502, timeout=3)

    def read() -> tuple[bool, bool, bool]:
        response = client.read_coils(0, count=3, device_id=1)
        assert response is not None and not response.isError(), f"Read failed: {response}"
        return tuple(bool(value) for value in response.bits[:3])

    def command(desired: bool) -> None:
        response = client.write_coil(1, desired, device_id=1)
        assert response is not None and not response.isError(), f"Write failed: {response}"
        for _ in range(20):
            if read()[1:] == (desired, desired):
                return
            time.sleep(0.1)
        raise AssertionError(f"OpenPLC did not acknowledge {desired}: {read()}")

    try:
        first = read()
        print(f"Initial coils: {first}")
        command(True)
        print(f"ON confirmed: {read()}")
        command(False)
        print(f"OFF confirmed: {read()}")
        start_pulse = read()[0]
        for _ in range(120):
            if read()[0] != start_pulse:
                print("Pulse changed")
                return
            time.sleep(0.1)
        raise AssertionError("Pulse did not change within 12 seconds")
    finally:
        try:
            command(False)
        finally:
            client.close()


if __name__ == "__main__":
    main()
