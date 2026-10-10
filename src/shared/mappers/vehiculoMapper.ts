import type { Vehiculo } from '../types';
import type {
  VehiculoResponseDto,
  VehiculoCreateDto,
  VehiculoUpdateDto,
} from '../types/api/vehiculoDto';
import type { VehiculoConConductor } from '../services/vehiclesService';

export const vehiculoMapper = {
  toDomain(dto: VehiculoResponseDto, conductorNombre?: string): VehiculoConConductor {
    return {
      id: dto.id,
      placa: dto.placa,
      marca: dto.marca,
      modelo: dto.modelo,
      capacidadM3: Number(dto.capacidad_m3),
      conductorId: dto.conductor_id ?? undefined,
      activo: dto.activo,
      conductorNombre: conductorNombre || (dto.conductor_id ? 'Conductor Asignado' : 'Sin conductor asignado'),
      createdAt: dto.created_at,
    };
  },

  toCreateDto(domain: Omit<Vehiculo, 'id'>): VehiculoCreateDto {
    return {
      placa: domain.placa.trim().toUpperCase(),
      marca: domain.marca.trim(),
      modelo: domain.modelo.trim(),
      capacidad_m3: domain.capacidadM3,
      conductor_id: domain.conductorId || null,
      activo: domain.activo,
    };
  },

  toUpdateDto(domain: Partial<Vehiculo>): VehiculoUpdateDto {
    const dto: VehiculoUpdateDto = {};
    if (domain.placa !== undefined) dto.placa = domain.placa.trim().toUpperCase();
    if (domain.marca !== undefined) dto.marca = domain.marca.trim();
    if (domain.modelo !== undefined) dto.modelo = domain.modelo.trim();
    if (domain.capacidadM3 !== undefined) dto.capacidad_m3 = domain.capacidadM3;
    if (domain.conductorId !== undefined) dto.conductor_id = domain.conductorId || null;
    if (domain.activo !== undefined) dto.activo = domain.activo;
    return dto;
  },
};
