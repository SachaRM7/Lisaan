# ÉTAPE 4 — Profil, Réglages & Gamification légère

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> Étapes terminées : 0 (Supabase + polices), 1 (onboarding), 2 (composants arabes + leçons Module 1 + MCQ), 3 (SRS + onglet Réviser + progression).
> Cette étape implémente l'onglet Profil/Réglages complet (personnalisation harakats/translittération/audio/taille), le système de streaks, le compteur XP, et propage les réglages dans tous les composants existants.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

---

## MISSION 1 — Types et valeurs par défaut des réglages

**Action :**
Crée `src/types/settings.ts`.

```typescript
// src/types/settings.ts

export type HarakatsMode = 'always' | 'adaptive' | 'never' | 'tap_reveal';
export type TransliterationMode = 'always' | 'tap_reveal' | 'never';
export type TranslationMode = 'always' | 'tap_reveal' | 'never';
export type ExerciseDirection = 'ar_to_fr' | 'fr_to_ar' | 'both';
export type AudioSpeed = 'slow' | 'normal' | 'native';
export type FontSizePreference = 'small' | 'medium' | 'large' | 'xlarge';

export interface UserSettings {
  harakats_mode: HarakatsMode;
  transliteration_mode: TransliterationMode;
  translation_mode: TranslationMode;
  exercise_direction: ExerciseDirection;
  audio_autoplay: boolean;
  audio_speed: AudioSpeed;
  font_size: FontSizePreference;
  haptic_feedback: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  harakats_mode: 'always',
  transliteration_mode: 'always',
  translation_mode: 'always',
  exercise_direction: 'both',
  audio_autoplay: true,
  audio_speed: 'slow',
  font_size: 'large',
  haptic_feedback: true,
};
```

**Checkpoint :**
- [ ] `src/types/settings.ts` compile sans erreur
- [ ] `DEFAULT_SETTINGS` correspond aux valeurs d'un débutant (tout visible, audio lent, grande taille)

---

## MISSION 2 — Store Zustand pour les réglages (useSettingsStore)

**Action :**
Crée ou refactore `src/stores/useSettingsStore.ts`.

Ce store :
- Charge les réglages depuis Supabase (`user_settings`) au démarrage
- Maintient une copie locale pour un accès synchrone dans tous les composants
- Persiste les changements vers Supabase en mode fire-and-forget
- Utilise `DEFAULT_SETTINGS` comme fallback si aucune entrée en base

```typescript
// src/stores/useSettingsStore.ts

import { create } from 'zustand';
import { supabase } from '../db/remote';
import type { UserSettings, HarakatsMode, TransliterationMode, TranslationMode, ExerciseDirection, AudioSpeed, FontSizePreference } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

interface SettingsState extends UserSettings {
  isLoaded: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoaded: true });
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows — c'est normal si premier lancement
        console.error('[settings] Load error:', error.message);
      }

      if (data) {
        set({
          harakats_mode: data.harakats_mode ?? DEFAULT_SETTINGS.harakats_mode,
          transliteration_mode: data.transliteration_mode ?? DEFAULT_SETTINGS.transliteration_mode,
          translation_mode: data.translation_mode ?? DEFAULT_SETTINGS.translation_mode,
          exercise_direction: data.exercise_direction ?? DEFAULT_SETTINGS.exercise_direction,
          audio_autoplay: data.audio_autoplay ?? DEFAULT_SETTINGS.audio_autoplay,
          audio_speed: data.audio_speed ?? DEFAULT_SETTINGS.audio_speed,
          font_size: data.font_size ?? DEFAULT_SETTINGS.font_size,
          haptic_feedback: data.haptic_feedback ?? DEFAULT_SETTINGS.haptic_feedback,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (err) {
      console.error('[settings] Network error:', err);
      set({ isLoaded: true });
    }
  },

  updateSetting: (key, value) => {
    // Mise à jour locale immédiate
    set({ [key]: value });

    // Sync vers Supabase en arrière-plan
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('user_settings')
          .upsert(
            { user_id: user.id, [key]: value },
            { onConflict: 'user_id' }
          );
      } catch (err) {
        console.error('[settings] Sync error:', err);
      }
    })();
  },

  resetToDefaults: () => {
    set({ ...DEFAULT_SETTINGS });

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('user_settings')
          .upsert(
            { user_id: user.id, ...DEFAULT_SETTINGS },
            { onConflict: 'user_id' }
          );
      } catch (err) {
        console.error('[settings] Reset sync error:', err);
      }
    })();
  },
}));
```

