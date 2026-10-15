import { AlertCircle, Fuel, Leaf, Loader2, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FuelPredictionResult } from '../services/fuelPredictionService';
import { ShimmerSkeleton } from './ShimmerSkeleton';

interface FuelPredictionCardProps {
  routeLoading: boolean;
  routeMessage?: string | null;
  prediction: FuelPredictionResult | null;
  predictionLoading: boolean;
  predictionError: string | null;
}

interface MetricCellProps {
  icon?: ReactNode;
  label: ReactNode;
  value: string;
  valueClassName: string;
  showSkeleton: boolean;
}

function ModelBadges({
  isLoading,
  prediction,
}: Pick<FuelPredictionCardProps, 'prediction'> & { isLoading: boolean }) {
  if (isLoading && !prediction) {
    return (
      <>
        <ShimmerSkeleton className="h-4 w-16" />
        <ShimmerSkeleton className="h-4 w-20" />
      </>
    );
  }

  return (
    <>
      <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
        R² {prediction ? `${(prediction.r2Score * 100).toFixed(1)}%` : '--'}
      </span>
      {prediction && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            prediction.source === 'backend'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}
        >
          {prediction.source === 'backend' ? 'Backend ML' : 'Fallback local'}
        </span>
      )}
    </>
  );
}

function StatusMessage({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <p className={`text-[10px] flex items-start gap-1.5 ${className}`}>
      <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" /> {children}
    </p>
  );
}

function MetricCell({
  icon,
  label,
  value,
  valueClassName,
  showSkeleton,
}: MetricCellProps) {
  return (
    <div className="bg-slate-950/60 p-2 rounded-xl border border-amber-500/10">
      <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
        {icon}
        {label}
      </span>
      {showSkeleton ? (
        <ShimmerSkeleton className="h-4 w-16 mx-auto mt-1" />
      ) : (
        <p className={`text-xs font-mono font-bold mt-0.5 ${valueClassName}`}>{value}</p>
      )}
    </div>
  );
}

export function FuelPredictionCard({
  routeLoading,
  routeMessage,
  prediction,
  predictionLoading,
  predictionError,
}: FuelPredictionCardProps) {
  const isLoading = routeLoading || predictionLoading;
  const showSkeleton = isLoading && !prediction;

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
          <ModelBadges isLoading={isLoading} prediction={prediction} />
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
      {routeMessage && <StatusMessage className="text-amber-300">{routeMessage}</StatusMessage>}
      {prediction?.source === 'fallback' && (
        <StatusMessage className="text-amber-300">
          Predicción local de contingencia; el backend no respondió.
        </StatusMessage>
      )}
      {predictionError && (
        <StatusMessage className="text-rose-300">{predictionError}</StatusMessage>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <MetricCell
          icon={<Fuel className="h-3 w-3 text-amber-400" />}
          label="Diésel"
          value={prediction ? `${prediction.consumoDieselGalones} gal` : '--'}
          valueClassName="text-amber-400"
          showSkeleton={showSkeleton}
        />
        <MetricCell
          label="Costo Est."
          value={prediction ? `S/ ${prediction.costoEstimadoSoles}` : '--'}
          valueClassName="text-slate-200"
          showSkeleton={showSkeleton}
        />
        <MetricCell
          icon={<Leaf className="h-3 w-3 text-emerald-400" />}
          label="CO₂ Est."
          value={prediction ? `${prediction.emisionesCo2Kg} kg` : '--'}
          valueClassName="text-emerald-400"
          showSkeleton={showSkeleton}
        />
      </div>
    </div>
  );
}
