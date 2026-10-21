import { supabase } from './supabase';

export interface FuelAnomaly {
  viajeId: string;
  cantera: string;
  distanciaKm: number;
  consumoEstimado: number;
  consumoReal: number;
  excesoGalones: number;
  porcentajeExceso: number;
}

export interface LogisticsSnapshot {
  totalVehiculos: number;
  vehiculosDisponibles: number;
  vehiculosEnRuta: number;
  totalConductores: number;
  conductoresDisponibles: number;
  conductoresEnRuta: number;
  viajesActivos: number;
  pedidosPendientes: number;
  anomaliasCombustible: FuelAnomaly[];
}

export class AdminLogisticsContextService {
  static async getLiveSnapshot(): Promise<LogisticsSnapshot> {
    try {
      const [
        { data: vehiculos },
        { data: conductores },
        { data: viajesActivos },
        { data: pedidosPendientes },
        { data: viajesRecientes },
      ] = await Promise.all([
        supabase.from('vehiculos').select('id, placa, activo').eq('activo', true),
        supabase.from('usuarios').select('id, nombre').eq('rol', 'CONDUCTOR'),
        supabase.from('viajes').select('id, vehiculo_id, conductor_id, estado').in('estado', ['PENDIENTE', 'EN_CAMINO', 'EN_BALANZA']),
        supabase.from('pedidos').select('id, estado').eq('estado', 'PENDIENTE'),
        supabase
          .from('viajes')
          .select('id, cantera_origen, distancia_km, consumo_diesel_estimado, consumo_diesel_real, estado')
          .not('consumo_diesel_real', 'is', null)
          .not('consumo_diesel_estimado', 'is', null)
          .order('fecha_asignacion', { ascending: false })
          .limit(20),
      ]);

      const totalVehiculos = vehiculos?.length ?? 0;
      const vehiculosOcupadosIds = new Set(viajesActivos?.map((v) => v.vehiculo_id) ?? []);
      const vehiculosDisponibles = (vehiculos ?? []).filter((v) => !vehiculosOcupadosIds.has(v.id)).length;
      const vehiculosEnRuta = vehiculosOcupadosIds.size;

      const totalConductores = conductores?.length ?? 0;
      const conductoresOcupadosIds = new Set(
        viajesActivos?.map((v) => v.conductor_id).filter(Boolean) ?? []
      );
      const conductoresDisponibles = (conductores ?? []).filter((c) => !conductoresOcupadosIds.has(c.id)).length;
      const conductoresEnRuta = conductoresOcupadosIds.size;

      const anomaliasCombustible: FuelAnomaly[] = [];

      (viajesRecientes ?? []).forEach((row) => {
        const est = Number(row.consumo_diesel_estimado);
        const real = Number(row.consumo_diesel_real);
        if (est > 0 && real > est * 1.15) {
          const excesoGalones = Math.round((real - est) * 100) / 100;
          const porcentajeExceso = Math.round(((real - est) / est) * 100);
          anomaliasCombustible.push({
            viajeId: row.id.slice(0, 8),
            cantera: row.cantera_origen || 'No especificada',
            distanciaKm: Number(row.distancia_km || 0),
            consumoEstimado: est,
            consumoReal: real,
            excesoGalones,
            porcentajeExceso,
          });
        }
      });

      return {
        totalVehiculos,
        vehiculosDisponibles,
        vehiculosEnRuta,
        totalConductores,
        conductoresDisponibles,
        conductoresEnRuta,
        viajesActivos: viajesActivos?.length ?? 0,
        pedidosPendientes: pedidosPendientes?.length ?? 0,
        anomaliasCombustible,
      };
    } catch {
      return {
        totalVehiculos: 0,
        vehiculosDisponibles: 0,
        vehiculosEnRuta: 0,
        totalConductores: 0,
        conductoresDisponibles: 0,
        conductoresEnRuta: 0,
        viajesActivos: 0,
        pedidosPendientes: 0,
        anomaliasCombustible: [],
      };
    }
  }

  static async buildSystemInstruction(): Promise<string> {
    const snapshot = await this.getLiveSnapshot();

    const anomaliasTexto =
      snapshot.anomaliasCombustible.length === 0
        ? 'No se detectaron anomalías de combustible recientes (todos los viajes se mantienen dentro del rango óptimo del modelo ML).'
        : snapshot.anomaliasCombustible
            .slice(0, 4)
            .map(
              (a) =>
                `• Viaje #${a.viajeId} (${a.cantera}, ${a.distanciaKm}km): Real ${a.consumoReal} gal vs Est. ${a.consumoEstimado} gal (+${a.porcentajeExceso}% / +${a.excesoGalones} gal exceso)`
            )
            .join('\n');

    return `Eres SIS-COPILOT, el asistente de inteligencia artificial para el Administrador de AGREGADOS SIS en Cerro de Pasco, Perú (altitud 4,380 m s.n.m.).
Tu rol es asistir en la toma de decisiones operativas de despacho, flota y control de combustible.
Sé conciso, técnico, profesional y directo. No uses saludos largos.

DATOS OPERATIVOS EN TIEMPO REAL DESDE LA BASE DE DATOS:
- Flota total activa: ${snapshot.totalVehiculos} volquetes.
- Volquetes disponibles para asignación: ${snapshot.vehiculosDisponibles}.
- Volquetes en operación o ruta: ${snapshot.vehiculosEnRuta}.
- Conductores registrados: ${snapshot.totalConductores} conductores.
- Conductores disponibles: ${snapshot.conductoresDisponibles}.
- Conductores en operación o ruta: ${snapshot.conductoresEnRuta}.
- Despachos en curso: ${snapshot.viajesActivos}.
- Pedidos de clientes pendientes de atención: ${snapshot.pedidosPendientes}.
- Auditoría de combustible basada en las estimaciones guardadas en los viajes:
${anomaliasTexto}

REGLAS DE RESPUESTA:
1. Responde siempre en español.
2. Si te preguntan por anomalías o sobrecostos de combustible, menciona los viajes específicos detectados arriba y sugiere posibles causas operativas (pendientes empinadas, ralentí en mina, fugas o estado de trocha).
3. Si te preguntan por el algoritmo o su precisión, explica solo las métricas disponibles en los datos consultados. No inventes una fórmula ni valores de R² o MAE.
4. Mantén las respuestas en un máximo de 3 a 5 oraciones estructuradas.
5. SEGURIDAD ESTRICTA: Tu acceso a la base de datos es exclusivamente de consulta y lectura informativa (SELECT). No tienes permisos ni capacidades para modificar, crear o eliminar tablas, campos o registros.`;
  }
}

export const adminLogisticsContextService = AdminLogisticsContextService;
