import { AVAILABLE_QUARRIES, freightService, type QuarryLocation } from './freightService';
import { loadGoogleMaps } from './googleMapsLoader';

export interface CopilotRouteSegment {
  cantera: string;
  destino: string;
  distancia_km: number;
  desnivel_metros: number;
  peso_carga_ton: number;
  proveedor_ruta: 'google_maps' | 'graphhopper';
}

export interface CopilotRouteContext {
  tramos: CopilotRouteSegment[];
  ida_y_vuelta: boolean;
  carga_asumida: boolean;
  calcular_combustible: boolean;
}

interface ParsedRouteQuery {
  originText: string | null;
  destinationText: string | null;
  loadTons: number;
  loadWasAssumed: boolean;
  roundTrip: boolean;
  calculatesFuel: boolean;
}

interface ResolvedDestination {
  lat: number;
  lng: number;
  displayName: string;
}

interface RouteResult {
  distanceKm: number;
  desnivelMeters: number;
  provider: 'google_maps' | 'graphhopper';
}

const DEFAULT_LOAD_TONS = 21.75;

const stripAccents = (value: string): string =>
  value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const cleanEndpoint = (value: string): string => {
  const withoutTrailingFollowUp = value.split(
    /\s*(?:,?\s+y\s+)?(?:de\s+qu[eé]|qu[eé])\s+cantera\b/i,
  )[0];
  const withoutTrailingExplanation = withoutTrailingFollowUp.split(
    /\s+(?:es decir|o sea|por ejemplo)\b/i,
  )[0];
  return withoutTrailingExplanation
    .replace(/^[\s,:;-]+|[\s,:;!?-]+$/g, '')
    .replace(/^(?:el destino|la obra|el lugar de destino)\s+/i, '')
    .trim();
};

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + cost,
      );
      diagonal = above;
    }
  }

  return previous[right.length];
}

function isSimilarLocationToken(left: string, right: string): boolean {
  if (left.length < 6 || right.length < 6) return false;
  const maximumDistance = Math.max(1, Math.floor(Math.min(left.length, right.length) * 0.2));
  return Math.abs(left.length - right.length) <= maximumDistance
    && editDistance(left, right) <= maximumDistance;
}

function parseRouteQuery(message: string): ParsedRouteQuery | null {
  const normalized = stripAccents(message);
  const movementPattern =
    '(?:llevar(?:lo)?|transportar|trasladar|enviar|entregar|despachar|viajar|viaje|ir|llegar|dirigir(?:me)?)';
  const hasFuelTerm = [
    'combustible',
    'diesel',
    'consumo',
    'galon',
    'gastaria',
    'gasto de combustible',
  ].some((term) => normalized.includes(term));
  const requestsRecommendation =
    /\b(?:recomiend\w*|convien\w*|menor\s+costo|mas\s+barat\w*|ahorr\w*)\b/.test(normalized);
  const hasRouteTerm =
    ['desde', 'hacia', 'hasta', 'destino'].some((term) => normalized.includes(term)) ||
    /\bcantera\b.+\b(?:a|hacia|hasta)\b/.test(normalized) ||
    /\b(?:distancia|ruta|trayecto|kilometros?|km|como llegar|cuanto demora)\b/.test(normalized) ||
    new RegExp(
      `\\b${movementPattern}\\b[\\s\\S]{0,80}\\b(?:a|hacia|hasta|rumbo\\s+a|con\\s+destino\\s+a)\\b`,
    ).test(normalized);

  if (!hasRouteTerm) return null;

  const loadMatch = normalized.match(
    /(?:carga(?:\s+de)?|peso(?:\s+de)?)?\s*(\d+(?:[.,]\d+)?)\s*(?:t\b|ton\w*)/
  );
  const loadTons = loadMatch ? Number(loadMatch[1].replace(',', '.')) : DEFAULT_LOAD_TONS;
  const roundTrip = /ida\s*y\s*vuelta|ida\s+y\s+retorno|retorno/.test(normalized);

  const connector = '(?:hacia|hasta|a|rumbo\\s+a)';
  const cleanMessage = message.replace(/[¿?¡!]/g, '').trim();
  let betweenMatch = cleanMessage.match(
    new RegExp(`\\bdesde\\s+(.+?)\\s+${connector}\\s+(.+)$`, 'i')
  );
  if (!betweenMatch) {
    betweenMatch = cleanMessage.match(
      new RegExp(`\\bde\\s+(.+?)\\s+${connector}\\s+(.+)$`, 'i')
    );
  }

  let originText: string | null = null;
  let destinationText: string | null;
  if (betweenMatch) {
    originText = cleanEndpoint(betweenMatch[1]) || null;
    destinationText = cleanEndpoint(betweenMatch[2]) || null;
  } else {
    const movementDestinationMatch = cleanMessage.match(
      new RegExp(
        `\\b${movementPattern}\\b[\\s\\S]*?\\b(?:con\\s+destino\\s+a|rumbo\\s+a|a|hacia|hasta)\\s+(.+)$`,
        'i',
      ),
    );
    const destinationMatch = cleanMessage.match(
      new RegExp(
        `\\b(?:hacia|hasta|rumbo\\s+a|con\\s+destino\\s+a)\\s+(?:el\\s+destino|la\\s+obra|el\\s+lugar\\s+de\\s+destino)?\\s*(.+)$`,
        'i',
      ),
    );
    destinationText = movementDestinationMatch
      ? cleanEndpoint(movementDestinationMatch[1]) || null
      : destinationMatch
        ? cleanEndpoint(destinationMatch[1]) || null
        : null;
  }

  if (originText && /combustible|consumo|diesel|di[eé]sel/.test(stripAccents(originText))) {
    originText = null;
  }

  return {
    originText,
    destinationText,
    loadTons,
    loadWasAssumed: !loadMatch,
    roundTrip,
    calculatesFuel: hasFuelTerm || requestsRecommendation,
  };
}

