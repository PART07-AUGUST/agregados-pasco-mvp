import { supabase } from './supabase';

const TICKET_BUCKET = 'tickets-balanza';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const SIGNED_URL_EXPIRATION_SECONDS = 5 * 60;
const SIGNED_TICKET_PATH = `/storage/v1/object/sign/${TICKET_BUCKET}/`;

function assertSafePathSegment(value: string, label: string): void {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`El identificador de ${label} no es válido.`);
  }
}

function buildUniqueStoragePath(originalName: string, userId: string, viajeId: string): string {
  const parts = originalName.split('.');
  const rawExt = parts.length > 1 ? parts.pop()?.toLowerCase() || 'jpg' : 'jpg';
  const fileExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : 'jpg';

  assertSafePathSegment(userId, 'usuario');
  assertSafePathSegment(viajeId, 'viaje');

  return `tickets/${userId}/${viajeId}/${crypto.randomUUID()}.${fileExt}`;
}

function normalizeTicketReference(reference: string): string {
  const trimmedReference = reference.trim();
  if (!trimmedReference) {
    throw new Error('La referencia del ticket está vacía.');
  }

  let filePath = trimmedReference;

  if (/^https?:\/\//i.test(trimmedReference)) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedReference);
    } catch {
      throw new Error('La referencia del ticket no es válida.');
    }

    const objectMarker = '/storage/v1/object/';
    const markerIndex = parsedUrl.pathname.indexOf(objectMarker);
    if (markerIndex === -1) {
      throw new Error('La URL del ticket no pertenece a Supabase Storage.');
    }

    const objectPath = parsedUrl.pathname.slice(markerIndex + objectMarker.length);
    const bucketPrefix = ['public', 'sign', 'authenticated']
      .map((visibility) => `${visibility}/${TICKET_BUCKET}/`)
      .find((prefix) => objectPath.startsWith(prefix));

    if (!bucketPrefix) {
      throw new Error('La URL del ticket no pertenece al bucket esperado.');
    }

    try {
      filePath = decodeURIComponent(objectPath.slice(bucketPrefix.length));
    } catch {
      throw new Error('La ruta del ticket no es válida.');
    }
  } else {
    filePath = filePath.replace(/^\/+/, '');
  }

  const pathSegments = filePath.split('/');
  if (
    !filePath.startsWith('tickets/') ||
    pathSegments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error('La ruta del ticket no es válida.');
  }

  return filePath;
}

export const storageService = {
  /**
   * Sube una imagen de ticket y devuelve la ruta interna del objeto.
   */
  async uploadTicketImage(file: File, viajeId: string): Promise<string> {
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

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('La sesión no es válida para subir el ticket.');
    }

    const filePath = buildUniqueStoragePath(file.name, userData.user.id, viajeId);

    const { error: uploadError } = await supabase.storage
      .from(TICKET_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Error al subir imagen a Supabase Storage:', uploadError);
      throw new Error(`Error de almacenamiento: ${uploadError.message}`);
    }

    return filePath;
  },

  /**
   * Genera una URL temporal para un ticket nuevo o para una URL pública antigua.
   */
  async createTicketSignedUrl(
    reference: string,
    expiresIn = SIGNED_URL_EXPIRATION_SECONDS
  ): Promise<string> {
    const filePath = normalizeTicketReference(reference);
    const { data, error } = await supabase.storage
      .from(TICKET_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.error('Error al generar URL firmada del ticket:', error);
      throw new Error('No se pudo generar un enlace temporal para el ticket.');
    }

    let isValidSignedUrl = false;
    try {
      const signedUrl = new URL(data.signedUrl);
      isValidSignedUrl = signedUrl.protocol === 'https:' && signedUrl.pathname.includes(SIGNED_TICKET_PATH);
    } catch (validationError) {
      console.error('URL firmada de ticket inválida:', validationError);
    }

    if (!isValidSignedUrl) {
      throw new Error('No se pudo validar el enlace temporal del ticket.');
    }

    return data.signedUrl;
  },
};
