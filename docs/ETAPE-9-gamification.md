# ÉTAPE 9 — Gamification : XP animations, badges, célébrations

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> Étapes terminées : 0→8. É8 = Audio natif (expo-av + expo-speech fallback + AudioButton + cache audio).
> Cette étape apporte la gamification qui transforme l'app en expérience addictive : animations XP flottantes, système de badges, écran de complétion de module, et célébrations streak.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (offline-first — CRITIQUE)** :
> - Tous les hooks lisent depuis **SQLite local**. JAMAIS d'import `src/db/remote` dans hooks/stores.
> - `content-sync.ts` et `sync-manager.ts` sont les seuls à parler à Supabase.
> - Après chaque écriture locale, appeler `runSync()` en fire-and-forget.
> - **Pas de CLI Supabase** : migrations SQL dans le Dashboard Cloud (SQL Editor).

> **Philosophie gamification de cette étape** :
> - Zéro dépendance externe pour les animations : Reanimated 3 (déjà installé) suffit pour tout.
> - Les badges sont des données, pas du code. Ajouter un badge = insérer une ligne, pas toucher au code.
> - Les célébrations sont subtiles et fonctionnelles — conformément à la direction artistique du brief (jamais gratuit, jamais criard).
> - Les confettis sont réservés aux moments exceptionnels (complétion de module, badge débloqué).

---

## MISSION 1 — Dépendances et vérifications

**Contexte :** Reanimated 3 est déjà installé depuis É2. Vérifier sa présence et installer `react-native-confetti-cannon` pour les célébrations de complétion de module.

**Action :**

```bash
# Vérifier Reanimated 3
cat package.json | grep -E "reanimated|confetti"

# Installer confetti (Reanimated-based, léger, pas de dépendance Lottie)
npx expo install react-native-confetti-cannon
```

> **Note :** `react-native-confetti-cannon` est une lib légère (~3KB gzipped) sans dépendance native lourde. Elle fonctionne avec Expo Go et EAS Build sans config supplémentaire.

**Checkpoint :**
- [ ] `react-native-reanimated` présent dans package.json (version 3.x)
- [ ] `react-native-confetti-cannon` présent dans package.json
- [ ] `npx expo start` démarre sans erreur

---

## MISSION 2 — Schéma SQLite local : table `badges` et `user_badges`

**Contexte :** Les badges sont des entités de contenu (comme les lettres). `badges` décrit les badges disponibles, `user_badges` trace les badges débloqués par l'utilisateur avec leur date d'obtention.

**Action — modifier `src/db/schema-local.ts` :**

Ajouter après la table `audio_cache` :

```typescript
// Table badges (contenu statique, synchronisé depuis Cloud)
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    title_fr TEXT NOT NULL,
    description_fr TEXT NOT NULL,
    icon TEXT NOT NULL,          -- Emoji ou identifiant d'icône
    category TEXT NOT NULL,      -- 'progress' | 'streak' | 'mastery' | 'speed'
    condition_type TEXT NOT NULL, -- 'lesson_count' | 'module_complete' | 'streak_days' | 'perfect_score' | 'speed_exercise'
    condition_value INTEGER NOT NULL, -- La valeur seuil
    condition_target TEXT,       -- ID optionnel (ex: module_id pour 'module_complete')
    xp_reward INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    synced_at TEXT
  );
`);

// Table user_badges (progression utilisateur)
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,   -- ISO 8601
    seen INTEGER NOT NULL DEFAULT 0, -- 0 = pas encore affiché à l'utilisateur
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    UNIQUE(user_id, badge_id)
  );
`);

await db.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_badges_seen ON user_badges(user_id, seen);
`);
```

**Checkpoint :**
- [ ] Tables `badges` et `user_badges` créées (supprimer l'app et relancer pour forcer la migration)
- [ ] Index créés
- [ ] Pas d'erreur de schema au démarrage

---

## MISSION 3 — SQL Cloud : tables + seed badges

**Contexte :** Les tables `badges` et `user_badges` doivent exister dans Supabase Cloud avec RLS. Le seed des 10 badges MVP est inséré directement.

**Action dans le Dashboard Supabase Cloud — SQL Editor :**

```sql
-- Table badges (contenu partagé, lecture publique)
CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  title_fr TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  condition_target TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_public_read" ON public.badges
  FOR SELECT USING (true);

-- Table user_badges (données privées par utilisateur)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id),
  unlocked_at TIMESTAMPTZ NOT NULL,
  seen BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_own_read" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_badges_own_write" ON public.user_badges
  FOR ALL USING (auth.uid() = user_id);

