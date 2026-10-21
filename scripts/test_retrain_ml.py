import unittest
from unittest.mock import MagicMock

import numpy as np
import pandas as pd
from retrain_ml import (
    ALGORITHM_NAMES,
    evaluate_models,
    load_artifact,
    prepare_training_data,
    promotion_allowed,
    publish_comparison,
    score_predictions,
    serialize_artifact,
    sign_artifact,
    split_recent_holdout,
)


class RetrainMlTests(unittest.TestCase):
    def test_signed_artifact_loads_and_rejects_tampering_or_context_changes(self) -> None:
        key = b"test-signing-key-with-at-least-32-bytes"
        encoded_artifact = serialize_artifact({"model": "trusted"})
        signature = sign_artifact(encoded_artifact, "v1", "ridge", key)

        loaded = load_artifact(encoded_artifact, signature, "v1", "ridge", key)

        self.assertEqual(loaded, {"model": "trusted"})
        with self.assertRaisesRegex(ValueError, "firma"):
            load_artifact(encoded_artifact, "0" * 64, "v1", "ridge", key)
        with self.assertRaisesRegex(ValueError, "firma"):
            load_artifact(encoded_artifact, signature, "v2", "ridge", key)

    def test_training_load_uses_order_volume_and_assigned_vehicle_capacity(
        self,
    ) -> None:
        dataset = prepare_training_data(
            [
                {
                    "id": "trip-1",
                    "pedido_id": "order-1",
                    "vehiculo_id": "truck-1",
                    "distancia_km": 20,
                    "desnivel_metros": 80,
                    "consumo_diesel_real": 8,
                    "fecha_entrega": "2026-01-02T00:00:00Z",
                    "fecha_asignacion": "2026-01-01T00:00:00Z",
                }
            ],
            [{"id": "order-1", "volumen_m3": 20}],
            [{"id": "truck-1", "capacidad_m3": 15}],
        )

        self.assertEqual(float(dataset.iloc[0]["volumen_carga_m3"]), 15)
        self.assertEqual(float(dataset.iloc[0]["peso_carga_ton"]), 21.75)

    def test_metrics_match_served_minimum_fuel(self) -> None:
        metrics = score_predictions(pd.Series([0.5, 1.23]), np.array([-1.0, 1.23]))

        self.assertEqual(metrics["mae_galones"], 0)
        self.assertEqual(metrics["rmse_galones"], 0)

    def test_validation_uses_the_most_recent_fifth_of_trips(self) -> None:
        dataset = pd.DataFrame({"fecha_orden": pd.date_range("2026-01-01", periods=40)})

        training, validation = split_recent_holdout(dataset)

        self.assertEqual(len(validation), 8)
        self.assertLess(training["fecha_orden"].max(), validation["fecha_orden"].min())

    def test_five_algorithms_share_one_historical_validation_set(self) -> None:
        row_count = 40
        dataset = pd.DataFrame(
            {
                "distancia_km": [15 + index for index in range(row_count)],
                "desnivel_metros": [index * 3 for index in range(row_count)],
                "peso_carga_ton": [12 + index % 8 for index in range(row_count)],
                "consumo_diesel_real": [
                    1 + index * 0.12 + (index % 3) * 0.04 for index in range(row_count)
                ],
                "fecha_orden": pd.date_range("2026-01-01", periods=row_count),
            }
        )

        models, reference_metrics, active_algorithm = evaluate_models(
            dataset,
            {"intercepto": 0.02, "distancia": 0.12, "desnivel": 0.001, "peso": 0.04},
            None,
        )

        self.assertEqual({model["algoritmo"] for model in models}, set(ALGORITHM_NAMES))
        self.assertTrue(all(model["mae_galones"] >= 0 for model in models))
        self.assertIn("rmse_galones", reference_metrics)
        self.assertIn("r2_score", reference_metrics)
        self.assertTrue(active_algorithm is None or active_algorithm in ALGORITHM_NAMES)

    def test_candidate_must_improve_mae_without_worsening_rmse(self) -> None:
        current = {"mae_galones": 0.5, "rmse_galones": 0.7}

        self.assertTrue(
            promotion_allowed({"mae_galones": 0.4, "rmse_galones": 0.7}, current)
        )
        self.assertFalse(
            promotion_allowed({"mae_galones": 0.5, "rmse_galones": 0.6}, current)
        )
        self.assertFalse(
            promotion_allowed({"mae_galones": 0.4, "rmse_galones": 0.71}, current)
        )

    def test_failed_publication_only_attempts_atomic_database_rpc(self) -> None:
        supabase = MagicMock()
        supabase.rpc.return_value.execute.side_effect = RuntimeError(
            "database unavailable"
        )

        with self.assertRaisesRegex(RuntimeError, "database unavailable"):
            publish_comparison(
                supabase,
                "version-1",
                [],
                {"mae_galones": 0.5, "rmse_galones": 0.6, "r2_score": 0.7},
                None,
                40,
                b"test-signing-key-with-at-least-32-bytes",
            )

        supabase.rpc.assert_called_once()
        supabase.table.assert_not_called()


if __name__ == "__main__":
    unittest.main()