**Intégration :** Appeler `loadSettings()` dans `app/_layout.tsx` au montage (après le check d'onboarding).

**Checkpoint :**
- [ ] `src/stores/useSettingsStore.ts` compile sans erreur
- [ ] `loadSettings()` est appelé au démarrage de l'app
- [ ] `updateSetting('harakats_mode', 'never')` met à jour le store ET sync vers Supabase
- [ ] Si aucune entrée en base, les `DEFAULT_SETTINGS` sont utilisés

---

## MISSION 3 — Propager les réglages dans ArabicText

**Action :**
Modifie `src/components/arabic/ArabicText.tsx` pour lire les réglages globaux quand les props ne sont pas explicitement passées.

### Logique de priorité :

1. Si une prop est explicitement passée → utiliser la prop
2. Sinon → lire la valeur depuis `useSettingsStore`

```typescript
// Dans ArabicText.tsx :
import { useSettingsStore } from '../../stores/useSettingsStore';

// Dans le composant :
const globalSettings = useSettingsStore();

const effectiveHarakatsMode = props.harakatsMode ?? globalSettings.harakats_mode;
const effectiveShowTransliteration = props.showTransliteration ?? (globalSettings.transliteration_mode === 'always');
const effectiveShowTranslation = props.showTranslation ?? (globalSettings.translation_mode === 'always');
const effectiveSize = props.size ?? globalSettings.font_size;
```

Pour les modes `tap_reveal` sur translittération et traduction :
- Si `transliteration_mode === 'tap_reveal'` : afficher la translittération masquée (ex: "• • • •"), tap pour révéler 2 secondes
- Si `transliteration_mode === 'never'` : ne pas afficher du tout
- Même logique pour `translation_mode`

**Checkpoint :**
- [ ] Changer `harakats_mode` dans le store change l'affichage de TOUS les `ArabicText` dans l'app
- [ ] Changer `font_size` dans le store change la taille de TOUS les textes arabes
- [ ] Les props explicites overrident toujours les réglages globaux
- [ ] Le mode `tap_reveal` fonctionne pour la translittération et la traduction

---

## MISSION 4 — Propager les réglages dans les exercices

**Action :**
Modifie le générateur d'exercices et le MCQExercise pour respecter les réglages.

### 4.1 — ExerciseDirection

Dans `src/engines/exercise-generator.ts`, respecter le réglage `exercise_direction` :

```typescript
import { useSettingsStore } from '../stores/useSettingsStore';

// Au lieu de toujours générer ar→fr ET fr→ar :
// - Si 'ar_to_fr' : ne générer QUE les exercices lettre arabe → nom français
// - Si 'fr_to_ar' : ne générer QUE les exercices nom français → lettre arabe
// - Si 'both' : générer les deux (comportement actuel)
```

**Note :** Le générateur est appelé hors d'un composant React (pas de hook possible). Passer la direction en paramètre :

```typescript
export function generateLetterExercises(
  lessonLetters: Letter[],
  allLetters: Letter[],
  direction: 'ar_to_fr' | 'fr_to_ar' | 'both' = 'both',
): ExerciseConfig[] {
  // ...
}
```

Puis dans `app/lesson/[id].tsx`, lire le store et passer la direction :

```typescript
const { exercise_direction } = useSettingsStore();
const exercises = generateLetterExercises(letters, allLetters, exercise_direction);
```

### 4.2 — Taille du texte dans MCQExercise

Le `MCQExercise` doit respecter `font_size` pour le prompt arabe. Utiliser `ArabicText` avec la prop `size` non passée (il lira le store automatiquement grâce à la Mission 3).

### 4.3 — Haptic feedback

Dans `MCQExercise`, si `haptic_feedback === true` :
- Réponse correcte : vibration légère (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`)
- Réponse incorrecte : vibration moyenne (`Haptics.ImpactFeedbackStyle.Medium`)

Si `haptic_feedback === false` : pas de vibration.

```bash
npx expo install expo-haptics
```

**Checkpoint :**
- [ ] Changer `exercise_direction` en `ar_to_fr` ne génère QUE des exercices dans ce sens
- [ ] Le texte arabe dans les exercices respecte le `font_size` global
- [ ] Le haptic feedback fonctionne quand activé, absent quand désactivé
- [ ] `expo-haptics` est installé

---

## MISSION 5 — Système de streaks

**Action :**
Crée `src/engines/streak.ts` — la logique de calcul et mise à jour des streaks.

### Règles du streak :

- Un streak est incrémenté quand l'utilisateur **complète au moins une leçon ou une session de révision** dans une journée calendaire (fuseau local)
- Si un jour passe sans activité, le streak retombe à 0
- Le record (`streak_longest`) est mis à jour si le streak courant le dépasse
- Le streak est stocké dans la table `users` (champs `streak_current` et `streak_longest`)

```typescript
// src/engines/streak.ts

import { supabase } from '../db/remote';

interface StreakData {
  streak_current: number;
  streak_longest: number;
  last_activity_date: string | null; // YYYY-MM-DD en heure locale
}

/**
 * Vérifie et met à jour le streak de l'utilisateur.
 * Appelée à chaque complétion de leçon ou session de révision.
 */
export async function updateStreak(): Promise<StreakData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Charger les données actuelles
    const { data: userData, error } = await supabase
      .from('users')
      .select('streak_current, streak_longest, last_activity_date')
      .eq('id', user.id)
      .single();

    if (error || !userData) return null;

    const today = getLocalDateString();
    const lastActivity = userData.last_activity_date;

    let newStreak: number;

    if (lastActivity === today) {
      // Déjà actif aujourd'hui — pas de changement
      return {
        streak_current: userData.streak_current,
        streak_longest: userData.streak_longest,
        last_activity_date: today,
      };
    }

    if (lastActivity === getYesterdayDateString()) {
      // Actif hier → incrémenter
      newStreak = (userData.streak_current ?? 0) + 1;
    } else {
      // Pas actif hier → reset à 1
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, userData.streak_longest ?? 0);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        streak_current: newStreak,
        streak_longest: newLongest,
        last_activity_date: today,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[streak] Update error:', updateError.message);
      return null;
    }

    return {
      streak_current: newStreak,
      streak_longest: newLongest,
      last_activity_date: today,
    };
  } catch (err) {
    console.error('[streak] Error:', err);
    return null;
  }
}

