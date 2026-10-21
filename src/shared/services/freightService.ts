import { graphhopperService, type RouteCoordinate, type GraphHopperRouteResult } from './graphhopperService';
import { MATERIAL_PRICES_PER_M3, type MaterialType } from '../constants/materials';

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
  routeSource: 'graphhopper' | 'aproximada';
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
  {
    id: 'oxapampa',
    name: 'Oxapampa (Capital)',
    district: 'Oxapampa',
    lat: -10.5750,
    lng: -75.4020,
  },
  {
    id: 'villa-rica',
    name: 'Villa Rica',
    district: 'Oxapampa',
    lat: -10.7380,
    lng: -75.2690,
  },
  {
    id: 'yanahuanca',
    name: 'Yanahuanca',
    district: 'Daniel Alcides Carrión',
    lat: -10.4900,
    lng: -76.5140,
  },
  {
    id: 'pozuzo',
    name: 'Pozuzo (Colonia)',
    district: 'Oxapampa',
    lat: -10.0710,
    lng: -75.5520,
  },
  {
    id: 'chontabamba',
    name: 'Chontabamba',
    district: 'Oxapampa',
    lat: -10.6050,
    lng: -75.4420,
  },
];

export { MATERIAL_PRICES_PER_M3 };

const DUMP_TRUCK_CAPACITY_M3 = 15;
const BASE_FEE_PER_TRIP = 90.0;
const COST_PER_KM_PER_10M3 = 2.6;

