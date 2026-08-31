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
  estimatedKmFallback: number;
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
  isApiCalculated: boolean;
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
    estimatedKmFallback: 8.5,
  },
  {
    id: 'chaupimarca',
    name: 'Chaupimarca (Centro Histórico)',
    district: 'Chaupimarca',
    lat: -10.6865,
    lng: -76.2572,
    estimatedKmFallback: 5.2,
  },
  {
    id: 'simon-bolivar',
    name: 'Simón Bolívar (Rancas)',
    district: 'Simón Bolívar',
    lat: -10.718,
    lng: -76.315,
    estimatedKmFallback: 9.8,
  },
  {
    id: 'tinyahuarco',
    name: 'Tinyahuarco Pueblo',
    district: 'Tinyahuarco',
    lat: -10.749,
    lng: -76.274,
    estimatedKmFallback: 6.0,
  },
  {
    id: 'colquijirca',
    name: 'Colquijirca',
    district: 'Tinyahuarco',
    lat: -10.768,
    lng: -76.265,
    estimatedKmFallback: 8.4,
  },
  {
    id: 'villa-pasco',
    name: 'Villa Pasco',
    district: 'Tinyahuarco',
    lat: -10.73,
    lng: -76.26,
    estimatedKmFallback: 4.5,
  },
  {
    id: 'huariaca',
    name: 'Huariaca (Valle)',
    district: 'Huariaca',
    lat: -10.435,
    lng: -76.195,
    estimatedKmFallback: 38.0,
  },
  {
    id: 'ninacaca',
    name: 'Ninacaca',
    district: 'Ninacaca',
    lat: -10.852,
    lng: -76.115,
    estimatedKmFallback: 28.5,
  },
  {
    id: 'carhuamayo',
    name: 'Carhuamayo',
    district: 'Carhuamayo',
    lat: -10.916,
    lng: -76.042,
    estimatedKmFallback: 36.0,
  },
  {
    id: 'paucartambo',
    name: 'Paucartambo (Valle Agrícola)',
    district: 'Paucartambo',
    lat: -10.771,
    lng: -75.815,
    estimatedKmFallback: 72.0,
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

const routeCache = new Map<string, { distanceKm: number; durationMinutes: number }>();

export const freightService = {
  /**
   * Calcula la ruta por carretera mediante la API OSRM
   */
  async calculateRouteDistance(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    fallbackKm: number
  ): Promise<{ distanceKm: number; durationMinutes: number; isApiCalculated: boolean }> {
    const cacheKey = `${fromLat.toFixed(4)},${fromLng.toFixed(4)}_${toLat.toFixed(4)},${toLng.toFixed(4)}`;
    if (routeCache.has(cacheKey)) {
      const cached = routeCache.get(cacheKey)!;
      return { ...cached, isApiCalculated: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // OSRM Driving Public API (coordinates in order: lng,lat)
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = Number((route.distance / 1000).toFixed(1));
          // En altitud y volquetes cargados, la velocidad promedio es ~35-40 km/h
          const durationMinutes = Math.round((distanceKm / 35) * 60) + 15; // +15 min carguío/pesaje

          const result = { distanceKm, durationMinutes };
          routeCache.set(cacheKey, result);
          return { ...result, isApiCalculated: true };
        }
      }
    } catch (err) {
      console.warn('API OSRM de rutas no disponible, usando cálculo logístico estimado:', err);
    }

    // Fallback logístico basado en distancias reales de la zona de Pasco
    const distanceKm = fallbackKm;
    const durationMinutes = Math.round((distanceKm / 35) * 60) + 15;
    return { distanceKm, durationMinutes, isApiCalculated: false };
  },

  /**
   * Calcula la cotización completa de material + flete
   */
  async calculateFreightQuote(params: {
    material: string;
    volumenM3: number;
    destinationName: string;
    destinationLat?: number;
    destinationLng?: number;
    fallbackKm?: number;
  }): Promise<RouteCalculationResult> {
    const { material, volumenM3, destinationName } = params;
    const quarry = DEFAULT_QUARRY;

    // Buscar si coincide con algún preset
    const preset = PASCO_DESTINATION_PRESETS.find(
      (p) =>
        p.name.toLowerCase().includes(destinationName.toLowerCase()) ||
        destinationName.toLowerCase().includes(p.district.toLowerCase())
    );

    const targetLat = params.destinationLat ?? preset?.lat ?? -10.6865;
    const targetLng = params.destinationLng ?? preset?.lng ?? -76.2572;
    const fallbackKm = params.fallbackKm ?? preset?.estimatedKmFallback ?? 10.0;

    const { distanceKm, durationMinutes, isApiCalculated } = await this.calculateRouteDistance(
      quarry.lat,
      quarry.lng,
      targetLat,
      targetLng,
      fallbackKm
    );

    const unitPrice = MATERIAL_PRICES_PER_M3[material] || 45.0;
    const materialTotal = Number((unitPrice * Math.max(1, volumenM3)).toFixed(2));

    // Estructura de Flete Logístico Minero / Altoandino:
    // 1. Tarifa base fija (salida de cantera + tolva): S/ 90.00
    // 2. Costo por km recorrido ajustado al volumen (camión volquete 15m3 aprox): S/ 2.60 por km por cada 10m3
    const freightBase = 90.0;
    const loadFactor = Math.max(1, volumenM3 / 10);
    const freightDistanceCost = Number((distanceKm * 2.6 * loadFactor).toFixed(2));
    const freightTotal = Number((freightBase + freightDistanceCost).toFixed(2));
    const grandTotal = Number((materialTotal + freightTotal).toFixed(2));

    return {
      quarry,
      destinationName: destinationName.trim() || preset?.name || 'Obra en Cerro de Pasco',
      distanceKm,
      durationMinutes,
      materialPricePerM3: unitPrice,
      materialTotal,
      freightBase,
      freightDistanceCost,
      freightTotal,
      grandTotal,
      isApiCalculated,
    };
  },
};
