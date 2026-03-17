# ÉTAPE 3 — Système SRS (répétition espacée) + onglet Réviser + progression

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> Étapes terminées : 0 (Supabase + polices), 1 (onboarding), 2 (composants arabes + leçons Module 1 + exercice MCQ).
> Cette étape implémente l'algorithme de répétition espacée, l'onglet Réviser fonctionnel, et le tracking de progression des leçons (déverrouillage séquentiel).

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

---

## MISSION 1 — Algorithme SRS (srs.ts)

**Action :**
Crée `src/engines/srs.ts` — l'algorithme de répétition espacée basé sur SM-2.

```typescript
// src/engines/srs.ts

/**
 * Algorithme SRS basé sur SM-2 (SuperMemo 2), adapté pour l'arabe.
 *
 * quality : 0 à 5
 *   0 = blackout total (aucune idée)
 *   1 = incorrect, mais reconnu après coup
 *   2 = incorrect, mais on sentait la réponse proche
 *   3 = correct, avec difficulté significative
 *   4 = correct, avec légère hésitation
 *   5 = correct, instantané
 *
 * En pratique dans Lisaan (MCQ) :
 *   - Bonne réponse au 1er essai, < 3s → quality 5
 *   - Bonne réponse au 1er essai, >= 3s → quality 4
 *   - Bonne réponse au 2ème essai → quality 3
 *   - Mauvaise réponse → quality 1
 */

export interface SRSCard {
  id: string;
  user_id: string;
  item_type: 'letter' | 'diacritic' | 'word' | 'sentence';
  item_id: string;
  ease_factor: number;      // Défaut: 2.5
  interval_days: number;    // Intervalle avant prochaine révision
  repetitions: number;      // Nombre de révisions réussies consécutives
  next_review_at: string;   // ISO 8601
  last_review_at: string | null;
  last_quality: number;     // Dernière note 0-5
}

export interface SRSUpdate {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_review_at: string;
  last_quality: number;
}

/**
 * Crée une nouvelle carte SRS avec les valeurs par défaut.
 */
export function createNewCard(
  userId: string,
  itemType: SRSCard['item_type'],
  itemId: string,
): Omit<SRSCard, 'id'> {
  return {
    user_id: userId,
    item_type: itemType,
    item_id: itemId,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: new Date().toISOString(),
    last_review_at: null,
    last_quality: 0,
  };
}

/**
 * Calcule la mise à jour d'une carte SRS après une révision.
 */
export function computeSRSUpdate(card: SRSCard, quality: number): SRSUpdate {
  const now = new Date();

  if (quality < 3) {
    // Échec : reset les répétitions, revoir dans 10 minutes
    return {
      ease_factor: Math.max(1.3, card.ease_factor - 0.2),
      interval_days: 0.0069, // ~10 minutes
      repetitions: 0,
      next_review_at: addDays(now, 0.0069).toISOString(),
      last_review_at: now.toISOString(),
      last_quality: quality,
    };
  }

  // Succès : calcul du nouveau ease_factor
  const newEase = Math.max(
    1.3,
    card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  // Calcul du nouvel intervalle
  let newInterval: number;
  if (card.repetitions === 0) {
    newInterval = 0.0069; // 10 minutes (première révision)
  } else if (card.repetitions === 1) {
    newInterval = 1; // 1 jour
  } else if (card.repetitions === 2) {
    newInterval = 3; // 3 jours
  } else {
    newInterval = card.interval_days * newEase;
  }

  // Plafonner à 180 jours max
  newInterval = Math.min(newInterval, 180);

  return {
    ease_factor: newEase,
    interval_days: newInterval,
    repetitions: card.repetitions + 1,
    next_review_at: addDays(now, newInterval).toISOString(),
    last_review_at: now.toISOString(),
    last_quality: quality,
  };
}

/**
 * Convertit un résultat d'exercice MCQ en quality score SRS.
 *
 * @param correct - L'utilisateur a-t-il donné la bonne réponse ?
 * @param attempts - Nombre de tentatives (1 = premier coup)
 * @param timeMs - Temps de réponse en millisecondes
 */
export function exerciseResultToQuality(
  correct: boolean,
  attempts: number,
  timeMs: number,
): number {
  if (!correct) return 1;
  if (attempts > 1) return 3;
  if (timeMs < 3000) return 5;
  return 4;
}

/**
 * Filtre les cartes dues pour révision.
 */
export function getCardsDueForReview(cards: SRSCard[]): SRSCard[] {
  const now = new Date();
  return cards
    .filter(card => new Date(card.next_review_at) <= now)
    .sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime());
}

/**
 * Applique le plafonnement des confusion pairs.
 * Si une lettre d'une paire est maîtrisée (interval > 7j) mais pas l'autre,
 * la maîtrisée est plafonnée à 7j pour forcer la révision comparative.
 */
export function applyConfusionPairCap(
  cards: SRSCard[],
  confusionPairs: string[][], // ex: [['letter-002-ba', 'letter-003-ta', 'letter-004-tha'], ...]
): SRSCard[] {
  const CAP_DAYS = 7;
  const cardMap = new Map(cards.map(c => [c.item_id, c]));

  return cards.map(card => {
    if (card.item_type !== 'letter') return card;

    // Trouver les paires de confusion de cette lettre
    for (const pair of confusionPairs) {
      if (!pair.includes(card.item_id)) continue;

      // Vérifier si un membre de la paire est faible (interval < 3j)
      const hasWeakSibling = pair.some(siblingId => {
        if (siblingId === card.item_id) return false;
        const sibling = cardMap.get(siblingId);
        return !sibling || sibling.interval_days < 3;
      });

      // Si un sibling est faible et cette carte est forte, plafonner
      if (hasWeakSibling && card.interval_days > CAP_DAYS) {
        return {
          ...card,
          interval_days: CAP_DAYS,
          next_review_at: addDays(new Date(card.last_review_at ?? new Date()), CAP_DAYS).toISOString(),
        };
      }
    }

    return card;
  });
}

// --- Helpers ---

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + days * 24 * 60 * 60 * 1000);
  return result;
}
```

