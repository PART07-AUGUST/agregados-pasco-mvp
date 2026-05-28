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

interface PedidoRow {
  id: string;
  cliente_id: string;
  material: Pedido['material'];
  volumen_m3: number | string;
  destino: string;
  estado: Pedido['estado'];
  created_at: string;
  usuarios?: Array<{
    nombre: string | null;
  }> | null;
}

function mapPedidoRow(pedido: PedidoRow): Pedido {
  return {
    id: pedido.id,
    clienteId: pedido.cliente_id,
    material: pedido.material,
    volumenM3: Number(pedido.volumen_m3),
    destino: pedido.destino,
    estado: pedido.estado,
    createdAt: pedido.created_at,
    clienteNombre: pedido.usuarios?.[0]?.nombre || 'Cliente Desconocido',
  };
}

export const ordersService = {
  async getOrders(): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        cliente_id,
        material,
        volumen_m3,
        destino,
        estado,
        created_at,
        usuarios:cliente_id (
          nombre
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener pedidos:', error);
      throw error;
    }

    return (data as PedidoRow[] | null)?.map(mapPedidoRow) ?? [];
  },

  async createOrder(order: Omit<Pedido, 'id' | 'createdAt' | 'estado'>): Promise<Pedido> {
    const { data, error } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente_id: order.clienteId,
          material: order.material,
          volumen_m3: order.volumenM3,
          destino: order.destino.trim(),
          estado: 'PENDIENTE',
        },
      ])
      .select('id, cliente_id, material, volumen_m3, destino, estado, created_at')
      .single<PedidoRow>();

    if (error) {
      console.error('Error al crear pedido:', error);
      throw error;
    }

    return mapPedidoRow(data);
  },

  async updateOrderState(id: string, estado: Pedido['estado']): Promise<void> {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar estado del pedido:', error);
      throw error;
    }
  },
};
