import { Navigation, Clock, Truck, Check, ChevronRight } from 'lucide-react';
import type { RouteCalculationResult } from '../../../../shared/services/freightService';
import { getMaterialLabel } from '../../../../shared/constants/materials';
import { fuelPredictionService } from '../../../../shared/services/fuelPredictionService';
import { useFuelPrediction } from '../../../../shared/hooks/useFuelPrediction';
import { FuelPredictionCard } from '../../../../shared/components/FuelPredictionCard';
import { ShimmerSkeleton } from '../../../../shared/components/ShimmerSkeleton';

interface QuoteBreakdownCardProps {
  quote: RouteCalculationResult | null;
  loading: boolean;
  totalVolumenM3: number;
  isAdmin: boolean;
  onClose: () => void;
  onApply?: () => void;
}

function createQuoteFuelInput(
  quote: RouteCalculationResult | null,
  totalVolumenM3: number
) {
  if (!quote) return null;

  const cantidadViajes = Math.max(1, quote.totalTrips ?? 1);
  const volumenPorViaje = totalVolumenM3 / cantidadViajes;
  return {
    ...fuelPredictionService.estimateTripParams(volumenPorViaje),
    distanciaKm: quote.distanceKm,
    desnivelMetros: quote.ascendMeters ?? 0,
    cantidadViajes,
  };
}

// react-doctor-disable-next-line no-high-complexity-react-function
export function QuoteBreakdownCard({
  quote,
  loading,
  totalVolumenM3,
  isAdmin,
  onClose,
  onApply,
}: QuoteBreakdownCardProps) {
  const predictionInput = createQuoteFuelInput(quote, totalVolumenM3);
  const { prediction, predictionLoading, predictionError } = useFuelPrediction(
    isAdmin ? predictionInput : null,
    isAdmin
  );

  return (
    <div
      aria-busy={loading}
      className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3.5"
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Navigation className="h-3 w-3 text-amber-500" />
            Distancia real
          </span>
          <p className="text-base font-black text-white font-mono mt-0.5">
            {loading ? <ShimmerSkeleton className="h-5 w-24" /> : `${quote?.distanceKm ?? '--'} km`}
          </p>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            Tiempo estimado
          </span>
          <p className="text-base font-black text-white font-mono mt-0.5">
            {loading ? <ShimmerSkeleton className="h-5 w-24" /> : `~${quote?.durationMinutes ?? '--'} min`}
          </p>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Truck className="h-3 w-3 text-amber-500" />
            Despachos requeridos
          </span>
          <p className="text-[11px] font-bold text-amber-400 font-mono mt-1">
            {loading ? <ShimmerSkeleton className="h-4 w-28" /> : quote?.totalTrips ? `${quote.totalTrips} viaje(s) volquete` : '1 viaje'}
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-850 pt-3 text-xs">
        {loading ? (
          <>
            <div className="flex justify-between items-center">
              <ShimmerSkeleton className="h-3 w-48" />
              <ShimmerSkeleton className="h-3 w-16" />
            </div>
            <div className="flex justify-between items-center">
              <ShimmerSkeleton className="h-3 w-40" />
              <ShimmerSkeleton className="h-3 w-16" />
            </div>
            <div className="flex justify-between items-center">
              <ShimmerSkeleton className="h-3 w-44" />
              <ShimmerSkeleton className="h-3 w-16" />
            </div>
            <div className="flex justify-between items-center border-t border-slate-900 pt-2">
              <ShimmerSkeleton className="h-3 w-52" />
              <ShimmerSkeleton className="h-3 w-20" />
            </div>
          </>
        ) : quote?.materialsBreakdown && quote.materialsBreakdown.length > 0 ? (
          quote.materialsBreakdown.map((item) => (
            <div key={`breakdown-${item.material}`} className="flex justify-between items-center text-slate-400">
              <span>
                {getMaterialLabel(item.material)} ({item.volumenM3} m³ × S/ {item.unitPrice.toFixed(2)}):
              </span>
              <span className="font-mono text-white font-semibold">
                S/ {item.subtotal.toFixed(2)}
              </span>
            </div>
          ))
        ) : (
          <div className="flex justify-between items-center text-slate-400">
            <span>Material ({totalVolumenM3} m³ × S/ {quote?.materialPricePerM3.toFixed(2)}):</span>
            <span className="font-mono text-white font-semibold">
              S/ {quote?.materialTotal.toFixed(2) ?? '0.00'}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-900">
          <span>
            Flete Base Operativo ({quote?.totalTrips ?? 1} viaje(s) × S/ 90.00):
          </span>
          <span className="font-mono text-white font-semibold">
            S/ {quote?.freightBase.toFixed(2) ?? '0.00'}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-400">
          <span>Flete por Distancia ({quote?.distanceKm} km):</span>
          <span className="font-mono text-white font-semibold">
            S/ {quote?.freightDistanceCost.toFixed(2) ?? '0.00'}
          </span>
        </div>

        <div className="flex justify-between items-center text-amber-400 font-bold border-t border-slate-850 pt-2 text-xs">
          <span>Subtotal Flete de Transporte:</span>
          <span className="font-mono">S/ {quote?.freightTotal.toFixed(2) ?? '0.00'}</span>
        </div>
      </div>

      {isAdmin && (loading || quote) && (
        <FuelPredictionCard
          routeLoading={loading}
          prediction={loading ? null : prediction}
          predictionLoading={predictionLoading}
          predictionError={predictionError}
        />
      )}

      <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent rounded-2xl border border-amber-500/30 flex justify-between items-center">
        <div>
          <span className="text-[11px] text-amber-400 font-semibold tracking-wider block">
            Total estimado (materiales + flete)
          </span>
          <span className="text-xs text-slate-300 font-medium">
            {totalVolumenM3} m³ puesto en obra / Conductor asignado
          </span>
        </div>
        <div className="text-right">
          {loading ? (
            <>
              <ShimmerSkeleton className="h-8 w-32 ml-auto" />
              <ShimmerSkeleton className="h-3 w-28 ml-auto mt-1" />
            </>
          ) : (
            <>
              <span className="text-2xl font-black text-amber-400 font-mono block">
                S/ {quote?.grandTotal.toFixed(2) ?? '0.00'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Moneda Nacional (PEN)</span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:text-white hover:bg-slate-850 transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer"
        >
          Cerrar
        </button>
        {onApply && (
          <button
            type="button"
            onClick={onApply}
            disabled={loading || !quote}
            className="flex-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-slate-950 font-black shadow-lg shadow-amber-500/20 transition-[color,background-color,border-color,opacity,transform,box-shadow] flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
          >
            <Check className="h-4 w-4" />
            <span>{isAdmin ? 'Aplicar cotización al pedido' : 'Solicitar este pedido'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
