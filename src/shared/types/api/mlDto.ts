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
  total_rutas_graphhopper?: number;
  total_rutas_legacy?: number;
  rutas_aproximadas_excluidas?: number;
  activo: boolean;
  es_referencia: boolean;
  mae_prueba_final_galones?: string | number | null;
  rmse_prueba_final_galones?: string | number | null;
  r2_prueba_final?: string | number | null;
  produccion_mae_galones?: string | number | null;
  produccion_rmse_galones?: string | number | null;
  viajes_produccion?: number;
}

export interface MlComparacionDto {
  version: string | null;
  modelos: MlModeloComparadoDto[];
  modelo_activo: MlModeloComparadoDto | null;
  ultimo_reentrenamiento: {
    estado: string;
    creado_en: string;
    terminado_en: string | null;
    error: string | null;
  } | null;
}

export interface MlComparacionPrediccionesDto {
  predicciones: Array<{
    algoritmo: string;
    version: string;
    consumo_estimado_galones: string | number;
  }>;
  estimacion_activa: EstimacionDieselResponseDto | null;
}
