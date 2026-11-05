import unittest

from bridge import Bridge, BridgeError, ModbusPlc, RenderApi, Snapshot


class FakePlc:
    def __init__(self, confirm: bool = True) -> None:
        self.command = False
        self.confirm = confirm
        self.writes: list[bool] = []

    def read(self) -> Snapshot:
        return Snapshot(pulse=True, command=self.command, ack=self.command and self.confirm)

    def write_command(self, desired: bool) -> None:
        self.writes.append(desired)
        self.command = desired


class FakeApi:
    def __init__(self, desired: bool = True) -> None:
        self.desired = desired
        self.telemetry: list[Snapshot] = []
        self.acks: list[tuple[bool, bool, int]] = []

    def post_telemetry(self, snapshot: Snapshot) -> None:
        self.telemetry.append(snapshot)

    def get_command(self) -> tuple[bool, int]:
        return self.desired, 7

    def post_ack(self, desired: bool, observed: bool, version: int) -> None:
        self.acks.append((desired, observed, version))


class BridgeTests(unittest.TestCase):
    def test_modbus_reconnects_after_runtime_restart(self) -> None:
        class Response:
            bits = [True, False, False]

            def isError(self) -> bool:
                return False

        class Client:
            def __init__(self) -> None:
                self.connects = 0
                self.closes = 0

            def connect(self) -> bool:
                self.connects += 1
                return True

            def close(self) -> None:
                self.closes += 1

            def read_coils(self, *_args, **_kwargs) -> Response:
                if self.closes == 0:
                    raise ConnectionResetError("Runtime restarted")
                return Response()

        plc = object.__new__(ModbusPlc)
        plc.client = Client()

        with self.assertRaisesRegex(BridgeError, "Modbus read failed"):
            plc.read()
        self.assertEqual(plc.read(), Snapshot(True, False, False))
        self.assertEqual(plc.client.connects, 2)
        self.assertEqual(plc.client.closes, 1)

    def test_cloud_command_is_written_and_confirmed(self) -> None:
        plc = FakePlc()
        api = FakeApi()

        result = Bridge(plc, api, sleep=lambda _: None).run_once()

        self.assertEqual(plc.writes, [True])
        self.assertFalse(api.telemetry[0].command)
        self.assertEqual(api.acks, [(True, True, 7)])
        self.assertTrue(result.ack)

    def test_missing_confirmation_is_reported_as_failure(self) -> None:
        plc = FakePlc(confirm=False)
        api = FakeApi()

        with self.assertRaisesRegex(BridgeError, "did not confirm"):
            Bridge(plc, api, sleep=lambda _: None).run_once()

        self.assertEqual(api.acks, [(True, False, 7)])

    def test_invalid_command_cannot_reach_the_plc(self) -> None:
        class InvalidApi(FakeApi):
            def get_command(self) -> tuple[bool, int]:
                raise BridgeError("Render returned an invalid command")

        plc = FakePlc()
        with self.assertRaises(BridgeError):
            Bridge(plc, InvalidApi(), sleep=lambda _: None).run_once()

        self.assertEqual(plc.writes, [])

    def test_command_payload_rejects_wrong_types(self) -> None:
        api = object.__new__(RenderApi)
        api._request = lambda *_: {"desired": "true", "version": 1}

        with self.assertRaisesRegex(BridgeError, "invalid command"):
            api.get_command()


if __name__ == "__main__":
    unittest.main()
