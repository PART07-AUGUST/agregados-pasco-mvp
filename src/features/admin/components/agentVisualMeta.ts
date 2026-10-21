import { Bot, Fuel, Truck, Package, MapPinned, type LucideIcon } from 'lucide-react';
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
  ORQUESTADOR: {
    etiqueta: 'Orquestador',
    icono: Bot,
    claseBadge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    claseIcono: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  },
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
  GESTION_PEDIDOS: {
    etiqueta: 'Gestión de Pedidos',
    icono: Package,
    claseBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    claseIcono: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  RUTAS_MAPAS: {
    etiqueta: 'Rutas y Maps',
    icono: MapPinned,
    claseBadge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    claseIcono: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  },
  SUPERVISOR: {
    etiqueta: 'Orquestador (compatibilidad)',
    icono: Bot,
    claseBadge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    claseIcono: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  },
};
