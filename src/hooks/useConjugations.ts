// src/hooks/useConjugations.ts

import { useEffect, useState } from 'react';
import { getConjugationsByWord, getConjugationsByWords } from '../db/local-queries';
import type { ConjugationEntry } from '../types/grammar';

export function useConjugations(wordId: string, tense: 'past' | 'present' | 'imperative') {
  const [conjugations, setConjugations] = useState<ConjugationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConjugationsByWord(wordId, tense)
      .then(setConjugations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wordId, tense]);

  return { conjugations, loading };
}

export function useConjugationsByWords(wordIds: string[], tense: 'past' | 'present' | 'imperative') {
  const [conjugations, setConjugations] = useState<ConjugationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const key = wordIds.join(',');

  useEffect(() => {
    if (wordIds.length === 0) { setLoading(false); return; }
    getConjugationsByWords(wordIds, tense)
      .then(setConjugations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [key, tense]);

  return { conjugations, loading };
}
