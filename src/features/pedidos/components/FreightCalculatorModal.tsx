import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Clock, 
  Calculator, 
  Check, 
  X, 
  AlertCircle,
  Layers,
  ChevronRight,
  Search,
  Loader2,
  Building2,
  Compass,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  freightService, 
  AVAILABLE_QUARRIES,
  DEFAULT_QUARRY,
  PASCO_DESTINATION_PRESETS, 
  MATERIAL_PRICES_PER_M3,
  type QuarryLocation,
  type DestinationPreset,
  type RouteCalculationResult 
} from '../../../shared/services/freightService';
import { GoogleMapView } from '../../../shared/components/GoogleMapView';
import type { Pedido } from '../../../shared/services/ordersService';
import { useAuthStore } from '../../../shared/stores/useAuthStore';

export interface CalculatorMaterialItem {
  id: string;
  material: Pedido['material'];
  volumenM3: number;
}

interface FreightCalculatorModalProps {
  initialMaterial?: Pedido['material'];
  initialVolumenM3?: number | '';
  initialMaterials?: Array<{ material: Pedido['material']; volumenM3: number }>;
  initialDestino?: string;
  initialQuarryId?: string;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (params: {
    destino: string;
    volumenM3: number;
    material: Pedido['material'];
    materials: Array<{ material: Pedido['material']; volumenM3: number }>;
    quarry: QuarryLocation;
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
  initialMaterial = 'ARENA_FINA',
  initialVolumenM3 = 15,
  initialMaterials,
  initialDestino = '',
  initialQuarryId = DEFAULT_QUARRY.id,
  isOpen,
  onClose,
  onApply,
}: FreightCalculatorModalProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  // Cantera de salida seleccionada
  const [selectedQuarry, setSelectedQuarry] = useState<QuarryLocation>(() => {
    return AVAILABLE_QUARRIES.find((q) => q.id === initialQuarryId) || DEFAULT_QUARRY;
  });

  // Lista de materiales solicitados (Soporte multi-material)
  const [materialList, setMaterialList] = useState<CalculatorMaterialItem[]>(() => {
    if (initialMaterials && initialMaterials.length > 0) {
      return initialMaterials.map((m, idx) => ({
        id: String(idx + 1),
        material: m.material,
        volumenM3: m.volumenM3,
      }));
    }
    return [
      {
        id: '1',
        material: initialMaterial,
        volumenM3: Number(initialVolumenM3) > 0 ? Number(initialVolumenM3) : 15,
      },
    ];
  });
  
  // Destino y coordenadas
  const [customDestino, setCustomDestino] = useState(initialDestino || 'Yanacancha (San Juan)');
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Estados de cálculo y búsqueda
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [quote, setQuote] = useState<RouteCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Operaciones con la lista de materiales
  const handleAddMaterial = () => {
    setMaterialList((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        material: 'PIEDRA_1_2',
        volumenM3: 15,
      },
    ]);
  };