// --- Helpers ---

function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}
```

### Migration : ajouter `last_activity_date` à la table `users`

```bash
npx supabase migration new add_last_activity_date
```

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_activity_date DATE;
```

### Intégration :

Appeler `updateStreak()` :
- À la fin d'une leçon (dans le handler "Continuer" de l'écran de résultats)
- À la fin d'une session de révision (dans le handler "Continuer" du récapitulatif)

C'est fire-and-forget — ne pas bloquer la navigation.

**Checkpoint :**
- [ ] `src/engines/streak.ts` compile sans erreur
- [ ] La colonne `last_activity_date` existe dans la table `users`
- [ ] Compléter une leçon incrémente le streak (vérifier dans Supabase Studio)
- [ ] Si on complète deux leçons le même jour, le streak n'augmente qu'une fois
- [ ] Si un jour est sauté, le streak retombe à 1

---

## MISSION 6 — Système XP

**Action :**
Crée `src/engines/xp.ts` — la logique d'attribution et cumul des XP.

### Règles XP :

- Chaque leçon rapporte les XP définis dans `lessons.xp_reward` (20-30 XP)
- Chaque session de révision rapporte `5 XP × nombre de cartes révisées`
- Bonus : 100% de réponses correctes dans une leçon → XP × 1.5
- Les XP sont cumulés dans `users.total_xp`

