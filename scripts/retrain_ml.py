import base64
import binascii
import hashlib
import hmac
import os
import sys
from datetime import UTC, datetime
from io import BytesIO
from typing import Any
from urllib.parse import urlparse

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
MAX_ARTIFACT_BYTES = 10 * 1024 * 1024
MAX_BASE64_ARTIFACT_CHARS = ((MAX_ARTIFACT_BYTES + 2) // 3) * 4


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
) -> tuple[pd.DataFrame, dict[str, int]]:
    diagnostics = {
        "filas_viajes_api": len(trips),
        "pedidos_sin_volumen_numerico": 0,
        "pedidos_sin_fecha_creacion": 0,
        "vehiculos_sin_capacidad_numerica": 0,
    }
    trip_data = pd.DataFrame(trips)
    order_data = pd.DataFrame(orders)
    vehicle_data = pd.DataFrame(vehicles)
    if not order_data.empty:
        diagnostics["pedidos_sin_volumen_numerico"] = int(
            pd.to_numeric(order_data["volumen_m3"], errors="coerce").isna().sum()
        )
        diagnostics["pedidos_sin_fecha_creacion"] = int(
            pd.to_datetime(
                order_data["created_at"],
                errors="coerce",
                format="mixed",
                utc=True,
            )
            .isna()
            .sum()
        )
    if not vehicle_data.empty:
        diagnostics["vehiculos_sin_capacidad_numerica"] = int(
            pd.to_numeric(vehicle_data["capacidad_m3"], errors="coerce").isna().sum()
        )

    if trip_data.empty or order_data.empty or vehicle_data.empty:
        diagnostics.update(
            {
                "filas_despues_join_pedidos": 0,
                "filas_despues_join_vehiculos": 0,
                "filas_sin_distancia_numerica": 0,
                "filas_sin_carga_calculable": 0,
                "filas_sin_consumo_numerico": 0,
                "filas_con_fecha_viaje": 0,
                "filas_con_fecha_pedido_respaldo": 0,
                "filas_sin_fecha_valida": 0,
                "filas_despues_campos_requeridos": 0,
                "filas_despues_filtro_distancia": 0,
                "filas_despues_filtro_desnivel": 0,
                "filas_despues_filtro_carga": 0,
                "filas_despues_filtro_consumo": 0,
            }
        )
        return pd.DataFrame(), diagnostics

    dataset = trip_data.merge(
        order_data[["id", "volumen_m3", "created_at"]],
        left_on="pedido_id",
        right_on="id",
        suffixes=("", "_pedido"),
    )
    diagnostics["filas_despues_join_pedidos"] = len(dataset)
    dataset = dataset.merge(
        vehicle_data[["id", "capacidad_m3"]],
        left_on="vehiculo_id",
        right_on="id",
        suffixes=("", "_vehiculo"),
    )
    diagnostics["filas_despues_join_vehiculos"] = len(dataset)

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
    fecha_entrega = pd.to_datetime(
        dataset["fecha_entrega"], errors="coerce", format="mixed", utc=True
    )
    fecha_asignacion = pd.to_datetime(
        dataset["fecha_asignacion"], errors="coerce", format="mixed", utc=True
    )
    fecha_viaje = fecha_entrega.fillna(fecha_asignacion)
    fecha_pedido = pd.to_datetime(
        dataset["created_at"], errors="coerce", format="mixed", utc=True
    )
    fecha_pedido_respaldo = fecha_viaje.isna() & fecha_pedido.notna()
    dataset["fecha_orden"] = fecha_viaje.fillna(fecha_pedido)
    diagnostics["filas_con_fecha_viaje"] = int(fecha_viaje.notna().sum())
    diagnostics["filas_con_fecha_pedido_respaldo"] = int(
        fecha_pedido_respaldo.sum()
    )
    diagnostics["filas_sin_distancia_numerica"] = int(
        dataset["distancia_km"].isna().sum()
    )
    diagnostics["filas_sin_carga_calculable"] = int(
        dataset["peso_carga_ton"].isna().sum()
    )
    diagnostics["filas_sin_consumo_numerico"] = int(
        dataset["consumo_diesel_real"].isna().sum()
    )
    diagnostics["filas_sin_fecha_valida"] = int(dataset["fecha_orden"].isna().sum())
    dataset = dataset.dropna(
        subset=["distancia_km", "peso_carga_ton", "consumo_diesel_real", "fecha_orden"]
    )
    diagnostics["filas_despues_campos_requeridos"] = len(dataset)
    dataset = dataset.loc[
        (dataset["distancia_km"] > 0)
        & (dataset["distancia_km"] <= 1000)
    ]
    diagnostics["filas_despues_filtro_distancia"] = len(dataset)
    dataset = dataset.loc[dataset["desnivel_metros"].abs() <= 4000]
    diagnostics["filas_despues_filtro_desnivel"] = len(dataset)
    dataset = dataset.loc[
        (dataset["peso_carga_ton"] > 0) & (dataset["peso_carga_ton"] <= 60)
    ]
    diagnostics["filas_despues_filtro_carga"] = len(dataset)
    dataset = dataset.loc[dataset["consumo_diesel_real"] > 0]
    diagnostics["filas_despues_filtro_consumo"] = len(dataset)
    dataset = dataset.sort_values("fecha_orden", kind="mergesort").reset_index(drop=True)
    return dataset, diagnostics


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


