import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../../shared/services/apiClient';
import type { MlComparacionDto } from '../../../shared/types/api/mlDto';
import { getErrorMessage } from '../../../shared/utils/errors';

const COMPARISON_REFRESH_INTERVAL_MS = 5 * 60_000;

export function useMlComparisonData() {
  const [comparison, setComparison] = useState<MlComparacionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let requestInProgress = false;
    const abortController = new AbortController();

    const loadComparison = () => {
      if (requestInProgress) return;
      requestInProgress = true;
      setRefreshing(true);

      void apiClient
        .get<MlComparacionDto>('/ml/comparacion', {
          cache: 'no-store',
          signal: abortController.signal,
        })
        .then((result) => {
          if (!cancelled) {
            setComparison(result);
            setLastUpdatedAt(new Date());
            setError(null);
          }
        })
        .catch((loadError: unknown) => {
          if (!cancelled) {
            setError(getErrorMessage(loadError, 'No se pudo cargar la comparación de modelos.'));
          }
        })
        .finally(() => {
          requestInProgress = false;
          if (!cancelled) {
            setLoading(false);
            setRefreshing(false);
          }
        });
    };

    const refreshOnFocus = () => void loadComparison();
    void loadComparison();
    const intervalId = window.setInterval(
      () => void loadComparison(),
      COMPARISON_REFRESH_INTERVAL_MS
    );
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      cancelled = true;
      abortController.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [refreshToken]);

  const refresh = useCallback(() => setRefreshToken((current) => current + 1), []);

  return { comparison, loading, refreshing, lastUpdatedAt, error, refresh };
}
