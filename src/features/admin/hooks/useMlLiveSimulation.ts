import { useEffect, useState } from 'react';
import { apiClient } from '../../../shared/services/apiClient';
import type { MlComparacionPrediccionesDto } from '../../../shared/types/api/mlDto';
import { getErrorMessage } from '../../../shared/utils/errors';

export interface MlSimulatorInput {
  distanciaKm: string;
  desnivelMetros: string;
  pesoCargaTon: string;
}

interface KeyedPredictions {
  inputKey: string;
  predictions: MlComparacionPrediccionesDto['predicciones'];
}

interface KeyedError {
  inputKey: string;
  message: string;
}

export function useMlLiveSimulation(
  input: MlSimulatorInput,
  version: string,
  enabled: boolean
) {
  const [result, setResult] = useState<KeyedPredictions | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<KeyedError | null>(null);
  const inputKey = `${version}:${input.distanciaKm}:${input.desnivelMetros}:${input.pesoCargaTon}`;
  const distance = Number(input.distanciaKm);
  const elevation = Number(input.desnivelMetros);
  const load = Number(input.pesoCargaTon);
  const isValid =
    enabled &&
    Number.isFinite(distance) && distance > 0 &&
    Number.isFinite(elevation) &&
    Number.isFinite(load) && load > 0;

  useEffect(() => {
    if (!isValid) return;

    let cancelled = false;
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setLoadingKey(inputKey);
      void apiClient
        .post<MlComparacionPrediccionesDto>(
          '/ml/comparacion/predicciones',
          {
            distancia_km: distance,
            desnivel_metros: elevation,
            peso_carga_ton: load,
          },
          { signal: abortController.signal }
        )
        .then((response) => {
          if (!cancelled) {
            setResult({ inputKey, predictions: response.predicciones });
            setError(null);
          }
        })
        .catch((simulationError: unknown) => {
          if (!cancelled) {
            setError({
              inputKey,
              message: getErrorMessage(
                simulationError,
                'No se pudieron comparar las predicciones.'
              ),
            });
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingKey(null);
        });
    }, 250);

    return () => {
      cancelled = true;
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [distance, elevation, inputKey, isValid, load]);

  return {
    predictions: result?.inputKey === inputKey ? result.predictions : [],
    loading: loadingKey === inputKey,
    error: error?.inputKey === inputKey ? error.message : null,
  };
}
