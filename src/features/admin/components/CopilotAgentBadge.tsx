import type { AgentRole } from '../agents/types';
import { AGENT_VISUAL_META, DEFAULT_AGENT_VISUAL_META } from './agentVisualMeta';

interface CopilotAgentBadgeProps {
  agente: AgentRole;
}

export function CopilotAgentBadge({ agente }: CopilotAgentBadgeProps) {
  const meta = AGENT_VISUAL_META[agente] ?? DEFAULT_AGENT_VISUAL_META;
  const Icono = meta.icono;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 mb-1.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wide ${meta.claseBadge}`}
    >
      <Icono className="h-2.5 w-2.5" />
      {meta.etiqueta}
    </span>
  );
}

export default CopilotAgentBadge;
