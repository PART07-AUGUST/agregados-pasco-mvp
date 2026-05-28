import { supabase } from './supabase';
import type { Vehiculo } from '../types';

interface VehiculoRow {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  capacidad_m3: number | string;
  conductor_id: string | null;
  activo: boolean;
  usuarios?: Array<{
    nombre: string | null;
  }> | null;
}

export interface VehiculoConConductor extends Vehiculo {
  conductorNombre?: string;
}

function mapVehiculoRow(vehicle: VehiculoRow): VehiculoConConductor {
  return {
    id: vehicle.id,
    placa: vehicle.placa,
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    capacidadM3: Number(vehicle.capacidad_m3),
    conductorId: vehicle.conductor_id ?? undefined,
    activo: vehicle.activo,
    conductorNombre: vehicle.usuarios?.[0]?.nombre || 'Sin conductor asignado',
  };
}

export const vehiclesService = {
  async getVehicles(): Promise<VehiculoConConductor[]> {
    const { data, error } = await supabase
      .from('vehiculos')
      .select(`
        id,
        placa,
        marca,
        modelo,
        capacidad_m3,
        conductor_id,
        activo,
        usuarios:conductor_id (
          nombre
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener vehículos:', error);
      throw error;
    }

    return (data as VehiculoRow[] | null)?.map(mapVehiculoRow) ?? [];
  },

  async createVehicle(vehicle: Omit<Vehiculo, 'id'>): Promise<Vehiculo> {
    const { data, error } = await supabase
      .from('vehiculos')
      .insert([
        {
          placa: vehicle.placa.trim().toUpperCase(),
          marca: vehicle.marca.trim(),
          modelo: vehicle.modelo.trim(),
          capacidad_m3: vehicle.capacidadM3,
          conductor_id: vehicle.conductorId || null,
          activo: vehicle.activo,
        },
      ])
      .select('id, placa, marca, modelo, capacidad_m3, conductor_id, activo')
      .single<VehiculoRow>();

    if (error) {
      console.error('Error al crear vehículo:', error);
      throw error;
    }

    return mapVehiculoRow(data);
  },

  async updateVehicle(id: string, vehicle: Partial<Vehiculo>): Promise<Vehiculo> {
    const updateData: Partial<{
      placa: string;
      marca: string;
      modelo: string;
      capacidad_m3: number;
      conductor_id: string | null;
      activo: boolean;
    }> = {};

    if (vehicle.placa !== undefined) updateData.placa = vehicle.placa.trim().toUpperCase();
    if (vehicle.marca !== undefined) updateData.marca = vehicle.marca.trim();
    if (vehicle.modelo !== undefined) updateData.modelo = vehicle.modelo.trim();
    if (vehicle.capacidadM3 !== undefined) updateData.capacidad_m3 = vehicle.capacidadM3;
    if (vehicle.conductorId !== undefined) updateData.conductor_id = vehicle.conductorId || null;
    if (vehicle.activo !== undefined) updateData.activo = vehicle.activo;

    const { data, error } = await supabase
      .from('vehiculos')
      .update(updateData)
      .eq('id', id)
      .select('id, placa, marca, modelo, capacidad_m3, conductor_id, activo')
      .single<VehiculoRow>();

    if (error) {
      console.error('Error al actualizar vehículo:', error);
      throw error;
    }

    return mapVehiculoRow(data);
  },

  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehiculos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar vehículo:', error);
      throw error;
    }
  },
};
