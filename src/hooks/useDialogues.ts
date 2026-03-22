// src/hooks/useDialogues.ts

import { useQuery } from '@tanstack/react-query';
import { getAllDialogues, getDialogueWithTurns } from '../db/local-queries';

export interface DialogueTurn {
  id: string;
  dialogue_id: string;
  speaker: 'A' | 'B';
  sort_order: number;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  translation_fr: string;
  audio_url: string | null;
}

export interface Dialogue {
  id: string;
  title_fr: string;
  title_ar: string | null;
  context_fr: string | null;
  difficulty: number;
  sort_order: number;
}

export interface DialogueWithTurns extends Dialogue {
  turns: DialogueTurn[];
}

export function useDialogues() {
  return useQuery({
    queryKey: ['dialogues'],
    queryFn: getAllDialogues,
    staleTime: Infinity,
  });
}

export function useDialogueWithTurns(dialogueId: string | null) {
  return useQuery({
    queryKey: ['dialogue', dialogueId],
    queryFn: () => getDialogueWithTurns(dialogueId!),
    enabled: !!dialogueId,
    staleTime: Infinity,
  });
}
