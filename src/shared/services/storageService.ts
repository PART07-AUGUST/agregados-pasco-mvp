import { supabase } from './supabase';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

function buildUniqueStoragePath(originalName: string): string {
  const parts = originalName.split('.');
  const rawExt = parts.length > 1 ? parts.pop()?.toLowerCase() || 'jpg' : 'jpg';
  const fileExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : 'jpg';

  const randomArray = new Uint8Array(6);
  crypto.getRandomValues(randomArray);
  const randomSuffix = Array.from(randomArray, (b) => b.toString(16).padStart(2, '0')).join('');

  return `tickets/ticket_${Date.now()}_${randomSuffix}.${fileExt}`;
}

export const storageService = {
  /**
   * Sube una imagen de ticket de balanza al bucket seguro con validaciones cliente y RLS.
   */
  async uploadTicketImage(file: File): Promise<string> {
    // 1. Validación de tamaño (máximo 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('El archivo supera el tamaño máximo permitido de 5 MB.');
    }

    // 2. Validación de tipo MIME
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG o WebP.');
    }

    // 3. Validación de extensión
    const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      throw new Error('Extensión de archivo inválida. Utilice .jpg, .jpeg, .png o .webp.');
    }

    const filePath = buildUniqueStoragePath(file.name);

    const { error: uploadError } = await supabase.storage
      .from('tickets-balanza')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
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
