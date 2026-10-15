import { AlertCircle, Fuel, Leaf, Loader2, Sparkles } from 'lucide-react';
import type { FuelPredictionResult } from '../services/fuelPredictionService';
import { ShimmerSkeleton } from './ShimmerSkeleton';

interface FuelPredictionCardProps {
  routeLoading: boolean;
  routeMessage?: string | null;
  prediction: FuelPredictionResult | null;
  predictionLoading: boolean;
  predictionError: string | null;
}

export function FuelPredictionCard({
  routeLoading,
  routeMessage,
  prediction,
  predictionLoading,
  predictionError,
}: FuelPredictionCardProps) {
  const isLoading = routeLoading || predictionLoading;

  return (
    <div
      aria-busy={isLoading}
      className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Estimación Inteligente de Combustible (ML)</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isLoading && !prediction ? (
            <ShimmerSkeleton className="h-4 w-16" />
          ) : (
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              R² {prediction ? `${(prediction.r2Score * 100).toFixed(1)}%` : '--'}
            </span>
          )}
          {isLoading && !prediction ? (
            <ShimmerSkeleton className="h-4 w-20" />
          ) : prediction ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              prediction.source === 'backend'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {prediction.source === 'backend' ? 'Backend ML' : 'Fallback local'}
            </span>
          ) : null}
        </div>
      </div>

      {routeLoading && (
        <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" /> Calculando ruta para la predicción...
        </p>
      )}
      {predictionLoading && !routeLoading && (
        <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" /> Consultando modelo ML...
        </p>
      )}
      {routeMessage && (
        <p className="text-[10px] text-amber-300 flex items-start gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" /> {routeMessage}
        </p>
      )}
      {prediction?.source === 'fallback' && (
        <p className="text-[10px] text-amber-300 flex items-start gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" /> Predicción local de contingencia; el backend no respondió.
        </p>
      )}
      {predictionError && (
        <p className="text-[10px] text-rose-300 flex items-start gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" /> {predictionError}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-950/60 p-2 rounded-xl border border-amber-500/10">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Fuel className="h-3 w-3 text-amber-400" /> Diésel
          </span>
          {isLoading && !prediction ? (
            <ShimmerSkeleton className="h-4 w-16 mx-auto mt-1" />
          ) : (
            <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">
              {prediction ? `${prediction.consumoDieselGalones} gal` : '--'}
            </p>
          )}
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-amber-500/10">
          <span className="text-[10px] text-slate-400">Costo Est.</span>
          {isLoading && !prediction ? (
            <ShimmerSkeleton className="h-4 w-16 mx-auto mt-1" />
          ) : (
            <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
              {prediction ? `S/ ${prediction.costoEstimadoSoles}` : '--'}
            </p>
          )}
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-amber-500/10">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Leaf className="h-3 w-3 text-emerald-400" /> CO₂ Est.
          </span>
          {isLoading && !prediction ? (
            <ShimmerSkeleton className="h-4 w-16 mx-auto mt-1" />
          ) : (
            <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
              {prediction ? `${prediction.emisionesCo2Kg} kg` : '--'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
