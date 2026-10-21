import { apiClient } from './apiClient';
import type {
  EstimacionDieselRequestDto,
  EstimacionDieselResponseDto,
  MlComparacionPrediccionesDto,
} from '../types/api/mlDto';

const ESTIMATED_DENSITY_TON_PER_M3 = 1.45;

export interface FuelPredictionInput {
  distanciaKm: number;
  desnivelMetros: number;
  pesoCargaTon: number;
  cantidadViajes?: number;
}

export interface FuelPredictionResult {
  consumoDieselGalones: number;
  costoEstimadoSoles: number;
  emisionesCo2Kg: number;
  precioGalonSoles: number;
  r2Score: number | null;
  modeloVersion: string;
  algoritmo: string;
  prediccionesModelos?: Array<{
    algoritmo: string;
    version: string;
    consumoDieselGalones: number;
  }>;
}

export class FuelPredictionService {
  static async predictOnline(
    input: FuelPredictionInput,
    compareModels = false
  ): Promise<FuelPredictionResult> {
    const payload: EstimacionDieselRequestDto = {
      distancia_km: input.distanciaKm,
      desnivel_metros: input.desnivelMetros,
      peso_carga_ton: input.pesoCargaTon,
      cantidad_viajes: input.cantidadViajes ?? 1,
    };
    let estimate: EstimacionDieselResponseDto | null;
    let predictions: MlComparacionPrediccionesDto['predicciones'] = [];
    if (compareModels) {
      const comparison = await apiClient.post<MlComparacionPrediccionesDto>(
        '/ml/comparacion/predicciones',
        payload
      );
      estimate = comparison.estimacion_activa;
      predictions = comparison.predicciones;
    } else {
      estimate = await apiClient.post<EstimacionDieselResponseDto>('/ml/estimaciones', payload);
    }
    if (!estimate) throw new Error('No hay un modelo activo para estimar combustible.');

    return {
      consumoDieselGalones: Number(estimate.consumo_estimado_galones),
      costoEstimadoSoles: Number(estimate.costo_estimado_pen),
      emisionesCo2Kg: Number(estimate.emisiones_co2_kg),
      precioGalonSoles: Number(estimate.precio_galon_referencial_pen),
      r2Score: estimate.r2_score == null ? null : Number(estimate.r2_score),
      modeloVersion: estimate.modelo_version,
      algoritmo: estimate.algoritmo,
      ...(compareModels
        ? {
            prediccionesModelos: predictions.map((prediction) => ({
              algoritmo: prediction.algoritmo,
              version: prediction.version,
              consumoDieselGalones: Number(prediction.consumo_estimado_galones),
            })),
          }
        : {}),
    };
  }

  static estimateTripParams(
    volumenM3: number,
    capacidadM3: number = volumenM3
  ): Pick<FuelPredictionInput, 'pesoCargaTon'> {
    const volumenPorViaje = Math.min(volumenM3, capacidadM3);
    const pesoSinRedondear = volumenPorViaje * ESTIMATED_DENSITY_TON_PER_M3;
    const pesoCargaTon = Math.round((pesoSinRedondear + Number.EPSILON) * 100) / 100;
    return { pesoCargaTon };
  }
}

export const fuelPredictionService = FuelPredictionService;