**Checkpoint :**
- [ ] `src/engines/srs.ts` compile sans erreur
- [ ] `computeSRSUpdate` avec quality < 3 retourne `interval_days: 0.0069` et `repetitions: 0`
- [ ] `computeSRSUpdate` avec quality 5 et repetitions 0 retourne `interval_days: 0.0069` (premier succès)
- [ ] `computeSRSUpdate` avec quality 5 et repetitions 1 retourne `interval_days: 1`
- [ ] `computeSRSUpdate` avec quality 5 et repetitions 2 retourne `interval_days: 3`
- [ ] `exerciseResultToQuality(true, 1, 2000)` retourne 5
- [ ] `exerciseResultToQuality(true, 1, 5000)` retourne 4
- [ ] `exerciseResultToQuality(true, 2, 1000)` retourne 3
- [ ] `exerciseResultToQuality(false, 1, 1000)` retourne 1
- [ ] `applyConfusionPairCap` plafonne bien une carte forte si son sibling est faible

---

## MISSION 2 — Hook useSRSCards : CRUD des cartes SRS dans Supabase

**Action :**
Crée `src/hooks/useSRSCards.ts`.

Ce hook gère les opérations sur les cartes SRS via Supabase.

```typescript
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

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SRS_QUERY_KEY });
    },
  });
}
```

**Important :** La table `srs_cards` a besoin d'un index unique composite pour que l'upsert fonctionne. Vérifie qu'il existe dans la migration initiale. Si ce n'est pas le cas, crée une migration :

```bash
npx supabase migration new add_srs_unique_constraint
```

```sql
-- Ajouter la contrainte unique si elle n'existe pas déjà
ALTER TABLE srs_cards
  ADD CONSTRAINT srs_cards_user_item_unique
  UNIQUE (user_id, item_type, item_id);
```

