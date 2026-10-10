export interface PedidoResponseDto {
  id: string;
  cliente_id: string;
  material: string;
  volumen_m3: number | string;
  destino: string;
  estado: string;
  created_at: string;
}

export interface PedidoCreateDto {
  cliente_id: string;
  material: string;
  volumen_m3: number;
  destino: string;
}

export interface PedidoUpdateDto {
  estado?: string;
  material?: string;
  volumen_m3?: number;
  destino?: string;
}
