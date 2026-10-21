import { Activity, Loader2 } from 'lucide-react';
import type { MlSimulatorInput } from '../hooks/useMlLiveSimulation';

interface MlRouteSimulatorProps {
  input: MlSimulatorInput;
  candidateCount: number;
  loading: boolean;
  onChange: (field: keyof MlSimulatorInput, value: string) => void;
}

export function MlRouteSimulator({
  input,
  candidateCount,
  loading,
  onChange,
}: MlRouteSimulatorProps) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-amber-400" />
        <div>
          <h3 className="text-sm font-bold text-white">Simulador de ruta y carga</h3>
          <p className="text-[10px] text-slate-500">Las cinco predicciones se actualizan al cambiar una entrada.</p>
        </div>
        {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-amber-400" />}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-[10px] text-slate-400">
          Distancia (km)
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={input.distanciaKm}
            onChange={(event) => onChange('distanciaKm', event.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
          />
        </label>
        <label className="space-y-1 text-[10px] text-slate-400">
          Desnivel (m)
          <input
            type="number"
            min="-4000"
            max="4000"
            step="1"
            value={input.desnivelMetros}
            onChange={(event) => onChange('desnivelMetros', event.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
          />
        </label>
        <label className="space-y-1 text-[10px] text-slate-400">
          Carga (ton)
          <input
            type="number"
            min="0.1"
            max="60"
            step="0.1"
            value={input.pesoCargaTon}
            onChange={(event) => onChange('pesoCargaTon', event.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
          />
        </label>
      </div>
      {candidateCount !== 5 && (
        <p className="mt-4 text-[10px] text-slate-500">
          El simulador se habilita cuando haya artefactos de los cinco modelos.
        </p>
      )}
    </div>
  );
}