```typescript
// src/engines/xp.ts

import { supabase } from '../db/remote';

/**
 * Ajoute des XP à l'utilisateur.
 */
export async function addXP(amount: number): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Lire le total actuel
    const { data: userData } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', user.id)
      .single();

    const currentXP = userData?.total_xp ?? 0;
    const newTotal = currentXP + amount;

    await supabase
      .from('users')
      .update({ total_xp: newTotal })
      .eq('id', user.id);

    return newTotal;
  } catch (err) {
    console.error('[xp] Error:', err);
    return null;
  }
}

/**
 * Calcule les XP gagnés pour une leçon complétée.
 */
export function calculateLessonXP(baseXP: number, scorePercent: number): number {
  // Bonus 50% pour un score parfait
  const multiplier = scorePercent >= 100 ? 1.5 : 1;
  return Math.round(baseXP * multiplier);
}

/**
 * Calcule les XP gagnés pour une session de révision.
 */
export function calculateReviewXP(cardsReviewed: number): number {
  return cardsReviewed * 5;
}
```

### Intégration :

Dans l'écran de résultats de leçon :
```typescript
const earnedXP = calculateLessonXP(lesson.xp_reward, score);
addXP(earnedXP); // fire-and-forget
// Afficher "+20 XP" (ou "+30 XP 🎯" si bonus) dans l'écran de résultats
```

Dans le récapitulatif de révision :
```typescript
const earnedXP = calculateReviewXP(cardsReviewed);
addXP(earnedXP);
// Afficher "+60 XP" dans le récapitulatif
```

**Checkpoint :**
- [ ] `src/engines/xp.ts` compile sans erreur
- [ ] Compléter une leçon ajoute les XP dans `users.total_xp`
- [ ] Score de 100% donne le bonus 1.5x
- [ ] Compléter une session de révision de 12 cartes donne 60 XP
- [ ] L'écran de résultats affiche les XP gagnés

---

## MISSION 7 — Onglet Profil : écran principal

**Action :**
Refactore `app/(tabs)/profile.tsx` — l'onglet Profil et Réglages.

### Structure de l'écran :

```
┌─────────────────────────────────────┐
│  Profil                             │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────┐      │
│  │  👤 Sacha                 │      │  ← Nom de l'utilisateur
│  │  🔥 12 jours de streak    │      │  ← Streak courant
│  │  ⭐ 450 XP               │      │  ← XP total
│  │  Record : 18 jours        │      │  ← Streak le plus long
│  └───────────────────────────┘      │
│                                     │
│  ── Affichage ──                    │
│                                     │
│  Harakats        [Toujours ▾]       │  ← Sélecteur
│  Translittération [Toujours ▾]      │
│  Traduction      [Toujours ▾]       │
│  Taille du texte [Grande   ▾]       │
│                                     │
│  ── Exercices ──                    │
│                                     │
│  Sens             [Les deux ▾]      │
│  Vibrations       [●         ]      │  ← Toggle on/off
│                                     │
│  ── Audio ──                        │
│                                     │
│  Lecture auto     [●         ]      │
│  Vitesse          [Lent     ▾]      │
│                                     │
│  ── Objectif ──                     │
│                                     │
│  Temps quotidien  [10 min   ▾]      │
│                                     │
│  ── Compte ──                       │
│                                     │
│  Réinitialiser les réglages         │  ← Bouton texte
│  Se déconnecter                     │  ← Bouton texte (rouge)
│                                     │
└─────────────────────────────────────┘
```

### Composants de réglage :

Crée `src/components/settings/SettingRow.tsx` — une ligne de réglage réutilisable :

```typescript
interface SettingRowProps {
  label: string;
  type: 'select' | 'toggle';
  // Pour select :
  options?: { value: string; label: string }[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  // Pour toggle :
  isOn?: boolean;
  onToggle?: (value: boolean) => void;
}
```

### Options des sélecteurs :

**Harakats :**
- `always` → "Toujours affichés"
- `tap_reveal` → "Tap pour révéler"
- `never` → "Masqués"
- `adaptive` → "Adaptatif" (note : au MVP, adaptive = always, mais le choix est en place)

**Translittération :**
- `always` → "Toujours visible"
- `tap_reveal` → "Tap pour révéler"
- `never` → "Masquée"

