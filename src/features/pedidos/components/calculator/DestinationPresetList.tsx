import { useRef, useEffect, type FormEvent } from 'react';
import { Navigation, Search, Loader2, Compass, MapPin } from 'lucide-react';
import {
  PASCO_DESTINATION_PRESETS,
  type DestinationPreset,
  type LocationSuggestion,
} from '../../../../shared/services/freightService';

interface DestinationPresetListProps {
  customDestino: string;
  selectedPresetId: string | null;
  searchingAddress: boolean;
  suggestions?: LocationSuggestion[];
  showSuggestions?: boolean;
  onDestinoChange: (val: string) => void;
  onSearchSubmit: (e: FormEvent) => void;
  onSelectPreset: (preset: DestinationPreset) => void;
  onSelectSuggestion?: (suggestion: LocationSuggestion) => void;
  onCloseSuggestions?: () => void;
  onOpenSuggestions?: () => void;
}

export function DestinationPresetList({
  customDestino,
  selectedPresetId,
  searchingAddress,
  suggestions = [],
  showSuggestions = false,
  onDestinoChange,
  onSearchSubmit,
  onSelectPreset,
  onSelectSuggestion,
  onCloseSuggestions,
  onOpenSuggestions,
}: DestinationPresetListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCloseSuggestions?.();
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [onCloseSuggestions]);

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex justify-between items-center">
        <label
          htmlFor="input-destino-obra"
          className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
        >
          <Navigation className="h-4 w-4 text-amber-500" />
          Destino de entrega (obra)
        </label>
        <span className="text-[10px] text-slate-400 font-mono">Buscar o marcar en mapa</span>
      </div>

      <form onSubmit={onSearchSubmit} className="flex gap-2 relative">
        <div className="relative flex-1">
          <input
            id="input-destino-obra"
            type="text"
            value={customDestino}
            onFocus={() => onOpenSuggestions?.()}
            onChange={(e) => {
              onDestinoChange(e.target.value);
              onOpenSuggestions?.();
            }}
            placeholder="Ej. Tarma, Yanacancha, Plaza Oxapampa, Hospital Pasco..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white outline-none"
          />
          {searchingAddress && (
            <span className="absolute right-2.5 top-3 text-amber-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </span>
          )}

          {/* Menú flotante de lugares sugeridos por intención */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 overflow-hidden backdrop-blur-md divide-y divide-slate-800">
              <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                <span>Lugares detectados en el mapa</span>
              </div>
              {suggestions.map((item) => (
                <button
                  key={`${item.lat}_${item.lng}_${item.displayName}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectSuggestion?.(item);
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-amber-500/10 hover:text-amber-300 transition-colors flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer"
                >
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="truncate leading-normal">{item.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={searchingAddress || !customDestino.trim()}
          className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-amber-500/10"
          title="Buscar dirección en Google Maps"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </form>

      <div className="space-y-1">
        <span className="text-[10px] text-slate-400 font-semibold">
          Zonas frecuentes en Pasco y alrededores:
        </span>
        <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pr-1">
          {PASCO_DESTINATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`p-2 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPresetId === preset.id
                  ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                  : 'bg-slate-950/70 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] truncate">{preset.name}</span>
              <span className="text-[9px] text-slate-500 font-mono">{preset.district}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/15 text-[11px] text-amber-400 flex items-center gap-2">
        <Compass className="h-4 w-4 shrink-0 text-amber-500" />
        <span>Haz clic en cualquier punto del mapa para fijar la obra exactamente.</span>
      </div>
    </div>
  );
}

export default DestinationPresetList;
