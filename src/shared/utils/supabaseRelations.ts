/**
 * Extrae un único elemento de una relación devuelta por Supabase,
 * soportando tanto respuestas singulares como arreglos generados por joins 1:1 o 1:N.
 */
export function getSingleRelation<T>(val: T | T[] | null | undefined): T | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val[0];
  return val;
}

/**
 * Resuelve de manera segura el nombre de un usuario vinculado a través de una relación de Supabase.
 */
export function getJoinedNombre(
  relation: { nombre: string | null } | Array<{ nombre: string | null }> | null | undefined
): string {
  if (!relation) return '';
  if (Array.isArray(relation)) {
    return relation[0]?.nombre || '';
  }
  return relation.nombre || '';
}
