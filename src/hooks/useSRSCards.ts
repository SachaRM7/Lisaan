// src/hooks/useSRSCards.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/remote';
import type { SRSCard, SRSUpdate } from '../engines/srs';
import { createNewCard } from '../engines/srs';

const SRS_QUERY_KEY = ['srs_cards'];

/**
 * Charge toutes les cartes SRS de l'utilisateur courant.
 */
export function useSRSCards() {
  return useQuery({
    queryKey: SRS_QUERY_KEY,
    queryFn: async (): Promise<SRSCard[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('srs_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('next_review_at', { ascending: true });

      if (error) throw error;
      return data as SRSCard[];
    },
  });
}

/**
 * Charge uniquement les cartes dues pour révision.
 */
export function useDueCards() {
  return useQuery({
    queryKey: [...SRS_QUERY_KEY, 'due'],
    queryFn: async (): Promise<SRSCard[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('srs_cards')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at', { ascending: true });

      if (error) throw error;
      return data as SRSCard[];
    },
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('srs_cards')
        .upsert({
          user_id: user.id,
          item_type: params.itemType,
          item_id: params.itemId,
          ...params.update,
        }, {
          onConflict: 'user_id,item_type,item_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SRS_QUERY_KEY });
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
    mutationFn: async (params: {
      letterIds: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const cards = params.letterIds.map(letterId =>
        createNewCard(user.id, 'letter', letterId)
      );

      const { error } = await supabase
        .from('srs_cards')
        .upsert(cards, {
          onConflict: 'user_id,item_type,item_id',
          ignoreDuplicates: true,
        });

      if (error) {
        console.error('[SRS] createSRSCards error:', error);
        throw error;
      }
      console.log('[SRS] createSRSCards ok — cartes créées:', cards.length);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SRS_QUERY_KEY });
    },
  });
}
