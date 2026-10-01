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
}

const INTERCEPT = 0.021927;
const COEF_DISTANCIA_KM = 0.288902;
const COEF_DESNIVEL_METROS = 0.000714;
const COEF_PESO_CARGA_TON = 0.040514;

const PRECIO_DIESEL_PASCO_SOL = 17.50;
const FACTOR_EMISION_CO2_POR_GALON = 10.21;

export class FuelPredictionService {
  static predict(input: FuelPredictionInput): FuelPredictionResult {
    const { distanciaKm, desnivelMetros, pesoCargaTon } = input;

    const rawPrediction =
      INTERCEPT +
      distanciaKm * COEF_DISTANCIA_KM +
      desnivelMetros * COEF_DESNIVEL_METROS +
      pesoCargaTon * COEF_PESO_CARGA_TON;

    const consumoDieselGalones = Math.max(0.5, Math.round(rawPrediction * 100) / 100);
    const costoEstimadoSoles = Math.round(consumoDieselGalones * PRECIO_DIESEL_PASCO_SOL * 100) / 100;
    const emisionesCo2Kg = Math.round(consumoDieselGalones * FACTOR_EMISION_CO2_POR_GALON * 100) / 100;

    return {
      consumoDieselGalones,
      costoEstimadoSoles,
      emisionesCo2Kg,
      precioGalonSoles: PRECIO_DIESEL_PASCO_SOL,
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
