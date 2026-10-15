import { useEffect, useState } from 'react';
import {
  fuelPredictionService,
  type FuelPredictionInput,
  type FuelPredictionResult,
} from '../services/fuelPredictionService';

export interface FuelPredictionState {
  prediction: FuelPredictionResult | null;
  predictionLoading: boolean;
  predictionError: string | null;
}

export function useFuelPrediction(input: FuelPredictionInput | null): FuelPredictionState {
  const [prediction, setPrediction] = useState<FuelPredictionResult | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const distanciaKm = input?.distanciaKm ?? null;
  const desnivelMetros = input?.desnivelMetros ?? null;
  const pesoCargaTon = input?.pesoCargaTon ?? null;

  useEffect(() => {
    if (distanciaKm == null || desnivelMetros == null || pesoCargaTon == null) {
      return;
    }

    let cancelled = false;

    const loadPrediction = async () => {
      setPrediction(null);
      setPredictionLoading(true);
      setPredictionError(null);

      try {
        await fuelPredictionService.loadActiveParams();
        const result = await fuelPredictionService.predictOnline({
          distanciaKm,
          desnivelMetros,
          pesoCargaTon,
        });

        if (!cancelled) {
          setPrediction(result);
        }
      } catch (predictionLoadError: unknown) {
        console.error('No se pudo obtener la predicción de combustible:', predictionLoadError);
        if (!cancelled) {
          setPredictionError('No se pudo calcular la predicción de combustible.');
          setPrediction(null);
        }
      } finally {
        if (!cancelled) {
          setPredictionLoading(false);
        }
      }
    };

    void loadPrediction();

    return () => {
      cancelled = true;
    };
  }, [distanciaKm, desnivelMetros, pesoCargaTon]);

  return {
    prediction: distanciaKm == null || desnivelMetros == null || pesoCargaTon == null ? null : prediction,
    predictionLoading:
      distanciaKm == null || desnivelMetros == null || pesoCargaTon == null
        ? false
        : predictionLoading,
    predictionError:
      distanciaKm == null || desnivelMetros == null || pesoCargaTon == null
        ? null
        : predictionError,
  };
}
