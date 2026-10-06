import os
import sys
import numpy as np
import pandas as pd
from supabase import create_client
from sklearn.linear_model import Ridge
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.model_selection import train_test_split

MIN_R2_THRESHOLD = 0.90
MAX_MAE_THRESHOLD = 0.50

def run_retraining():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("ERROR: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")
        sys.exit(1)

    print("Iniciando conexión con Supabase...")
    supabase = create_client(supabase_url, supabase_key)

    response = supabase.table("viajes").select(
        "id, distancia_km, desnivel_metros, peso_entrada_kg, peso_salida_kg, consumo_diesel_real"
    ).not_.is_("consumo_diesel_real", "null").not_.is_("distancia_km", "null").execute()

    data = response.data
    total_records = len(data)
    print(f"Registros recuperados para reentrenamiento: {total_records}")

    if total_records < 30:
        print("ADVERTENCIA: Muestra insuficiente (< 30 viajes). Se requiere mayor volumen para reentrenar.")
        sys.exit(0)

    df = pd.DataFrame(data)
    df["distancia_km"] = pd.to_numeric(df["distancia_km"], errors="coerce")
    df["desnivel_metros"] = pd.to_numeric(df["desnivel_metros"], errors="coerce")
    df["consumo_diesel_real"] = pd.to_numeric(df["consumo_diesel_real"], errors="coerce")

    df["peso_salida_kg"] = pd.to_numeric(df["peso_salida_kg"], errors="coerce")
    df["peso_entrada_kg"] = pd.to_numeric(df["peso_entrada_kg"], errors="coerce")

    valid_net_weight = (df["peso_salida_kg"].notnull()) & (df["peso_entrada_kg"].notnull()) & (df["peso_salida_kg"] > df["peso_entrada_kg"])
    df["peso_carga_ton"] = np.where(valid_net_weight, (df["peso_salida_kg"] - df["peso_entrada_kg"]) / 1000.0, 18.5)

    df = df.dropna(subset=["distancia_km", "desnivel_metros", "peso_carga_ton", "consumo_diesel_real"])

    features = ["distancia_km", "desnivel_metros", "peso_carga_ton"]
    X = df[features]
    y = df["consumo_diesel_real"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2 = float(r2_score(y_test, y_pred))
    mae = float(mean_absolute_error(y_test, y_pred))

    print(f"Métricas obtenidas: R2 = {r2:.4f}, MAE = {mae:.4f} galones")

    if r2 < MIN_R2_THRESHOLD or mae > MAX_MAE_THRESHOLD:
        print(f"GUARDRAIL RECHAZADO: R2 ({r2:.4f}) < {MIN_R2_THRESHOLD} o MAE ({mae:.4f}) > {MAX_MAE_THRESHOLD}. No se actualiza producción.")
        sys.exit(1)

    intercept = float(model.intercept_)
    coef_distancia = float(model.coef_[0])
    coef_desnivel = float(model.coef_[1])
    coef_peso = float(model.coef_[2])

    print("Guardrail superado. Actualizando tabla ml_parametros en Supabase...")

    update_payload = {
        "intercepto": round(intercept, 6),
        "coef_distancia_km": round(coef_distancia, 6),
        "coef_desnivel_metros": round(coef_desnivel, 6),
        "coef_peso_carga_ton": round(coef_peso, 6),
        "r2_score": round(r2, 4),
        "mae_galones": round(mae, 4),
        "total_viajes_entrenados": len(df),
        "actualizado_en": pd.Timestamp.now("UTC").isoformat(),
    }

    supabase.table("ml_parametros").update(update_payload).eq("id", "diesel_model_v1").execute()

    print("PROCESO COMPLETADO EXITOSAMENTE.")
    print(f"Nuevos coeficientes desplegados: Intercepto={intercept:.6f}, Distancia={coef_distancia:.6f}, Desnivel={coef_desnivel:.6f}, Peso={coef_peso:.6f}")

if __name__ == "__main__":
    run_retraining()
