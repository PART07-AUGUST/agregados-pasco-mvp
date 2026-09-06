import { Building2 } from 'lucide-react';
import {
  AVAILABLE_QUARRIES,
  type QuarryLocation,
} from '../../../../shared/services/freightService';

interface QuarrySelectorProps {
  selectedQuarry: QuarryLocation;
  onSelectQuarry: (quarry: QuarryLocation) => void;
}

export function QuarrySelector({ selectedQuarry, onSelectQuarry }: QuarrySelectorProps) {
  return (
    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
      <label htmlFor="select-cantera-origen" className="text-xs font-semibold text-amber-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-amber-500" />
          Cantera de salida
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          {selectedQuarry.altitudeMsnm} msnm
        </span>
      </label>

      <select
        id="select-cantera-origen"
        value={selectedQuarry.id}
        onChange={(e) => {
          const quarry = AVAILABLE_QUARRIES.find((item) => item.id === e.target.value);
          if (quarry) onSelectQuarry(quarry);
        }}
        className="w-full bg-slate-900/90 border border-slate-750 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs font-medium cursor-pointer"
      >
        {AVAILABLE_QUARRIES.map((q) => (
          <option key={q.id} value={q.id}>
            {q.name} — {q.district} ({q.altitudeMsnm} msnm)
          </option>
        ))}
      </select>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        {selectedQuarry.description}
      </p>
      <div className="text-[10px] text-slate-500 font-mono">
        Coordenadas: {selectedQuarry.lat.toFixed(4)}, {selectedQuarry.lng.toFixed(4)}
      </div>
    </div>
  );
}
