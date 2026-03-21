// src/hooks/useSRSCards.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import {
  getSRSCardsForUser, getDueCards as getDueCardsLocal, upsertSRSCard,
} from '../db/local-queries';
import type { SRSCard, SRSUpdate } from '../engines/srs';
import { createNewCard } from '../engines/srs';
import { runSync } from '../engines/sync-manager';

const SRS_QUERY_KEY = ['srs_cards'];

/**
 * Charge toutes les cartes SRS de l'utilisateur courant.
 */
export function useSRSCards() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: SRS_QUERY_KEY,
    queryFn: async (): Promise<SRSCard[]> => {
      if (!userId) return [];
      return getSRSCardsForUser(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Charge uniquement les cartes dues pour révision.
 */
export function useDueCards() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: [...SRS_QUERY_KEY, 'due'],
    queryFn: async (): Promise<SRSCard[]> => {
      if (!userId) return [];
      return getDueCardsLocal(userId);
    },
    enabled: !!userId,
    // Refetch toutes les 60 secondes (des cartes peuvent devenir dues)
    refetchInterval: 60_000,
  });
}

/**
 * Mutation : créer ou mettre à jour une carte SRS après un exercice.
 */
export function useUpdateSRSCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      itemType: SRSCard['item_type'];
      itemId: string;
      update: SRSUpdate;
    }) => {
      const userId = useAuthStore.getState().userId;
      if (!userId) throw new Error('Not authenticated');

      await upsertSRSCard({
        id: `${userId}-${params.itemType}-${params.itemId}`,
        user_id: userId,
        item_type: params.itemType,
        item_id: params.itemId,
        ...params.update,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SRS_QUERY_KEY });
      // Fire-and-forget sync vers Cloud
      runSync().catch(console.warn);
    },
  });
}

/**
 * Mutation : créer les cartes SRS initiales pour les lettres d'une leçon.
 * Appelée quand l'utilisateur termine la phase de présentation.
 */
export function useCreateSRSCardsForLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { letterIds: string[] }) => {
      const userId = useAuthStore.getState().userId;
      if (!userId) throw new Error('Not authenticated');

      for (const letterId of params.letterIds) {
        const card = createNewCard(userId, 'letter', letterId);
        await upsertSRSCard({
          id: `${userId}-letter-${letterId}`,
          ...card,
        });
      }
      console.log('[SRS] createSRSCards ok — cartes créées:', params.letterIds.length);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SRS_QUERY_KEY });
      runSync().catch(console.warn);
    },
  });
}