function selectKnownQuarries(originText: string | null): QuarryLocation[] | null {
  if (!originText) return AVAILABLE_QUARRIES;

  const normalized = stripAccents(originText);
  if (/cualquier|todas?|cualquiera/.test(normalized)) return AVAILABLE_QUARRIES;

  const originTokens = normalized.split(/[^a-z0-9]+/).filter((token) => token.length >= 6);
  const matches = AVAILABLE_QUARRIES.filter((quarry) => {
    const quarryText = stripAccents(`${quarry.name} ${quarry.district}`);
    const quarryTokens = quarryText.split(/[^a-z0-9]+/).filter((token) => token.length >= 6);
    return quarryText.includes(normalized)
      || normalized.includes(stripAccents(quarry.name.split(' ')[1] || ''))
      || originTokens.some((originToken) =>
        quarryTokens.some((quarryToken) => isSimilarLocationToken(originToken, quarryToken))
      );
  });

  return matches.length > 0 ? matches : null;
}

async function geocodeWithGoogleAddress(
  maps: typeof google.maps,
  query: string,
): Promise<ResolvedDestination> {
  const geocoder = new maps.Geocoder();

  return new Promise<ResolvedDestination>((resolve, reject) => {
    geocoder.geocode(
      {
        address: query,
        componentRestrictions: { country: 'PE' },
      },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            displayName: results[0].formatted_address,
          });
          return;
        }
        reject(new Error(`Google Maps no pudo ubicar la ubicación: ${status}`));
      },
    );
  });
}

async function geocodeWithGoogle(query: string): Promise<ResolvedDestination> {
  const maps = await loadGoogleMaps();

  try {
    return await geocodeWithGoogleAddress(maps, query);
  } catch {
    // Places puede corregir errores de escritura que el geocoder directo no reconoce.
    const autocomplete = new maps.places.AutocompleteService();
    const response = await autocomplete.getPlacePredictions({
      input: query,
      componentRestrictions: { country: 'PE' },
      types: ['geocode'],
    });
    const suggestion = response.predictions?.[0]?.description;
    if (!suggestion) throw new Error(`Google Maps no encontró sugerencias para “${query}”.`);
    return geocodeWithGoogleAddress(maps, suggestion);
  }
}

