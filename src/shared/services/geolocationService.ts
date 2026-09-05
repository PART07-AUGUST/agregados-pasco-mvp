export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export type GeolocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NOT_SUPPORTED';

export class GeolocationServiceError extends Error {
  code: GeolocationErrorCode;

  constructor(message: string, code: GeolocationErrorCode) {
    super(message);
    this.name = 'GeolocationServiceError';
    this.code = code;
  }
}

/**
 * Servicio de Geolocalización GPS nativa para el dispositivo del conductor.
 * Lee directamente los sensores del smartphone mediante la Web Geolocation API.
 */
export const geolocationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'geolocation' in navigator;
  },

  /**
   * Obtiene la posición actual inmediata con alta precisión (GPS).
   */
  async getCurrentPosition(): Promise<Coordinates> {
    if (!this.isSupported()) {
      throw new GeolocationServiceError(
        'La geolocalización no es compatible con este navegador.',
        'NOT_SUPPORTED'
      );
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: pos.timestamp,
          });
        },
        (err) => {
          let code: GeolocationErrorCode = 'POSITION_UNAVAILABLE';
          if (err.code === err.PERMISSION_DENIED) code = 'PERMISSION_DENIED';
          if (err.code === err.TIMEOUT) code = 'TIMEOUT';

          reject(new GeolocationServiceError(err.message, code));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  },

  /**
   * Inicia el rastreo continuo del conductor por carretera.
   * Retorna una función para cancelar la suscripción y ahorrar batería.
   */
  watchPosition(
    onSuccess: (coords: Coordinates) => void,
    onError: (error: GeolocationServiceError) => void
  ): () => void {
    if (!this.isSupported()) {
      onError(
        new GeolocationServiceError(
          'La geolocalización no es compatible con este navegador.',
          'NOT_SUPPORTED'
        )
      );
      return () => {};
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onSuccess({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        let code: GeolocationErrorCode = 'POSITION_UNAVAILABLE';
        if (err.code === err.PERMISSION_DENIED) code = 'PERMISSION_DENIED';
        if (err.code === err.TIMEOUT) code = 'TIMEOUT';

        onError(new GeolocationServiceError(err.message, code));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  },

  /**
   * Genera el enlace universal oficial para abrir la navegación en la app de Google Maps
   * instalada en el teléfono del conductor con guía por voz giro a giro.
   */
  getGoogleMapsNavigationUrl(
    destLat: number,
    destLng: number,
    originLat?: number,
    originLng?: number
  ): string {
    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const dest = `&destination=${destLat},${destLng}`;
    const orig = originLat !== undefined && originLng !== undefined ? `&origin=${originLat},${originLng}` : '';
    const travel = '&travelmode=driving';

    return `${baseUrl}${dest}${orig}${travel}`;
  },
};
