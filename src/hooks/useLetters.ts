// src/hooks/useLetters.ts

import { useQuery } from '@tanstack/react-query';
import { getAllLetters, getLettersBySortRange } from '../db/local-queries';

export interface Letter {
  id: string;
  sort_order: number;
  name_ar: string;
  name_fr: string;
  transliteration: string;
  ipa: string;
  form_isolated: string;
  form_initial: string;
  form_medial: string;
  form_final: string;
  connects_left: boolean;
  connects_right: boolean;
  is_sun_letter: boolean;
  articulation_group: string;
  articulation_fr: string;
  pedagogy_notes: string;
  audio_url: string | null;
  confusion_pairs: string[];
}

function mapLetterRow(row: any): Letter {
  return {
    ...row,
    connects_left: !!row.connects_left,
    connects_right: !!row.connects_right,
    is_sun_letter: !!row.is_sun_letter,
    confusion_pairs: typeof row.confusion_pairs === 'string'
      ? JSON.parse(row.confusion_pairs)
      : row.confusion_pairs ?? [],
  };
}

/** Charge les 28 lettres triées par ordre alphabétique arabe */
export function useLetters() {
  return useQuery({
    queryKey: ['letters'],
    queryFn: async () => {
      const rows = await getAllLetters();
      return rows.map(mapLetterRow);
    },
    staleTime: Infinity,
  });
}

/** Charge les lettres d'une leçon spécifique (par plage de sort_order) */
export function useLettersForLesson(startOrder: number, endOrder: number) {
  return useQuery({
    queryKey: ['letters', 'range', startOrder, endOrder],
    queryFn: async () => {
      const rows = await getLettersBySortRange(startOrder, endOrder);
      return rows.map(mapLetterRow);
    },
    enabled: startOrder > 0 && endOrder > 0,
    staleTime: Infinity,
  });
}
