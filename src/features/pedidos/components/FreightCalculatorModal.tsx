import { Calculator, X, AlertCircle, MapPin } from 'lucide-react';
import { GoogleMapView } from '../../../shared/components/GoogleMapView';
import { useAuthStore } from '../../../shared/stores/useAuthStore';
import {
  useFreightCalculator,
  type UseFreightCalculatorProps,
} from '../hooks/useFreightCalculator';
import { QuarrySelector } from './calculator/QuarrySelector';
import { MaterialItemsList } from './calculator/MaterialItemsList';
import { DestinationPresetList } from './calculator/DestinationPresetList';
import { QuoteBreakdownCard } from './calculator/QuoteBreakdownCard';

export type FreightCalculatorModalProps = UseFreightCalculatorProps;

export function FreightCalculatorModal(props: FreightCalculatorModalProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const {
    selectedQuarry,
    setSelectedQuarry,
    materialList,
    totalVolumenM3,
    handleAddMaterial,
    handleRemoveMaterial,
    handleUpdateMaterial,
    customDestino,
    setCustomDestino,
    destinationCoords,
    selectedPresetId,
    searchingAddress,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleSelectSuggestion,
    handleSearchSubmit,
    handleSelectPreset,
    handleMapClick,
    quote,
    loading,
    error,
    handleApply,
  } = useFreightCalculator(props);

  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl relative text-xs overflow-hidden">
        
        {/* Cabecera del Modal */}
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
            onClick={props.onClose}
            aria-label="Cerrar calculadora"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2.5 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cuerpo del Modal con Dos Columnas Modulares */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda: Configuración Logística */}
          <div className="lg:col-span-5 space-y-4">
            <QuarrySelector
              selectedQuarry={selectedQuarry}
              onSelectQuarry={setSelectedQuarry}
            />

            <MaterialItemsList
              materialList={materialList}
              totalVolumenM3={totalVolumenM3}
              totalTrips={quote?.totalTrips}
              onAddMaterial={handleAddMaterial}
              onRemoveMaterial={handleRemoveMaterial}
              onUpdateMaterial={handleUpdateMaterial}
            />

            <DestinationPresetList
              customDestino={customDestino}
              selectedPresetId={selectedPresetId}
              searchingAddress={searchingAddress}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              onDestinoChange={(val) => setCustomDestino(val)}
              onSearchSubmit={handleSearchSubmit}
              onSelectPreset={handleSelectPreset}
              onSelectSuggestion={handleSelectSuggestion}
              onCloseSuggestions={() => setShowSuggestions(false)}
              onOpenSuggestions={() => setShowSuggestions(true)}
            />
          </div>

          {/* Columna Derecha: Mapa Satelital y Desglose Financiero */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
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

            <QuoteBreakdownCard
              quote={quote}
              loading={loading}
              totalVolumenM3={totalVolumenM3}
              isAdmin={isAdmin}
              onClose={props.onClose}
              onApply={props.onApply ? handleApply : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FreightCalculatorModal;
