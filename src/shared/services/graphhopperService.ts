export interface RouteCoordinate {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface GraphHopperRouteResult {
  distanceKm: number;
  durationMinutes: number;
  ascendMeters: number;
  descendMeters: number;
  coordinates: RouteCoordinate[];
  instructions: string[];
}

interface RawPath {
  distance: number;
  time: number;
  ascend?: number;
  descend?: number;
  points?: {
    coordinates: [number, number, number?][];
  };
  instructions?: {
    text: string;
  }[];
}

interface GraphHopperResponse {
  paths?: RawPath[];
  message?: string;
}

const memoryCache = new Map<string, GraphHopperRouteResult>();

/**
 * Servicio cliente para interactuar con la API de GraphHopper Routing.
 * Implementa patrón Adapter con caché en memoria y resiliencia para transporte pesado en Pasco.
 */
export const graphhopperService = {
  /**
   * Obtiene la ruta óptima entre dos coordenadas (origen y destino).
   */
  async getRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    preferredProfile: 'truck' | 'car' = 'truck'
  ): Promise<GraphHopperRouteResult> {
    const cacheKey = `${fromLat.toFixed(4)},${fromLng.toFixed(4)}->${toLat.toFixed(4)},${toLng.toFixed(4)}_${preferredProfile}`;
    if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey)!;
    }

    const apiKey = import.meta.env.VITE_GRAPHHOPPER_API_KEY;

    if (!apiKey || apiKey === 'your-graphhopper-api-key-here') {
      console.warn('VITE_GRAPHHOPPER_API_KEY no está configurada o es de ejemplo. Usando fallback de navegación.');
      return this.getFallbackRoute(fromLat, fromLng, toLat, toLng);
    }

    try {
      return await this.fetchGraphHopper(fromLat, fromLng, toLat, toLng, preferredProfile, apiKey, cacheKey);
    } catch (err: unknown) {
      // Si falla con perfil 'truck' (ej. restricción de cuenta free), intentamos con 'car'
      if (preferredProfile === 'truck') {
        try {
          console.warn('Perfil truck no disponible en la cuenta o falló. Intentando con perfil car...');
          return await this.fetchGraphHopper(fromLat, fromLng, toLat, toLng, 'car', apiKey, cacheKey);
        } catch (carErr: unknown) {
          console.error('Error en GraphHopper car:', carErr);
        }
      }

      console.warn('Fallo al consultar GraphHopper API, activando fallback de contingencia:', err);
      return this.getFallbackRoute(fromLat, fromLng, toLat, toLng);
    }
  },

  async fetchGraphHopper(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    profile: string,
    apiKey: string,
    cacheKey: string
  ): Promise<GraphHopperRouteResult> {
    const url = new URL('https://graphhopper.com/api/1/route');
    url.searchParams.append('point', `${fromLat},${fromLng}`);
    url.searchParams.append('point', `${toLat},${toLng}`);
    url.searchParams.append('profile', profile);
    url.searchParams.append('locale', 'es');
    url.searchParams.append('elevation', 'true');
    url.searchParams.append('points_encoded', 'false');
    url.searchParams.append('key', apiKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody: GraphHopperResponse = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `GraphHopper respondió con estado HTTP ${response.status}`);
    }

    const data: GraphHopperResponse = await response.json();
    if (!data.paths || data.paths.length === 0) {
      throw new Error('GraphHopper no encontró ninguna ruta válida entre estos dos puntos.');
    }

    const path = data.paths[0];
    const distanceKm = Number((path.distance / 1000).toFixed(1));

    // Duración: En altitud andina (Cerro de Pasco 4380m) los volquetes pesados cargados
    // suelen promediar entre 30 y 40 km/h en pendientes
    const durationMinutes = Math.max(
      Math.round((path.time / 1000 / 60) * 1.15), // Ajuste por curvas de montaña
      Math.round((distanceKm / 35) * 60) + 10
    );

    const coordinates: RouteCoordinate[] = (path.points?.coordinates || []).map((coord) => ({
      lng: coord[0],
      lat: coord[1],
      elevation: coord[2],
    }));

    const instructions = (path.instructions || []).map((inst) => inst.text);

    const result: GraphHopperRouteResult = {
      distanceKm,
      durationMinutes,
      ascendMeters: Math.round(path.ascend || 0),
      descendMeters: Math.round(path.descend || 0),
      coordinates,
      instructions,
    };

    memoryCache.set(cacheKey, result);
    return result;
  },

  /**
   * Fallback de emergencia cuando no hay conectividad o se excede la cuota.
   * Utiliza el cálculo de distancia ortodrómica (Haversine) con factor de tortuosidad vial de montaña (1.35x).
   */
  getFallbackRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): GraphHopperRouteResult {
    const r = 6371; // Radio de la Tierra en km
    const dLat = ((toLat - fromLat) * Math.PI) / 180;
    const dLng = ((toLng - fromLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((fromLat * Math.PI) / 180) *
        Math.cos((toLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDistanceKm = r * c;

    // En los Andes la distancia por carretera es ~1.35x a 1.45x la distancia en línea recta
    const distanceKm = Number((straightDistanceKm * 1.35).toFixed(1));
    const durationMinutes = Math.round((distanceKm / 35) * 60) + 15;

    return {
      distanceKm: Math.max(1, distanceKm),
      durationMinutes: Math.max(10, durationMinutes),
      ascendMeters: 120,
      descendMeters: 80,
      coordinates: [
        { lat: fromLat, lng: fromLng },
        { lat: toLat, lng: toLng },
      ],
      instructions: ['Ruta estimada hacia el destino por vía principal de Pasco'],
    };
  },
};
