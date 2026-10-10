import { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import type { ReActTraceStep } from '../agents/types';
import { AGENT_VISUAL_META, DEFAULT_AGENT_VISUAL_META } from './agentVisualMeta';

interface CopilotTracePanelProps {
  trazas: ReActTraceStep[];
}

const formatearParametros = (parametros?: Record<string, unknown>): string => {
  const entradas = Object.entries(parametros ?? {});
  if (entradas.length === 0) {
    return 'sin parámetros';
  }
  return entradas.map(([clave, valor]) => `${clave}=${String(valor)}`).join(', ');
};

function TraceStepItem({ traza }: { traza: ReActTraceStep }) {
  const meta = AGENT_VISUAL_META[traza.agente] ?? DEFAULT_AGENT_VISUAL_META;
  const exitoso = traza.estado === 'EXITOSO';
  const IconoEstado = exitoso ? CheckCircle2 : AlertTriangle;
  const herramienta = traza.herramientaInvocada || 'herramienta_desconocida';
  const pensamiento = traza.pensamiento || 'Sin pensamiento disponible.';
  const observacion = traza.observacionResumida || 'Sin observación disponible.';

  return (
    <li className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold ${meta.claseBadge}`}>
          Paso {traza.paso} · {meta.etiqueta}
        </span>
        <span className={`flex items-center gap-1 text-[9px] font-mono ${exitoso ? 'text-emerald-400' : 'text-rose-400'}`}>
          <IconoEstado className="h-3 w-3" />
          {traza.estado}
        </span>
      </div>
      <p className="text-[10px] text-slate-300">
        <span className="text-slate-500 font-semibold">Pensamiento: </span>
        {pensamiento}
      </p>
      <p className="text-[10px] text-slate-300 font-mono">
        <span className="text-slate-500 font-semibold font-sans">Acción: </span>
        {herramienta}({formatearParametros(traza.parametrosValidados)})
      </p>
      <p className="text-[10px] text-slate-300">
        <span className="text-slate-500 font-semibold">Observación: </span>
        {observacion}
      </p>
    </li>
  );
}

export function CopilotTracePanel({ trazas }: CopilotTracePanelProps) {
  const [abierto, setAbierto] = useState(false);

  if (trazas.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 pt-2 border-t border-slate-800">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-expanded={abierto}
        className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
      >
        <Search className="h-3 w-3" />
        Ver trazabilidad ReAct ({trazas.length} pasos)
        <ChevronDown className={`h-3 w-3 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <ol className="mt-2 space-y-1.5">
          {trazas.map((traza) => (
            <TraceStepItem key={`${traza.paso}-${traza.herramientaInvocada || 'herramienta'}`} traza={traza} />
          ))}
        </ol>
      )}
    </div>
  );
}

export default CopilotTracePanel;
