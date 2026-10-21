import base64
import os
import sys
from datetime import UTC, datetime
from io import BytesIO
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR

from supabase import Client, create_client

FEATURES = ["distancia_km", "desnivel_metros", "peso_carga_ton"]
ALGORITHM_NAMES = (
    "linear_regression",
    "ridge",
    "svr",
    "random_forest",
    "gradient_boosting",
)
DENSIDAD_ESTIMADA_TON_M3 = 1.45
MINIMUM_TRAINING_ROWS = 30


def create_models() -> dict[str, Any]:
    return {
        "linear_regression": LinearRegression(),
        "ridge": Ridge(alpha=1.0),
        "svr": make_pipeline(StandardScaler(), SVR(C=10.0, epsilon=0.1)),
        "random_forest": RandomForestRegressor(
            n_estimators=150,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        ),
        "gradient_boosting": GradientBoostingRegressor(
            n_estimators=150,
            max_depth=2,
            random_state=42,
        ),
    }


def prepare_training_data(
    trips: list[dict[str, Any]],
    orders: list[dict[str, Any]],
    vehicles: list[dict[str, Any]],
) -> pd.DataFrame:
    trip_data = pd.DataFrame(trips)
    order_data = pd.DataFrame(orders)
    vehicle_data = pd.DataFrame(vehicles)

    if trip_data.empty or order_data.empty or vehicle_data.empty:
        return pd.DataFrame()

    dataset = trip_data.merge(
        order_data[["id", "volumen_m3"]],
        left_on="pedido_id",
        right_on="id",
        suffixes=("", "_pedido"),
    ).merge(
        vehicle_data[["id", "capacidad_m3"]],
        left_on="vehiculo_id",
        right_on="id",
        suffixes=("", "_vehiculo"),
    )

    for column in (
        "distancia_km",
        "desnivel_metros",
        "volumen_m3",
        "capacidad_m3",
        "consumo_diesel_real",
    ):
        dataset[column] = pd.to_numeric(dataset[column], errors="coerce")

    dataset["desnivel_metros"] = dataset["desnivel_metros"].fillna(0)
    dataset["volumen_carga_m3"] = dataset[["volumen_m3", "capacidad_m3"]].min(axis=1)
    dataset["peso_carga_ton"] = (
        dataset["volumen_carga_m3"] * DENSIDAD_ESTIMADA_TON_M3
    ).round(2)
    dataset["fecha_orden"] = pd.to_datetime(
        dataset["fecha_entrega"].fillna(dataset["fecha_asignacion"]),
        errors="coerce",
        utc=True,
    )
    dataset = dataset.dropna(
        subset=["distancia_km", "peso_carga_ton", "consumo_diesel_real", "fecha_orden"]
    )
    dataset = dataset.loc[
        (dataset["distancia_km"] > 0)
        & (dataset["distancia_km"] <= 1000)
        & (dataset["desnivel_metros"].abs() <= 4000)
        & (dataset["peso_carga_ton"] > 0)
        & (dataset["peso_carga_ton"] <= 60)
        & (dataset["consumo_diesel_real"] > 0)
    ]
    return dataset.sort_values("fecha_orden", kind="mergesort").reset_index(drop=True)


