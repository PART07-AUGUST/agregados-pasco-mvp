import { Bot, Sparkles } from 'lucide-react';

interface CopilotTriggerButtonProps {
  onClick: () => void;
  remainingQuota?: number;
  showQuota?: boolean;
}

export function CopilotTriggerButton({
  onClick,
  remainingQuota,
  showQuota = false,
}: CopilotTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir Copiloto de Inteligencia Artificial"
      className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-colors cursor-pointer flex items-center gap-2.5 border border-amber-400/40 group"
    >
      <div className="relative">
        <Bot className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
        </span>
      </div>

      <div className="flex flex-col text-left">
        <span className="text-[11px] font-black tracking-tight flex items-center gap-1">
          SIS-COPILOT
          <Sparkles className="h-3 w-3 text-slate-950" />
        </span>
        <span className="text-[9px] font-mono font-semibold text-slate-900/80">
          {showQuota && typeof remainingQuota === 'number'
            ? `${remainingQuota} consultas hoy`
            : 'Asistente Operativo'}
        </span>
      </div>
    </button>
  );
}

export default CopilotTriggerButton;