**Checkpoint :**
- [ ] `src/hooks/useSRSCards.ts` compile sans erreur
- [ ] La contrainte unique `(user_id, item_type, item_id)` existe sur `srs_cards`
- [ ] `useDueCards` filtre bien par `next_review_at <= now()`
- [ ] `useCreateSRSCardsForLesson` fait un upsert sans erreur si les cartes existent déjà

---

## MISSION 3 — Créer les cartes SRS à la fin d'une leçon

**Action :**
Modifie `app/lesson/[id].tsx` pour intégrer la création de cartes SRS.

### Quand créer les cartes :

À la fin de la **phase présentation** (quand l'utilisateur a vu toutes les lettres et clique "Commencer les exercices"), appeler `useCreateSRSCardsForLesson` avec les IDs des lettres de la leçon.

### Quand mettre à jour les cartes :

À chaque exercice complété dans la **phase exercices**, calculer le quality score et mettre à jour la carte SRS :

```typescript
// Dans le handler onComplete d'un exercice :
const quality = exerciseResultToQuality(result.correct, result.attempts, result.time_ms);

// Trouver la carte de la lettre concernée (via l'exercice metadata)
const letterId = exercise.metadata?.letter_id as string;
if (letterId && currentCard) {
  const update = computeSRSUpdate(currentCard, quality);
  updateSRSCard.mutate({
    itemType: 'letter',
    itemId: letterId,
    update,
  });
}
```

**Pré-requis :** Le générateur d'exercices (`exercise-generator.ts`) doit inclure le `letter_id` dans le `metadata` de chaque exercice. Si ce n'est pas encore le cas, ajoute-le :

```typescript
// Dans generateLetterExercises, pour chaque exercice :
metadata: { letter_id: letter.id },
```

**Checkpoint :**
- [ ] Après avoir vu toutes les lettres d'une leçon, les cartes SRS sont créées dans Supabase
- [ ] Vérifier dans Supabase Studio : `SELECT count(*) FROM srs_cards` augmente après une leçon
- [ ] Après chaque exercice, la carte SRS est mise à jour (ease_factor, interval_days changent)
- [ ] Pas de doublon si on refait la leçon (upsert avec ignoreDuplicates)

---

## MISSION 4 — Onglet Réviser : écran principal

**Action :**
Refactore `app/(tabs)/review.tsx` — l'onglet de révision SRS.

### Structure de l'écran :

**État 1 — Aucune carte (premier lancement, pas de leçon faite) :**

```
┌─────────────────────────────────────┐
│  Réviser                            │
├─────────────────────────────────────┤
│                                     │
│         📚                          │
│                                     │
│  Rien à réviser pour l'instant      │
│                                     │
│  Termine ta première leçon pour     │
│  débloquer les révisions.           │
│                                     │
│  ┌───────────────────────────┐      │
│  │   Aller apprendre →       │      │
│  └───────────────────────────┘      │
│                                     │
└─────────────────────────────────────┘
```

**État 2 — Des cartes existent, certaines sont dues :**

```
┌─────────────────────────────────────┐
│  Réviser                            │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────┐      │
│  │  🔄 12 cartes à réviser    │      │  ← Compteur de cartes dues
│  │     Lettres: 8  Mots: 4   │      │  ← Détail par type
│  └───────────────────────────┘      │
│                                     │
│  ┌───────────────────────────┐      │
│  │   Commencer la révision → │      │  ← CTA principal (émeraude)
│  └───────────────────────────┘      │
│                                     │
│  ── Statistiques ──                 │
│                                     │
│  Total de cartes : 28               │
│  Maîtrisées (>7j) : 12             │
│  En apprentissage : 10              │
│  Nouvelles : 6                      │
│                                     │
│  Prochaine révision dans : 2h       │  ← Si aucune carte due maintenant
│                                     │
└─────────────────────────────────────┘
```

**État 3 — Toutes les cartes sont à jour :**

```
┌─────────────────────────────────────┐
│  Réviser                            │
├─────────────────────────────────────┤
│                                     │
│         ✅                          │
│                                     │
│  Tu es à jour !                     │
│                                     │
│  Prochaine révision dans 3h.        │
│  En attendant, continue à           │
│  apprendre de nouvelles lettres.    │
│                                     │
│  ── Statistiques ──                 │
│  (mêmes stats que l'état 2)         │
│                                     │
└─────────────────────────────────────┘
```

### Logique :

1. Charger les cartes via `useDueCards()` pour le compteur de cartes dues
2. Charger toutes les cartes via `useSRSCards()` pour les statistiques
3. Catégoriser les cartes :
   - **Maîtrisées** : `interval_days > 7`
   - **En apprentissage** : `interval_days > 0 && interval_days <= 7`
   - **Nouvelles** : `repetitions === 0`
4. Calculer "prochaine révision dans X" : trouver la carte non-due la plus proche
5. Le CTA "Commencer la révision" navigue vers un écran de session de révision

**Checkpoint :**
- [ ] L'onglet "Réviser" affiche l'état correct (vide / cartes dues / à jour)
- [ ] Le compteur de cartes dues est exact
- [ ] Les statistiques (maîtrisées / en apprentissage / nouvelles) sont correctes
- [ ] Le calcul "prochaine révision dans X" fonctionne

---

## MISSION 5 — Session de révision

**Action :**
Crée `app/review-session.tsx` — l'écran de session de révision SRS.

### Flux :

1. Charger les cartes dues via `useDueCards()`
2. Pour chaque carte, générer un exercice MCQ adapté :
   - Si `item_type === 'letter'` : charger la lettre depuis Supabase, générer un MCQ avec `generateLetterExercises` (une seule lettre, distracteurs parmi toutes les lettres connues)
3. Présenter les exercices un par un via `ExerciseRenderer`
4. Après chaque exercice :
   - Calculer le quality score via `exerciseResultToQuality`
   - Mettre à jour la carte SRS via `useUpdateSRSCard`
   - Si quality < 3, remettre la carte à la fin de la file (elle sera re-présentée dans cette session)
5. Afficher une barre de progression en haut (X/Y complétées)
6. À la fin de la session, afficher un récapitulatif

### Générateur d'exercice pour la révision :

Crée `src/engines/review-exercise-generator.ts` :

```typescript
// src/engines/review-exercise-generator.ts

import type { ExerciseConfig } from '../types/exercise';
import type { Letter } from '../hooks/useLetters';
import type { SRSCard } from './srs';

/**
 * Génère un exercice MCQ pour une carte SRS de type lettre.
 * Utilise toutes les lettres connues comme distracteurs potentiels.
 */
export function generateReviewExercise(
  card: SRSCard,
  targetLetter: Letter,
  allKnownLetters: Letter[],
): ExerciseConfig {
  // Alterner entre ar→fr et fr→ar
  const direction = Math.random() > 0.5 ? 'ar_to_fr' : 'fr_to_ar';

  // Prendre 2 distracteurs parmi les lettres connues (pas la cible)
  const distractors = allKnownLetters
    .filter(l => l.id !== targetLetter.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const options = [
    {
      id: targetLetter.id,
      text: direction === 'ar_to_fr'
        ? { fr: targetLetter.name_fr }
        : { ar: targetLetter.form_isolated },
      correct: true as const,
    },
    ...distractors.map(d => ({
      id: d.id,
      text: direction === 'ar_to_fr'
        ? { fr: d.name_fr }
        : { ar: d.form_isolated },
      correct: false as const,
    })),
  ].sort(() => Math.random() - 0.5);

  return {
    id: `review-${card.id}-${Date.now()}`,
    type: 'mcq',
    instruction_fr: direction === 'ar_to_fr'
      ? 'Quelle est cette lettre ?'
      : `Trouve la lettre "${targetLetter.name_fr}"`,
    prompt: direction === 'ar_to_fr'
      ? { ar: targetLetter.form_isolated }
      : { fr: `${targetLetter.name_fr} (${targetLetter.transliteration})` },
    options,
    metadata: { letter_id: targetLetter.id, card_id: card.id },
  };
}
```

### Structure de l'écran de session :

```
┌─────────────────────────────────────┐
│  ← Quitter    Révision     3/12    │  ← Header + progression
│  ████████░░░░░░░░░░░░░░░░░░░░░    │  ← Barre de progression
├─────────────────────────────────────┤
│                                     │
│  [ExerciseRenderer — MCQ]           │  ← Exercice courant
│                                     │
└─────────────────────────────────────┘
```

### Écran récapitulatif de fin de session :

```
┌─────────────────────────────────────┐
│                                     │
│  Session terminée ! 🎉             │
│                                     │
│  12 cartes révisées                 │
│  10 correctes du premier coup       │
│  2 à revoir bientôt                 │
│                                     │
│  Temps : 3 min 42 s                 │
│                                     │
│  ┌───────────────────────────┐      │
│  │       Continuer →         │      │
│  └───────────────────────────┘      │
└─────────────────────────────────────┘
```

**Checkpoint :**
- [ ] `app/review-session.tsx` existe et se charge sans erreur
- [ ] `src/engines/review-exercise-generator.ts` compile
- [ ] Les cartes dues sont présentées comme des exercices MCQ
- [ ] Après chaque exercice, la carte SRS est mise à jour dans Supabase
- [ ] Les cartes échouées (quality < 3) sont remises en fin de file
- [ ] La barre de progression avance correctement
- [ ] L'écran récapitulatif affiche les bonnes stats
- [ ] Le bouton "Continuer" ramène à l'onglet Réviser (avec les compteurs mis à jour)

---

## MISSION 6 — Tracking de progression des leçons

**Action :**
Implémente le suivi de progression pour déverrouiller les leçons séquentiellement.

### 6.1 — Hook useProgress

Crée `src/hooks/useProgress.ts` :

```typescript
// src/hooks/useProgress.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/remote';

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  score: number;
  completed_at: string | null;
  attempts: number;
  time_spent_seconds: number;
}

const PROGRESS_QUERY_KEY = ['user_progress'];

export function useProgress() {
  return useQuery({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn: async (): Promise<LessonProgress[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as LessonProgress[];
    },
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      lessonId: string;
      score: number;
      timeSpentSeconds: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Marquer la leçon comme complétée
      const { error: completeError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: params.lessonId,
          status: 'completed',
          score: params.score,
          completed_at: new Date().toISOString(),
          attempts: 1, // Incrémenté côté serveur idéalement
          time_spent_seconds: params.timeSpentSeconds,
        }, { onConflict: 'user_id,lesson_id' });

      if (completeError) throw completeError;

      // Déverrouiller la leçon suivante
      // Trouver la leçon courante pour connaître son module et sort_order
      const { data: currentLesson } = await supabase
        .from('lessons')
        .select('module_id, sort_order')
        .eq('id', params.lessonId)
        .single();

      if (currentLesson) {
        // Trouver la leçon suivante dans le même module
        const { data: nextLesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('module_id', currentLesson.module_id)
          .eq('sort_order', currentLesson.sort_order + 1)
          .single();

        if (nextLesson) {
          // Créer une entrée "available" pour la leçon suivante (si pas déjà existante)
          await supabase
            .from('user_progress')
            .upsert({
              user_id: user.id,
              lesson_id: nextLesson.id,
              status: 'available',
              score: 0,
              attempts: 0,
              time_spent_seconds: 0,
            }, {
              onConflict: 'user_id,lesson_id',
              ignoreDuplicates: true, // Ne pas écraser si déjà complétée
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
    },
  });
}
```

### 6.2 — Contrainte unique sur user_progress

Si elle n'existe pas déjà, crée une migration :

```bash
npx supabase migration new add_progress_unique_constraint
```

```sql
ALTER TABLE user_progress
  ADD CONSTRAINT user_progress_user_lesson_unique
  UNIQUE (user_id, lesson_id);
```

### 6.3 — Initialiser la première leçon comme "available"

Au premier lancement après l'onboarding (ou quand l'écran Apprendre se charge), vérifier que la leçon 1 du Module 1 a une entrée `status: 'available'`. Si aucune progression n'existe, la créer automatiquement.

