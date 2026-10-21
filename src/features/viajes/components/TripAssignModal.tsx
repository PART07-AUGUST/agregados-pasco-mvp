import { Truck, Users, Check, Loader2, AlertCircle } from 'lucide-react';
import type { Pedido } from '../../../shared/services/ordersService';
import { getMaterialLabel } from '../../../shared/constants/materials';
import { ModalContainer } from '../../../shared/components/ModalContainer';
import { useTripDispatch } from '../hooks/useTripDispatch';
import { useTripFuelPrediction } from '../hooks/useTripFuelPrediction';
import { FuelPredictionCard } from '../../../shared/components/FuelPredictionCard';
import { ShimmerSkeleton } from '../../../shared/components/ShimmerSkeleton';

interface TripAssignModalProps {
  order: Pedido;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TripAssignModal({ order, onSuccess, onCancel }: TripAssignModalProps) {
  const {
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
  } = useTripDispatch(order, onSuccess);

  const {
    route,
    routeLoading,
    routeMessage,
    prediction,
    predictionLoading,
    predictionError,
  } = useTripFuelPrediction(order, selectedVehiculo?.capacidadM3);

  return (
    <ModalContainer
      isOpen={true}
      onClose={onCancel}
      title="Despachar Viaje Logístico"
      subtitle="Transacción atómica a través de PostgreSQL RPC"
      icon={<Truck className="h-5 w-5" />}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-900 text-[11px] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300">Cliente:</span>
            <span className="text-slate-400">{order.clienteNombre}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300">Material y Volumen:</span>
            <span className="text-amber-500 font-mono font-bold">
              {order.volumenM3} m³ · {getMaterialLabel(order.material)}
            </span>
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-300">Destino:</span>
            <p className="text-slate-400 mt-0.5 leading-normal">{order.destino}</p>
          </div>
        </div>

        <FuelPredictionCard
          routeLoading={routeLoading}
          routeMessage={routeMessage}
          prediction={routeLoading ? null : prediction}
          predictionLoading={predictionLoading}
          predictionError={predictionError}
        />

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {fetching ? (
          <div aria-busy="true" className="py-5 space-y-4">
            <div className="space-y-2">
              <ShimmerSkeleton className="h-3 w-56" />
              <ShimmerSkeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <ShimmerSkeleton className="h-3 w-52" />
              <ShimmerSkeleton className="h-10 w-full rounded-xl" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center">
              Cargando flota y conductores...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="select-volquete" className="font-semibold text-slate-400 flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-amber-500" />
                <span>1. Selecciona Volquete de Flota Activa *</span>
              </label>
              <select
                id="select-volquete"
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
              <label htmlFor="select-conductor" className="font-semibold text-slate-400 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-amber-500" />
                <span>2. Selecciona Conductor Asignado *</span>
              </label>
              <select
                id="select-conductor"
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
                className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-900 active:scale-95 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleAssign(route ?? undefined)}
                disabled={loading || routeLoading || predictionLoading || !route || !prediction}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 active:scale-95 transition-colors shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1"
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
    </ModalContainer>
  );
}

export default TripAssignModal;
