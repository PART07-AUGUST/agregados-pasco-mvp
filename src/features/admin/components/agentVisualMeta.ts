import { Bot, Fuel, Truck, type LucideIcon } from 'lucide-react';
import type { AgentRole } from '../agents/types';

export interface AgentVisualMeta {
  etiqueta: string;
  icono: LucideIcon;
  claseBadge: string;
  claseIcono: string;
}

export const DEFAULT_AGENT_VISUAL_META: AgentVisualMeta = {
  etiqueta: 'Agente',
  icono: Bot,
  claseBadge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  claseIcono: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export const AGENT_VISUAL_META: Record<AgentRole, AgentVisualMeta> = {
  AUDITOR_ML: {
    etiqueta: 'Auditor ML',
    icono: Fuel,
    claseBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    claseIcono: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  FLOTA_DESPACHO: {
    etiqueta: 'Flota y Despacho',
    icono: Truck,
    claseBadge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    claseIcono: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  SUPERVISOR: {
    etiqueta: 'Supervisor',
    icono: Bot,
    claseBadge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    claseIcono: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  },
};