-- SEED : 10 badges MVP
INSERT INTO public.badges (id, title_fr, description_fr, icon, category, condition_type, condition_value, condition_target, xp_reward, sort_order)
VALUES
  ('badge-premier-pas',       'Premier pas',       'Première leçon complétée',               '🌱', 'progress', 'lesson_count',     1,    NULL,       50,  1),
  ('badge-curieux',           'Curieux',           '5 leçons complétées',                    '👀', 'progress', 'lesson_count',     5,    NULL,       100, 2),
  ('badge-alphabet',          'Alphabète',         'Toutes les leçons du Module 1 complétées','🔤', 'progress', 'module_complete',  1,    'module-1', 200, 3),
  ('badge-harakats',          'Voyellisé',         'Module 2 complété',                       '✨', 'progress', 'module_complete',  1,    'module-2', 200, 4),
  ('badge-lecteur',           'Lecteur',           'Module 3 complété',                       '📖', 'progress', 'module_complete',  1,    'module-3', 200, 5),
  ('badge-batisseur',         'Bâtisseur',         'Module 4 complété',                       '🏗️', 'progress', 'module_complete',  1,    'module-4', 300, 6),
  ('badge-streak-3',          'Sur la lancée',     '3 jours de streak consécutifs',           '🔥', 'streak',   'streak_days',      3,    NULL,       100, 7),
  ('badge-streak-7',          'Semaine parfaite',  '7 jours de streak consécutifs',           '💎', 'streak',   'streak_days',      7,    NULL,       250, 8),
  ('badge-sans-faute',        'Sans faute',        'Leçon complétée avec un score de 100%',   '⭐', 'mastery',  'perfect_score',    1,    NULL,       150, 9),
  ('badge-eclair',            'Éclair',            'Exercice MCQ résolu en moins de 3s',      '⚡', 'speed',    'speed_exercise',   3000, NULL,       100, 10)
ON CONFLICT (id) DO NOTHING;
```

**Checkpoint :**
- [ ] Tables `badges` et `user_badges` visibles dans le Dashboard Supabase
- [ ] 10 lignes dans `badges`
- [ ] RLS activé (SELECT `badges` fonctionne sans auth, `user_badges` exige un user connecté)

---

## MISSION 4 — content-sync : synchroniser les badges

**Contexte :** `content-sync.ts` synchronise actuellement letters, diacritics, modules, lessons. Ajouter la table `badges` dans le cycle de sync.

**Action — modifier `src/db/content-sync.ts` :**

**4a.** Ajouter la sync de `badges` après la sync de `lessons` :

```typescript
// Sync badges
const { data: badges, error: badgesError } = await supabase
  .from('badges')
  .select('*')
  .order('sort_order');

if (badgesError) throw badgesError;

