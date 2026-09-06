import { Radio, Compass, Navigation } from 'lucide-react';
import { GoogleMapView } from '../../../../shared/components/GoogleMapView';
import { DEFAULT_QUARRY } from '../../../../shared/services/freightService';

interface DriverGpsPanelProps {
  isTracking: boolean;
  coords: { latitude: number; longitude: number; accuracy: number } | null;
  gpsError: Error | GeolocationPositionError | null;
  startTracking: () => void;
  showInAppMap: boolean;
  setShowInAppMap: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleOpenGoogleMaps: () => void;
  destLat: number;
  destLng: number;
  destino?: string;
  placa?: string;
  routeCoordinates?: Array<{ lat: number; lng: number }>;
}

export function DriverGpsPanel({
  isTracking,
  coords,
  gpsError,
  startTracking,
  showInAppMap,
  setShowInAppMap,
  handleOpenGoogleMaps,
  destLat,
  destLng,
  destino,
  placa,
  routeCoordinates,
}: DriverGpsPanelProps) {
  return (
    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isTracking ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isTracking ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            GPS de Conductor en Vivo
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {isTracking ? 'Transmitiendo posición' : 'GPS Listo / Inactivo'}
        </span>
      </div>

      {coords ? (
        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 font-mono">
          <div>
            <span className="text-slate-500 block">Coordenadas:</span>
            <span className="text-slate-200 font-bold">
              {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Precisión GPS:</span>
            <span className="text-emerald-400 font-bold">±{Math.round(coords.accuracy)} m</span>
          </div>
        </div>
      ) : gpsError ? (
        <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between">
          <span>⚠️ {gpsError.message || 'Permiso de ubicación denegado o no disponible.'}</span>
          <button
            type="button"
            onClick={startTracking}
            className="px-2 py-1 bg-amber-500 text-slate-950 rounded-md text-[10px] font-bold cursor-pointer"
          >
            Activar GPS
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-xl border border-slate-850">
          <span>{isTracking ? 'Sincronizando satélites GPS...' : 'GPS disponible para navegación'}</span>
          {!isTracking && (
            <button
              type="button"
              onClick={startTracking}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-md text-[10px] font-bold cursor-pointer transition-colors"
            >
              Conectar GPS
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleOpenGoogleMaps}
          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-colors cursor-pointer"
        >
          <Compass className="h-4 w-4" />
          <span>Navegar en App Google Maps</span>
        </button>

        <button
          type="button"
          onClick={() => setShowInAppMap(!showInAppMap)}
          className="w-full py-2.5 px-3 bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-750 transition-colors cursor-pointer"
        >
          <Navigation className="h-3.5 w-3.5 text-amber-500" />
          <span>{showInAppMap ? 'Ocultar Mapa' : 'Ver Mapa en Pantalla'}</span>
        </button>
      </div>

      {showInAppMap && (
        <div className="pt-2">
          <GoogleMapView
            height="220px"
            origin={{ lat: DEFAULT_QUARRY.lat, lng: DEFAULT_QUARRY.lng, title: DEFAULT_QUARRY.name }}
            destination={{ lat: destLat, lng: destLng, title: destino }}
            driverLocation={
              coords
                ? { lat: coords.latitude, lng: coords.longitude, title: `Volquete ${placa}` }
                : undefined
            }
            routeCoordinates={routeCoordinates}
          />
        </div>
      )}
    </div>
  );
}
