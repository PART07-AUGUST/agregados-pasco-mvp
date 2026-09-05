import { useState, useEffect, useCallback } from 'react';
import {
  geolocationService,
  type Coordinates,
  type GeolocationServiceError,
} from '../services/geolocationService';

interface UseDriverGeolocationOptions {
  autoStart?: boolean;
}

export function useDriverGeolocation({ autoStart = false }: UseDriverGeolocationOptions = {}) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<GeolocationServiceError | null>(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState<boolean>(autoStart);

  useEffect(() => {
    if (!isTrackingEnabled) {
      return;
    }

    const unsubscribe = geolocationService.watchPosition(
      (newCoords) => {
        setCoords(newCoords);
        setError(null);
      },
      (geoError) => {
        setError(geoError);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isTrackingEnabled]);

  const startTracking = useCallback(() => {
    setError(null);
    setIsTrackingEnabled(true);
  }, []);

  const stopTracking = useCallback(() => {
    setIsTrackingEnabled(false);
  }, []);

  return {
    coords,
    error,
    isTracking: isTrackingEnabled,
    startTracking,
    stopTracking,
  };
}
