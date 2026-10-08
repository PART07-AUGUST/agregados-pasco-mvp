import type { MLModelParams } from '../../../../shared/services/fuelPredictionService';

export function buildMLFormulaText(params: MLModelParams): string {
  const intercepto = params.intercepto.toFixed(4);
  const km = params.coefDistanciaKm.toFixed(4);
  const ton = params.coefPesoCargaTon.toFixed(4);
  const desnivel = params.coefDesnivelMetros.toFixed(5);
  return `Consumo (gal) = ${intercepto} + ${km} × Distancia(km) + ${ton} × Carga(ton) + ${desnivel} × Desnivel(m)`;
}

export function buildMLMetricsText(params: MLModelParams): string {
  const r2 = (params.r2Score * 100).toFixed(1);
  return `R² ${r2}%, MAE ${params.maeGalones} gal, entrenado con ${params.totalViajesEntrenados} viajes`;
}