for (const badge of badges ?? []) {
  await db.runAsync(
    `INSERT OR REPLACE INTO badges
     (id, title_fr, description_fr, icon, category, condition_type, condition_value,
      condition_target, xp_reward, sort_order, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      badge.id, badge.title_fr, badge.description_fr, badge.icon,
      badge.category, badge.condition_type, badge.condition_value,
      badge.condition_target ?? null, badge.xp_reward, badge.sort_order,
      new Date().toISOString()
    ]
  );
}

await db.runAsync(
  `INSERT OR REPLACE INTO sync_metadata (table_name, last_synced_at, row_count)
   VALUES ('badges', ?, ?)`,
  [new Date().toISOString(), badges?.length ?? 0]
);
```

**4b.** Ajouter `user_badges` dans le push sync (`sync-manager.ts`) :

```typescript
// Dans la liste des tables à pousser vers Cloud :
// user_badges : synced_at IS NULL → push → marquer synced_at

const unsyncedBadges = await db.getAllAsync<UserBadgeRow>(
  `SELECT * FROM user_badges WHERE synced_at IS NULL`
);

for (const ub of unsyncedBadges) {
  const { error } = await supabase
    .from('user_badges')
    .upsert({
      id: ub.id,
      user_id: userId,
      badge_id: ub.badge_id,
      unlocked_at: ub.unlocked_at,
      seen: ub.seen === 1,
      updated_at: ub.updated_at,
    }, { onConflict: 'user_id,badge_id' });

  if (!error) {
    await db.runAsync(
      `UPDATE user_badges SET synced_at = ? WHERE id = ?`,
      [new Date().toISOString(), ub.id]
    );
  }
}
```

**Checkpoint :**
- [ ] `badges` synchronisées depuis Cloud → SQLite local (10 lignes)
- [ ] `user_badges` pushées vers Cloud quand synced_at IS NULL
- [ ] Aucune régression sur les 4 tables de contenu existantes

---

## MISSION 5 — BadgeEngine (`src/engines/badge-engine.ts`)

**Contexte :** Moteur qui évalue si de nouveaux badges ont été débloqués après une action (complétion de leçon, streak mis à jour, score parfait, exercise rapide). Appelé depuis le hook `useProgress` et `useSRS`.

**Action — créer `src/engines/badge-engine.ts` :**

```typescript
import { getLocalDB } from '../db/local-db';
import { runSync } from './sync-manager';
import { generateId } from '../utils/id';

export interface BadgeUnlock {
  badge_id: string;
  title_fr: string;
  description_fr: string;
  icon: string;
  xp_reward: number;
}

interface BadgeCheckContext {
  userId: string;
  lessonCount?: number;       // Nombre total de leçons complétées
  completedModuleId?: string; // ID du module fraîchement complété (ou null)
  streakDays?: number;        // Streak actuel en jours
  isPerfectScore?: boolean;   // Leçon complétée avec score 100%
  exerciseTimeMs?: number;    // Temps du dernier exercice MCQ en ms
}

export async function checkAndUnlockBadges(ctx: BadgeCheckContext): Promise<BadgeUnlock[]> {
  const db = getLocalDB();
  const { userId } = ctx;

  // Charger les badges non encore débloqués par cet utilisateur
  const allBadges = await db.getAllAsync<{
    id: string; title_fr: string; description_fr: string; icon: string;
    category: string; condition_type: string; condition_value: number;
    condition_target: string | null; xp_reward: number;
  }>(`
    SELECT b.* FROM badges b
    WHERE b.id NOT IN (
      SELECT badge_id FROM user_badges WHERE user_id = ?
    )
  `, [userId]);

  const newUnlocks: BadgeUnlock[] = [];

  for (const badge of allBadges) {
    let shouldUnlock = false;

    switch (badge.condition_type) {
      case 'lesson_count':
        shouldUnlock = (ctx.lessonCount ?? 0) >= badge.condition_value;
        break;

      case 'module_complete':
        shouldUnlock = ctx.completedModuleId === badge.condition_target;
        break;

      case 'streak_days':
        shouldUnlock = (ctx.streakDays ?? 0) >= badge.condition_value;
        break;

      case 'perfect_score':
        shouldUnlock = ctx.isPerfectScore === true;
        break;

      case 'speed_exercise':
        // condition_value est le temps max en ms (ex: 3000 = 3s)
        shouldUnlock = ctx.exerciseTimeMs !== undefined && ctx.exerciseTimeMs <= badge.condition_value;
        break;
    }

    if (shouldUnlock) {
      const now = new Date().toISOString();
      const id = generateId();
      await db.runAsync(
        `INSERT OR IGNORE INTO user_badges
         (id, user_id, badge_id, unlocked_at, seen, updated_at, synced_at)
         VALUES (?, ?, ?, ?, 0, ?, NULL)`,
        [id, userId, badge.id, now, now]
      );
      newUnlocks.push({
        badge_id: badge.id,
        title_fr: badge.title_fr,
        description_fr: badge.description_fr,
        icon: badge.icon,
        xp_reward: badge.xp_reward,
      });
    }
  }

  // Push en fire-and-forget si nouveaux badges
  if (newUnlocks.length > 0) {
    runSync().catch(e => console.warn('[BadgeEngine] sync error:', e));
  }

  return newUnlocks;
}

export async function getUnseenBadges(userId: string): Promise<BadgeUnlock[]> {
  const db = getLocalDB();
  return db.getAllAsync<BadgeUnlock>(
    `SELECT b.id as badge_id, b.title_fr, b.description_fr, b.icon, b.xp_reward
     FROM user_badges ub
     JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = ? AND ub.seen = 0
     ORDER BY ub.unlocked_at ASC`,
    [userId]
  );
}

export async function markBadgesSeen(userId: string): Promise<void> {
  const db = getLocalDB();
  await db.runAsync(
    `UPDATE user_badges SET seen = 1, updated_at = ?, synced_at = NULL
     WHERE user_id = ? AND seen = 0`,
    [new Date().toISOString(), userId]
  );
  runSync().catch(e => console.warn('[BadgeEngine] sync error:', e));
}
```

**Créer `src/utils/id.ts` si absent :**
```typescript
import { v4 as uuidv4 } from 'uuid';
export const generateId = () => uuidv4();
// Si uuid non installé : Math.random().toString(36).slice(2) + Date.now().toString(36)
```

**Checkpoint :**
- [ ] `checkAndUnlockBadges()` retourne un tableau vide si aucun nouveau badge
- [ ] `checkAndUnlockBadges({ userId, lessonCount: 1 })` débloque `badge-premier-pas`
- [ ] Double appel → IGNORE, pas de doublon (contrainte UNIQUE)
- [ ] `getUnseenBadges()` retourne les badges non encore affichés
- [ ] **Aucun import `src/db/remote`**

---

## MISSION 6 — Hook `useBadges` (`src/hooks/useBadges.ts`)

**Contexte :** Hook React qui expose les badges débloqués par l'utilisateur et une fonction `checkBadges()` à appeler après chaque action de progression.

**Action — créer `src/hooks/useBadges.ts` :**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from '../stores/user-store';
import {
  checkAndUnlockBadges,
  getUnseenBadges,
  markBadgesSeen,
  BadgeUnlock,
  BadgeCheckContext,
} from '../engines/badge-engine';
import { getLocalDB } from '../db/local-db';

export interface UserBadgeDisplay {
  badge_id: string;
  title_fr: string;
  description_fr: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string;
}

export function useBadges() {
  const userId = useUserStore(s => s.user?.id);
  const [allUnlockedBadges, setAllUnlockedBadges] = useState<UserBadgeDisplay[]>([]);
  const [unseenBadges, setUnseenBadges] = useState<BadgeUnlock[]>([]);

  const loadBadges = useCallback(async () => {
    if (!userId) return;
    const db = getLocalDB();
    const badges = await db.getAllAsync<UserBadgeDisplay>(
      `SELECT b.id as badge_id, b.title_fr, b.description_fr, b.icon, b.xp_reward,
              ub.unlocked_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ?
       ORDER BY ub.unlocked_at DESC`,
      [userId]
    );
    setAllUnlockedBadges(badges);

    const unseen = await getUnseenBadges(userId);
    setUnseenBadges(unseen);
  }, [userId]);

  useEffect(() => { loadBadges(); }, [loadBadges]);

  const checkBadges = useCallback(async (ctx: Omit<BadgeCheckContext, 'userId'>): Promise<BadgeUnlock[]> => {
    if (!userId) return [];
    const newBadges = await checkAndUnlockBadges({ ...ctx, userId });
    if (newBadges.length > 0) {
      await loadBadges();
    }
    return newBadges;
  }, [userId, loadBadges]);

  const dismissUnseenBadges = useCallback(async () => {
    if (!userId) return;
    await markBadgesSeen(userId);
    setUnseenBadges([]);
  }, [userId]);

  return {
    allUnlockedBadges,
    unseenBadges,
    checkBadges,
    dismissUnseenBadges,
    reload: loadBadges,
  };
}
```

**Checkpoint :**
- [ ] Hook exporté sans erreur TypeScript
- [ ] `checkBadges({ lessonCount: 1 })` débloque le badge "Premier pas" et met à jour `unseenBadges`
- [ ] `dismissUnseenBadges()` vide `unseenBadges`
- [ ] **Aucun import `src/db/remote`**

---

## MISSION 7 — Composant `XPFloatingLabel` (`src/components/XPFloatingLabel.tsx`)

**Contexte :** Animation de "+50 XP" qui apparaît et monte vers le haut lorsqu'une leçon ou un exercice est complété. Utilise Reanimated 3. Déclenché depuis l'écran de leçon.

**Action — créer `src/components/XPFloatingLabel.tsx` :**

```typescript
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface XPFloatingLabelProps {
  xp: number;
  visible: boolean;
  onAnimationEnd?: () => void;
}

export function XPFloatingLabel({ xp, visible, onAnimationEnd }: XPFloatingLabelProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    opacity.value = 0;
    translateY.value = 0;

    // Apparition
    opacity.value = withTiming(1, { duration: 200 });
    // Montée
    translateY.value = withTiming(-60, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
    // Disparition avec délai
    opacity.value = withDelay(
      500,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onAnimationEnd) runOnJS(onAnimationEnd)();
      })
    );
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>+{xp} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 80,
    zIndex: 999,
    backgroundColor: 'rgba(255, 193, 7, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
});
```

**Checkpoint :**
- [ ] Composant rendu sans erreur
- [ ] Visible = true → animation de montée + disparition en ~1s
- [ ] `onAnimationEnd` appelé après la disparition
- [ ] Pas de crash si `visible` toggle rapidement

---

## MISSION 8 — Composant `BadgeUnlockModal` (`src/components/BadgeUnlockModal.tsx`)

**Contexte :** Modal de célébration affiché quand un nouveau badge est débloqué. Affiche l'icône, le titre, la description, les XP gagnés, et un fond avec confettis légers. Animation d'entrée via Reanimated 3.

**Action — créer `src/components/BadgeUnlockModal.tsx` :**

```typescript
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BadgeUnlock } from '../engines/badge-engine';

