// src/hooks/useGrammarRules.ts

import { useEffect, useState } from 'react';
import { getGrammarRulesByModule } from '../db/local-queries';
import type { GrammarRule } from '../types/grammar';

export function useGrammarRules(moduleId: string) {
  const [rules, setRules] = useState<GrammarRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGrammarRulesByModule(moduleId)
      .then(setRules)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [moduleId]);

  return { rules, loading };
}
