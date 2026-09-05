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
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export function GoogleMapView({
  origin,
  destination,
  driverLocation,
  routeCoordinates,
  height = '380px',
  className = '',
  onMapClick,
}: GoogleMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<Array<google.maps.Marker | google.maps.marker.AdvancedMarkerElement>>([]);

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
          maxZoom: 18,
          mapTypeId: maps.MapTypeId.ROADMAP,
          mapId: 'agregados_pasco_map',
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

  // Listener para clic en el mapa (selección interactiva de punto de entrega)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !onMapClick) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onMapClick({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
      }
    });

    return () => {
      listener.remove();
      if (typeof window.google !== 'undefined' && window.google.maps?.event) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [onMapClick]);

  // Actualizar marcadores y polilínea cuando cambian las coordenadas
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof window.google === 'undefined' || !window.google.maps) return;

    // Función creadora con soporte para AdvancedMarkerElement (Google Maps 2024+)
    const createCustomMarker = (
      position: google.maps.LatLngLiteral,
      title: string,
      emoji: string,
      fontSize: string = '20px'
    ) => {
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        const pin = document.createElement('div');
        pin.textContent = emoji;
        pin.style.fontSize = fontSize;
        pin.style.cursor = 'pointer';
        pin.style.userSelect = 'none';
        pin.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))';
        return new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position,
          title,
          content: pin,
        });
      }

      return new window.google.maps.Marker({
        position,
        map,
        title,
        label: {
          text: emoji,
          fontSize,
        },
      });
    };

    // Limpiar marcadores anteriores
    markersRef.current.forEach((marker) => {
      if ('setMap' in marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      } else {
        (marker as google.maps.marker.AdvancedMarkerElement).map = null;
      }
    });
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

      const originMarker = createCustomMarker(
        originPos,
        origin.title || 'Cantera de Agregados',
        '🏭',
        '22px'
      );
      markersRef.current.push(originMarker);
    }

    // Marcador de Destino (Obra)
    if (destination) {
      const destPos = { lat: destination.lat, lng: destination.lng };
      bounds.extend(destPos);
      hasPoints = true;

      const destMarker = createCustomMarker(
        destPos,
        destination.title || 'Punto de Entrega',
        '📍',
        '22px'
      );
      markersRef.current.push(destMarker);
    }

    // Marcador de Conductor en Vivo
    if (driverLocation) {
      const driverPos = { lat: driverLocation.lat, lng: driverLocation.lng };
      bounds.extend(driverPos);
      hasPoints = true;

      const driverMarker = createCustomMarker(
        driverPos,
        driverLocation.title || 'Volquete en ruta',
        '🚛',
        '24px'
      );
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

    let idleListener: google.maps.MapsEventListener | null = null;
    if (hasPoints) {
      map.fitBounds(bounds);
      idleListener = google.maps.event.addListenerOnce(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined && currentZoom > 15) {
          map.setZoom(15);
        }
      });
    }

    return () => {
      if (idleListener) {
        google.maps.event.removeListener(idleListener);
      }
      markersRef.current.forEach((marker) => {
        if ('setMap' in marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        } else {
          (marker as google.maps.marker.AdvancedMarkerElement).map = null;
        }
      });
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [origin, destination, driverLocation, routeCoordinates]);

  const toggleMapType = () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const nextType = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
    mapInstanceRef.current.setMapTypeId(
      nextType === 'hybrid' ? window.google.maps.MapTypeId.HYBRID : window.google.maps.MapTypeId.ROADMAP
    );
    setMapType(nextType);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 shadow-xl bg-slate-950 ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-300">Cargando Google Maps...</p>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900/95 text-center z-10">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-sm font-semibold text-white mb-1">Mapa de Google temporalmente no disponible</p>
          <p className="text-xs text-slate-400 max-w-sm mb-3">{loadError}</p>
          <div className="text-[11px] text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
            Verifica que <code className="font-mono font-bold">VITE_GOOGLE_MAPS_API_KEY</code> esté configurada en tu <code className="font-mono">.env.local</code>.
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-slate-200 hover:text-white rounded-xl shadow-lg border border-slate-800 text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>{mapType === 'roadmap' ? 'Ver Satélite' : 'Ver Calles'}</span>
          </button>
        </div>
      )}

      {/* Leyenda Dinámica */}
      {!isLoading && !loadError && (
        <div className="absolute bottom-2 left-2 z-5 flex flex-wrap items-center gap-2.5 px-3 py-1.5 bg-slate-950/85 backdrop-blur-md rounded-xl shadow-md text-[10px] text-slate-300 border border-slate-800/80">
          <span className="flex items-center gap-1">
            <span>🏭</span> <strong className="text-white">{origin?.title || 'Cantera Origen'}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span>📍</span> <strong className="text-white">{destination?.title || 'Destino'}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-1 bg-amber-500 rounded-xs" /> Ruta GraphHopper
          </span>
        </div>
      )}
    </div>
  );
}
