// src/hooks/useDiacritics.ts

import { useQuery } from '@tanstack/react-query';
import { getAllDiacritics, getDiacriticsBySortOrders } from '../db/local-queries';

export interface Diacritic {
  id: string;
  name_ar: string;
  name_fr: string;
  symbol: string;
  sound_effect: string;
  audio_url: string | null;
  category: 'vowel_short' | 'vowel_long' | 'tanwin' | 'other';
  sort_order: number;
  pedagogy_notes: string | null;
  visual_description: string | null;
  example_letters: string[];
  transliteration: string | null;
  ipa: string | null;
}

/** Tous les diacritiques */
export function useDiacritics() {
  return useQuery({
    queryKey: ['diacritics'],
    queryFn: getAllDiacritics,
    staleTime: Infinity,
  });
}

/** Diacritiques pour une leçon spécifique du Module 2 (par sort_order des diacritiques) */
export function useDiacriticsForLesson(sortOrders: number[]) {
  return useQuery({
    queryKey: ['diacritics', 'lesson', sortOrders],
    queryFn: () => getDiacriticsBySortOrders(sortOrders),
    enabled: sortOrders.length > 0,
    staleTime: Infinity,
  });
}
