// src/hooks/useDarijaVariants.ts
// Hook générique pour récupérer les variantes dialectales depuis SQLite
// variant = 'darija' | 'egyptian' | 'levantine' | 'khaliji'

import { useQuery } from '@tanstack/react-query';
import { getLocalDB } from '../db/local';
import type { WordVariant } from '../types/index';

async function fetchDialectalVariants(
  wordIds: string[],
  variant: string
): Promise<Map<string, WordVariant>> {
  if (wordIds.length === 0) return new Map();

  const db = getLocalDB();
  const placeholders = wordIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<WordVariant>(
    `SELECT * FROM word_variants WHERE word_id IN (${placeholders}) AND variant = ?`,
    [...wordIds, variant]
  );

  const map = new Map<string, WordVariant>();
  for (const row of rows) {
    map.set(row.word_id, row);
  }
  return map;
}

/**
 * @param wordIds - IDs des mots MSA de référence
 * @param variant - 'darija' | 'egyptian' | 'levantine' | 'khaliji'
 */
export function useDarijaVariants(
  wordIds: string[],
  variant: 'darija' | 'egyptian' | 'levantine' | 'khaliji' = 'darija'
): Map<string, WordVariant> {
  const { data } = useQuery({
    queryKey: [`${variant}-variants`, wordIds],
    queryFn: () => fetchDialectalVariants(wordIds, variant),
    staleTime: Infinity,
    enabled: wordIds.length > 0,
  });

  return data ?? new Map();
}

