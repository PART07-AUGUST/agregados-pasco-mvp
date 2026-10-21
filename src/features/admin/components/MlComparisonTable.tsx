import type { MlComparacionDto, MlComparacionPrediccionesDto } from '../../../shared/types/api/mlDto';

const ALGORITHM_LABELS: Record<string, string> = {
  linear_regression: 'Regresión lineal',
  ridge: 'Ridge',
  svr: 'SVR',
  random_forest: 'Random Forest',
  gradient_boosting: 'Gradient Boosting',
  baseline_coefficients: 'Coeficientes actuales (referencia)',
};

function formatMetric(value: string | number | null): string {
  return value == null ? '—' : Number(value).toFixed(3);
}

interface MlComparisonTableProps {
  comparison: MlComparacionDto | null;
  loading: boolean;
  simulationLoading: boolean;
  predictions: MlComparacionPrediccionesDto['predicciones'];
}

export function MlComparisonTable({
  comparison,
  loading,
  simulationLoading,
  predictions,
}: MlComparisonTableProps) {
  const predictionsByAlgorithm = new Map(
    predictions.map((prediction) => [
      prediction.algoritmo,
      Number(prediction.consumo_estimado_galones),
    ])
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/30">
      <table className="w-full min-w-[1240px] text-left text-xs">
        <thead className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Algoritmo</th>
            <th className="px-4 py-3">MAE (gal)</th>
            <th className="px-4 py-3">RMSE (gal)</th>
            <th className="px-4 py-3">R²</th>
            <th className="px-4 py-3">MAE prueba final</th>
            <th className="px-4 py-3">Viajes de entrenamiento</th>
            <th className="px-4 py-3">MAE real producción</th>
            <th className="px-4 py-3">RMSE real producción</th>
            <th className="px-4 py-3">Viajes con medición</th>
            <th className="px-4 py-3">Predicción (gal)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900 text-slate-300">
          {loading ? (
            <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">Cargando métricas…</td></tr>
          ) : comparison?.modelos.length ? (
            comparison.modelos.map((model) => (
              <tr key={`${model.version}-${model.algoritmo}`}>
                <td className="px-4 py-3 font-semibold text-slate-100">
                  {ALGORITHM_LABELS[model.algoritmo] ?? model.algoritmo}
                  {model.activo && <span className="ml-2 text-[9px] text-emerald-400">ACTIVO</span>}
                </td>
                <td className="px-4 py-3 font-mono">{formatMetric(model.mae_galones)}</td>
                <td className="px-4 py-3 font-mono">{formatMetric(model.rmse_galones)}</td>
                <td className="px-4 py-3 font-mono">{formatMetric(model.r2_score)}</td>
                <td className="px-4 py-3 font-mono">{formatMetric(model.mae_prueba_final_galones ?? null)}</td>
                <td className="px-4 py-3 font-mono">{model.total_viajes_entrenados}</td>
                <td className="px-4 py-3 font-mono">{formatMetric(model.produccion_mae_galones ?? null)}</td>
                <td className="px-4 py-3 font-mono">{formatMetric(model.produccion_rmse_galones ?? null)}</td>
                <td className="px-4 py-3 font-mono">{model.viajes_produccion ?? 0}</td>
                <td className="px-4 py-3 font-mono text-amber-300">
                  {model.es_referencia
                    ? 'Referencia'
                    : simulationLoading && !predictionsByAlgorithm.has(model.algoritmo)
                      ? 'Calculando…'
                      : formatMetric(predictionsByAlgorithm.get(model.algoritmo) ?? null)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                <p>Aún no hay comparación publicada.</p>
                <p className="mt-2 text-[10px]">
                  Aplica la migración ML del backend y registra mediciones reales desde los viajes entregados; el backend compara y entrena automáticamente en segundo plano.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
