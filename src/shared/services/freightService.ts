import { graphhopperService, type RouteCoordinate, type GraphHopperRouteResult } from './graphhopperService';

export interface QuarryLocation {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  altitudeMsnm: number;
  description: string;
}

export interface DestinationPreset {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
}

export interface MaterialQuoteItem {
  material: string;
  volumenM3: number;
  unitPrice: number;
  subtotal: number;
  trips: number;
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
  materialsBreakdown?: MaterialQuoteItem[];
  totalVolumenM3?: number;
  totalTrips?: number;
}

// Canteras oficiales de agregados y piedra clasificada en la región Pasco / Centro
export const AVAILABLE_QUARRIES: QuarryLocation[] = [
  {
    id: 'quiulacocha',
    name: 'Cantera Quiulacocha',
    district: 'Cerro de Pasco',
    lat: -10.7025,
    lng: -76.2625,
    altitudeMsnm: 4380,
    description: 'Cantera principal de agregados clasificados, arena fina/gruesa y piedra chancada',
  },
  {
    id: 'smelter-tinyahuarco',
    name: 'Cantera Smelter (Tinyahuarco)',
    district: 'Tinyahuarco',
    lat: -10.7550,
    lng: -76.2680,
    altitudeMsnm: 4100,
    description: 'Especializada en afirmado clasificado, base granular y roca chancada',
  },
  {
    id: 'valle-huariaca',
    name: 'Cantera Río Huallaga (Huariaca)',
    district: 'Huariaca',
    lat: -10.4420,
    lng: -76.1980,
    altitudeMsnm: 2940,
    description: 'Agregados fluviales de río, arena lavada y confitillo para concreto',
  },
  {
    id: 'bellavista-paucartambo',
    name: 'Cantera Bellavista (Paucartambo)',
    district: 'Paucartambo',
    lat: -10.7750,
    lng: -75.8200,
    altitudeMsnm: 2880,
    description: 'Material granular, afirmado y piedra seleccionada para obras viales',
  },
  {
    id: 'vinchos-pallanchacra',
    name: 'Cantera Vinchos (Pallanchacra)',
    district: 'Pallanchacra',
    lat: -10.5850,
    lng: -76.2300,
    altitudeMsnm: 3150,
    description: 'Agregado chancado y piedra para cimientos y muros de contención',
  },
];

// Cantera central por defecto en Pasco
export const DEFAULT_QUARRY: QuarryLocation = AVAILABLE_QUARRIES[0];

