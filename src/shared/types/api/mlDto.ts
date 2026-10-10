export interface EstimacionDieselRequestDto {
  distancia_km: number;
  desnivel_metros: number;
  peso_carga_ton: number;
}

export interface EstimacionDieselResponseDto {
  consumo_estimado_galones: string | number;
  costo_estimado_pen: string | number;
  distancia_km: string | number;
  desnivel_metros: string | number;
  peso_carga_ton: string | number;
  precio_galon_referencial_pen: string | number;
  modelo_version: string;
}

export interface MLParametrosDto {
  id: string;
  intercepto: string | number;
  coef_distancia_km: string | number;
  coef_desnivel_metros: string | number;
  coef_peso_carga_ton: string | number;
  r2_score: string | number;
  mae_galones: string | number;
  total_viajes_entrenados: number;
  actualizado_en: string;
}
