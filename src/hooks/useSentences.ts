// src/hooks/useSentences.ts

import { useQuery } from '@tanstack/react-query';
import { getAllSentences, getSentencesByDifficulty } from '../db/local-queries';

export interface Sentence {
  id: string;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  translation_fr: string;
  word_ids: string[];
  audio_url: string | null;
  context: string | null;
  variant: string;
  difficulty: number;
  sort_order: number;
}

export function useSentences() {
  return useQuery({
    queryKey: ['sentences'],
    queryFn: getAllSentences,
    staleTime: Infinity,
  });
}

export function useSentencesByDifficulty(maxDifficulty: number) {
  return useQuery({
    queryKey: ['sentences', 'difficulty', maxDifficulty],
    queryFn: () => getSentencesByDifficulty(maxDifficulty),
    staleTime: Infinity,
  });
}
