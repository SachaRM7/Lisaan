// src/hooks/useWords.ts

import { useQuery } from '@tanstack/react-query';
import { getAllWords, getSimpleWords, getWordsByRootId, getWordsByRootIds, getWordsByTheme } from '../db/local-queries';

export interface Word {
  id: string;
  root_id: string | null;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  ipa: string | null;
  translation_fr: string;
  pattern: string | null;
  pos: string | null;
  frequency_rank: number;
  audio_url: string | null;
  gender: string | null;
  is_simple_word: boolean;
  pedagogy_notes: string | null;
  theme: string | null;
  sort_order: number;
}

export function useWords() {
  return useQuery({
    queryKey: ['words'],
    queryFn: getAllWords,
    staleTime: Infinity,
  });
}

export function useSimpleWords() {
  return useQuery({
    queryKey: ['words', 'simple'],
    queryFn: getSimpleWords,
    staleTime: Infinity,
  });
}

export function useWordsByRoot(rootId: string | null) {
  return useQuery({
    queryKey: ['words', 'root', rootId],
    queryFn: () => getWordsByRootId(rootId!),
    enabled: !!rootId,
    staleTime: Infinity,
  });
}

export function useWordsByRoots(rootIds: string[]) {
  return useQuery({
    queryKey: ['words', 'roots', rootIds],
    queryFn: () => getWordsByRootIds(rootIds),
    enabled: rootIds.length > 0,
    staleTime: Infinity,
  });
}

export function useWordsByTheme(theme: string | null) {
  return useQuery({
    queryKey: ['words', 'theme', theme],
    queryFn: () => getWordsByTheme(theme!),
    staleTime: Infinity,
    enabled: !!theme,
  });
}
