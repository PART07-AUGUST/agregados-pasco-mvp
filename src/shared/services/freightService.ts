import { graphhopperService, type RouteCoordinate, type GraphHopperRouteResult } from './graphhopperService';

export interface QuarryLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export interface DestinationPreset {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
}

export interface RouteCalculationResult {
  quarry: QuarryLocation;
  destinationName: string;
  distanceKm: number;
  durationMinutes: number;
  materialPricePerM3: number;
  materialTotal: number;
  freightBase: number;
  freightDistanceCost: number;
  freightTotal: number;
  grandTotal: number;
  ascendMeters?: number;
  descendMeters?: number;
  routeCoordinates?: RouteCoordinate[];
  instructions?: string[];
}

// Cantera central por defecto en Pasco
export const DEFAULT_QUARRY: QuarryLocation = {
  id: 'quiulacocha',
  name: 'Cantera Quiulacocha - Pasco',
  lat: -10.7025,
  lng: -76.2625,
  description: 'Cantera principal de agregados y piedra clasificada (Cerro de Pasco)',
};

// Zonas y destinos frecuentes en Cerro de Pasco
export const PASCO_DESTINATION_PRESETS: DestinationPreset[] = [
  {
    id: 'yanacancha',
    name: 'Yanacancha (San Juan)',
    district: 'Yanacancha',
    lat: -10.6692,
    lng: -76.2514,
  },
  {
    id: 'chaupimarca',
    name: 'Chaupimarca (Centro Histórico)',
    district: 'Chaupimarca',
    lat: -10.6865,
    lng: -76.2572,
  },
  {
    id: 'simon-bolivar',
    name: 'Simón Bolívar (Rancas)',
    district: 'Simón Bolívar',
    lat: -10.718,
    lng: -76.315,
  },
  {
    id: 'tinyahuarco',
    name: 'Tinyahuarco Pueblo',
    district: 'Tinyahuarco',
    lat: -10.749,
    lng: -76.274,
  },
  {
    id: 'colquijirca',
    name: 'Colquijirca',
    district: 'Tinyahuarco',
    lat: -10.768,
    lng: -76.265,
  },
  {
    id: 'villa-pasco',
    name: 'Villa Pasco',
    district: 'Tinyahuarco',
    lat: -10.73,
    lng: -76.26,
  },
  {
    id: 'huariaca',
    name: 'Huariaca (Valle)',
    district: 'Huariaca',
    lat: -10.435,
    lng: -76.195,
  },
  {
    id: 'ninacaca',
    name: 'Ninacaca',
    district: 'Ninacaca',
    lat: -10.852,
    lng: -76.115,
  },
  {
    id: 'carhuamayo',
    name: 'Carhuamayo',
    district: 'Carhuamayo',
    lat: -10.916,
    lng: -76.042,
  },
  {
    id: 'paucartambo',
    name: 'Paucartambo (Valle Agrícola)',
    district: 'Paucartambo',
    lat: -10.771,
    lng: -75.815,
  },
];

// Precios unitarios referenciales por m3 de agregado puesto en cantera (PEN)
export const MATERIAL_PRICES_PER_M3: Record<string, number> = {
  ARENA_FINA: 48.0,
  ARENA_GRUESA: 45.0,
  PIEDRA_1_2: 52.0,
  PIEDRA_3_4: 50.0,
  AFIRMADO: 38.0,
  TIERRA_CHACRA: 35.0,
};

export const freightService = {
  /**
   * Geocodifica una dirección en Pasco mediante OpenStreetMap Nominatim.
   */
  async geocodeAddress(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
    if (!query || query.trim().length < 3) return null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim() + ', Pasco, Peru')}&format=json&limit=1`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AgregadosPascoMVP/1.0' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            displayName: data[0].display_name,
          };
        }
      }
    } catch {
      // Ignorar fallo de geocodificación
    }
    return null;
  },

  /**
   * Calcula la ruta por carretera en tiempo real mediante GraphHopper Routing API
   * (con soporte de perfil de carga pesada y datos de elevación).
   */
  async calculateRouteDistance(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<GraphHopperRouteResult> {
    return graphhopperService.getRoute(fromLat, fromLng, toLat, toLng, 'truck');
  },

  /**
   * Calcula la cotización completa de material + flete en base a distancias reales de GraphHopper
   */
  async calculateFreightQuote(params: {
    material: string;
    volumenM3: number;
    destinationName: string;
    destinationLat?: number;
    destinationLng?: number;
  }): Promise<RouteCalculationResult> {
    const { material, volumenM3, destinationName } = params;
    if (!destinationName.trim()) {
      throw new Error('El destino es obligatorio para calcular una ruta real.');
    }
    const quarry = DEFAULT_QUARRY;

    // Buscar si coincide con algún preset
    const preset = PASCO_DESTINATION_PRESETS.find(
      (p) =>
        p.name.toLowerCase().includes(destinationName.toLowerCase()) ||
        destinationName.toLowerCase().includes(p.district.toLowerCase())
    );

    let targetLat = params.destinationLat ?? preset?.lat;
    let targetLng = params.destinationLng ?? preset?.lng;

    // Si no coincide con un destino conocido, obtener coordenadas reales en vivo.
    if (targetLat === undefined || targetLng === undefined) {
      const geo = await this.geocodeAddress(destinationName);
      if (!geo) {
        throw new Error('No se encontró una ubicación real para el destino indicado.');
      }
      targetLat = geo.lat;
      targetLng = geo.lng;
    }

    const routeResult = await this.calculateRouteDistance(
      quarry.lat,
      quarry.lng,
      targetLat,
      targetLng
    );

    const unitPrice = MATERIAL_PRICES_PER_M3[material] || 45.0;
    const materialTotal = Number((unitPrice * Math.max(1, volumenM3)).toFixed(2));

    // Estructura de Flete Logístico Minero / Altoandino:
    // 1. Tarifa base fija (salida de cantera + tolva): S/ 90.00
    // 2. Costo por km recorrido ajustado al volumen (camión volquete 15m3 aprox): S/ 2.60 por km por cada 10m3
    const freightBase = 90.0;
    const loadFactor = Math.max(1, volumenM3 / 10);
    const freightDistanceCost = Number((routeResult.distanceKm * 2.6 * loadFactor).toFixed(2));
    const freightTotal = Number((freightBase + freightDistanceCost).toFixed(2));
    const grandTotal = Number((materialTotal + freightTotal).toFixed(2));

    return {
      quarry,
      destinationName: destinationName.trim() || preset?.name || 'Obra en Cerro de Pasco',
      distanceKm: routeResult.distanceKm,
      durationMinutes: routeResult.durationMinutes,
      materialPricePerM3: unitPrice,
      materialTotal,
      freightBase,
      freightDistanceCost,
      freightTotal,
      grandTotal,
      ascendMeters: routeResult.ascendMeters,
      descendMeters: routeResult.descendMeters,
      routeCoordinates: routeResult.coordinates,
      instructions: routeResult.instructions,
    };
  },
};

