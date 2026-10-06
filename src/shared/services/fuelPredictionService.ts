import { supabase } from './supabase';

export interface FuelPredictionInput {
  distanciaKm: number;
  desnivelMetros: number;
  pesoCargaTon: number;
}

export interface FuelPredictionResult {
  consumoDieselGalones: number;
  costoEstimadoSoles: number;
  emisionesCo2Kg: number;
  precioGalonSoles: number;
  r2Score: number;
}

export interface MLModelParams {
  intercepto: number;
  coefDistanciaKm: number;
  coefDesnivelMetros: number;
  coefPesoCargaTon: number;
  r2Score: number;
  maeGalones: number;
  totalViajesEntrenados: number;
  actualizadoEn: string;
}

const DEFAULT_PARAMS: MLModelParams = {
  intercepto: 0.021927,
  coefDistanciaKm: 0.288902,
  coefDesnivelMetros: 0.000714,
  coefPesoCargaTon: 0.040514,
  r2Score: 0.9788,
  maeGalones: 0.289,
  totalViajesEntrenados: 500,
  actualizadoEn: '2026-09-30T19:47:00Z',
};

const PRECIO_DIESEL_PASCO_SOL = 17.50;
const FACTOR_EMISION_CO2_POR_GALON = 10.21;

let activeParams: MLModelParams = DEFAULT_PARAMS;
let isLoaded = false;

export class FuelPredictionService {
  static getActiveParams(): MLModelParams {
    return activeParams;
  }

  static async loadActiveParams(): Promise<MLModelParams> {
    if (isLoaded) {
      return activeParams;
    }

    try {
      const { data, error } = await supabase
        .from('ml_parametros')
        .select('*')
        .eq('id', 'diesel_model_v1')
        .maybeSingle();

      if (!error && data) {
        activeParams = {
          intercepto: Number(data.intercepto),
          coefDistanciaKm: Number(data.coef_distancia_km),
          coefDesnivelMetros: Number(data.coef_desnivel_metros),
          coefPesoCargaTon: Number(data.coef_peso_carga_ton),
          r2Score: Number(data.r2_score),
          maeGalones: Number(data.mae_galones),
          totalViajesEntrenados: Number(data.total_viajes_entrenados),
          actualizadoEn: String(data.actualizado_en),
        };
        isLoaded = true;
      }
    } catch {
      activeParams = DEFAULT_PARAMS;
    }

    return activeParams;
  }

  static predict(input: FuelPredictionInput): FuelPredictionResult {
    const { distanciaKm, desnivelMetros, pesoCargaTon } = input;
    const params = activeParams;

    const rawPrediction =
      params.intercepto +
      distanciaKm * params.coefDistanciaKm +
      desnivelMetros * params.coefDesnivelMetros +
      pesoCargaTon * params.coefPesoCargaTon;

    const consumoDieselGalones = Math.max(0.5, Math.round(rawPrediction * 100) / 100);
    const costoEstimadoSoles = Math.round(consumoDieselGalones * PRECIO_DIESEL_PASCO_SOL * 100) / 100;
    const emisionesCo2Kg = Math.round(consumoDieselGalones * FACTOR_EMISION_CO2_POR_GALON * 100) / 100;

    return {
      consumoDieselGalones,
      costoEstimadoSoles,
      emisionesCo2Kg,
      precioGalonSoles: PRECIO_DIESEL_PASCO_SOL,
      r2Score: params.r2Score,
    };
  }

  static estimateTripParams(volumenM3: number): FuelPredictionInput {
    const densidadEstimadaTonM3 = 1.45;
    const pesoCargaTon = Math.max(1, Math.round(volumenM3 * densidadEstimadaTonM3 * 10) / 10);
    const distanciaKm = 24.5;
    const desnivelMetros = 140;

    return {
      distanciaKm,
      desnivelMetros,
      pesoCargaTon,
    };
  }
}

export const fuelPredictionService = FuelPredictionService;