interface BadgeUnlockModalProps {
  badge: BadgeUnlock | null;
  onDismiss: () => void;
}

export function BadgeUnlockModal({ badge, onDismiss }: BadgeUnlockModalProps) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (badge) {
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      // Déclencher les confettis après un court délai
      setTimeout(() => confettiRef.current?.start(), 400);
    } else {
      scale.value = 0.5;
      opacity.value = 0;
    }
  }, [badge]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!badge) return null;

  return (
    <Modal transparent animationType="none" visible={!!badge} onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        {/* Confetti centré en haut */}
        <ConfettiCannon
          ref={confettiRef}
          count={60}
          origin={{ x: 200, y: -10 }}
          autoStart={false}
          fadeOut
          colors={['#F4C430', '#3CB371', '#4682B4', '#DC143C', '#9370DB']}
          explosionSpeed={350}
          fallSpeed={3000}
        />

        <Animated.View style={[styles.card, cardStyle]}>
          {/* Badge icon */}
          <Text style={styles.icon}>{badge.icon}</Text>

          {/* Titre */}
          <Text style={styles.newBadgeLabel}>NOUVEAU BADGE</Text>
          <Text style={styles.title}>{badge.title_fr}</Text>
          <Text style={styles.description}>{badge.description_fr}</Text>

          {/* XP reward */}
          <View style={styles.xpRow}>
            <Text style={styles.xpText}>+{badge.xp_reward} XP</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Super !</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFDF7',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  icon: { fontSize: 72, marginBottom: 12 },
  newBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#B8860B',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  xpRow: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
  },
  button: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
