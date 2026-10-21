import { BrainCircuit, RefreshCw } from 'lucide-react';

interface MlComparisonHeaderProps {
  version: string | null;
  lastUpdatedAt: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}

export function MlComparisonHeader({
  version,
  lastUpdatedAt,
  refreshing,
  onRefresh,
}: MlComparisonHeaderProps) {
  const updateLabel = lastUpdatedAt
    ? `Actualizado ${lastUpdatedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} · cada minuto`
    : 'Actualización automática cada minuto';

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <BrainCircuit className="h-5 w-5 text-amber-400" /> Modelos de combustible
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Evaluación histórica de los cinco algoritmos y predicción en tiempo real.
        </p>
      </div>
      {version && (
        <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 font-mono text-[10px] text-slate-400">
          Comparación {version}
        </span>
      )}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-500">{updateLabel}</span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-[10px] text-slate-300 transition hover:border-amber-500/50 hover:text-white disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>
    </header>
  );
}
