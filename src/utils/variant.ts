// src/utils/variant.ts
// Map module ID → variant key (permet d'afficher le bon badge couleur)

import type { VariantKey } from '../constants/theme';

const VARIANT_MAP: Record<string, VariantKey> = {
  'mod-darija':   'darija',
  'mod-egyptian': 'egyptian',
  'mod-levantine':'levantine',
  'mod-khaliji':  'khaliji',
  'mod-quran':    'quranic',
};

/**
 * Détermine le variant d'un module depuis son ID.
 * Retourne 'msa' par défaut (modules MSA standards M1-M10).
 */
export function getVariantFromModuleId(moduleId: string): VariantKey {
  return VARIANT_MAP[moduleId] ?? 'msa';
}