Ajoute cette logique dans l'écran `app/(tabs)/learn.tsx` :

```typescript
// Dans l'écran Apprendre, au montage :
// Si aucune progression n'existe pour le Module 1, créer l'entrée de la leçon 1
useEffect(() => {
  if (progress && progress.length === 0 && lessons && lessons.length > 0) {
    initFirstLesson(lessons[0].id);
  }
}, [progress, lessons]);
```

### 6.4 — Mettre à jour l'affichage des leçons

Modifie `app/(tabs)/learn.tsx` pour utiliser la progression réelle :
- Leçon avec `status: 'completed'` → icône ✅, score affiché
- Leçon avec `status: 'available'` → icône 🔓, cliquable
- Leçon sans entrée de progression → icône 🔒, grisée, non cliquable

### 6.5 — Appeler completeLesson à la fin d'une leçon

Modifie l'écran de résultats dans `app/lesson/[id].tsx` :
- Au tap sur "Continuer", appeler `completeLesson.mutate({ lessonId, score, timeSpentSeconds })`
- Le score est calculé comme : `(nombre de bonnes réponses / total exercices) * 100`

**Checkpoint :**
- [ ] `src/hooks/useProgress.ts` compile sans erreur
- [ ] La contrainte unique `(user_id, lesson_id)` existe sur `user_progress`
- [ ] La leçon 1 est automatiquement marquée `available` au premier chargement
- [ ] Compléter la leçon 1 déverrouille la leçon 2 (vérifier dans Supabase Studio)
- [ ] L'écran Apprendre affiche les bons statuts (✅ / 🔓 / 🔒)
- [ ] Le score est enregistré dans `user_progress`

