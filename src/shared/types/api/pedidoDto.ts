export interface PedidoResponseDto {
  id: string;
  cliente_id: string;
  material: string;
  volumen_m3: number | string;
  destino: string;
  estado: string;
  created_at: string;
  distancia_km?: number | string | null;
  desnivel_metros?: number | string | null;
  cantera_origen?: string | null;
}

export interface PedidoCreateDto {
  cliente_id: string;
  material: string;
  volumen_m3: number;
  destino: string;
  distancia_km?: number | null;
  desnivel_metros?: number | null;
  cantera_origen?: string | null;
}

export interface PedidoUpdateDto {
  estado?: string;
  material?: string;
  volumen_m3?: number;
  destino?: string;
  distancia_km?: number | null;
  desnivel_metros?: number | null;
  cantera_origen?: string | null;
}