def split_recent_holdout(dataset: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    holdout_size = max(1, int(np.ceil(len(dataset) * 0.2)))
    training_data = dataset.iloc[:-holdout_size]
    validation_data = dataset.iloc[-holdout_size:]
    return training_data, validation_data


def score_predictions(actual: pd.Series, predicted: np.ndarray) -> dict[str, float]:
    serving_predictions = np.maximum(0.5, np.round(predicted.astype(float), 2))
    return {
        "mae_galones": float(mean_absolute_error(actual, serving_predictions)),
        "rmse_galones": float(mean_squared_error(actual, serving_predictions) ** 0.5),
        "r2_score": float(r2_score(actual, serving_predictions)),
    }


def promotion_allowed(candidate: dict[str, float], active: dict[str, float]) -> bool:
    return (
        candidate["mae_galones"] < active["mae_galones"]
        and candidate["rmse_galones"] <= active["rmse_galones"]
    )


def load_artifact(encoded_artifact: str) -> Any:
    return joblib.load(BytesIO(base64.b64decode(encoded_artifact, validate=True)))


def serialize_artifact(model: Any) -> str:
    model_buffer = BytesIO()
    joblib.dump(model, model_buffer, compress=3)
    return base64.b64encode(model_buffer.getvalue()).decode("ascii")


def fetch_training_data(supabase: Client) -> pd.DataFrame:
    trip_response = (
        supabase.table("viajes")
        .select(
            "id, pedido_id, vehiculo_id, distancia_km, desnivel_metros, "
            "consumo_diesel_real, fecha_entrega, fecha_asignacion"
        )
        .eq("estado", "ENTREGADO")
        .not_.is_("consumo_diesel_real", "null")
        .not_.is_("distancia_km", "null")
        .range(0, 4999)
        .execute()
    )
    trips = trip_response.data or []
    if not trips:
        return pd.DataFrame()

    order_ids = list({trip["pedido_id"] for trip in trips})
    vehicle_ids = list({trip["vehiculo_id"] for trip in trips})
    orders = (
        supabase.table("pedidos")
        .select("id, volumen_m3")
        .in_("id", order_ids)
        .execute()
        .data
        or []
    )
    vehicles = (
        supabase.table("vehiculos")
        .select("id, capacidad_m3")
        .in_("id", vehicle_ids)
        .execute()
        .data
        or []
    )
    return prepare_training_data(trips, orders, vehicles)


def load_reference_coefficients(supabase: Client) -> dict[str, float]:
    response = (
        supabase.table("ml_parametros")
        .select(
            "intercepto, coef_distancia_km, coef_desnivel_metros, coef_peso_carga_ton"
        )
        .eq("id", "diesel_model_v1")
        .limit(1)
        .execute()
    )
    row = response.data[0] if response.data else {}
    return {
        "intercepto": float(row.get("intercepto", 0.021927)),
        "distancia": float(row.get("coef_distancia_km", 0.288902)),
        "desnivel": float(row.get("coef_desnivel_metros", 0.000714)),
        "peso": float(row.get("coef_peso_carga_ton", 0.040514)),
    }


def score_reference(
    features: pd.DataFrame, coefficients: dict[str, float]
) -> np.ndarray:
    return (
        coefficients["intercepto"]
        + features["distancia_km"].to_numpy() * coefficients["distancia"]
        + features["desnivel_metros"].to_numpy() * coefficients["desnivel"]
        + features["peso_carga_ton"].to_numpy() * coefficients["peso"]
    )


def get_active_estimator(supabase: Client) -> Any | None:
    response = (
        supabase.table("ml_modelos_comparados")
        .select("artifact_base64")
        .eq("activo", True)
        .eq("es_referencia", False)
        .limit(1)
        .execute()
    )
    if not response.data or not response.data[0].get("artifact_base64"):
        return None
    return load_artifact(response.data[0]["artifact_base64"])


def evaluate_models(
    dataset: pd.DataFrame,
    coefficients: dict[str, float],
    active_estimator: Any | None,
) -> tuple[list[dict[str, Any]], dict[str, float], str | None]:
    training_data, validation_data = split_recent_holdout(dataset)
    x_train = training_data[FEATURES]
    y_train = training_data["consumo_diesel_real"]
    x_validation = validation_data[FEATURES]
    y_validation = validation_data["consumo_diesel_real"]

    baseline_metrics = score_predictions(
        y_validation,
        score_reference(x_validation, coefficients),
    )
    if active_estimator is None:
        active_metrics = baseline_metrics
    else:
        active_metrics = score_predictions(
            y_validation, active_estimator.predict(x_validation)
        )

    results: list[dict[str, Any]] = []
    for algorithm, model in create_models().items():
        model.fit(x_train, y_train)
        metrics = score_predictions(y_validation, model.predict(x_validation))
        model.fit(dataset[FEATURES], dataset["consumo_diesel_real"])
        results.append(
            {
                "algoritmo": algorithm,
                **metrics,
                "artifact_base64": serialize_artifact(model),
            }
        )

    best_candidate = min(results, key=lambda result: result["mae_galones"])
    active_algorithm = (
        best_candidate["algoritmo"]
        if promotion_allowed(best_candidate, active_metrics)
        else None
    )
    return results, baseline_metrics, active_algorithm


def publish_comparison(
    supabase: Client,
    version: str,
    models: list[dict[str, Any]],
    baseline_metrics: dict[str, float],
    active_algorithm: str | None,
    training_count: int,
) -> None:
    comparison_rows = [
        {
            "algoritmo": model["algoritmo"],
            "mae_galones": round(model["mae_galones"], 6),
            "rmse_galones": round(model["rmse_galones"], 6),
            "r2_score": round(model["r2_score"], 6),
            "total_viajes_entrenados": training_count,
            "artifact_base64": model["artifact_base64"],
            "es_referencia": False,
        }
        for model in models
    ]
    comparison_rows.append(
        {
            "algoritmo": "baseline_coefficients",
            "mae_galones": round(baseline_metrics["mae_galones"], 6),
            "rmse_galones": round(baseline_metrics["rmse_galones"], 6),
            "r2_score": round(baseline_metrics["r2_score"], 6),
            "total_viajes_entrenados": training_count,
            "artifact_base64": None,
            "es_referencia": True,
        }
    )

    # La RPC cambia el modelo activo y guarda la comparación en una sola transacción.
    supabase.rpc(
        "publicar_comparacion_ml",
        {
            "p_version": version,
            "p_modelos": comparison_rows,
            "p_algoritmo_activo": active_algorithm,
        },
    ).execute()


def run_retraining() -> None:
    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_role_key:
        raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")

    supabase = create_client(supabase_url, service_role_key)
    dataset = fetch_training_data(supabase)
    print(f"Viajes entregados válidos para entrenamiento: {len(dataset)}")
    if len(dataset) < MINIMUM_TRAINING_ROWS:
        print(
            f"Se requieren al menos {MINIMUM_TRAINING_ROWS}; no se modifica el modelo activo."
        )
        return

    coefficients = load_reference_coefficients(supabase)
    try:
        active_estimator = get_active_estimator(supabase)
    except (ValueError, TypeError, EOFError, AttributeError):
        print(
            "El modelo activo no se pudo cargar; se comparará contra los coeficientes de referencia."
        )
        active_estimator = None

    models, baseline_metrics, active_algorithm = evaluate_models(
        dataset,
        coefficients,
        active_estimator,
    )
    for model in sorted(models, key=lambda result: result["mae_galones"]):
        print(
            f"{model['algoritmo']}: MAE={model['mae_galones']:.4f}, "
            f"RMSE={model['rmse_galones']:.4f}, R²={model['r2_score']:.4f}"
        )
    print(
        "Referencia coeficientes: "
        f"MAE={baseline_metrics['mae_galones']:.4f}, "
        f"RMSE={baseline_metrics['rmse_galones']:.4f}, "
        f"R²={baseline_metrics['r2_score']:.4f}"
    )

    version = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
    publish_comparison(
        supabase,
        version,
        models,
        baseline_metrics,
        active_algorithm,
        len(dataset),
    )
    if active_algorithm:
        print(f"Modelo activo actualizado a {active_algorithm} ({version}).")
    else:
        print(
            "Ningún candidato superó MAE y RMSE del modelo vigente; se conserva el anterior."
        )


if __name__ == "__main__":
    try:
        run_retraining()
    except Exception as error:
        print(f"ERROR al reentrenar o publicar los modelos: {error}", file=sys.stderr)
        raise
