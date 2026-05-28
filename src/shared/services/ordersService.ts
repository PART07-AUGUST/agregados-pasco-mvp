import { supabase } from './supabase';

export interface Pedido {
  id: string;
  clienteId: string;
  material: 'ARENA_FINA' | 'ARENA_GRUESA' | 'PIEDRA_1_2' | 'PIEDRA_3_4' | 'AFIRMADO' | 'TIERRA_CHACRA';
  volumenM3: number;
  destino: string;
  estado: 'PENDIENTE' | 'ASIGNADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';
  createdAt: string;
  clienteNombre?: string;
}

export const ordersService = {
  /**
   * Obtiene la lista completa de pedidos, incluyendo el nombre de la constructora/cliente.
   */
  async getOrders(): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        usuarios:cliente_id (
          nombre
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener pedidos:', error);
      throw error;
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      clienteId: p.cliente_id,
      material: p.material,
      volumenM3: Number(p.volumen_m3),
      destino: p.destino,
      estado: p.estado,
      createdAt: p.created_at,
      clienteNombre: p.usuarios?.nombre || 'Cliente Desconocido'
    }));
  },

  /**
   * Crea un nuevo pedido de material.
   */
  async createOrder(order: Omit<Pedido, 'id' | 'createdAt' | 'estado'>): Promise<Pedido> {
    const { data, error } = await supabase
      .from('pedidos')
      .insert([{
        cliente_id: order.clienteId,
        material: order.material,
        volumen_m3: order.volumenM3,
        destino: order.destino.trim(),
        estado: 'PENDIENTE'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error al crear pedido:', error);
      throw error;
    }

    return {
      id: data.id,
      clienteId: data.cliente_id,
      material: data.material,
      volumenM3: Number(data.volumen_m3),
      destino: data.destino,
      estado: data.estado,
      createdAt: data.created_at
    };
  },

  /**
   * Actualiza el estado de un pedido (por ejemplo, cancelarlo).
   */
  async updateOrderState(id: string, estado: Pedido['estado']): Promise<void> {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar estado del pedido:', error);
      throw error;
    }
  }
};
