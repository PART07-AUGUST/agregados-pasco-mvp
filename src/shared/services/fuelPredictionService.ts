import { apiClient } from './apiClient';
import type {
  EstimacionDieselRequestDto,
  EstimacionDieselResponseDto,
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
}

export class FuelPredictionService {
  static async predictOnline(input: FuelPredictionInput): Promise<FuelPredictionResult> {
    const payload: EstimacionDieselRequestDto = {
      distancia_km: input.distanciaKm,
      desnivel_metros: input.desnivelMetros,
      peso_carga_ton: input.pesoCargaTon,
      cantidad_viajes: input.cantidadViajes ?? 1,
    };
    const response = await apiClient.post<EstimacionDieselResponseDto>(
      '/ml/estimaciones',
      payload
    );

    return {
      consumoDieselGalones: Number(response.consumo_estimado_galones),
      costoEstimadoSoles: Number(response.costo_estimado_pen),
      emisionesCo2Kg: Number(response.emisiones_co2_kg),
      precioGalonSoles: Number(response.precio_galon_referencial_pen),
      r2Score: response.r2_score == null ? null : Number(response.r2_score),
      modeloVersion: response.modelo_version,
      algoritmo: response.algoritmo,
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