async function geocodeWithGoogleMaps(
  query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  if (typeof window === 'undefined' || !window.google?.maps?.Geocoder) {
    return null;
  }

  try {
    const geocoder = new window.google.maps.Geocoder();
    return await new Promise<{ lat: number; lng: number; displayName: string } | null>((resolve) => {
      geocoder.geocode(
        {
          address: query,
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
  } catch {
    return null;
  }
}

export interface LocationSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

export function normalizeSearchIntent(query: string): string {
  return query
    .replace(
      /^(obra en|entrega en|construcci[oó]n en|llegando a|camino a|rumbo a|cerca a|cerca de|distrito de|provincia de|ciudad de|sector|aa\.?hh\.?|asociaci[oó]n)\s+/i,
      ''
    )
    .trim();
}

function matchPresetDestination(
  query: string
): { lat: number; lng: number; displayName: string } | null {
  const clean = normalizeSearchIntent(query);
  const queryLower = clean.toLowerCase();
  const matched = PASCO_DESTINATION_PRESETS.find(
    (p) =>
      p.name.toLowerCase().includes(queryLower) ||
      queryLower.includes(p.name.toLowerCase().split(' ')[0]) ||
      p.district.toLowerCase().includes(queryLower)
  );

  if (!matched) return null;

  return {
    lat: matched.lat,
    lng: matched.lng,
    displayName: matched.name,
  };
}

async function geocodeWithPhoton(
  query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const clean = normalizeSearchIntent(query);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(clean + ' Peru')}&lat=-10.68&lon=-76.25&limit=1`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const firstFeature = data?.features?.[0];
      if (firstFeature?.geometry?.coordinates) {
        const [lng, lat] = firstFeature.geometry.coordinates;
        const p = firstFeature.properties || {};
        const name = p.name || clean;
        const state = p.state || 'Pasco';
        return {
          lat: Number(lat),
          lng: Number(lng),
          displayName: `${name}, ${state}, Perú`,
        };
      }
    }
  } catch {
    // Photon fallback failure
  }
  return null;
}

async function geocodeWithNominatim(
  query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Peru')}&format=json&limit=1`;
    const res = await fetch(url, {
      signal: controller.signal,
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
    // Network fallback failure
  }
  return null;
}

export function calculateMaterialsBreakdown(
  materialsList: Array<{ material: string; volumenM3: number }>
): {
  breakdown: MaterialQuoteItem[];
  totalVolumenM3: number;
  materialTotal: number;
  totalTrips: number;
} {
  let totalVolumenM3 = 0;
  let materialTotal = 0;
  let totalTrips = 0;

  const breakdown: MaterialQuoteItem[] = materialsList.map((item) => {
    const vol = Math.max(1, item.volumenM3);
    const unitPrice =
      MATERIAL_PRICES_PER_M3[item.material as MaterialType] ?? 45.0;
    const subtotal = Number((unitPrice * vol).toFixed(2));
    const trips = Math.max(1, Math.ceil(vol / DUMP_TRUCK_CAPACITY_M3));

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

  return { breakdown, totalVolumenM3, materialTotal, totalTrips };
}

export function calculateFreightPricing(
  distanceKm: number,
  totalVolumenM3: number,
  totalTrips: number,
  materialTotal: number
) {
  const freightBase = Number((BASE_FEE_PER_TRIP * totalTrips).toFixed(2));
  const loadFactor = Math.max(1, totalVolumenM3 / 10);
  const freightDistanceCost = Number((distanceKm * COST_PER_KM_PER_10M3 * loadFactor).toFixed(2));
  const freightTotal = Number((freightBase + freightDistanceCost).toFixed(2));
  const grandTotal = Number((materialTotal + freightTotal).toFixed(2));
  const avgPricePerM3 =
    totalVolumenM3 > 0 ? Number((materialTotal / totalVolumenM3).toFixed(2)) : 45.0;

  return {
    freightBase,
    freightDistanceCost,
    freightTotal,
    grandTotal,
    avgPricePerM3,
  };
}

export const freightService = {
  async searchDestinationSuggestions(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.trim().length < 2) return [];
    const clean = query.trim();
    const normalized = normalizeSearchIntent(clean);
    const lower = normalized.toLowerCase();

    const results: LocationSuggestion[] = [];

    const matchedPresets = PASCO_DESTINATION_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.district.toLowerCase().includes(lower) ||
        lower.includes(p.name.toLowerCase().split(' ')[0])
    );

    for (const p of matchedPresets.slice(0, 3)) {
      results.push({
        displayName: `${p.name} (${p.district}, Pasco)`,
        lat: p.lat,
        lng: p.lng,
      });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(normalized + ' Peru')}&lat=-10.68&lon=-76.25&limit=5`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        for (const f of data?.features || []) {
          const coords = f.geometry?.coordinates;
          if (!coords) continue;
          const p = f.properties || {};
          const name = p.name || normalized;
          const parts = [name, p.city || p.district, p.state || 'Pasco', 'Perú'].filter(Boolean);
          const displayName = parts.join(', ');

          const isDuplicate = results.some(
            (r) => Math.abs(r.lat - coords[1]) < 0.005 && Math.abs(r.lng - coords[0]) < 0.005
          );

          if (!isDuplicate) {
            results.push({
              displayName,
              lat: coords[1],
              lng: coords[0],
            });
          }
        }
      }
    } catch {
      // Ignorar fallo de sugerencias remotas
    }

    return results.slice(0, 5);
  },

  async geocodeAddress(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
    if (!query || query.trim().length < 2) return null;
    const cleanQuery = query.trim();

    const presetResult = matchPresetDestination(cleanQuery);
    if (presetResult) return presetResult;

    const googleResult = await geocodeWithGoogleMaps(cleanQuery);
    if (googleResult) return googleResult;

    const photonResult = await geocodeWithPhoton(cleanQuery);
    if (photonResult) return photonResult;

    return geocodeWithNominatim(cleanQuery);
  },

  async calculateRouteDistance(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<GraphHopperRouteResult> {
    return graphhopperService.getRoute(fromLat, fromLng, toLat, toLng, 'car');
  },

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

    const materialsList: Array<{ material: string; volumenM3: number }> =
      params.materials && params.materials.length > 0
        ? params.materials
        : [{ material: params.material || 'ARENA_FINA', volumenM3: params.volumenM3 || 15 }];

    const quarry =
      params.quarry ||
      AVAILABLE_QUARRIES.find((q) => q.id === params.quarryId) ||
      DEFAULT_QUARRY;

    const preset = PASCO_DESTINATION_PRESETS.find(
      (p) =>
        p.name.toLowerCase().includes(destinationName.toLowerCase()) ||
        destinationName.toLowerCase().includes(p.district.toLowerCase())
    );

    let targetLat = params.destinationLat ?? preset?.lat;
    let targetLng = params.destinationLng ?? preset?.lng;

    if (targetLat === undefined || targetLng === undefined) {
      const geo = await this.geocodeAddress(destinationName);
      if (!geo) {
        throw new Error(
          'No se encontró una ubicación en el mapa para el destino ingresado. Intenta seleccionar una zona o marca el punto.'
        );
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

    const {
      breakdown: materialsBreakdown,
      totalVolumenM3,
      materialTotal,
      totalTrips,
    } = calculateMaterialsBreakdown(materialsList);

    const {
      freightBase,
      freightDistanceCost,
      freightTotal,
      grandTotal,
      avgPricePerM3,
    } = calculateFreightPricing(routeResult.distanceKm, totalVolumenM3, totalTrips, materialTotal);

    return {
      quarry,
      routeSource: routeResult.source,
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

