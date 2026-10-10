import { Truck, AlertTriangle, Loader2 } from 'lucide-react';
import type { ViajeDetallado } from '../../../shared/services/tripsService';
import { useDriverTripActions } from '../hooks/useDriverTripActions';
import { TripInfoCard } from './driver/TripInfoCard';
import { DriverGpsPanel } from './driver/DriverGpsPanel';
import { WeighingForm } from './driver/WeighingForm';
import { DeliveryConfirmationPanel } from './driver/DeliveryConfirmationPanel';

export interface DriverTripActiveProps {
  trip: ViajeDetallado;
  onRefresh: () => void | Promise<void>;
}

export function DriverTripActive({ trip, onRefresh }: DriverTripActiveProps) {
  const {
    loading,
    error,
    pesoEntrada,
    setPesoEntrada,
    pesoSalida,
    setPesoSalida,
    selectedFile,
    previewUrl,
    uploadProgress,
    fileInputRef,
    coords,
    gpsError,
    isTracking,
    startTracking,
    showInAppMap,
    setShowInAppMap,
    routeQuote,
    destLat,
    destLng,
    handleOpenGoogleMaps,
    handleStartTrip,
    handlePhotoChange,
    handleClearPhoto,
    handleRegisterWeighing,
    handleConfirmDelivery,
    pesoEntradaDbTon,
    pesoSalidaDbTon,
    pesoNetoDbTon,
  } = useDriverTripActions({ trip, onRefresh });

  const getTopBarColor = () => {
    switch (trip.estado) {
      case 'PENDIENTE':
        return 'bg-amber-500';
      case 'EN_CAMINO':
        return 'bg-indigo-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 max-w-md w-full mx-auto relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${getTopBarColor()}`} />

      {/* Información del viaje y stepper de estado */}
      <TripInfoCard trip={trip} routeQuote={routeQuote} />

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-normal">{error}</p>
        </div>
      )}

      {/* Panel de GPS y Navegación en Google Maps */}
      <DriverGpsPanel
        isTracking={isTracking}
        coords={coords}
        gpsError={gpsError}
        startTracking={startTracking}
        showInAppMap={showInAppMap}
        setShowInAppMap={setShowInAppMap}
        handleOpenGoogleMaps={handleOpenGoogleMaps}
        destLat={destLat}
        destLng={destLng}
        destino={trip.destino}
        placa={trip.placa}
        routeCoordinates={routeQuote?.routeCoordinates}
      />

      {/* Flujo por cada estado del viaje */}
      {trip.estado === 'PENDIENTE' && (
        <div className="space-y-3.5">
          <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[11px] text-slate-400 leading-normal">
            ℹ️ **Indicaciones de Salida**: Revisa la ruta en Google Maps arriba. Una vez que tu volquete esté cargado con el agregado correspondiente en la cantera y listo para partir, presiona el botón de abajo para notificar al centro de control.
          </div>

          <button
            onClick={() => void handleStartTrip()}
            disabled={loading}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-600/35 text-slate-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-[color,background-color,border-color,opacity,transform,box-shadow] active:scale-95 shadow-md shadow-amber-500/5 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : <Truck className="h-4 w-4" />}
            <span>INICIAR VIAJE (SALIDA)</span>
          </button>
        </div>
      )}

      {trip.estado === 'EN_CAMINO' && (
        <WeighingForm
          pesoEntrada={pesoEntrada}
          pesoSalida={pesoSalida}
          onPesoEntradaChange={setPesoEntrada}
          onPesoSalidaChange={setPesoSalida}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          fileInputRef={fileInputRef}
          onPhotoChange={handlePhotoChange}
          onClearPhoto={handleClearPhoto}
          onSubmit={(e) => void handleRegisterWeighing(e)}
          loading={loading}
          uploadProgress={uploadProgress}
        />
      )}

      {trip.estado === 'EN_BALANZA' && (
        <DeliveryConfirmationPanel
          pesoEntradaDbTon={pesoEntradaDbTon}
          pesoSalidaDbTon={pesoSalidaDbTon}
          pesoNetoDbTon={pesoNetoDbTon}
          ticketBalanzaUrl={trip.ticketBalanzaUrl}
          loading={loading}
          onConfirmDelivery={() => void handleConfirmDelivery()}
        />
      )}
    </div>
  );
}

export default DriverTripActive;
