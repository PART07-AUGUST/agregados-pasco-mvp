import { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Clock, 
  Calculator, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  freightService, 
  PASCO_DESTINATION_PRESETS, 
  MATERIAL_PRICES_PER_M3,
  type DestinationPreset,
  type RouteCalculationResult 
} from '../../../shared/services/freightService';
import type { Pedido } from '../../../shared/services/ordersService';

interface FreightCalculatorModalProps {
  initialMaterial: Pedido['material'];
  initialVolumenM3: number | '';
  initialDestino: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (params: {
    destino: string;
    volumenM3: number;
    material: Pedido['material'];
    quote: RouteCalculationResult;
  }) => void;
}

const MATERIAL_LABELS: Record<Pedido['material'], string> = {
  ARENA_FINA: 'Arena Fina',
  ARENA_GRUESA: 'Arena Gruesa',
  PIEDRA_1_2: 'Piedra Chancada 1/2"',
  PIEDRA_3_4: 'Piedra Chancada 3/4"',
  AFIRMADO: 'Afirmado Clasificado',
  TIERRA_CHACRA: 'Tierra de Chacra',
};

export function FreightCalculatorModal({
  initialMaterial,
  initialVolumenM3,
  initialDestino,
  isOpen,
  onClose,
  onApply,
}: FreightCalculatorModalProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Pedido['material']>(initialMaterial);
  const [volumen, setVolumen] = useState<number>(Number(initialVolumenM3) > 0 ? Number(initialVolumenM3) : 15);
  const [selectedPreset, setSelectedPreset] = useState<DestinationPreset | null>(() => {
    if (!initialDestino) return null;
    return (
      PASCO_DESTINATION_PRESETS.find(
        (p) =>
          p.name.toLowerCase() === initialDestino.toLowerCase() ||
          initialDestino.toLowerCase().includes(p.district.toLowerCase())
      ) || null
    );
  });
  const [customDestino, setCustomDestino] = useState(initialDestino);
  const [quote, setQuote] = useState<RouteCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recalcular cotización cada vez que cambien los parámetros
  useEffect(() => {
    let active = true;

    async function computeQuote() {
      const destinationName = selectedPreset?.name || customDestino.trim() || 'Yanacancha (San Juan)';
      setLoading(true);
      setError(null);

      try {
        const result = await freightService.calculateFreightQuote({
          material: selectedMaterial,
          volumenM3: volumen > 0 ? volumen : 1,
          destinationName,
          destinationLat: selectedPreset?.lat,
          destinationLng: selectedPreset?.lng,
          fallbackKm: selectedPreset?.estimatedKmFallback,
        });

        if (active) {
          setQuote(result);
        }
      } catch {
        if (active) {
          setError('No se pudo calcular la ruta. Verifica el destino.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (isOpen) {
      computeQuote();
    }

    return () => {
      active = false;
    };
  }, [isOpen, selectedMaterial, volumen, selectedPreset, customDestino]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: DestinationPreset) => {
    setSelectedPreset(preset);
    setCustomDestino(`${preset.name} - Obra`);
  };

  const handleApply = () => {
    if (!quote) return;
    const finalDestino = customDestino.trim() || (selectedPreset ? selectedPreset.name : 'Cerro de Pasco');
    onApply({
      destino: finalDestino,
      volumenM3: volumen,
      material: selectedMaterial,
      quote,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative text-xs">
        
        {/* Botón de cierre */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Calculadora de Flete y Rutas de Agregados
              <span className="text-[10px] bg-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                API OSRM Live
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Cálculo de distancias satelitales desde Cantera Quiulacocha (Cerro de Pasco)
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda: Parámetros */}
          <div className="space-y-4">
            {/* Cantera Origen */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                Punto de Carga (Origen)
              </span>
              <p className="text-white font-semibold text-xs">Cantera Quiulacocha - Pasco</p>
              <p className="text-[10px] text-slate-500 font-mono">Coord: -10.7025, -76.2625 (4,380 msnm)</p>
            </div>

            {/* Material */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-amber-500" />
                Tipo de Agregado
              </label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value as Pedido['material'])}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs cursor-pointer"
              >
                {(Object.keys(MATERIAL_LABELS) as Array<Pedido['material']>).map((mat) => (
                  <option key={mat} value={mat}>
                    {MATERIAL_LABELS[mat]} (S/ {MATERIAL_PRICES_PER_M3[mat].toFixed(2)}/m³)
                  </option>
                ))}
              </select>
            </div>

            {/* Volumen */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-amber-500" />
                  Volumen de Carga (m³)
                </label>
                <span className="text-[10px] text-amber-400 font-mono">
                  {volumen >= 15 ? '🚛 Capacidad Volquete 15m³+' : '🚚 Camión Mediano'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[8, 15, 20, 30].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVolumen(v)}
                    className={`py-2 rounded-xl font-bold font-mono text-xs border transition-all cursor-pointer ${
                      volumen === v
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {v} m³
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.5"
                min="1"
                value={volumen}
                onChange={(e) => setVolumen(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 outline-none text-white font-mono text-xs mt-1"
                placeholder="Otro volumen personalizado..."
              />
            </div>

            {/* Destinos Frecuentes en Pasco */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5 text-amber-500" />
                Zonas de Entrega en Pasco
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {PASCO_DESTINATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPreset?.id === preset.id
                        ? 'bg-amber-500/15 border-amber-500 text-white font-bold'
                        : 'bg-slate-950/70 border-slate-850 text-slate-400 hover:text-white hover:border-slate-750'
                    }`}
                  >
                    <span className="text-[11px] truncate">{preset.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">~{preset.estimatedKmFallback} km</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Entrada de Obra/Dirección Específica */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Dirección u Obra Específica:</label>
              <input
                type="text"
                value={customDestino}
                onChange={(e) => {
                  setCustomDestino(e.target.value);
                  setSelectedPreset(null);
                }}
                placeholder="Ej. Yanacancha - AA.HH. Columna Pasco Mz B"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Columna Derecha: Resumen y Cotización */}
          <div className="flex flex-col justify-between space-y-4 bg-slate-950/80 rounded-2xl p-5 border border-slate-850">
            <div>
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Desglose Logístico Oficial
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <Sparkles className="h-3 w-3" /> Tarifa Pasco 2026
                </span>
              </div>

              {/* Indicadores de Ruta */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-amber-500" />
                    Distancia OSRM
                  </span>
                  <p className="text-sm font-extrabold text-white font-mono mt-0.5">
                    {loading ? 'Calculando...' : `${quote?.distanceKm ?? '--'} km`}
                  </p>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500" />
                    Tiempo Tránsito
                  </span>
                  <p className="text-sm font-extrabold text-white font-mono mt-0.5">
                    {loading ? '...' : `~${quote?.durationMinutes ?? '--'} min`}
                  </p>
                </div>
              </div>

              {/* Detalle de Costos */}
              <div className="space-y-2.5 border-t border-slate-900 pt-3">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Material ({volumen} m³ × S/ {quote?.materialPricePerM3.toFixed(2)}):</span>
                  <span className="font-mono text-white font-semibold">
                    S/ {quote?.materialTotal.toFixed(2) ?? '0.00'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1">
                    Flete Base Operativo:
                  </span>
                  <span className="font-mono text-white font-semibold">
                    S/ {quote?.freightBase.toFixed(2) ?? '0.00'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Flete por Distancia ({quote?.distanceKm} km):</span>
                  <span className="font-mono text-white font-semibold">
                    S/ {quote?.freightDistanceCost.toFixed(2) ?? '0.00'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-amber-400 font-bold border-t border-slate-850 pt-2 text-[11px]">
                  <span>Subtotal Flete de Transporte:</span>
                  <span className="font-mono">S/ {quote?.freightTotal.toFixed(2) ?? '0.00'}</span>
                </div>
              </div>

              {/* Total General */}
              <div className="mt-5 p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl border border-amber-500/30 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
                    Total Estimado (Material + Flete)
                  </span>
                  <span className="text-[10px] text-slate-400">Puesto en Obra / Conductor Asignado</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-amber-400 font-mono block">
                    S/ {quote?.grandTotal.toFixed(2) ?? '0.00'}
                  </span>
                  <span className="text-[9px] text-slate-500">Moneda Nacional (PEN)</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={loading || !quote}
                className="flex-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Aplicar al Pedido</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default FreightCalculatorModal;