async function calculateGoogleRoute(
  quarry: QuarryLocation,
  destination: ResolvedDestination
): Promise<RouteResult> {
  const maps = await loadGoogleMaps();
  const directionsService = new maps.DirectionsService();

  const directions = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
    directionsService.route(
      {
        origin: { lat: quarry.lat, lng: quarry.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          resolve(result);
          return;
        }
        reject(new Error(`Google Maps no pudo calcular la ruta: ${status}`));
      }
    );
  });

  const legs = directions.routes[0]?.legs ?? [];
  const distanceMeters = legs.reduce((total, leg) => total + (leg.distance?.value ?? 0), 0);
  if (distanceMeters <= 0) throw new Error('Google Maps devolvió una distancia inválida.');

  let desnivelMeters = 0;
  try {
    const elevationService = new maps.ElevationService();
    const elevations = await new Promise<google.maps.ElevationResult[]>((resolve, reject) => {
      elevationService.getElevationForLocations(
        {
          locations: [
            { lat: quarry.lat, lng: quarry.lng },
            { lat: destination.lat, lng: destination.lng },
          ],
        },
        (results, status) => {
          if (status === 'OK' && results) {
            resolve(results);
            return;
          }
          reject(new Error(`Google Elevation no disponible: ${status}`));
        }
      );
    });
    if (elevations.length >= 2) {
      desnivelMeters = Math.round(Math.abs(elevations[0].elevation - elevations[1].elevation));
    }
  } catch {
    // La distancia sigue siendo válida si Elevation API no está habilitada.
  }

  return {
    distanceKm: Number((distanceMeters / 1000).toFixed(1)),
    desnivelMeters,
    provider: 'google_maps',
  };
}

async function resolveLocation(query: string, label: 'origen' | 'destino'): Promise<ResolvedDestination> {
  const candidates = Array.from(
    new Set([
      query.trim(),
      `${query.trim()}, Pasco, Perú`,
      `${query.trim()}, Perú`,
    ]),
  );

  for (const candidate of candidates) {
    try {
      return await geocodeWithGoogle(candidate);
    } catch {
      const fallback = await freightService.geocodeAddress(candidate);
      if (fallback) return fallback;
    }
  }

  throw new Error(`No se pudo ubicar el ${label} “${query}”.`);
}

async function resolveDestination(query: string): Promise<ResolvedDestination> {
  return resolveLocation(query, 'destino');
}

async function resolveQuarries(originText: string | null): Promise<QuarryLocation[]> {
  const knownQuarries = selectKnownQuarries(originText);
  if (knownQuarries) return knownQuarries;

  const resolvedOrigin = await resolveLocation(originText as string, 'origen');
  return [
    {
      id: 'custom-origin',
      name: resolvedOrigin.displayName,
      district: '',
      lat: resolvedOrigin.lat,
      lng: resolvedOrigin.lng,
      altitudeMsnm: 0,
      description: 'Origen resuelto dinámicamente con Google Maps',
    },
  ];
}

async function calculateRoute(
  quarry: QuarryLocation,
  destination: ResolvedDestination
): Promise<RouteResult> {
  try {
    return await calculateGoogleRoute(quarry, destination);
  } catch {
    const fallback = await freightService.calculateRouteDistance(
      quarry.lat,
      quarry.lng,
      destination.lat,
      destination.lng
    );
    return {
      distanceKm: fallback.distanceKm,
      desnivelMeters: fallback.ascendMeters ?? 0,
      provider: 'graphhopper',
    };
  }
}

export const copilotRouteContextService = {
  async buildContext(message: string): Promise<CopilotRouteContext | null> {
    const query = parseRouteQuery(message);
    if (!query || !query.destinationText) return null;

    const [destination, quarries] = await Promise.all([
      resolveDestination(query.destinationText),
      resolveQuarries(query.originText),
    ]);
    const multiplier = query.roundTrip ? 2 : 1;
    const tramos = await Promise.all(
      quarries.map(async (quarry): Promise<CopilotRouteSegment> => {
        const route = await calculateRoute(quarry, destination);
        return {
          cantera: quarry.name,
          destino: destination.displayName,
          distancia_km: Number((route.distanceKm * multiplier).toFixed(1)),
          desnivel_metros: route.desnivelMeters,
          peso_carga_ton: query.loadTons,
          proveedor_ruta: route.provider,
        };
      })
    );

    return {
      tramos,
      ida_y_vuelta: query.roundTrip,
      carga_asumida: query.loadWasAssumed,
      calcular_combustible: query.calculatesFuel,
    };
  },
};

export default copilotRouteContextService;
