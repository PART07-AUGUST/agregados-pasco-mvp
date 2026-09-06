export type MaterialType =
  | 'ARENA_FINA'
  | 'ARENA_GRUESA'
  | 'PIEDRA_1_2'
  | 'PIEDRA_3_4'
  | 'AFIRMADO'
  | 'TIERRA_CHACRA';

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  ARENA_FINA: 'Arena Fina',
  ARENA_GRUESA: 'Arena Gruesa',
  PIEDRA_1_2: 'Piedra Chancada de 1/2"',
  PIEDRA_3_4: 'Piedra Chancada de 3/4"',
  AFIRMADO: 'Afirmado Clasificado',
  TIERRA_CHACRA: 'Tierra de Chacra',
};

export const MATERIAL_PRICES_PER_M3: Record<MaterialType, number> = {
  ARENA_FINA: 48.0,
  ARENA_GRUESA: 45.0,
  PIEDRA_1_2: 52.0,
  PIEDRA_3_4: 50.0,
  AFIRMADO: 38.0,
  TIERRA_CHACRA: 35.0,
};

export function getMaterialLabel(material: string): string {
  if (material in MATERIAL_LABELS) {
    return MATERIAL_LABELS[material as MaterialType];
  }
  return material.replace(/_/g, ' ');
}