**Traduction :**
- `always` → "Toujours visible"
- `tap_reveal` → "Tap pour révéler"
- `never` → "Masquée"

**Taille du texte :**
- `small` → "Petite"
- `medium` → "Moyenne"
- `large` → "Grande"
- `xlarge` → "Très grande"

**Sens des exercices :**
- `ar_to_fr` → "Arabe → Français"
- `fr_to_ar` → "Français → Arabe"
- `both` → "Les deux en alternance"

**Vitesse audio :**
- `slow` → "Lent"
- `normal` → "Normal"
- `native` → "Natif"

**Objectif quotidien :**
- `5` → "5 min"
- `10` → "10 min"
- `15` → "15 min"
- `25` → "25 min"

### Comportement des sélecteurs :

Utiliser un **bottom sheet** ou un **picker modal** pour les sélecteurs (pas un dropdown natif qui rend mal sur les deux plateformes). Options :
- `@gorhom/bottom-sheet` (si déjà installé)
- Ou un simple `Modal` React Native avec une liste d'options

Chaque changement appelle `updateSetting(key, value)` sur le store — l'effet est immédiat.

### Section stats (header) :

Charger les données utilisateur depuis Supabase :
```typescript
const { data: userData } = useQuery({
  queryKey: ['user_profile'],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from('users')
      .select('display_name, streak_current, streak_longest, total_xp')
      .eq('id', user.id)
      .single();
    return data;
  },
});
```

### Section Compte :

- **Réinitialiser les réglages** : appeler `resetToDefaults()` avec une confirmation `Alert.alert`
- **Se déconnecter** : appeler `supabase.auth.signOut()` avec une confirmation, puis rediriger vers l'onboarding (ou un écran de login — au MVP, juste reset l'état)

**Checkpoint :**
- [ ] `app/(tabs)/profile.tsx` affiche les stats (streak, XP, nom)
- [ ] Les 8 réglages sont affichés avec les bonnes valeurs courantes
- [ ] Changer un réglage met à jour le store ET sync vers Supabase
- [ ] Les toggles (vibrations, lecture auto) fonctionnent
- [ ] Les sélecteurs ouvrent un picker/bottom sheet avec les options
- [ ] "Réinitialiser" remet tout aux valeurs par défaut
- [ ] Le composant `SettingRow` est réutilisable

---

## MISSION 8 — Afficher streak et XP dans les écrans existants

**Action :**
Ajouter des indicateurs de streak et XP dans les endroits stratégiques.

### 8.1 — Header de l'onglet Apprendre

Ajouter en haut de l'écran Apprendre :
```
┌─────────────────────────────────────┐
│  Apprendre    🔥 12   ⭐ 450       │
└─────────────────────────────────────┘
```

Streak (🔥) et XP (⭐) affichés en haut à droite, compacts.

### 8.2 — Écran de résultats de leçon

Ajouter l'affichage des XP gagnés :
```
  Score : 8/10 (80%)
  +20 XP
  🔥 Streak : 13 jours
```

### 8.3 — Récapitulatif de session de révision

Ajouter l'affichage des XP gagnés :
```
  12 cartes révisées
  +60 XP
```

**Checkpoint :**
- [ ] Le header de l'onglet Apprendre affiche le streak et les XP
- [ ] L'écran de résultats de leçon affiche les XP gagnés et le streak
- [ ] Le récapitulatif de révision affiche les XP gagnés

---

## MISSION 9 — Preview en temps réel dans les réglages

**Action :**
Ajoute un aperçu live en haut de la section "Affichage" des réglages.

### Structure :

```
┌─────────────────────────────────────┐
│  ── Affichage ──                    │
│                                     │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │
│  │       كِتَابٌ                 │    │  ← ArabicText avec les réglages courants
│  │       kitābun               │    │
│  │       un livre              │    │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    │
│                                     │
│  Harakats        [Toujours ▾]       │
│  ...                                │
└─────────────────────────────────────┘
```