```

**Checkpoint :**
- [ ] Modal s'ouvre avec animation de scale + spring
- [ ] Confettis se déclenchent ~400ms après l'ouverture
- [ ] "Super !" → ferme le modal, `onDismiss` appelé
- [ ] Pas de crash si `badge` passe de non-null à null pendant l'animation

---

## MISSION 9 — Écran de complétion de module (`src/screens/ModuleCompleteScreen.tsx`)

**Contexte :** Écran plein-écran affiché quand l'utilisateur termine le dernier exercice d'un module (détecté dans `useProgress`). Affiche l'icône du module, le titre, les stats (XP total, leçons, temps), un fond avec confettis généreux, et un bouton "Continuer".

**Action — créer `src/screens/ModuleCompleteScreen.tsx` :**

```typescript
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { router } from 'expo-router';

interface ModuleCompleteScreenProps {
  moduleTitle: string;
  moduleIcon: string;
  totalXP: number;
  lessonsCount: number;
  timeMinutes: number;
  onContinue?: () => void;
}

export function ModuleCompleteScreen({
  moduleTitle, moduleIcon, totalXP, lessonsCount, timeMinutes, onContinue
}: ModuleCompleteScreenProps) {
  const confettiRef1 = useRef<ConfettiCannon>(null);
  const confettiRef2 = useRef<ConfettiCannon>(null);
  const iconScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    // Séquence d'entrée
    iconScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    statsOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    btnOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));

    // Confettis en deux vagues
    setTimeout(() => confettiRef1.current?.start(), 200);
    setTimeout(() => confettiRef2.current?.start(), 800);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const statsStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  const handleContinue = () => {
    if (onContinue) onContinue();
    else router.replace('/(tabs)/learn');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Deux canons à confettis, positions opposées */}
      <ConfettiCannon
        ref={confettiRef1}
        count={80}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut
        colors={['#F4C430', '#3CB371', '#4682B4', '#DC143C']}
        explosionSpeed={300}
        fallSpeed={3500}
      />
      <ConfettiCannon
        ref={confettiRef2}
        count={60}
        origin={{ x: 420, y: 0 }}
        autoStart={false}
        fadeOut
        colors={['#9370DB', '#FF8C00', '#20B2AA', '#FF69B4']}
        explosionSpeed={280}
        fallSpeed={3200}
      />

      {/* Contenu centré */}
      <View style={styles.content}>
        {/* Icône animée */}
        <Animated.Text style={[styles.moduleIcon, iconStyle]}>
          {moduleIcon}
        </Animated.Text>

        {/* Titre */}
        <Animated.View style={titleStyle}>
          <Text style={styles.completedLabel}>MODULE COMPLÉTÉ</Text>
          <Text style={styles.moduleTitle}>{moduleTitle}</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsRow, statsStyle]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalXP}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{lessonsCount}</Text>
            <Text style={styles.statLabel}>Leçons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{timeMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={btnStyle}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Continuer →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B3A2D',  // Vert profond de la palette Lisaan
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  moduleIcon: { fontSize: 88 },
  completedLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#A8D5BA',
    textAlign: 'center',
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFDF7',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 24,
    marginTop: 8,
  },
  statItem: { alignItems: 'center', minWidth: 60 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#F4C430' },
  statLabel: { fontSize: 12, color: '#A8D5BA', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  continueButton: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 8,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B3A2D',
    letterSpacing: 0.5,
  },
});
```

**Créer la route `app/module-complete.tsx` pour accéder à cet écran :**

```typescript
import { useLocalSearchParams } from 'expo-router';
import { ModuleCompleteScreen } from '../../src/screens/ModuleCompleteScreen';

export default function ModuleCompletePage() {
  const params = useLocalSearchParams<{
    moduleTitle: string;
    moduleIcon: string;
    totalXP: string;
    lessonsCount: string;
    timeMinutes: string;
  }>();

  return (
    <ModuleCompleteScreen
      moduleTitle={params.moduleTitle ?? 'Module complété'}
      moduleIcon={params.moduleIcon ?? '🎓'}
      totalXP={parseInt(params.totalXP ?? '0')}
      lessonsCount={parseInt(params.lessonsCount ?? '0')}
      timeMinutes={parseInt(params.timeMinutes ?? '0')}
    />
  );
}
```

**Checkpoint :**
- [ ] Écran accessible via `router.push('/module-complete?moduleTitle=...&moduleIcon=...&totalXP=...&lessonsCount=...&timeMinutes=...')`
- [ ] Séquence d'animation : icône → titre → stats → bouton (enchainement)
- [ ] Confettis en deux vagues
- [ ] "Continuer →" navigue vers l'onglet learn
- [ ] Fond vert profond conforme à la palette Lisaan

---

## MISSION 10 — Intégration dans le flow de leçon (`app/lesson/[id].tsx`)

**Contexte :** Après la dernière question d'une leçon, l'écran de leçon doit : (1) incrémenter le total XP, (2) déclencher l'animation XP flottante, (3) vérifier les nouveaux badges, (4) si module complété, naviguer vers `/module-complete`. Les badges non vus sont affichés via `BadgeUnlockModal`.

**Action — modifier `app/lesson/[id].tsx` :**

**10a.** Importer les composants et hooks nécessaires :

```typescript
import { XPFloatingLabel } from '../../src/components/XPFloatingLabel';
import { BadgeUnlockModal } from '../../src/components/BadgeUnlockModal';
import { useBadges } from '../../src/hooks/useBadges';
import { BadgeUnlock } from '../../src/engines/badge-engine';
```

**10b.** Ajouter dans le composant :

```typescript
const { checkBadges } = useBadges();

