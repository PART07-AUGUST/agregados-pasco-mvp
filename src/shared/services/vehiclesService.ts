import { apiClient } from './apiClient';
import { driversService } from './driversService';
import { vehiculoMapper } from '../mappers/vehiculoMapper';
import type { Vehiculo } from '../types';
import type { PageResponse } from '../types/api/pageResponse';
import type { VehiculoResponseDto } from '../types/api/vehiculoDto';

export interface VehiculoConConductor extends Vehiculo {
  conductorNombre?: string;
}

export const vehiclesService = {
  async getVehicles(): Promise<VehiculoConConductor[]> {
    const [response, conductors] = await Promise.all([
      apiClient.get<PageResponse<VehiculoResponseDto>>('/vehiculos?page=1&page_size=100'),
      driversService.getConductorOptions().catch(() => []),
    ]);

    const conductorMap = new Map<string, string>();
    conductors.forEach((c) => {
      conductorMap.set(c.id, c.nombre);
    });

    return (response.items || []).map((item) => {
      const conductorNombre = item.conductor_id ? conductorMap.get(item.conductor_id) : undefined;
      return vehiculoMapper.toDomain(item, conductorNombre);
    });
  },

  async createVehicle(vehicle: Omit<Vehiculo, 'id'>): Promise<Vehiculo> {
    const payload = vehiculoMapper.toCreateDto(vehicle);
    const data = await apiClient.post<VehiculoResponseDto>('/vehiculos', payload);
    return vehiculoMapper.toDomain(data);
  },

  async updateVehicle(id: string, vehicle: Partial<Vehiculo>): Promise<Vehiculo> {
    const payload = vehiculoMapper.toUpdateDto(vehicle);
    const data = await apiClient.patch<VehiculoResponseDto>(`/vehiculos/${id}`, payload);
    return vehiculoMapper.toDomain(data);
  },

  async deleteVehicle(id: string): Promise<void> {
    await apiClient.delete<void>(`/vehiculos/${id}`);
  },
};