---

## MISSION 7 — Intégration confusion pairs dans le SRS

**Action :**
Intègre le plafonnement des confusion pairs dans le flux de révision.

### 7.1 — Charger les confusion pairs

Les confusion pairs sont définies dans `docs/lisaan-seed-letters.json` sous `confusion_pairs_index`. Au MVP, on les hardcode dans le code (elles ne changent pas) :

Crée `src/constants/confusion-pairs.ts` :

```typescript
// src/constants/confusion-pairs.ts

/**
 * Paires de lettres visuellement ou auditivement similaires.
 * Utilisées par le SRS pour plafonner les intervalles :
 * si une lettre d'une paire est maîtrisée mais pas l'autre,
 * la maîtrisée est plafonnée à 7 jours pour forcer la révision comparative.
 */
export const CONFUSION_PAIRS: string[][] = [
  // Même forme de base, différenciées par les points
  ['letter-002-ba', 'letter-003-ta', 'letter-004-tha'],
  // Forme de coupe, point au milieu / aucun / dessus
  ['letter-005-jim', 'letter-006-ha', 'letter-007-kha'],
  // Même forme, Dhal a un point
  ['letter-008-dal', 'letter-009-dhal'],
  // Même forme, Zay a un point
  ['letter-010-ra', 'letter-011-zay'],
  // Même dents, Shin a 3 points
  ['letter-012-sin', 'letter-013-shin'],
  // Même boucle, Dad a un point
  ['letter-014-sad', 'letter-015-dad'],
  // Même boucle verticale, Dhaa a un point
  ['letter-016-taa', 'letter-017-dhaa'],
  // Même forme, Ghayn a un point
  ['letter-018-ayn', 'letter-019-ghayn'],
  // Boucle similaire, 1 point vs 2 points
  ['letter-020-fa', 'letter-021-qaf'],
  // Sons proches (vélaire vs uvulaire)
  ['letter-021-qaf', 'letter-022-kaf'],
  // Sons proches (S normal vs S emphatique)
  ['letter-012-sin', 'letter-014-sad'],
  // Ta Marbuta ressemble à Ha' final
  ['letter-026-ha-end'],  // Note: letter-027-ta-marbuta n'est pas dans les 28 lettres de base
];
```

