import { FuelPredictionService, type FuelPredictionResult } from '../../../../shared/services/fuelPredictionService';
import type { AgentContext, IAgentTool, ToolResult } from '../types';

export class CalculadoraDieselTool implements IAgentTool {
  readonly nombre = 'calculadora_diesel_ml';
  readonly descripcion = 'Calcula consumo de diésel, costo y emisiones con el modelo ML vigente.';

  async ejecutar(parametros: Record<string, unknown>, contexto: AgentContext): Promise<ToolResult<FuelPredictionResult>> {
    const distanciaKm = Number(parametros.distanciaKm);
    const desnivelMetros = Number(parametros.desnivelMetros ?? 0);
    const pesoCargaTon = Number(parametros.pesoCargaTon ?? 18.5);

    if (!Number.isFinite(distanciaKm) || distanciaKm <= 0) {
      return {
        exito: false,
        error: 'La distancia debe ser un número mayor a cero.',
        observacion: 'Validación fallida: distanciaKm debe ser mayor a 0 km.',
      };
    }

    if (!Number.isFinite(pesoCargaTon) || pesoCargaTon <= 0) {
      return {
        exito: false,
        error: 'El peso de carga debe ser un número mayor a cero.',
        observacion: 'Validación fallida: pesoCargaTon debe ser mayor a 0 toneladas.',
      };
    }

    if (!Number.isFinite(desnivelMetros)) {
      return {
        exito: false,
        error: 'El desnivel debe ser numérico.',
        observacion: 'Validación fallida: desnivelMetros no es numérico.',
      };
    }

    const pred = FuelPredictionService.predict({ distanciaKm, desnivelMetros, pesoCargaTon });
    const r2 = (contexto.mlParams.r2Score * 100).toFixed(1);

    return {
      exito: true,
      datos: pred,
      observacion: `Consumo proyectado: ${pred.consumoDieselGalones} gal | Costo: S/ ${pred.costoEstimadoSoles} | CO2: ${pred.emisionesCo2Kg} kg (modelo R² ${r2}%).`,
    };
  }
}

export const calculadoraDieselTool = new CalculadoraDieselTool();
