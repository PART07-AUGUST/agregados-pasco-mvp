export interface EstimacionDieselRequestDto {
  distancia_km: number;
  desnivel_metros: number;
  peso_carga_ton: number;
  cantidad_viajes?: number;
}

export interface EstimacionDieselResponseDto {
  consumo_estimado_galones: string | number;
  costo_estimado_pen: string | number;
  emisiones_co2_kg: string | number;
  distancia_km: string | number;
  desnivel_metros: string | number;
  peso_carga_ton: string | number;
  precio_galon_referencial_pen: string | number;
  modelo_version: string;
  algoritmo: string;
  r2_score: string | number | null;
}

export interface MlModeloComparadoDto {
  version: string;
  algoritmo: string;
  mae_galones: string | number;
  rmse_galones: string | number;
  r2_score: string | number | null;
  total_viajes_entrenados: number;
  activo: boolean;
  es_referencia: boolean;
}

export interface MlComparacionDto {
  version: string | null;
  modelos: MlModeloComparadoDto[];
  modelo_activo: MlModeloComparadoDto | null;
}

export interface MlComparacionPrediccionesDto {
  predicciones: Array<{
    algoritmo: string;
    consumo_estimado_galones: string | number;
  }>;
}
