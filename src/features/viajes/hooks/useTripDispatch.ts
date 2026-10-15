import { useState, useEffect } from 'react';
import {
  tripsService,
  type VehiculoDespachoOption,
  type ConductorDespachoOption,
  type TripRouteInput,
} from '../../../shared/services/tripsService';
import type { Pedido } from '../../../shared/services/ordersService';
import { getErrorMessage } from '../../../shared/utils/errors';

export function useTripDispatch(
  order: Pedido,
  onSuccess: () => void,
  route?: TripRouteInput
) {
  const [vehiculos, setVehiculos] = useState<VehiculoDespachoOption[]>([]);
  const [conductores, setConductores] = useState<ConductorDespachoOption[]>([]);
  const [selectedVehiculoId, setSelectedVehiculoId] = useState('');
  const [selectedConductorId, setSelectedConductorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadResources = async () => {
      setFetching(true);
      setError(null);

      try {
        const { vehiculos: vList, conductores: cList } =
          await tripsService.getAvailableDispatchResources();

        if (cancelled) return;
        setVehiculos(vList);
        setConductores(cList);
      } catch (loadError: unknown) {
        console.error('Error al cargar recursos de despacho:', loadError);
        if (!cancelled) {
          setError(
            getErrorMessage(loadError, 'Ocurrió un error al cargar la flota o los conductores.')
          );
        }
      } finally {
        setFetching(false);
      }
    };

    void loadResources();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAssign = async () => {
    setError(null);

    if (!selectedVehiculoId || !selectedConductorId) {
      setError('Por favor, selecciona tanto un vehículo como un conductor.');
      return;
    }

    if (!route) {
      setError('Aún no se ha podido calcular la ruta para este viaje.');
      return;
    }

    setLoading(true);

    try {
      await tripsService.assignTrip(order.id, selectedVehiculoId, selectedConductorId, route);
      onSuccess();
    } catch (assignError: unknown) {
      console.error('Error al asignar viaje:', assignError);
      setError(
        getErrorMessage(assignError, 'Error de base de datos al realizar la transacción.')
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedVehiculo = vehiculos.find((v) => v.id === selectedVehiculoId);

  return {
    vehiculos,
    conductores,
    selectedVehiculoId,
    setSelectedVehiculoId,
    selectedConductorId,
    setSelectedConductorId,
    selectedVehiculo,
    loading,
    fetching,
    error,
    handleAssign,
  };
}

export default useTripDispatch;
