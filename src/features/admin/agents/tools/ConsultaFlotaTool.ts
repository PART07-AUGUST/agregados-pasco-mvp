import type { AgentContext, IAgentTool, ToolResult } from '../types';

export interface ResumenFlota {
  totalVehiculos: number;
  vehiculosDisponibles: number;
  vehiculosEnRuta: number;
  viajesActivos: number;
}

export class ConsultaFlotaTool implements IAgentTool {
  readonly nombre = 'consulta_flota_disponibilidad';
  readonly descripcion = 'Devuelve volquetes activos, disponibles y en ruta.';

  async ejecutar(_parametros: Record<string, unknown>, contexto: AgentContext): Promise<ToolResult<ResumenFlota>> {
    const { snapshot } = contexto;
    const resumen: ResumenFlota = {
      totalVehiculos: snapshot.totalVehiculos,
      vehiculosDisponibles: snapshot.vehiculosDisponibles,
      vehiculosEnRuta: snapshot.vehiculosEnRuta,
      viajesActivos: snapshot.viajesActivos,
    };

    return {
      exito: true,
      datos: resumen,
      observacion: `Flota: ${resumen.totalVehiculos} volquetes | Disponibles: ${resumen.vehiculosDisponibles} | En ruta: ${resumen.vehiculosEnRuta} | Viajes en curso: ${resumen.viajesActivos}.`,
    };
  }
}

export const consultaFlotaTool = new ConsultaFlotaTool();
