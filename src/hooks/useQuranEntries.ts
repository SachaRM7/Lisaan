// src/hooks/useQuranEntries.ts

import { useQuery } from '@tanstack/react-query';
import { getAllQuranEntries, getQuranEntriesBySurah, getQuranSurahs } from '../db/local-queries';

export interface QuranEntry {
  id: string;
  surah_number: number;
  surah_name_ar: string;
  surah_name_fr: string;
  ayah_number: number;
  word_position: number;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  translation_fr: string;
  context_fr: string | null;
  root_id: string | null;
  tajwid_notes: string | null;
  sort_order: number;
}

export function useQuranEntries() {
  return useQuery({
    queryKey: ['quran_entries'],
    queryFn: getAllQuranEntries,
    staleTime: Infinity,
  });
}

export function useQuranEntriesBySurah(surahNumber: number) {
  return useQuery({
    queryKey: ['quran_entries', surahNumber],
    queryFn: () => getQuranEntriesBySurah(surahNumber),
    staleTime: Infinity,
    enabled: surahNumber > 0,
  });
}

export interface QuranSurah {
  surah_number: number;
  surah_name_ar: string;
  surah_name_fr: string;
  ayah_count: number;
}

export function useQuranSurahs() {
  return useQuery({
    queryKey: ['quran_surahs'],
    queryFn: getQuranSurahs,
    staleTime: Infinity,
  });
}
