import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import type { ViajeDetallado } from '../../../shared/services/tripsService';
import { tripsService } from '../../../shared/services/tripsService';
import { storageService } from '../../../shared/services/storageService';
import { getErrorMessage } from '../../../shared/utils/errors';
import { useDriverGeolocation } from '../../../shared/hooks/useDriverGeolocation';
import { geolocationService } from '../../../shared/services/geolocationService';
import {
  PASCO_DESTINATION_PRESETS,
  freightService,
  type RouteCalculationResult,
} from '../../../shared/services/freightService';

export interface UseDriverTripActionsProps {
  trip: ViajeDetallado;
  onRefresh: () => void | Promise<void>;
}

export function useDriverTripActions({ trip, onRefresh }: UseDriverTripActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pesoEntrada, setPesoEntrada] = useState('');
  const [pesoSalida, setPesoSalida] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { coords, error: gpsError, isTracking, startTracking } = useDriverGeolocation({
    autoStart: trip.estado === 'EN_CAMINO',
  });

  const [showInAppMap, setShowInAppMap] = useState(false);
  const [routeQuote, setRouteQuote] = useState<RouteCalculationResult | null>(null);
  const [, setLoadingRoute] = useState(false);

  const destinationPreset = PASCO_DESTINATION_PRESETS.find(
    (p) =>
      p.name.toLowerCase().includes((trip.destino || '').toLowerCase()) ||
      (trip.destino || '').toLowerCase().includes(p.district.toLowerCase())
  );
  const destLat = destinationPreset?.lat ?? -10.6865;
  const destLng = destinationPreset?.lng ?? -76.2572;

  useEffect(() => {
    let isMounted = true;

    async function loadTripFreight() {
      if (!trip.destino) return;
      setLoadingRoute(true);
      try {
        const quote = await freightService.calculateFreightQuote({
          material: trip.material || 'AFIRMADO',
          volumenM3: trip.volumenM3 || 15,
          destinationName: trip.destino,
          destinationLat: destLat,
          destinationLng: destLng,
        });
        if (isMounted) {
          setRouteQuote(quote);
        }
      } catch (err: unknown) {
        console.warn('No se pudo precargar la cotización de flete para el chofer:', err);
      } finally {
        if (isMounted) {
          setLoadingRoute(false);
        }
      }
    }

    void loadTripFreight();

    return () => {
      isMounted = false;
    };
  }, [trip.destino, trip.material, trip.volumenM3, destLat, destLng]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleOpenGoogleMaps = () => {
    const navUrl = geolocationService.getGoogleMapsNavigationUrl(
      destLat,
      destLng,
      coords?.latitude,
      coords?.longitude
    );
    window.open(navUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStartTrip = async () => {
    setLoading(true);
    setError(null);

    try {
      await tripsService.updateTripState(trip.id, 'EN_CAMINO');
      await onRefresh();
    } catch (startError: unknown) {
      console.error('Error al iniciar viaje:', startError);
      setError(getErrorMessage(startError, 'No se pudo iniciar el viaje. Verifica tu conexión.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) {
      return;
    }

    const file = e.target.files[0];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearPhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleRegisterWeighing = async (e: FormEvent) => {
    e.preventDefault();

    if (!pesoEntrada || !pesoSalida) {
      setError('Por favor, ingresa los pesos de entrada y salida.');
      return;
    }

    const pEntradaVal = parseFloat(pesoEntrada);
    const pSalidaVal = parseFloat(pesoSalida);

    if (Number.isNaN(pEntradaVal) || pEntradaVal <= 0 || Number.isNaN(pSalidaVal) || pSalidaVal <= 0) {
      setError('Los pesos deben ser números positivos mayores que cero.');
      return;
    }

    if (!selectedFile) {
      setError('Por favor, toma o selecciona una foto del ticket físico de la balanza.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pesoEntradaKg = Math.round(pEntradaVal * 1000);
      const pesoSalidaKg = Math.round(pSalidaVal * 1000);

      if (!navigator.onLine) {
        setUploadProgress(false);
        await tripsService.registerWeighingOffline(trip.id, pesoEntradaKg, pesoSalidaKg, selectedFile);
      } else {
        setUploadProgress(true);
        const ticketUrl = await storageService.uploadTicketImage(selectedFile);
        setUploadProgress(false);
        await tripsService.registerWeighing(trip.id, pesoEntradaKg, pesoSalidaKg, ticketUrl);
      }

      setPesoEntrada('');
      setPesoSalida('');
      setSelectedFile(null);
      setPreviewUrl(null);

      await onRefresh();
    } catch (weighingError: unknown) {
      console.error('Error al registrar pesaje en balanza:', weighingError);
      setError(getErrorMessage(weighingError, 'Error al guardar pesaje en balanza. Reintenta.'));
      setUploadProgress(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setLoading(true);
    setError(null);

    try {
      await tripsService.completeDelivery(trip.id);
      await onRefresh();
    } catch (deliveryError: unknown) {
      console.error('Error al confirmar entrega:', deliveryError);
      setError(getErrorMessage(deliveryError, 'No se pudo confirmar la entrega. Intenta nuevamente.'));
    } finally {
      setLoading(false);
    }
  };

  const pesoEntradaDbTon = trip.pesoEntradaKg ? (trip.pesoEntradaKg / 1000).toFixed(2) : null;
  const pesoSalidaDbTon = trip.pesoSalidaKg ? (trip.pesoSalidaKg / 1000).toFixed(2) : null;
  const pesoNetoDbTon =
    trip.pesoEntradaKg && trip.pesoSalidaKg
      ? ((trip.pesoEntradaKg - trip.pesoSalidaKg) / 1000).toFixed(2)
      : null;

  return {
    loading,
    error,
    pesoEntrada,
    setPesoEntrada,
    pesoSalida,
    setPesoSalida,
    selectedFile,
    previewUrl,
    uploadProgress,
    fileInputRef,
    coords,
    gpsError,
    isTracking,
    startTracking,
    showInAppMap,
    setShowInAppMap,
    routeQuote,
    destLat,
    destLng,
    handleOpenGoogleMaps,
    handleStartTrip,
    handlePhotoChange,
    handleClearPhoto,
    handleRegisterWeighing,
    handleConfirmDelivery,
    pesoEntradaDbTon,
    pesoSalidaDbTon,
    pesoNetoDbTon,
  };
}
