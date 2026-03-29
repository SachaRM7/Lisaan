// src/hooks/useDialogueScenario.ts

import { useQuery } from '@tanstack/react-query';
import { getDialogueScenariosByLesson } from '../db/local-queries';

export interface DialogueTurnChoice {
  id: string;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  translation_fr: string;
  is_correct: boolean;
}

export interface DialogueTurn {
  id: string;
  speaker: 'A' | 'B' | 'student';
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  translation_fr: string;
  audio_url?: string | null;
  choices?: DialogueTurnChoice[];  // présent si le joueur doit choisir une réplique
}

export interface DialogueScenario {
  id: string;
  lesson_id: string;
  title_fr: string;
  title_ar: string;
  context_fr: string;
  setting_ar: string;
  setting_transliteration: string;
  difficulty: number;
  turns: DialogueTurn[];
  vocabulary_ids: string[];
  grammar_rule_ids: string[];
}

export function useDialogueScenariosForLesson(lessonId: string | null) {
  return useQuery<DialogueScenario[]>({
    queryKey: ['dialogue_scenarios', lessonId],
    queryFn: () => getDialogueScenariosByLesson(lessonId!),
    enabled: !!lessonId,
    staleTime: Infinity,
  });
}
