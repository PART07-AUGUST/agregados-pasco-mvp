import { MapPin, Check } from 'lucide-react';
import type { ViajeDetallado } from '../../../../shared/services/tripsService';
import type { RouteCalculationResult } from '../../../../shared/services/freightService';

interface TripInfoCardProps {
  trip: ViajeDetallado;
  routeQuote: RouteCalculationResult | null;
}

export function TripInfoCard({ trip, routeQuote }: TripInfoCardProps) {
  const getBadgeStyle = () => {
    switch (trip.estado) {
      case 'PENDIENTE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'EN_CAMINO':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getBadgeLabel = () => {
    switch (trip.estado) {
      case 'PENDIENTE':
        return 'POR INICIAR';
      case 'EN_CAMINO':
        return 'EN RUTA';
      default:
        return 'EN BALANZA';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start pt-1">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
            VIAJE EN CURSO
          </span>
          <h3 className="text-base font-extrabold text-white mt-0.5">Control de Ruta</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono border ${getBadgeStyle()}`}>
          {getBadgeLabel()}
        </span>
      </div>

      <div className="flex items-center justify-between px-2 pt-2 pb-1 border-b border-slate-800/80">
        <div className="flex flex-col items-center space-y-1 flex-1">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              trip.estado === 'PENDIENTE'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-110'
                : 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {trip.estado !== 'PENDIENTE' ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 text-center">Salida</span>
        </div>

        <div className={`h-0.5 flex-1 transition-all ${trip.estado !== 'PENDIENTE' ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />

        <div className="flex flex-col items-center space-y-1 flex-1">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              trip.estado === 'EN_CAMINO'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-110'
                : trip.estado === 'EN_BALANZA'
                  ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-850 text-slate-600 border border-slate-800'
            }`}
          >
            {trip.estado === 'EN_BALANZA' ? <Check className="h-4 w-4" /> : '2'}
          </div>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 text-center">Balanza</span>
        </div>

        <div className={`h-0.5 flex-1 transition-all ${trip.estado === 'EN_BALANZA' ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />

        <div className="flex flex-col items-center space-y-1 flex-1">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              trip.estado === 'EN_BALANZA'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-110 animate-pulse'
                : 'bg-slate-850 text-slate-600 border border-slate-800'
            }`}
          >
            3
          </div>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 text-center">Obra</span>
        </div>
      </div>

      <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-855 space-y-3">
        <div className="flex items-start space-x-3">
          <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Destino de la Carga</span>
            <p className="text-xs font-bold text-slate-200">{trip.destino}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-900">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Material</span>
            <p className="text-xs font-bold text-white uppercase font-mono">{trip.material?.replace('_', ' ')}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Vehículo (Volquete)</span>
            <p className="text-xs font-bold text-amber-400 font-mono">Placa: {trip.placa}</p>
          </div>
        </div>

        {trip.clienteNombre && (
          <div className="pt-2 border-t border-slate-900 space-y-0.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Cliente</span>
            <p className="text-xs font-semibold text-slate-300">{trip.clienteNombre}</p>
          </div>
        )}

        <div className="pt-2.5 border-t border-slate-900 grid grid-cols-2 gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
          <div>
            <span className="text-[8.5px] text-amber-400 font-bold uppercase tracking-wider block">Tarifa Flete Asignada</span>
            <p className="text-sm font-extrabold text-amber-400 font-mono">
              {routeQuote ? `S/ ${routeQuote.freightTotal.toFixed(2)}` : 'Calculando flete...'}
            </p>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block">Distancia y Tránsito</span>
            <p className="text-xs font-bold text-slate-200 font-mono mt-0.5">
              {routeQuote ? `${routeQuote.distanceKm} km (~${routeQuote.durationMinutes} min)` : '--'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