Utiliser le composant `ArabicText` avec le mot "كِتَابٌ" (kitābun, "un livre") comme preview. Comme `ArabicText` lit maintenant le store automatiquement (Mission 3), changer un réglage met à jour le preview instantanément.

Props de l'ArabicText de preview (ne pas passer de props explicites pour que les réglages globaux soient utilisés) :
```typescript
<ArabicText
  withoutHarakats="كتاب"
  transliteration="kitābun"
  translation="un livre"
>
  كِتَابٌ
</ArabicText>
```

**Checkpoint :**
- [ ] L'aperçu live s'affiche en haut de la section Affichage
- [ ] Changer les harakats en "Masqués" retire les harakats du preview instantanément
- [ ] Changer la taille en "Très grande" agrandit le preview instantanément
- [ ] Changer la translittération en "Masquée" retire la translittération du preview

---

## MISSION 10 — Vérification end-to-end

**Action :**
Lance l'app et vérifie le flux complet :

```bash
npx expo start
```

### Scénario de test :

1. **Réglages → impact sur les leçons** :
   - Aller dans Profil → changer Harakats en "Masqués"
   - Aller dans Apprendre → ouvrir une leçon
   - Vérifier que les LetterCards n'affichent plus de harakats
   - Revenir dans Profil → changer en "Tap pour révéler"
   - Vérifier que le tap révèle les harakats dans ArabicText

2. **Réglages → impact sur les exercices** :
   - Changer Sens en "Arabe → Français"
   - Lancer une leçon → vérifier que tous les MCQ montrent une lettre arabe avec options en français
   - Changer en "Français → Arabe" → vérifier l'inverse

3. **Taille du texte** :
   - Changer de "Grande" à "Petite" → vérifier dans leçons et révision
   - Changer en "Très grande" → vérifier que rien ne déborde

4. **Haptic feedback** :
   - Activer → répondre à un exercice → vibration
   - Désactiver → répondre → pas de vibration

5. **Streak** :
   - Compléter une leçon → vérifier que le streak augmente
   - Vérifier que le streak s'affiche dans Profil et dans le header Apprendre

6. **XP** :
   - Compléter une leçon → vérifier que les XP s'ajoutent
   - Faire un score parfait → vérifier le bonus 1.5x
   - Faire une session de révision → vérifier que les XP de révision s'ajoutent

7. **Preview** :
   - Ouvrir Profil → l'aperçu "كِتَابٌ" reflète les réglages
   - Changer chaque réglage → le preview se met à jour en temps réel

8. **Persistance** :
   - Changer des réglages → fermer et rouvrir l'app → vérifier qu'ils sont conservés

**Checkpoint final de l'étape :**
- [ ] L'onglet Profil affiche les stats (streak, XP, nom) et les 8 réglages
- [ ] Chaque réglage a un impact immédiat dans l'app (leçons, exercices, révision)
- [ ] L'aperçu live reflète les réglages en temps réel
- [ ] Le streak s'incrémente correctement et gère les jours sautés
- [ ] Les XP se cumulent avec bonus pour les scores parfaits
- [ ] Les réglages persistent après redémarrage
- [ ] Le haptic feedback respecte le réglage
- [ ] Aucun crash, aucun warning critique

---

## RÉSUMÉ DE L'ÉTAPE 4

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Types et valeurs par défaut (`src/types/settings.ts`) | ✅ |
| 2 | Store Zustand settings (`useSettingsStore`) | ✅ |
| 3 | Propagation réglages → `ArabicText` | ✅ |
| 4 | Propagation réglages → exercices (direction, taille, haptic) | ✅ |
| 5 | Système de streaks (`src/engines/streak.ts`) | ✅ |
| 6 | Système XP (`src/engines/xp.ts`) | ✅ |
| 7 | Onglet Profil complet (stats + 8 réglages + sélecteurs) | ✅ |
| 8 | Streak et XP dans les écrans existants | ✅ |
| 9 | Preview en temps réel dans les réglages | ✅ |
| 10 | Vérification end-to-end | ✅ |

> **Prochaine étape après validation :** Étape 5 — Module 2 : Les harakats démystifiés (introduction progressive fatha/kasra/damma, tanwin, soukoun, chadda, exercices spécifiques)
