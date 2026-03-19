// src/hooks/useDiacritics.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/remote';

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

async function fetchAllDiacritics(): Promise<Diacritic[]> {
  const { data, error } = await supabase
    .from('diacritics')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Diacritic[];
}

async function fetchDiacriticsForLesson(sortOrders: number[]): Promise<Diacritic[]> {
  const { data, error } = await supabase
    .from('diacritics')
    .select('*')
    .in('sort_order', sortOrders)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Diacritic[];
}

/** Tous les diacritiques */
export function useDiacritics() {
  return useQuery({
    queryKey: ['diacritics'],
    queryFn: fetchAllDiacritics,
    staleTime: Infinity,
  });
}

/** Diacritiques pour une leçon spécifique du Module 2 (par sort_order des diacritiques) */
export function useDiacriticsForLesson(sortOrders: number[]) {
  return useQuery({
    queryKey: ['diacritics', 'lesson', sortOrders],
    queryFn: () => fetchDiacriticsForLesson(sortOrders),
    enabled: sortOrders.length > 0,
    staleTime: Infinity,
  });
}
