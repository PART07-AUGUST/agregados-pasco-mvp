import { useEffect, useState } from 'react';
import type { Pedido } from '../../../shared/services/ordersService';
import {
  DEFAULT_QUARRY,
  freightService,
} from '../../../shared/services/freightService';
import {
  fuelPredictionService,
  type FuelPredictionResult,
} from '../../../shared/services/fuelPredictionService';
import type { TripRouteInput } from '../../../shared/services/tripsService';
import { useFuelPrediction } from '../../../shared/hooks/useFuelPrediction';

const FALLBACK_ROUTE: TripRouteInput = {
  distanciaKm: 24.5,
  desnivelMetros: 140,
  fuenteRuta: 'aproximada',
  canteraOrigen: DEFAULT_QUARRY.name,
};

export interface TripFuelPredictionState {
  route: TripRouteInput | null;
  routeLoading: boolean;
  routeMessage: string | null;
  prediction: FuelPredictionResult | null;
  predictionLoading: boolean;
  predictionError: string | null;
}

function getStoredRoute(order: Pick<Pedido, 'distanciaKm' | 'desnivelMetros' | 'canteraOrigen'>): TripRouteInput | null {
  if (order.distanciaKm == null || order.distanciaKm <= 0) {
    return null;
  }

  return {
    distanciaKm: order.distanciaKm,
    desnivelMetros: order.desnivelMetros ?? 0,
    fuenteRuta: 'legacy',
    canteraOrigen: order.canteraOrigen || DEFAULT_QUARRY.name,
  };
}

export function useTripFuelPrediction(
  order: Pedido,
  capacidadVehiculoM3?: number
): TripFuelPredictionState {
  const {
    canteraOrigen,
    destino,
    desnivelMetros,
    distanciaKm,
    volumenM3,
  } = order;
  const [route, setRoute] = useState<TripRouteInput | null>(null);
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const predictionInput = route
    ? {
        ...fuelPredictionService.estimateTripParams(
          volumenM3,
          capacidadVehiculoM3 ?? volumenM3
        ),
        distanciaKm: route.distanciaKm,
        desnivelMetros: route.desnivelMetros,
      }
    : null;
  const { prediction, predictionLoading, predictionError } = useFuelPrediction(
    predictionInput,
    true
  );

  useEffect(() => {
    let cancelled = false;
    const storedRoute = getStoredRoute({ distanciaKm, desnivelMetros, canteraOrigen });

    void Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setRouteLoading(true);
        setRouteMessage(null);
        if (storedRoute) {
          setRoute(storedRoute);
          if (storedRoute.fuenteRuta === 'legacy') {
            setRouteMessage('Ruta histórica sin origen verificable; se conservará etiquetada como legacy.');
          }
          return null;
        }
        return freightService.calculateFreightQuote({
          destinationName: destino,
          volumenM3,
          quarry: DEFAULT_QUARRY,
        });
      })
      .then((quote) => {
        if (!quote || cancelled) return;
        setRoute({
          distanciaKm: quote.distanceKm,
          desnivelMetros: quote.ascendMeters ?? 0,
          fuenteRuta: quote.routeSource,
          canteraOrigen: quote.quarry.name,
        });
        if (quote.routeSource === 'aproximada') {
          setRouteMessage('Ruta aproximada: no se usará como medición observada para reentrenar.');
        }
      })
      .catch((routeError: unknown) => {
        console.warn('No se pudo recalcular la ruta del pedido; usando fallback:', routeError);
        if (cancelled) return;
        setRoute(FALLBACK_ROUTE);
        setRouteMessage('No se pudo recalcular la ruta. Se usará una ruta aproximada para la predicción.');
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canteraOrigen, destino, desnivelMetros, distanciaKm, volumenM3]);

  return {
    route,
    routeLoading,
    routeMessage,
    prediction,
    predictionLoading,
    predictionError,
  };
}