const [showXP, setShowXP] = useState(false);
const [currentBadge, setCurrentBadge] = useState<BadgeUnlock | null>(null);
const pendingBadges = useRef<BadgeUnlock[]>([]);
```

**10c.** Dans la fonction `onLessonComplete(result: LessonResult)` (adapter au nom existant) :

```typescript
const handleLessonComplete = async (result: { score: number; xpEarned: number; timeSeconds: number }) => {
  // 1. Mettre à jour la progression en base (existant)
  await markLessonCompleted(lessonId, result.score, result.timeSeconds);

  // 2. Mettre à jour le XP dans le store utilisateur
  const newTotalXP = userStore.addXP(result.xpEarned);

  // 3. XP flottant
  setShowXP(true);

  // 4. Compter les leçons complétées et vérifier si module terminé
  const completedCount = await getCompletedLessonsCount(userId);
  const moduleJustCompleted = await checkIfModuleComplete(lesson.module_id, userId);

  // 5. Vérifier les badges
  const newBadges = await checkBadges({
    lessonCount: completedCount,
    completedModuleId: moduleJustCompleted ? lesson.module_id : undefined,
    isPerfectScore: result.score === 100,
  });

  // 6. Si module complété → naviguer vers l'écran de célébration
  if (moduleJustCompleted) {
    const moduleStats = await getModuleStats(lesson.module_id, userId);
    router.push({
      pathname: '/module-complete',
      params: {
        moduleTitle: moduleStats.title_fr,
        moduleIcon: moduleStats.icon,
        totalXP: moduleStats.total_xp.toString(),
        lessonsCount: moduleStats.lessons_count.toString(),
        timeMinutes: Math.round(moduleStats.total_seconds / 60).toString(),
      },
    });
    return;
  }

  // 7. Afficher les badges en file d'attente
  if (newBadges.length > 0) {
    pendingBadges.current = newBadges;
    setCurrentBadge(pendingBadges.current.shift() ?? null);
  } else {
    // 8. Sinon, naviguer vers l'écran de résultat de leçon (comportement existant)
    navigateToLessonResult(result);
  }
};
```

**10d.** Ajouter la gestion de la file de badges :

```typescript
const handleBadgeDismiss = () => {
  const next = pendingBadges.current.shift();
  if (next) {
    setCurrentBadge(next);
  } else {
    setCurrentBadge(null);
    navigateToLessonResult(currentResult);
  }
};
```

**10e.** Dans le JSX, ajouter `XPFloatingLabel` et `BadgeUnlockModal` :

```typescript
<View style={styles.container}>
  {/* ... contenu existant de la leçon ... */}

  {/* XP Floating */}
  <XPFloatingLabel
    xp={lesson.xp_reward ?? 50}
    visible={showXP}
    onAnimationEnd={() => setShowXP(false)}
  />

  {/* Badge modal */}
  <BadgeUnlockModal
    badge={currentBadge}
    onDismiss={handleBadgeDismiss}
  />
</View>
```

**10f.** Ajouter les fonctions helpers dans `src/db/local-queries.ts` (si absentes) :

```typescript
export async function getCompletedLessonsCount(userId: string): Promise<number> {
  const db = getLocalDB();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );
  return result?.count ?? 0;
}

