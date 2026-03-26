// src/engines/section-utils.ts

import type { ExerciseConfig } from '../types/exercise';
import type { LessonSection, LessonSections } from '../types/section';

/** Taille cible d'une section : 4-6 items de teaching */
export const DEFAULT_SECTION_SIZE = 5;

/** Nombre min d'items pour justifier un split (en dessous, une seule section suffit) */
export const MIN_ITEMS_TO_SPLIT = 7;

/**
 * Découpe un tableau d'items en groupes de taille `sectionSize`.
 * Si le total est inférieur à MIN_ITEMS_TO_SPLIT, retourne un seul groupe.
 */
export function chunkItems<T>(items: T[], sectionSize: number = DEFAULT_SECTION_SIZE): T[][] {
  if (items.length < MIN_ITEMS_TO_SPLIT) {
    return [items];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += sectionSize) {
    chunks.push(items.slice(i, i + sectionSize));
  }
  // Si la dernière section est trop petite (< 3 items), fusionner avec la précédente
  if (chunks.length > 1 && chunks[chunks.length - 1].length < 3) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1].push(...last);
  }
  return chunks;
}

/**
 * Construit un LessonSection à partir d'un chunk d'items et de ses exercices.
 */
export function buildSection(
  index: number,
  titleFr: string,
  itemIds: string[],
  exercises: ExerciseConfig[],
): LessonSection {
  return {
    id: `section-${index}`,
    title_fr: titleFr,
    index,
    teachingItemIds: itemIds,
    exercises,
  };
}

/**
 * Assemble les sections en un LessonSections complet.
 */
export function buildLessonSections(
  contentType: LessonSections['contentType'],
  sections: LessonSection[],
): LessonSections {
  return { contentType, sections };
}
