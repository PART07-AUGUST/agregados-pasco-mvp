import type { AgentContext, IAgentTool, ToolResult } from '../types';

export interface ResumenPedidos {
  pedidosPendientes: number;
}

export class ConsultaPedidosTool implements IAgentTool {
  readonly nombre = 'consulta_pedidos_pendientes';
  readonly descripcion = 'Devuelve la cantidad de pedidos en estado PENDIENTE.';

  async ejecutar(_parametros: Record<string, unknown>, contexto: AgentContext): Promise<ToolResult<ResumenPedidos>> {
    const pedidosPendientes = contexto.snapshot.pedidosPendientes;
    return {
      exito: true,
      datos: { pedidosPendientes },
      observacion: `${pedidosPendientes} pedidos pendientes de asignación de volquete.`,
    };
  }
}

export const consultaPedidosTool = new ConsultaPedidosTool();
