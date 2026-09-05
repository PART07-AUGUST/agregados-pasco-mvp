import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle, Layers } from 'lucide-react';
import { loadGoogleMaps } from '../services/googleMapsLoader';
import type { RouteCoordinate } from '../services/graphhopperService';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'quarry' | 'destination' | 'driver';
}

interface GoogleMapViewProps {
  origin?: { lat: number; lng: number; title?: string };
  destination?: { lat: number; lng: number; title?: string };
  driverLocation?: { lat: number; lng: number; title?: string };
  routeCoordinates?: RouteCoordinate[];
  height?: string;
  className?: string;
}

export function GoogleMapView({
  origin,
  destination,
  driverLocation,
  routeCoordinates,
  height = '350px',
  className = '',
}: GoogleMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  const initialCenterRef = useRef({ lat: origin?.lat ?? -10.6865, lng: origin?.lng ?? -76.2572 });

  // Inicializar Google Maps una sola vez
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const maps = await loadGoogleMaps();
        if (!isMounted || !mapContainerRef.current) return;

        const map = new maps.Map(mapContainerRef.current, {
          center: initialCenterRef.current,
          zoom: 13,
          maxZoom: 16,
          mapTypeId: maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Error inicializando Google Maps:', err);
        const errorMsg = err instanceof Error ? err.message : 'No se pudo cargar Google Maps.';
        setLoadError(errorMsg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Actualizar marcadores y polilínea cuando cambian las coordenadas
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof window.google === 'undefined' || !window.google.maps) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Limpiar polilínea anterior
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    // Marcador de Cantera (Origen)
    if (origin) {
      const originPos = { lat: origin.lat, lng: origin.lng };
      bounds.extend(originPos);
      hasPoints = true;

      const originMarker = new window.google.maps.Marker({
        position: originPos,
        map,
        title: origin.title || 'Cantera de Agregados',
        label: {
          text: '🏭',
          fontSize: '18px',
        },
      });
      markersRef.current.push(originMarker);
    }

    // Marcador de Destino (Obra)
    if (destination) {
      const destPos = { lat: destination.lat, lng: destination.lng };
      bounds.extend(destPos);
      hasPoints = true;

      const destMarker = new window.google.maps.Marker({
        position: destPos,
        map,
        title: destination.title || 'Punto de Entrega',
        label: {
          text: '📍',
          fontSize: '18px',
        },
      });
      markersRef.current.push(destMarker);
    }

    // Marcador de Conductor en Vivo
    if (driverLocation) {
      const driverPos = { lat: driverLocation.lat, lng: driverLocation.lng };
      bounds.extend(driverPos);
      hasPoints = true;

      const driverMarker = new window.google.maps.Marker({
        position: driverPos,
        map,
        title: driverLocation.title || 'Volquete en ruta',
        label: {
          text: '🚛',
          fontSize: '20px',
        },
      });
      markersRef.current.push(driverMarker);
    }

    // Dibujar ruta calculada por GraphHopper
    if (routeCoordinates && routeCoordinates.length > 1) {
      const path = routeCoordinates.map((c) => ({ lat: c.lat, lng: c.lng }));
      path.forEach((pt) => bounds.extend(pt));
      hasPoints = true;

      const polyline = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#f59e0b', // Ámbar de transporte pesado
        strokeOpacity: 0.9,
        strokeWeight: 5,
      });

      polyline.setMap(map);
      polylineRef.current = polyline;
    }

    if (hasPoints) {
      map.fitBounds(bounds);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [origin, destination, driverLocation, routeCoordinates]);

  // Alternar vista Satelital / Callejera
  const toggleMapType = () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const nextType = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
    mapInstanceRef.current.setMapTypeId(
      nextType === 'hybrid' ? window.google.maps.MapTypeId.HYBRID : window.google.maps.MapTypeId.ROADMAP
    );
    setMapType(nextType);
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 shadow-inner bg-slate-100 ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 z-10 backdrop-blur-xs">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-600">Cargando Google Maps...</p>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-amber-50/95 text-center z-10">
          <AlertTriangle className="w-8 h-8 text-amber-600 mb-2" />
          <p className="text-sm font-semibold text-slate-800 mb-1">Mapa de Google temporalmente no disponible</p>
          <p className="text-xs text-slate-600 max-w-sm mb-3">{loadError}</p>
          <div className="text-[11px] text-amber-800 bg-amber-100/70 px-3 py-1.5 rounded-lg border border-amber-200">
            Verifica que <code className="font-mono font-bold">VITE_GOOGLE_MAPS_API_KEY</code> esté configurada en tu <code className="font-mono">.env.local</code> con la API de Maps JavaScript habilitada.
          </div>
        </div>
      )}

      {/* Contenedor DOM para el mapa */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Botón flotante para alternar satélite / mapa */}
      {!isLoading && !loadError && (
        <div className="absolute top-3 right-3 z-5 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMapType}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg shadow-md border border-slate-200 text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{mapType === 'roadmap' ? 'Ver Satélite' : 'Ver Calles'}</span>
          </button>
        </div>
      )}

      {/* Leyenda de Pasco */}
      {!isLoading && !loadError && (
        <div className="absolute bottom-2 left-2 z-5 flex items-center gap-3 px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-md shadow-xs text-[10px] text-slate-600 border border-slate-200">
          <span className="flex items-center gap-1">
            <span>🏭</span> Cantera Quiulacocha
          </span>
          <span className="flex items-center gap-1">
            <span>📍</span> Obra Destino
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-1 bg-amber-500 rounded-xs" /> Ruta GraphHopper
          </span>
        </div>
      )}
    </div>
  );
}
