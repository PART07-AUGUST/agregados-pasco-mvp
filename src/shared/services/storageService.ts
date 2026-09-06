import { supabase } from './supabase';

function buildUniqueStoragePath(originalName: string): string {
  const fileExt = originalName.split('.').pop() || 'jpg';
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `tickets/ticket_${Date.now()}_${randomSuffix}.${fileExt}`;
}

export const storageService = {
  async uploadTicketImage(file: File): Promise<string> {
    const filePath = buildUniqueStoragePath(file.name);

    const { error: uploadError } = await supabase.storage
      .from('tickets-balanza')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error al subir imagen a Supabase Storage:', uploadError);
      throw new Error(`Error de almacenamiento: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('tickets-balanza')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('No se pudo obtener la URL pública del archivo subido.');
    }

    return data.publicUrl;
  },
};