// Zonas y destinos frecuentes en Cerro de Pasco y provincias conectadas
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
  {
    id: 'tarma',
    name: 'Tarma (La Perla de los Andes)',
    district: 'Tarma',
    lat: -11.4190,
    lng: -75.6890,
  },
  {
    id: 'junin',
    name: 'Junín (Meseta de Bombón)',
    district: 'Junín',
    lat: -11.1580,
    lng: -75.9920,
  },
  {
    id: 'la-oroya',
    name: 'La Oroya',
    district: 'Yauli',
    lat: -11.5200,
    lng: -75.9000,
  },
  {
    id: 'huanuco',
    name: 'Huánuco Ciudad',
    district: 'Huánuco',
    lat: -9.9306,
    lng: -76.2422,
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
   * Geocodifica una dirección u obra en tiempo real.
   * Prioriza Google Maps Geocoder en el navegador; si no está listo,
   * evalúa coincidencias con presets y OpenStreetMap Nominatim.
   */
  async geocodeAddress(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
    if (!query || query.trim().length < 2) return null;
    const cleanQuery = query.trim();

    // 1. Intento con Google Maps Geocoder en vivo (si el SDK está en window)
    if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const googleResult = await new Promise<{ lat: number; lng: number; displayName: string } | null>((resolve) => {
          geocoder.geocode(
            {
              address: cleanQuery,
              componentRestrictions: { country: 'PE' },
            },
            (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const loc = results[0].geometry.location;
                resolve({
                  lat: loc.lat(),
                  lng: loc.lng(),
                  displayName: results[0].formatted_address,
                });
              } else {
                resolve(null);
              }
            }
          );
        });

        if (googleResult) {
          return googleResult;
        }
      } catch {
        // Fallback a presets
      }
    }

    // 2. Coincidencia local con presets y destinos conocidos de la sierra central
    const queryLower = cleanQuery.toLowerCase();
    const matchedPreset = PASCO_DESTINATION_PRESETS.find(
      (p) =>
        p.name.toLowerCase().includes(queryLower) ||
        queryLower.includes(p.name.toLowerCase().split(' ')[0]) ||
        p.district.toLowerCase().includes(queryLower)
    );

    if (matchedPreset) {
      return {
        lat: matchedPreset.lat,
        lng: matchedPreset.lng,
        displayName: matchedPreset.name,
      };
    }

    // 3. Fallback de Nominatim (OpenStreetMap) buscando en Perú
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery + ', Peru')}&format=json&limit=1`;
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
    return graphhopperService.getRoute(fromLat, fromLng, toLat, toLng, 'car');
  },

  /**
   * Calcula la cotización completa de material + flete en base a distancias reales de GraphHopper
   * desde la cantera seleccionada.
   */
  async calculateFreightQuote(params: {
    material?: string;
    volumenM3?: number;
    materials?: Array<{ material: string; volumenM3: number }>;
    destinationName: string;
    destinationLat?: number;
    destinationLng?: number;
    quarryId?: string;
    quarry?: QuarryLocation;
  }): Promise<RouteCalculationResult> {
    const { destinationName } = params;
    if (!destinationName.trim()) {
      throw new Error('El destino es obligatorio para calcular una ruta real.');
    }

    // Normalizar lista de materiales
    const materialsList: Array<{ material: string; volumenM3: number }> =
      params.materials && params.materials.length > 0
        ? params.materials
        : [{ material: params.material || 'ARENA_FINA', volumenM3: params.volumenM3 || 15 }];

    // Seleccionar cantera origen (por ID, objeto o por defecto Quiulacocha)
    const quarry =
      params.quarry ||
      AVAILABLE_QUARRIES.find((q) => q.id === params.quarryId) ||
      DEFAULT_QUARRY;

    // Buscar si coincide con algún preset
    const preset = PASCO_DESTINATION_PRESETS.find(
      (p) =>
        p.name.toLowerCase().includes(destinationName.toLowerCase()) ||
        destinationName.toLowerCase().includes(p.district.toLowerCase())
    );

    let targetLat = params.destinationLat ?? preset?.lat;
    let targetLng = params.destinationLng ?? preset?.lng;

    // Si no tenemos coordenadas directas, geocodificar la dirección ingresada
    if (targetLat === undefined || targetLng === undefined) {
      const geo = await this.geocodeAddress(destinationName);
      if (!geo) {
        throw new Error('No se encontró una ubicación en el mapa para el destino ingresado. Intenta seleccionar una zona o marca el punto.');
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

    // Calcular desglose por cada material
    // Regla logística: Los agregados no se mezclan en la misma tolva;
    // cada tipo de material requiere sus propios viajes de volquete (capacidad 15 m³ por viaje).
    let totalVolumenM3 = 0;
    let materialTotal = 0;
    let totalTrips = 0;

    const materialsBreakdown: MaterialQuoteItem[] = materialsList.map((item) => {
      const vol = Math.max(1, item.volumenM3);
      const unitPrice = MATERIAL_PRICES_PER_M3[item.material] || 45.0;
      const subtotal = Number((unitPrice * vol).toFixed(2));
      // Cada material ocupa tolvas completas o parciales (máximo 15 m³ por viaje de volquete)
      const trips = Math.max(1, Math.ceil(vol / 15));

      totalVolumenM3 += vol;
      materialTotal += subtotal;
      totalTrips += trips;

      return {
        material: item.material,
        volumenM3: vol,
        unitPrice,
        subtotal,
        trips,
      };
    });

    // Estructura de Flete Logístico Minero / Altoandino:
    // 1. Tarifa base fija por viaje de volquete (salida de tolva y cargador frontal en cantera): S/ 90.00 x cantidad de viajes
    // 2. Costo por km recorrido ajustado al volumen (S/ 2.60 por km por cada 10m³ transportados)
    const freightBase = Number((90.0 * totalTrips).toFixed(2));
    const loadFactor = Math.max(1, totalVolumenM3 / 10);
    const freightDistanceCost = Number((routeResult.distanceKm * 2.6 * loadFactor).toFixed(2));
    const freightTotal = Number((freightBase + freightDistanceCost).toFixed(2));
    const grandTotal = Number((materialTotal + freightTotal).toFixed(2));
    const avgPricePerM3 = totalVolumenM3 > 0 ? Number((materialTotal / totalVolumenM3).toFixed(2)) : 45.0;

    return {
      quarry,
      destinationName: destinationName.trim() || preset?.name || 'Obra en Cerro de Pasco',
      distanceKm: routeResult.distanceKm,
      durationMinutes: routeResult.durationMinutes,
      materialPricePerM3: avgPricePerM3,
      materialTotal: Number(materialTotal.toFixed(2)),
      freightBase,
      freightDistanceCost,
      freightTotal,
      grandTotal,
      ascendMeters: routeResult.ascendMeters,
      descendMeters: routeResult.descendMeters,
      routeCoordinates: routeResult.coordinates,
      instructions: routeResult.instructions,
      materialsBreakdown,
      totalVolumenM3,
      totalTrips,
    };
  },
};