export async function checkIfModuleComplete(moduleId: string, userId: string): Promise<boolean> {
  const db = getLocalDB();
  const result = await db.getFirstAsync<{ total: number; completed: number }>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed
     FROM lessons l
     LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
     WHERE l.module_id = ?`,
    [userId, moduleId]
  );
  return !!result && result.total > 0 && result.total === result.completed;
}

export async function getModuleStats(moduleId: string, userId: string) {
  const db = getLocalDB();
  const module = await db.getFirstAsync<{ title_fr: string; icon: string }>(
    `SELECT title_fr, icon FROM modules WHERE id = ?`,
    [moduleId]
  );
  const stats = await db.getFirstAsync<{ total_xp: number; lessons_count: number; total_seconds: number }>(
    `SELECT
      COALESCE(SUM(up.score), 0) as total_xp,
      COUNT(*) as lessons_count,
      COALESCE(SUM(up.time_spent_seconds), 0) as total_seconds
     FROM user_progress up
     JOIN lessons l ON l.id = up.lesson_id
     WHERE l.module_id = ? AND up.user_id = ? AND up.status = 'completed'`,
    [moduleId, userId]
  );
  return {
    title_fr: module?.title_fr ?? 'Module',
    icon: module?.icon ?? '📚',
    total_xp: stats?.total_xp ?? 0,
    lessons_count: stats?.lessons_count ?? 0,
    total_seconds: stats?.total_seconds ?? 0,
  };
}
```

**Checkpoint :**
- [ ] En fin de leçon : animation XP flottante visible
- [ ] En fin de leçon : vérification badges (badge-premier-pas si 1ère leçon)
- [ ] Badge débloqué → modal `BadgeUnlockModal` affiché
- [ ] Plusieurs badges → affichés en séquence (un par un)
- [ ] Module complété → navigation vers `/module-complete` avec les stats
- [ ] Aucune régression sur le flow de leçon existant

---

## MISSION 11 — Onglet Profil : galerie de badges

**Contexte :** L'onglet Profil (É4) montre les stats utilisateur. Ajouter une section "Mes badges" qui affiche les badges débloqués (icône + titre) et les badges non encore débloqués (grisés, icon + "?" ou titre masqué).

**Action — modifier `app/(tabs)/profile.tsx` :**

**11a.** Ajouter le hook :

```typescript
import { useBadges } from '../../src/hooks/useBadges';

const { allUnlockedBadges } = useBadges();
```

**11b.** Charger tous les badges disponibles depuis SQLite :

```typescript
const [allBadges, setAllBadges] = useState<BadgeItem[]>([]);

useEffect(() => {
  getLocalDB().getAllAsync<BadgeItem>(
    `SELECT b.id, b.title_fr, b.icon, b.description_fr,
            CASE WHEN ub.badge_id IS NOT NULL THEN 1 ELSE 0 END as unlocked
     FROM badges b
     LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
     ORDER BY b.sort_order`,
    [userId]
  ).then(setAllBadges);
}, [userId, allUnlockedBadges]);
```

**11c.** Ajouter la section dans le JSX (après les stats existantes) :

```typescript
{/* Section badges */}
<View style={styles.badgesSection}>
  <Text style={styles.sectionTitle}>
    Badges · {allUnlockedBadges.length}/{allBadges.length}
  </Text>
  <View style={styles.badgesGrid}>
    {allBadges.map(badge => (
      <View
        key={badge.id}
        style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]}
      >
        <Text style={[styles.badgeIcon, !badge.unlocked && styles.badgeIconLocked]}>
          {badge.unlocked ? badge.icon : '🔒'}
        </Text>
        <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}
          numberOfLines={2}
        >
          {badge.unlocked ? badge.title_fr : '???'}
        </Text>
      </View>
    ))}
  </View>
</View>
```

**11d.** Styles à ajouter :

```typescript
badgesSection: {
  marginTop: 24,
  paddingHorizontal: 20,
},
sectionTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#1A1A1A',
  marginBottom: 16,
},
badgesGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
},
badgeItem: {
  width: '30%',
  alignItems: 'center',
  backgroundColor: '#FFFDF7',
  borderRadius: 16,
  padding: 12,
  borderWidth: 1,
  borderColor: '#E8E0D0',
},
badgeLocked: {
  backgroundColor: '#F5F5F5',
  borderColor: '#E0E0E0',
},
badgeIcon: { fontSize: 36, marginBottom: 6 },
badgeIconLocked: { opacity: 0.3 },
badgeTitle: {
  fontSize: 11,
  fontWeight: '600',
  color: '#333',
  textAlign: 'center',
},
badgeTitleLocked: { color: '#AAA' },
```

**Checkpoint :**
- [ ] Section "Badges" visible dans l'onglet Profil
- [ ] Badges débloqués : icône + titre visibles
- [ ] Badges verrouillés : 🔒 + "???" grisé
- [ ] Compteur "x/10" correct
- [ ] Pas de régression sur les stats existantes

---

## MISSION 12 — Célébration de streak (`src/components/StreakCelebration.tsx`)

**Contexte :** Quand l'utilisateur ouvre l'app et qu'un nouveau jour de streak est atteint (J3, J7, J14, J30), afficher une petite bannière animée en haut de l'écran. Plus subtil que la modal de badge — c'est une notification "toast" style.

**Action — créer `src/components/StreakCelebration.tsx` :**

```typescript
import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

interface StreakCelebrationProps {
  streakDays: number;
  visible: boolean;
  onHide?: () => void;
}

const MILESTONE_MESSAGES: Record<number, string> = {
  3:  '🔥 3 jours de suite !',
  7:  '💎 Une semaine parfaite !',
  14: '🌟 Deux semaines sans relâche !',
  30: '🏆 Un mois de régularité !',
};

export function StreakCelebration({ streakDays, visible, onHide }: StreakCelebrationProps) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  const message = MILESTONE_MESSAGES[streakDays];
  if (!message || !visible) return null;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 14 });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto-hide après 3 secondes
      translateY.value = withDelay(3000, withTiming(-80, { duration: 400 }));
      opacity.value = withDelay(3000, withTiming(0, { duration: 400 }, () => {
        if (onHide) onHide();
      }));
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.banner, animatedStyle]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    backgroundColor: '#1B3A2D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFDF7',
    letterSpacing: 0.3,
  },
});
```

**Intégration dans `app/_layout.tsx` ou `app/(tabs)/_layout.tsx` :**

```typescript
import { StreakCelebration } from '../../src/components/StreakCelebration';
import { useUserStore } from '../../src/stores/user-store';

// Dans le layout principal, après avoir vérifié le streak au démarrage :
const [showStreakCelebration, setShowStreakCelebration] = useState(false);
const streakCurrent = useUserStore(s => s.user?.streak_current ?? 0);

useEffect(() => {
  const milestones = [3, 7, 14, 30];
  if (milestones.includes(streakCurrent)) {
    setShowStreakCelebration(true);
  }
}, [streakCurrent]);

// Dans le JSX racine :
<StreakCelebration
  streakDays={streakCurrent}
  visible={showStreakCelebration}
  onHide={() => setShowStreakCelebration(false)}
/>
```

**Checkpoint :**
- [ ] Banner animée visible quand streak atteint 3, 7, 14 ou 30 jours
- [ ] Disparaît automatiquement après 3 secondes
- [ ] Aucun affichage si streak n'est pas un palier
- [ ] Positionnement correct sur iOS et Android (safe area)

---

## MISSION 13 — Vérification end-to-end + régression

**Action :**

```bash
npx expo start
```

### Scénario de test complet :

**1. XP Flottant :**
   - Compléter une leçon → animation "+50 XP" (ou la valeur réelle) visible et disparaît en ~1s

**2. Badge "Premier pas" :**
   - Utilisateur ayant 0 leçon complétée → compléter la 1ère leçon
   - → `BadgeUnlockModal` s'affiche avec l'icône 🌟, "Premier pas", "+50 XP"
   - → "Super !" → modal disparaît
   - → Onglet Profil → badge visible dans la galerie

**3. Complétion de module :**
   - Compléter toutes les leçons du Module 1
   - → Dernier exercice → `ModuleCompleteScreen` avec confettis
   - → Stats cohérentes (XP, nombre de leçons, temps)
   - → "Continuer →" → retour sur learn tab

**4. Galerie de badges :**
   - Onglet Profil → section "Badges · 1/10" (si 1 badge débloqué)
   - → Badge débloqué : icône + titre visibles
   - → Badge verrouillé : 🔒 + "???" grisé

**5. Sync des badges :**
   - Déconnecter le réseau → débloquer un badge → remettre le réseau
   - → `user_badges` pushé vers Cloud (synced_at rempli)

**6. Architecture offline-first :**
```bash
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/ src/engines/
# → Aucun résultat attendu (sauf content-sync.ts et sync-manager.ts)
```

**7. Régression complète :**
   - Modules 1→4 jouables de bout en bout
   - SRS fonctionne
   - Audio fonctionne (É8)
   - Aucun crash, aucun warning critique

**Checkpoint final :**
- [ ] SQL Cloud : tables `badges` et `user_badges` avec RLS
- [ ] Seed : 10 badges insérés dans Cloud
- [ ] SQLite local : tables `badges` et `user_badges` créées
- [ ] `content-sync` : badges syncés depuis Cloud
- [ ] `sync-manager` : `user_badges` pushés vers Cloud
- [ ] `BadgeEngine` : `checkAndUnlockBadges()`, `getUnseenBadges()`, `markBadgesSeen()`
- [ ] `useBadges` hook : `checkBadges()`, `unseenBadges`, `allUnlockedBadges`
- [ ] `XPFloatingLabel` : animation montée + disparition
- [ ] `BadgeUnlockModal` : spring + confettis + file d'attente multi-badges
- [ ] `ModuleCompleteScreen` : séquence animée + confettis + stats
- [ ] Route `/module-complete` accessible via router.push
- [ ] Intégration dans `lesson/[id].tsx` : XP + badges + module complete
- [ ] Onglet Profil : galerie badges 30% grid, débloqués vs verrouillés
- [ ] `StreakCelebration` : banner toast aux paliers 3/7/14/30 jours
- [ ] Mode offline : badges locaux, sync au retour réseau
- [ ] **Aucun hook/store/engine n'importe `src/db/remote`**
- [ ] Aucune régression Modules 1→4 + Audio

---

## RÉSUMÉ DE L'ÉTAPE 9

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Dépendances : react-native-confetti-cannon | ⬜ |
| 2 | SQLite local : tables badges + user_badges | ⬜ |
| 3 | SQL Cloud : tables + RLS + seed 10 badges | ⬜ |
| 4 | content-sync : sync badges + push user_badges | ⬜ |
| 5 | BadgeEngine : check, unlock, unseen, markSeen | ⬜ |
| 6 | Hook useBadges : checkBadges, unseenBadges, allUnlocked | ⬜ |
| 7 | XPFloatingLabel : animation Reanimated 3 | ⬜ |
| 8 | BadgeUnlockModal : spring + confettis + file d'attente | ⬜ |
| 9 | ModuleCompleteScreen + route /module-complete | ⬜ |
| 10 | Intégration lesson/[id].tsx : XP + badges + module complete | ⬜ |
| 11 | Onglet Profil : galerie badges | ⬜ |
| 12 | StreakCelebration : toast aux paliers | ⬜ |
| 13 | Vérification end-to-end + régression | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs :**
- `ETAPE-9-gamification.md` (ce fichier)
- `lisaan-seed-letters.json` (référence lettres)

**Fichiers à supprimer de /docs :**
- `ETAPE-8-audio.md` (terminée)

---

> **Prochaine étape après validation :** Étape 10 — Beta fermée : polish final, onboarding analytics, crash reporting, TestFlight/Play Store beta track.
