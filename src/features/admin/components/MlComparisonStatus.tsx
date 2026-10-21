import type { MlComparacionDto, MlModeloComparadoDto } from '../../../shared/types/api/mlDto';

const ALGORITHM_LABELS: Record<string, string> = {
  linear_regression: 'Regresión lineal',
  ridge: 'Ridge',
  svr: 'SVR',
  random_forest: 'Random Forest',
  gradient_boosting: 'Gradient Boosting',
};

interface MlComparisonStatusProps {
  comparison: MlComparacionDto | null;
  trainingSources: MlModeloComparadoDto | undefined;
  error: string | null;
}

export function MlComparisonStatus({
  comparison,
  trainingSources,
  error,
}: MlComparisonStatusProps) {
  const activeModel = comparison?.modelo_activo;
  const latestJob = comparison?.ultimo_reentrenamiento;

  return (
    <div className="space-y-3">
      {activeModel && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          Modelo que calcula los nuevos viajes:{' '}
          <strong>{ALGORITHM_LABELS[activeModel.algoritmo] ?? activeModel.algoritmo}</strong>
          <span className="ml-2 font-mono text-emerald-300/80">{activeModel.version}</span>
        </div>
      )}
      {latestJob && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-300">
          Reentrenamiento por consumo medido:{' '}
          <strong className={latestJob.estado === 'COMPLETADO' ? 'text-emerald-300' : 'text-amber-300'}>
            {latestJob.estado.replaceAll('_', ' ')}
          </strong>
          {latestJob.error && <span className="ml-2 text-slate-500">{latestJob.error}</span>}
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}
      {trainingSources && (
        <p className="text-[10px] text-slate-500">
          Datos de entrenamiento: {trainingSources.total_rutas_graphhopper ?? 0} rutas GraphHopper verificadas,{' '}
          {trainingSources.total_rutas_legacy ?? 0} rutas históricas sin origen verificable;{' '}
          {trainingSources.rutas_aproximadas_excluidas ?? 0} aproximadas excluidas.
        </p>
      )}
    </div>
  );
}
