import { supabase } from './supabase';

export const storageService = {
  /**
   * Sube una imagen de ticket de balanza al bucket de Supabase Storage.
   * Retorna la URL pública de lectura directa del archivo.
   */
  async uploadTicketImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    // Generar un nombre único para evitar cualquier colisión de archivos
    const fileName = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `tickets/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tickets-balanza')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error al subir imagen a Supabase Storage:', uploadError);
      throw new Error(`Error de almacenamiento: ${uploadError.message}`);
    }

    // Obtener la URL pública del archivo subido
    const { data } = supabase.storage
      .from('tickets-balanza')
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      throw new Error('No se pudo obtener la URL pública del archivo subido.');
    }

    return data.publicUrl;
  }
};