def load_hmac_key() -> bytes:
    secret = os.environ.get("ML_ARTIFACT_HMAC_KEY", "")
    key = secret.encode("utf-8")
    if len(key) < 32:
        raise RuntimeError("ML_ARTIFACT_HMAC_KEY debe tener al menos 32 bytes.")
    return key


def decode_artifact(encoded_artifact: str) -> bytes:
    if len(encoded_artifact) > MAX_BASE64_ARTIFACT_CHARS:
        raise ValueError("El artefacto del modelo excede el tamaño permitido.")
    try:
        artifact = base64.b64decode(encoded_artifact, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ValueError("El artefacto del modelo no tiene base64 válido.") from error
    if not artifact or len(artifact) > MAX_ARTIFACT_BYTES:
        raise ValueError("El artefacto del modelo excede el tamaño permitido.")
    return artifact


def sign_artifact(
    encoded_artifact: str, version: str, algorithm: str, key: bytes
) -> str:
    artifact = decode_artifact(encoded_artifact)
    signed_content = (
        version.encode("utf-8")
        + b"\0"
        + algorithm.encode("utf-8")
        + b"\0"
        + artifact
    )
    return hmac.new(key, signed_content, hashlib.sha256).hexdigest()


def load_artifact(
    encoded_artifact: str,
    signature: str | None,
    version: str,
    algorithm: str,
    key: bytes,
) -> Any:
    artifact = decode_artifact(encoded_artifact)
    if not isinstance(signature, str) or len(signature) != 64:
        raise ValueError("El artefacto del modelo no tiene una firma válida.")
    signed_content = (
        version.encode("utf-8")
        + b"\0"
        + algorithm.encode("utf-8")
        + b"\0"
        + artifact
    )
    expected_signature = hmac.new(key, signed_content, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("La firma del artefacto del modelo no es válida.")
    return joblib.load(BytesIO(artifact))


def serialize_artifact(model: Any) -> str:
    model_buffer = BytesIO()
    joblib.dump(model, model_buffer, compress=3)
    return base64.b64encode(model_buffer.getvalue()).decode("ascii")


def fetch_training_data(supabase: Client) -> tuple[pd.DataFrame, dict[str, int]]:
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
    order_ids = list({trip["pedido_id"] for trip in trips if trip["pedido_id"]})
    vehicle_ids = list({trip["vehiculo_id"] for trip in trips if trip["vehiculo_id"]})
    orders = []
    if order_ids:
        orders = (
            supabase.table("pedidos")
            .select("id, volumen_m3, created_at")
            .in_("id", order_ids)
            .execute()
            .data
            or []
        )
    vehicles = []
    if vehicle_ids:
        vehicles = (
            supabase.table("vehiculos")
            .select("id, capacidad_m3")
            .in_("id", vehicle_ids)
            .execute()
            .data
            or []
        )
    dataset, diagnostics = prepare_training_data(trips, orders, vehicles)
    diagnostics.update(
        {
            "viajes_sin_pedido_id": sum(not trip["pedido_id"] for trip in trips),
            "viajes_sin_vehiculo_id": sum(not trip["vehiculo_id"] for trip in trips),
            "pedidos_ids_solicitados": len(order_ids),
            "pedidos_recibidos": len(orders),
            "pedidos_ids_no_encontrados": len(order_ids) - len(orders),
            "vehiculos_ids_solicitados": len(vehicle_ids),
            "vehiculos_recibidos": len(vehicles),
            "vehiculos_ids_no_encontrados": len(vehicle_ids) - len(vehicles),
        }
    )
    return dataset, diagnostics


def print_training_diagnostics(
    project_host: str, diagnostics: dict[str, int], valid_rows: int
) -> None:
    print(f"Proyecto Supabase (host): {project_host}")
    print("Diagnóstico del conjunto de entrenamiento:")
    diagnostic_labels = (
        ("filas_viajes_api", "Viajes devueltos por la API"),
        ("viajes_sin_pedido_id", "Viajes sin pedido_id"),
        ("viajes_sin_vehiculo_id", "Viajes sin vehiculo_id"),
        ("pedidos_ids_solicitados", "IDs de pedidos solicitados"),
        ("pedidos_recibidos", "Pedidos devueltos por la API"),
        ("pedidos_ids_no_encontrados", "IDs de pedidos no encontrados"),
        ("pedidos_sin_volumen_numerico", "Pedidos sin volumen numérico"),
        ("pedidos_sin_fecha_creacion", "Pedidos sin created_at válido"),
        ("vehiculos_ids_solicitados", "IDs de vehículos solicitados"),
        ("vehiculos_recibidos", "Vehículos devueltos por la API"),
        ("vehiculos_ids_no_encontrados", "IDs de vehículos no encontrados"),
        ("vehiculos_sin_capacidad_numerica", "Vehículos sin capacidad numérica"),
        ("filas_despues_join_pedidos", "Filas después de unir pedidos"),
        ("filas_despues_join_vehiculos", "Filas después de unir vehículos"),
        ("filas_sin_distancia_numerica", "Filas sin distancia numérica (pueden solaparse)"),
        ("filas_sin_carga_calculable", "Filas sin carga calculable (pueden solaparse)"),
        ("filas_sin_consumo_numerico", "Filas sin consumo numérico (pueden solaparse)"),
        ("filas_con_fecha_viaje", "Filas ordenadas por fecha del viaje"),
        (
            "filas_con_fecha_pedido_respaldo",
            "Filas ordenadas por created_at del pedido (respaldo)",
        ),
        ("filas_sin_fecha_valida", "Filas sin fecha válida (pueden solaparse)"),
        ("filas_despues_campos_requeridos", "Filas con campos requeridos y fecha válidos"),
        ("filas_despues_filtro_distancia", "Filas después del filtro de distancia"),
        ("filas_despues_filtro_desnivel", "Filas después del filtro de desnivel"),
        ("filas_despues_filtro_carga", "Filas después del filtro de carga"),
        ("filas_despues_filtro_consumo", "Filas después del filtro de consumo"),
    )
    for key, label in diagnostic_labels:
        print(f"  {label}: {diagnostics.get(key, 0)}")
    print(f"  Total válido para entrenamiento: {valid_rows}")


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


def get_active_estimator(supabase: Client, artifact_hmac_key: bytes) -> Any | None:
    response = (
        supabase.table("ml_modelos_comparados")
        .select("version, algoritmo, artifact_base64, artifact_signature")
        .eq("activo", True)
        .eq("es_referencia", False)
        .limit(1)
        .execute()
    )
    if not response.data or not response.data[0].get("artifact_base64"):
        return None
    active_model = response.data[0]
    return load_artifact(
        active_model["artifact_base64"],
        active_model.get("artifact_signature"),
        active_model["version"],
        active_model["algoritmo"],
        artifact_hmac_key,
    )


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
    artifact_hmac_key: bytes,
) -> None:
    comparison_rows = [
        {
            "algoritmo": model["algoritmo"],
            "mae_galones": round(model["mae_galones"], 6),
            "rmse_galones": round(model["rmse_galones"], 6),
            "r2_score": round(model["r2_score"], 6),
            "total_viajes_entrenados": training_count,
            "artifact_base64": model["artifact_base64"],
            "artifact_signature": sign_artifact(
                model["artifact_base64"], version, model["algoritmo"], artifact_hmac_key
            ),
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
            "artifact_signature": None,
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
    artifact_hmac_key = load_hmac_key()
    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_role_key:
        raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")

    supabase = create_client(supabase_url, service_role_key)
    dataset, diagnostics = fetch_training_data(supabase)
    project_host = urlparse(supabase_url).hostname or "no disponible"
    print_training_diagnostics(project_host, diagnostics, len(dataset))
    print(f"Viajes entregados válidos para entrenamiento: {len(dataset)}")
    if len(dataset) < MINIMUM_TRAINING_ROWS:
        print(
            f"Se requieren al menos {MINIMUM_TRAINING_ROWS}; no se modifica el modelo activo."
        )
        return

    coefficients = load_reference_coefficients(supabase)
    try:
        active_estimator = get_active_estimator(supabase, artifact_hmac_key)
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
        artifact_hmac_key,
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
