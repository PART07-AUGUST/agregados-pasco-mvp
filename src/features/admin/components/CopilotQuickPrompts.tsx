import { AlertTriangle, Truck, ClipboardList, Fuel } from 'lucide-react';

interface CopilotQuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled: boolean;
}

const QUICK_PROMPTS = [
  {
    icon: AlertTriangle,
    label: 'Anomalías de diésel (ML)',
    text: '¿Detectas anomalías o sobrecostos de combustible en los viajes recientes según el modelo ML?',
  },
  {
    icon: Truck,
    label: 'Flota disponible',
    text: '¿Cuáles volquetes están libres y disponibles para despacho en este momento?',
  },
  {
    icon: ClipboardList,
    label: 'Pedidos pendientes',
    text: '¿Cuántos pedidos de obra están pendientes y qué volumen total requieren?',
  },
  {
    icon: Fuel,
    label: 'Fórmula diésel Pasco',
    text: '¿Cómo calcula el modelo ML el consumo de diésel para Cerro de Pasco?',
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
            onClick={() => onSelectPrompt(item.text)}
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
