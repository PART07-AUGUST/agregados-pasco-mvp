export interface VehiculoResponseDto {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  capacidad_m3: number | string;
  conductor_id: string | null;
  activo: boolean;
  created_at: string;
}

export interface VehiculoCreateDto {
  placa: string;
  marca: string;
  modelo: string;
  capacidad_m3: number;
  conductor_id?: string | null;
  activo?: boolean;
}

export interface VehiculoUpdateDto {
  placa?: string;
  marca?: string;
  modelo?: string;
  capacidad_m3?: number;
  conductor_id?: string | null;
  activo?: boolean;
}
