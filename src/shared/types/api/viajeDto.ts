export interface ViajeResponseDto {
  id: string;
  pedido_id: string;
  vehiculo_id: string;
  conductor_id: string;
  estado: string;
  peso_entrada_kg?: number | string | null;
  peso_salida_kg?: number | string | null;
  ticket_balanza_url?: string | null;
  fecha_asignacion: string;
  fecha_entrega?: string | null;
  distancia_km?: number | string | null;
  desnivel_metros?: number | string | null;
  cantera_origen?: string | null;
  fuente_ruta?: 'graphhopper' | 'aproximada' | 'legacy';
  volumen_carga_estimado_m3?: number | string | null;
  consumo_diesel_estimado?: number | string | null;
  costo_diesel_estimado_pen?: number | string | null;
  precio_galon_aplicado_pen?: number | string | null;
  ml_modelo_version?: string | null;
  consumo_diesel_real?: number | string | null;
}

export interface ViajeCreateDto {
  pedido_id: string;
  vehiculo_id: string;
  conductor_id: string;
  distancia_km?: number | null;
  desnivel_metros?: number | null;
  cantera_origen?: string | null;
  fuente_ruta?: 'graphhopper' | 'aproximada' | 'legacy';
}

export interface ViajeUpdateDto {
  estado?: string;
  peso_entrada_kg?: number | null;
  peso_salida_kg?: number | null;
  ticket_balanza_url?: string | null;
  fecha_entrega?: string | null;
  consumo_diesel_real?: number | null;
}
