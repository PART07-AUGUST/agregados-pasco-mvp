import { supabase } from './supabase';
import type { Vehiculo } from '../types';

export interface VehiculoConConductor extends Vehiculo {
  conductorNombre?: string;
}

export const vehiclesService = {
  /**
   * Obtiene la lista completa de vehículos de la flota, incluyendo el nombre del conductor asignado.
   */
  async getVehicles(): Promise<VehiculoConConductor[]> {
    const { data, error } = await supabase
      .from('vehiculos')
      .select(`
        *,
        usuarios:conductor_id (
          nombre
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener vehículos:', error);
      throw error;
    }

    return (data || []).map((v: any) => ({
      id: v.id,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      capacidadM3: Number(v.capacidad_m3),
      conductorId: v.conductor_id,
      activo: v.activo,
      conductorNombre: v.usuarios?.nombre || 'Sin conductor asignado'
    }));
  },

  /**
   * Registra un nuevo vehículo en la flota.
   */
  async createVehicle(vehicle: Omit<Vehiculo, 'id'>): Promise<Vehiculo> {
    const { data, error } = await supabase
      .from('vehiculos')
      .insert([{
        placa: vehicle.placa.trim().toUpperCase(),
        marca: vehicle.marca.trim(),
        modelo: vehicle.modelo.trim(),
        capacidad_m3: vehicle.capacidadM3,
        conductor_id: vehicle.conductorId || null,
        activo: vehicle.activo
      }])
      .select()
      .single();

    if (error) {
      console.error('Error al crear vehículo:', error);
      throw error;
    }

    return {
      id: data.id,
      placa: data.placa,
      marca: data.marca,
      modelo: data.modelo,
      capacidadM3: Number(data.capacidad_m3),
      conductorId: data.conductor_id,
      activo: data.activo
    };
  },

  /**
   * Actualiza los datos de un vehículo existente.
   */
  async updateVehicle(id: string, vehicle: Partial<Vehiculo>): Promise<Vehiculo> {
    const updateData: any = {};
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
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar vehículo:', error);
      throw error;
    }

    return {
      id: data.id,
      placa: data.placa,
      marca: data.marca,
      modelo: data.modelo,
      capacidadM3: Number(data.capacidad_m3),
      conductorId: data.conductor_id,
      activo: data.activo
    };
  },

  /**
   * Elimina (o da de baja física) un vehículo de la flota.
   */
  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehiculos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar vehículo:', error);
      throw error;
    }
  }
};
