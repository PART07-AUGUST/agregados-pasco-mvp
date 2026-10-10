import type { AgentContext, IAgentTool, ToolResult } from '../types';

export interface ResumenFlota {
  totalVehiculos: number;
  vehiculosDisponibles: number;
  vehiculosEnRuta: number;
  totalConductores: number;
  conductoresDisponibles: number;
  conductoresEnRuta: number;
  viajesActivos: number;
}

export class ConsultaFlotaTool implements IAgentTool {
  readonly nombre = 'consulta_flota_disponibilidad';
  readonly descripcion = 'Devuelve estado de volquetes y conductores activos, disponibles y en ruta.';

  async ejecutar(_parametros: Record<string, unknown>, contexto: AgentContext): Promise<ToolResult<ResumenFlota>> {
    const { snapshot } = contexto;
    const resumen: ResumenFlota = {
      totalVehiculos: snapshot.totalVehiculos,
      vehiculosDisponibles: snapshot.vehiculosDisponibles,
      vehiculosEnRuta: snapshot.vehiculosEnRuta,
      totalConductores: snapshot.totalConductores,
      conductoresDisponibles: snapshot.conductoresDisponibles,
      conductoresEnRuta: snapshot.conductoresEnRuta,
      viajesActivos: snapshot.viajesActivos,
    };

    return {
      exito: true,
      datos: resumen,
      observacion: `Flota: ${resumen.totalVehiculos} volquetes | Volquetes disponibles: ${resumen.vehiculosDisponibles} | Volquetes en ruta: ${resumen.vehiculosEnRuta} | Conductores registrados: ${resumen.totalConductores} | Conductores disponibles: ${resumen.conductoresDisponibles} | Conductores en ruta: ${resumen.conductoresEnRuta} | Viajes en curso: ${resumen.viajesActivos}.`,
    };
  }
}

export const consultaFlotaTool = new ConsultaFlotaTool();