  const handleRemoveMaterial = (id: string) => {
    if (materialList.length <= 1) return;
    setMaterialList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateMaterial = (id: string, field: 'material' | 'volumenM3', value: unknown) => {
    setMaterialList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const totalVolumenM3 = materialList.reduce((acc, curr) => acc + (Number(curr.volumenM3) || 0), 0);

  // Geocodificar y buscar dirección en Google Maps
  const searchAddress = useCallback(
    async (queryText: string) => {
      const clean = queryText.trim();
      if (!clean) return;

      setSearchingAddress(true);
      setError(null);

      try {
        const geo = await freightService.geocodeAddress(clean);
        if (geo) {
          setDestinationCoords({ lat: geo.lat, lng: geo.lng });
          return { lat: geo.lat, lng: geo.lng };
        } else {
          setError(`No se ubicó "${clean}" en el mapa. Selecciona una zona o haz clic en el mapa.`);
          return null;
        }
      } catch (err: unknown) {
        console.error('Error al geocodificar:', err);
        setError('Error al buscar la dirección en el mapa.');
        return null;
      } finally {
        setSearchingAddress(false);
      }
    },
    []
  );

  // Inicializar destino o preset
  useEffect(() => {
    if (!isOpen) return;

    const initialText = initialDestino.trim() || 'Yanacancha (San Juan)';
    const timeoutId = window.setTimeout(() => {
      setCustomDestino(initialText);

      // Buscar si coincide con preset inicial
      const preset = PASCO_DESTINATION_PRESETS.find(
        (p) =>
          p.name.toLowerCase() === initialText.toLowerCase() ||
          initialText.toLowerCase().includes(p.district.toLowerCase())
      );

      if (preset) {
        setSelectedPresetId(preset.id);
        setDestinationCoords({ lat: preset.lat, lng: preset.lng });
      } else {
        setSelectedPresetId(null);
        void searchAddress(initialText);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, initialDestino, searchAddress]);

  // Recalcular cotización de flete automáticamente cada vez que cambien:
  // Cantera de salida, Lista de Materiales, o Coordenadas de Destino
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    async function computeQuote() {
      const destinationName = customDestino.trim() || 'Punto de Entrega';
      setLoading(true);
      setError(null);

      try {
        let lat = destinationCoords?.lat;
        let lng = destinationCoords?.lng;

        // Si no tenemos coordenadas aún, intentar geocodificar
        if (lat === undefined || lng === undefined) {
          const geo = await freightService.geocodeAddress(destinationName);
          if (geo && active) {
            lat = geo.lat;
            lng = geo.lng;
            setDestinationCoords({ lat: geo.lat, lng: geo.lng });
          }
        }

        const validMaterials = materialList.map((m) => ({
          material: m.material,
          volumenM3: Number(m.volumenM3) > 0 ? Number(m.volumenM3) : 1,
        }));

        const result = await freightService.calculateFreightQuote({
          materials: validMaterials,
          destinationName,
          destinationLat: lat,
          destinationLng: lng,
          quarry: selectedQuarry,
        });

        if (active) {
          setQuote(result);
        }
      } catch (err: unknown) {
        if (active) {
          console.error('Error calculando flete:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudo calcular la ruta. Verifica el punto de entrega en el mapa.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      void computeQuote();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, selectedQuarry, materialList, destinationCoords, customDestino]);

  if (!isOpen) return null;

  // Manejador para clic directo en el mapa de Google
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setDestinationCoords(coords);
    setSelectedPresetId(null);
    setCustomDestino(`Obra marcada en mapa (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
    setError(null);
  };

  // Manejador para presets de Pasco
  const handleSelectPreset = (preset: DestinationPreset) => {
    setSelectedPresetId(preset.id);
    setDestinationCoords({ lat: preset.lat, lng: preset.lng });
    setCustomDestino(preset.name);
    setError(null);
  };

  // Manejador para formulario de búsqueda de dirección
  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customDestino.trim()) return;
    setSelectedPresetId(null);
    await searchAddress(customDestino);
  };

  const handleApply = () => {
    if (!quote || !onApply) return;
    const finalDestino = customDestino.trim() || quote.destinationName;
    const validMaterials = materialList.map((m) => ({
      material: m.material,
      volumenM3: Number(m.volumenM3) > 0 ? Number(m.volumenM3) : 1,
    }));

    onApply({
      destino: finalDestino,
      volumenM3: totalVolumenM3,
      material: validMaterials[0]?.material || 'ARENA_FINA',
      materials: validMaterials,
      quarry: selectedQuarry,
      quote,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl relative text-xs overflow-hidden">
        
        {/* Cabecera del Modal (Limpia, sin insignias redundantes) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md shadow-amber-500/10">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                Calculadora y Simulador de Flete de Agregados
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cálculo vial en tiempo real para camiones volquetes, perfiles de elevación andina y tarifa de flete.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar calculadora"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensaje de Error si ocurre */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2.5 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cuerpo del Modal con Dos Columnas Amplias */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: Configuración Logística (5 de 12) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* 1. Cantera de salida (Origen) */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
              <label className="text-xs font-semibold text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  Cantera de salida
                </span>
                <span className="text-[11px] font-mono text-slate-400">{selectedQuarry.altitudeMsnm} msnm</span>
              </label>

              <select
                value={selectedQuarry.id}
                onChange={(e) => {
                  const q = AVAILABLE_QUARRIES.find((item) => item.id === e.target.value);
                  if (q) setSelectedQuarry(q);
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

            {/* 2. Materiales de obra */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-amber-500" />
                  Materiales solicitados ({materialList.length})
                </label>
                <span className="text-[11px] text-amber-400 font-mono font-semibold">
                  Volumen total: {totalVolumenM3} m³
                </span>
              </div>

              {/* Lista dinámica de materiales */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {materialList.map((item, index) => (
                  <div key={item.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Ítem #{index + 1}
                      </span>
                      {materialList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(item.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar este material"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-8">
                        <select
                          aria-label={`Tipo de material ítem ${index + 1}`}
                          value={item.material}
                          onChange={(e) => handleUpdateMaterial(item.id, 'material', e.target.value as Pedido['material'])}
                          className="w-full bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-lg px-2.5 py-1.5 outline-none text-white text-xs font-medium cursor-pointer"
                        >
                          {(Object.keys(MATERIAL_LABELS) as Array<Pedido['material']>).map((mat) => (
                            <option key={mat} value={mat}>
                              {MATERIAL_LABELS[mat]} (S/ {MATERIAL_PRICES_PER_M3[mat].toFixed(2)}/m³)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            step="0.5"
                            aria-label={`Volumen en m3 ítem ${index + 1}`}
                            value={item.volumenM3}
                            onChange={(e) => handleUpdateMaterial(item.id, 'volumenM3', Math.max(1, parseFloat(e.target.value) || 1))}
                            className="w-full bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-lg px-2.5 py-1.5 outline-none text-white text-xs font-mono pr-6 text-right"
                          />
                          <span className="absolute right-1.5 top-2 text-[9px] text-slate-500 pointer-events-none">m³</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón para agregar más materiales */}
              <button
                type="button"
                onClick={handleAddMaterial}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-750 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs"
              >
                <Plus className="h-3.5 w-3.5 text-amber-500" />
                <span>+ Agregar otro tipo de material a la orden</span>
              </button>

              {/* Indicador de capacidad y viajes de volquete */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-amber-500" />
                  Volquetes necesarios:
                </span>
                <span className="text-amber-400 font-bold">
                  🚛 {quote?.totalTrips ?? Math.max(1, Math.ceil(totalVolumenM3 / 15))} viaje(s) de volquete (15 m³)
                </span>
              </div>
            </div>

            {/* 3. Destino de entrega (Obra) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-amber-500" />
                  Destino de entrega (obra)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Buscar o marcar en mapa</span>
              </div>

              {/* Formulario de búsqueda de dirección */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customDestino}
                    onChange={(e) => {
                      setCustomDestino(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    placeholder="Ej. Tarma, Yanacancha, AA.HH. Columna Pasco..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white outline-none"
                  />
                  {searchingAddress && (
                    <span className="absolute right-2.5 top-3 text-amber-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={searchingAddress || !customDestino.trim()}
                  className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-amber-500/10"
                  title="Buscar dirección en Google Maps"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </form>

              {/* Presets Rápidos de Zonas */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold">
                  Zonas frecuentes en Pasco y alrededores:
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {PASCO_DESTINATION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
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
          </div>

          {/* COLUMNA DERECHA: Mapa Satelital y Desglose de Costos (7 de 12) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            
            {/* Mapa Interactivo con Google Maps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-500" />
                  Ruta vial en mapa
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {loading ? 'Calculando...' : `${quote?.distanceKm ?? '--'} km`}
                </span>
              </div>

              <GoogleMapView
                height="320px"
                origin={{
                  lat: selectedQuarry.lat,
                  lng: selectedQuarry.lng,
                  title: selectedQuarry.name,
                }}
                destination={
                  destinationCoords
                    ? {
                        lat: destinationCoords.lat,
                        lng: destinationCoords.lng,
                        title: customDestino || 'Obra Destino',
                      }
                    : undefined
                }
                routeCoordinates={quote?.routeCoordinates}
                onMapClick={handleMapClick}
              />
            </div>

            {/* Desglose Logístico y Métricas de Ruta */}
            <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3.5">
              
              {/* Tarjetas de Distancia, Tiempo y Altitud */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-amber-500" />
                    Distancia real
                  </span>
                  <p className="text-base font-black text-white font-mono mt-0.5">
                    {loading ? '...' : `${quote?.distanceKm ?? '--'} km`}
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500" />
                    Tiempo estimado
                  </span>
                  <p className="text-base font-black text-white font-mono mt-0.5">
                    {loading ? '...' : `~${quote?.durationMinutes ?? '--'} min`}
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Truck className="h-3 w-3 text-amber-500" />
                    Despachos requeridos
                  </span>
                  <p className="text-[11px] font-bold text-amber-400 font-mono mt-1">
                    {quote?.totalTrips ? `${quote.totalTrips} viaje(s) volquete` : '1 viaje'}
                  </p>
                </div>
              </div>

              {/* Detalle de Costos Transparente por Material */}
              <div className="space-y-2 border-t border-slate-850 pt-3 text-xs">
                {quote?.materialsBreakdown && quote.materialsBreakdown.length > 0 ? (
                  quote.materialsBreakdown.map((item) => (
                    <div key={`breakdown-${item.material}`} className="flex justify-between items-center text-slate-400">
                      <span>
                        {MATERIAL_LABELS[item.material as Pedido['material']] || item.material} ({item.volumenM3} m³ × S/ {item.unitPrice.toFixed(2)}):
                      </span>
                      <span className="font-mono text-white font-semibold">
                        S/ {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Material ({totalVolumenM3} m³ × S/ {quote?.materialPricePerM3.toFixed(2)}):</span>
                    <span className="font-mono text-white font-semibold">
                      S/ {quote?.materialTotal.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-900">
                  <span>
                    Flete Base Operativo ({quote?.totalTrips ?? 1} viaje(s) × S/ 90.00):
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

                <div className="flex justify-between items-center text-amber-400 font-bold border-t border-slate-850 pt-2 text-xs">
                  <span>Subtotal Flete de Transporte:</span>
                  <span className="font-mono">S/ {quote?.freightTotal.toFixed(2) ?? '0.00'}</span>
                </div>
              </div>

              {/* Tarjeta de Total General Destacado */}
              <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent rounded-2xl border border-amber-500/30 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-amber-400 font-semibold tracking-wider block">
                    Total estimado (materiales + flete)
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {totalVolumenM3} m³ puesto en obra / Conductor asignado
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-400 font-mono block">
                    S/ {quote?.grandTotal.toFixed(2) ?? '0.00'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Moneda Nacional (PEN)</span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:text-white hover:bg-slate-850 transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                {onApply && (
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={loading || !quote}
                    className="flex-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-slate-950 font-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <Check className="h-4 w-4" />
                    <span>{isAdmin ? 'Aplicar cotización al pedido' : 'Solicitar este pedido'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FreightCalculatorModal;
