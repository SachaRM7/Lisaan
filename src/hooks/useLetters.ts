// src/hooks/useLetters.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/remote';

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
}

async function fetchLetters(): Promise<Letter[]> {
  const { data, error } = await supabase
    .from('letters')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Letter[];
}

/** Charge les 28 lettres triées par ordre alphabétique arabe */
export function useLetters() {
  return useQuery({
    queryKey: ['letters'],
    queryFn: fetchLetters,
    staleTime: Infinity,
  });
}

/** Charge les lettres d'une leçon spécifique (par plage de sort_order) */
export function useLettersForLesson(startOrder: number, endOrder: number) {
  return useQuery({
    queryKey: ['letters', startOrder, endOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .gte('sort_order', startOrder)
        .lte('sort_order', endOrder)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Letter[];
    },
    staleTime: Infinity,
  });
}
