import { AlertTriangle, Truck, Calculator, Users } from 'lucide-react';
import type { AgentRole } from '../agents/types';

interface CopilotQuickPromptsProps {
  onSelectPrompt: (prompt: string, agente?: AgentRole) => void;
  disabled: boolean;
}

interface QuickPromptItem {
  icon: typeof AlertTriangle;
  label: string;
  text: string;
  agente?: AgentRole;
}

const QUICK_PROMPTS: QuickPromptItem[] = [
  {
    icon: AlertTriangle,
    label: 'Auditor: Anomalías ML',
    text: '¿Detectas anomalías o sobrecostos de combustible en los viajes recientes según el modelo ML?',
    agente: 'AUDITOR_ML',
  },
  {
    icon: Calculator,
    label: 'Auditor: Cálculo 25 km',
    text: 'Calcula el consumo proyectado para una ruta de 25 km con 80 m de desnivel y 21.75 ton de agregados.',
    agente: 'AUDITOR_ML',
  },
  {
    icon: Truck,
    label: 'Flota: Unidades libres',
    text: '¿Cuáles volquetes están libres y disponibles para despacho y cuántos pedidos tenemos pendientes?',
    agente: 'FLOTA_DESPACHO',
  },
  {
    icon: Users,
    label: 'Comité: Pedido urgente 60 m³',
    text: 'Tengo un pedido urgente de 60 m³ a 22 km en Quiulacocha. ¿Podemos atenderlo hoy con la flota disponible y cuál sería el costo de diésel?',
    agente: 'SUPERVISOR',
  },
];

export function CopilotQuickPrompts({ onSelectPrompt, disabled }: CopilotQuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/70 border-t border-slate-900">
      {QUICK_PROMPTS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(item.text, item.agente)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800/80 text-[10px] text-slate-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icon className="h-3 w-3 text-amber-400 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default CopilotQuickPrompts;
