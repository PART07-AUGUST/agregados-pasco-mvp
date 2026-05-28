import { useEffect, useState } from 'react';
import { Truck, Users, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { tripsService } from '../../../shared/services/tripsService';
import { supabase } from '../../../shared/services/supabase';
import type { Pedido } from '../../../shared/services/ordersService';
import { getErrorMessage } from '../../../shared/utils/errors';

interface TripAssignModalProps {
  order: Pedido;
  onSuccess: () => void;
  onCancel: () => void;
}

interface VehiculoOption {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  capacidadM3: number;
}

interface ConductorOption {
  id: string;
  nombre: string;
  dni: string;
}

interface ActiveTripRow {
  vehiculo_id: string;
  conductor_id: string;
}

export function TripAssignModal({ order, onSuccess, onCancel }: TripAssignModalProps) {
  const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]);
  const [conductores, setConductores] = useState<ConductorOption[]>([]);
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
        const [{ data: vData, error: vErr }, { data: cData, error: cErr }, { data: activeTrips, error: activeErr }] =
          await Promise.all([
            supabase.from('vehiculos').select('id, placa, marca, modelo, capacidad_m3').eq('activo', true).order('placa', { ascending: true }),
            supabase.from('usuarios').select('id, nombre, dni').eq('rol', 'CONDUCTOR').order('nombre', { ascending: true }),
            supabase.from('viajes').select('vehiculo_id, conductor_id').in('estado', ['PENDIENTE', 'EN_CAMINO', 'EN_BALANZA']),
          ]);

        if (vErr) throw vErr;
        if (cErr) throw cErr;
        if (activeErr) throw activeErr;
        if (cancelled) return;

        const activeVehicleIds = new Set((activeTrips as ActiveTripRow[] | null)?.map((trip) => trip.vehiculo_id) ?? []);
        const activeDriverIds = new Set((activeTrips as ActiveTripRow[] | null)?.map((trip) => trip.conductor_id) ?? []);

        setVehiculos(
          ((vData as Array<{ id: string; placa: string; marca: string; modelo: string; capacidad_m3: number | string }> | null) ?? [])
            .filter((vehicle) => !activeVehicleIds.has(vehicle.id))
            .map((vehicle) => ({
              id: vehicle.id,
              placa: vehicle.placa,
              marca: vehicle.marca,
              modelo: vehicle.modelo,
              capacidadM3: Number(vehicle.capacidad_m3),
            }))
        );

        setConductores(
          ((cData as ConductorOption[] | null) ?? []).filter((driver) => !activeDriverIds.has(driver.id))
        );
      } catch (loadError: unknown) {
        console.error('Error al cargar recursos de despacho:', loadError);
        setError(getErrorMessage(loadError, 'Ocurrió un error al cargar la flota o los conductores.'));
      } finally {
        if (!cancelled) {
          setFetching(false);
        }
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

    setLoading(true);

    try {
      await tripsService.assignTrip(order.id, selectedVehiculoId, selectedConductorId);
      onSuccess();
    } catch (assignError: unknown) {
      console.error('Error al asignar viaje:', assignError);
      setError(getErrorMessage(assignError, 'Error de base de datos al realizar la transacción.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative space-y-5 shadow-2xl selection:bg-amber-500 selection:text-slate-950">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Despachar Viaje Logístico</h4>
            <p className="text-[10px] text-slate-500">Transacción atómica a través de PostgreSQL RPC</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-900 text-[11px] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300">Cliente:</span>
            <span className="text-slate-400">{order.clienteNombre}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300">Material y Volumen:</span>
            <span className="text-amber-500 font-mono font-bold">{order.volumenM3} m³ · {order.material}</span>
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-300">Destino:</span>
            <p className="text-slate-400 mt-0.5 leading-normal">{order.destino}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {fetching ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Cargando flota y choferes...</span>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-400 flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-amber-500" />
                <span>1. Selecciona Volquete de Flota Activa *</span>
              </label>
              <select
                value={selectedVehiculoId}
                onChange={(e) => setSelectedVehiculoId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs cursor-pointer"
              >
                <option value="">-- Elige placa de volquete --</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} ({v.marca} {v.modelo} · {v.capacidadM3} m³)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-400 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-amber-500" />
                <span>2. Selecciona Conductor Asignado *</span>
              </label>
              <select
                value={selectedConductorId}
                onChange={(e) => setSelectedConductorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs cursor-pointer"
              >
                <option value="">-- Elige conductor --</option>
                {conductores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (DNI: {c.dni})
                  </option>
                ))}
              </select>
            </div>

            {!vehiculos.length && !conductores.length && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300">
                No hay vehículos ni conductores disponibles en este momento. Verifica si existen viajes activos pendientes de cierre.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleAssign()}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Despachando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Confirmar Despacho</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripAssignModal;
