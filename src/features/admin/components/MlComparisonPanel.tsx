import { useEffect, useState } from 'react';
import { Activity, BrainCircuit, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '../../../shared/services/apiClient';
import type {
  MlComparacionDto,
  MlComparacionPrediccionesDto,
} from '../../../shared/types/api/mlDto';
import { getErrorMessage } from '../../../shared/utils/errors';

const ALGORITHM_LABELS: Record<string, string> = {
  linear_regression: 'Regresión lineal',
  ridge: 'Ridge',
  svr: 'SVR',
  random_forest: 'Random Forest',
  gradient_boosting: 'Gradient Boosting',
  baseline_coefficients: 'Coeficientes actuales (referencia)',
};

const COMPARISON_REFRESH_INTERVAL_MS = 60_000;

interface SimulatorInput {
  distanciaKm: string;
  desnivelMetros: string;
  pesoCargaTon: string;
}

function formatMetric(value: string | number | null): string {
  return value == null ? '—' : Number(value).toFixed(3);
}

export function MlComparisonPanel() {
  const [comparison, setComparison] = useState<MlComparacionDto | null>(null);
  const [simulation, setSimulation] = useState<{
    inputKey: string;
    predictions: MlComparacionPrediccionesDto['predicciones'];
  } | null>(null);
  const [input, setInput] = useState<SimulatorInput>({
    distanciaKm: '25',
    desnivelMetros: '120',
    pesoCargaTon: '18',
  });
  const [loading, setLoading] = useState(true);
  const [comparisonRefreshing, setComparisonRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let requestInProgress = false;
    const abortController = new AbortController();

    const loadComparison = async () => {
      if (requestInProgress) return;
      requestInProgress = true;
      setComparisonRefreshing(true);

      try {
        const result = await apiClient.get<MlComparacionDto>('/ml/comparacion', {
          cache: 'no-store',
          signal: abortController.signal,
        });
        if (!cancelled) {
          setComparison(result);
          setLastUpdatedAt(new Date());
          setError(null);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, 'No se pudo cargar la comparación de modelos.'));
        }
      } finally {
        requestInProgress = false;
        if (!cancelled) {
          setLoading(false);
          setComparisonRefreshing(false);
        }
      }
    };

    const refreshOnFocus = () => void loadComparison();
    void loadComparison();
    const intervalId = window.setInterval(
      () => void loadComparison(),
      COMPARISON_REFRESH_INTERVAL_MS
    );
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      cancelled = true;
      abortController.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [refreshToken]);

  const comparisonVersion = comparison?.version ?? '';
  const candidateModelCount = comparison?.modelos.filter((model) => !model.es_referencia).length ?? 0;

  useEffect(() => {
    const distance = Number(input.distanciaKm);
    const elevation = Number(input.desnivelMetros);
    const load = Number(input.pesoCargaTon);
    if (
      candidateModelCount !== 5 ||
      !Number.isFinite(distance) || distance <= 0 ||
      !Number.isFinite(elevation) ||
      !Number.isFinite(load) || load <= 0
    ) {
      return;
    }

    let cancelled = false;
    const inputKey = `${comparisonVersion}:${input.distanciaKm}:${input.desnivelMetros}:${input.pesoCargaTon}`;
    const timeoutId = window.setTimeout(() => {
      setSimulationLoading(true);
      void apiClient
        .post<MlComparacionPrediccionesDto>('/ml/comparacion/predicciones', {
          distancia_km: distance,
          desnivel_metros: elevation,
          peso_carga_ton: load,
        })
        .then((result) => {
          if (!cancelled) setSimulation({ inputKey, predictions: result.predicciones });
        })
        .catch((simulationError: unknown) => {
          if (!cancelled) {
            setError(getErrorMessage(simulationError, 'No se pudieron comparar las predicciones.'));
            setSimulation({ inputKey, predictions: [] });
          }
        })
        .finally(() => {
          if (!cancelled) setSimulationLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [candidateModelCount, comparisonVersion, input]);

  const updateInput = (field: keyof SimulatorInput, value: string) => {
    setInput((current) => ({ ...current, [field]: value }));
    setSimulationLoading(false);
    setError(null);
  };

  const candidateModels = comparison?.modelos.filter((model) => !model.es_referencia) ?? [];
  const displayedInputKey = `${comparisonVersion}:${input.distanciaKm}:${input.desnivelMetros}:${input.pesoCargaTon}`;
  const predictions = simulation?.inputKey === displayedInputKey ? simulation.predictions : [];
  const predictionsByAlgorithm = new Map(
    predictions.map((prediction) => [prediction.algoritmo, Number(prediction.consumo_estimado_galones)])
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <BrainCircuit className="h-5 w-5 text-amber-400" /> Modelos de combustible
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Evaluación histórica de los cinco algoritmos y predicción en tiempo real.
          </p>
        </div>
        {comparison?.version && (
          <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 font-mono text-[10px] text-slate-400">
            Comparación {comparison.version}
          </span>
        )}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500">
            {lastUpdatedAt
              ? `Actualizado ${lastUpdatedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} · cada minuto`
              : 'Actualización automática cada minuto'}
          </span>
          <button
            type="button"
            onClick={() => setRefreshToken((current) => current + 1)}
            disabled={comparisonRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-[10px] text-slate-300 transition hover:border-amber-500/50 hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${comparisonRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </header>

      {comparison?.modelo_activo && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          Modelo que calcula los nuevos viajes:{' '}
          <strong>{ALGORITHM_LABELS[comparison.modelo_activo.algoritmo] ?? comparison.modelo_activo.algoritmo}</strong>
          <span className="ml-2 font-mono text-emerald-300/80">{comparison.modelo_activo.version}</span>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/30">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Algoritmo</th>
              <th className="px-4 py-3">MAE (gal)</th>
              <th className="px-4 py-3">RMSE (gal)</th>
              <th className="px-4 py-3">R²</th>
              <th className="px-4 py-3">Viajes de entrenamiento</th>
              <th className="px-4 py-3">Predicción (gal)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-slate-300">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Cargando métricas…</td></tr>
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
                  <td className="px-4 py-3 font-mono">{model.total_viajes_entrenados}</td>
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
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  <p>Aún no hay comparación publicada.</p>
                  <p className="mt-2 text-[10px]">
                    Ejecuta una vez el flujo “ML Continuous Retraining Pipeline” en GitHub Actions y verifica que la migración de comparación esté aplicada en Supabase. Después, esta tabla se refresca automáticamente cada minuto.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Simulador de ruta y carga</h3>
            <p className="text-[10px] text-slate-500">Las cinco predicciones se actualizan al cambiar una entrada.</p>
          </div>
          {simulationLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-amber-400" />}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-[10px] text-slate-400">
            Distancia (km)
            <input type="number" min="0.1" step="0.1" value={input.distanciaKm} onChange={(event) => updateInput('distanciaKm', event.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500" />
          </label>
          <label className="space-y-1 text-[10px] text-slate-400">
            Desnivel (m)
            <input type="number" min="-4000" max="4000" step="1" value={input.desnivelMetros} onChange={(event) => updateInput('desnivelMetros', event.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500" />
          </label>
          <label className="space-y-1 text-[10px] text-slate-400">
            Carga (ton)
            <input type="number" min="0.1" max="60" step="0.1" value={input.pesoCargaTon} onChange={(event) => updateInput('pesoCargaTon', event.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500" />
          </label>
        </div>
        {!loading && candidateModels.length !== 5 && (
          <p className="mt-4 text-[10px] text-slate-500">El simulador se habilita cuando haya artefactos de los cinco modelos.</p>
        )}
      </div>
    </section>
  );
}