### 7.2 — Appliquer le plafonnement

Dans `app/review-session.tsx`, avant de présenter les cartes dues, appliquer le plafonnement :

```typescript
import { applyConfusionPairCap, getCardsDueForReview } from '../src/engines/srs';
import { CONFUSION_PAIRS } from '../src/constants/confusion-pairs';

// Au chargement de la session :
const allCards = useSRSCards();
const cappedCards = applyConfusionPairCap(allCards.data ?? [], CONFUSION_PAIRS);
const dueCards = getCardsDueForReview(cappedCards);
```

**Checkpoint :**
- [ ] `src/constants/confusion-pairs.ts` existe avec les 12 paires du seed
- [ ] Le plafonnement est appliqué avant de filtrer les cartes dues
- [ ] Scénario : si Ba est maîtrisée (interval 14j) mais Ta est faible (interval 0.5j), Ba est plafonnée à 7j

---

## MISSION 8 — Vérification end-to-end

**Action :**
Lance l'app et parcours le flux complet :

```bash
npx expo start
```

### Scénario de test :

1. **Leçon 1 complète** :
   - Onglet Apprendre → Leçon 1
   - Parcourir la présentation (4 lettres)
   - Faire les exercices MCQ
   - Vérifier que l'écran de résultats affiche le score
   - Tap "Continuer" → retour à Apprendre
   - Vérifier : Leçon 1 = ✅, Leçon 2 = 🔓 (déverrouillée)

