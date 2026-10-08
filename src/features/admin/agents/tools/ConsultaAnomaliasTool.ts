import type { FuelAnomaly } from '../../../../shared/services/adminLogisticsContextService';
import type { AgentContext, IAgentTool, ToolResult } from '../types';

export class ConsultaAnomaliasTool implements IAgentTool {
  readonly nombre = 'consulta_anomalias_ml';
  readonly descripcion = 'Lista viajes con consumo real mayor al 15% de lo estimado por el modelo ML.';

  async ejecutar(parametros: Record<string, unknown>, contexto: AgentContext): Promise<ToolResult<FuelAnomaly[]>> {
    const limiteSolicitado = Number(parametros.limite ?? 3);
    const limite = Number.isFinite(limiteSolicitado) ? Math.min(10, Math.max(1, limiteSolicitado)) : 3;
    const anomalias = contexto.snapshot.anomaliasCombustible.slice(0, limite);

    if (anomalias.length === 0) {
      return {
        exito: true,
        datos: [],
        observacion: 'Auditoría conforme: no hay viajes con sobreconsumo mayor al 15%.',
      };
    }

    const resumen = anomalias
      .map((a) => `Viaje #${a.viajeId} (${a.cantera}): real ${a.consumoReal} gal vs est. ${a.consumoEstimado} gal (+${a.porcentajeExceso}%)`)
      .join('; ');

    return {
      exito: true,
      datos: anomalias,
      observacion: `${anomalias.length} anomalías detectadas: ${resumen}.`,
    };
  }
}

export const consultaAnomaliasTool = new ConsultaAnomaliasTool();