2. **Cartes SRS créées** :
   - Ouvrir Supabase Studio
   - Vérifier que 4 cartes existent dans `srs_cards` (Alif, Ba, Ta, Tha)
   - Vérifier que `next_review_at` est dans ~10 minutes

3. **Onglet Réviser** :
   - Si les 10 minutes sont passées : "X cartes à réviser" s'affiche
   - Si pas encore : "Prochaine révision dans Xmin" s'affiche
   - Les stats montrent 4 cartes au total

4. **Session de révision** :
   - Tap "Commencer la révision"
   - Les MCQ s'affichent avec les 4 lettres de la leçon 1
   - Répondre correctement → la carte passe à interval 1 jour
   - Répondre incorrectement → la carte revient en fin de file
   - Fin de session → récapitulatif → retour à Réviser

5. **Progression** :
   - Faire la leçon 2 (Jim, Ha, Kha)
   - Vérifier que la leçon 3 se déverrouille
   - Vérifier que les cartes SRS augmentent (maintenant 7)

6. **Confusion pairs** :
   - Après avoir fait leçon 1 (Ba, Ta, Tha sont dans la même paire de confusion)
   - Si Ba est maîtrisée mais Ta non, vérifier que Ba reste dans les révisions

**Checkpoint final de l'étape :**
- [ ] L'algorithme SRS calcule correctement les intervalles (10min → 1j → 3j → croissant)
- [ ] Les cartes SRS sont créées à la fin de chaque leçon
- [ ] L'onglet Réviser affiche les 3 états corrects (vide / dues / à jour)
- [ ] La session de révision fonctionne de bout en bout
- [ ] Les cartes échouées reviennent en fin de file
- [ ] La progression des leçons est trackée (✅ / 🔓 / 🔒)
- [ ] Compléter une leçon déverrouille la suivante
- [ ] Le plafonnement des confusion pairs est actif
- [ ] Aucun crash, aucun warning critique

---

## RÉSUMÉ DE L'ÉTAPE 3

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Algorithme SRS (`src/engines/srs.ts`) | ⬜ |
| 2 | Hook `useSRSCards` (CRUD Supabase + contrainte unique) | ⬜ |
| 3 | Création des cartes SRS à la fin d'une leçon | ⬜ |
| 4 | Onglet Réviser (3 états, stats, compteurs) | ⬜ |
| 5 | Session de révision (exercices MCQ + mise à jour SRS) | ⬜ |
| 6 | Tracking de progression (déverrouillage séquentiel des leçons) | ⬜ |
| 7 | Confusion pairs intégrées au SRS | ⬜ |
| 8 | Vérification end-to-end | ⬜ |

> **Prochaine étape après validation :** Étape 4 — Onglet Profil/Réglages (personnalisation harakats/translittération/audio, streaks, XP) + exercice Association (match)
