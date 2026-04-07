# ÉTAPE 2 — L'alphabet vivant : composants arabes, leçons & premier exercice

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> L'étape 0 (Supabase + polices) et l'étape 1 (onboarding complet) sont terminées.
> Cette étape construit le cœur de l'expérience : l'affichage du texte arabe, les cartes de lettres, l'écran des leçons du Module 1, et le premier type d'exercice (QCM).

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Fichier de données** : `docs/lisaan-seed-letters.json` contient les 28 lettres avec toutes leurs propriétés (formes, phonétique, connexions, pédagogie, confusion pairs). Utilise-le comme source de vérité.

---

## MISSION 1 — Composant ArabicText

**Le composant le plus important de l'app.** Il rend du texte arabe avec gestion des harakats adaptatifs et de la translittération.

**Action :**
Crée `src/components/arabic/ArabicText.tsx`.

### Props :

```typescript
interface ArabicTextProps {
  /** Texte arabe avec harakats (ex: كِتَاب) */
  children: string;
  /** Texte sans harakats — si fourni, utilisé quand harakats masqués (ex: كتاب) */
  withoutHarakats?: string;
  /** Translittération latine (ex: kitāb) — affichée en dessous si activée */
  transliteration?: string;
  /** Traduction française — affichée en dessous si activée */
  translation?: string;
  /** Mode d'affichage des harakats */
  harakatsMode?: 'always' | 'never' | 'tap_reveal';
  /** Afficher la translittération */
  showTransliteration?: boolean;
  /** Afficher la traduction */
  showTranslation?: boolean;
  /** Taille du texte arabe (défaut: 'large') */
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  /** Style additionnel */
  style?: StyleProp<ViewStyle>;
}
```

### Comportement :

1. **Rendu RTL natif** : Le texte arabe utilise `writingDirection: 'rtl'` et `textAlign: 'right'`
2. **Police Amiri** : Le texte arabe utilise la police `Amiri` (ou `Amiri-Bold` si bold)
3. **Harakats adaptatifs** :
   - `always` : affiche `children` (texte vocalisé)
   - `never` : affiche `withoutHarakats` si fourni, sinon `children`
   - `tap_reveal` : affiche le texte sans harakats, tap pour révéler temporairement (2s)
4. **Translittération** : si `showTransliteration === true` et `transliteration` fourni, affiche en dessous du texte arabe, en police Inter, couleur grise, taille plus petite
5. **Traduction** : idem, encore en dessous de la translittération
6. **Tailles** : `small` = 20, `medium` = 28, `large` = 40, `xlarge` = 56 (en points)
7. **Espacement vertical** : le texte arabe avec diacritiques a besoin de `lineHeight` généreux — utiliser `fontSize * 2` comme lineHeight pour laisser la place aux harakats au-dessus et en-dessous

### Mapping tailles :

```typescript
const SIZES = {
  small:  { arabic: 20, sub: 12, lineHeight: 40 },
  medium: { arabic: 28, sub: 14, lineHeight: 56 },
  large:  { arabic: 40, sub: 16, lineHeight: 80 },
  xlarge: { arabic: 56, sub: 18, lineHeight: 112 },
} as const;
```

### Structure du rendu :

```
┌────────────────────────┐
│       كِتَاب              │  ← Texte arabe (Amiri, RTL, grande taille)
│       kitāb             │  ← Translittération (Inter, gris, petite taille)
│       livre             │  ← Traduction (Inter, gris clair, petite taille)
└────────────────────────┘
```

Le tout est centré horizontalement par défaut.

**Checkpoint :**
- [ ] `src/components/arabic/ArabicText.tsx` compile sans erreur
- [ ] Le texte arabe s'affiche en police Amiri, de droite à gauche
- [ ] Le mode `tap_reveal` masque les harakats et les révèle au tap
- [ ] La translittération et la traduction s'affichent en dessous quand activées
- [ ] Les diacritiques ne se chevauchent pas (lineHeight suffisant)

---

## MISSION 2 — Composant LetterCard

**Action :**
Crée `src/components/arabic/LetterCard.tsx`.

C'est la carte qui présente une lettre arabe avec ses 4 formes positionnelles. Utilisée dans les écrans de leçon et de révision.

### Props :

```typescript
interface LetterCardProps {
  /** Données de la lettre (depuis Supabase ou seed) */
  letter: {
    name_ar: string;          // باء
    name_fr: string;          // Ba
    transliteration: string;  // b
    ipa: string;              // /b/
    form_isolated: string;    // ب
    form_initial: string;     // بـ
    form_medial: string;      // ـبـ
    form_final: string;       // ـب
    connects_left: boolean;
    connects_right: boolean;
    articulation_fr: string;  // "Labiale — comme le B français"
  };
  /** Mode d'affichage */
  mode?: 'full' | 'compact' | 'quiz';
  /** Forme actuellement mise en surbrillance (pour les exercices) */
  highlightedForm?: 'isolated' | 'initial' | 'medial' | 'final';
  /** Callback au tap sur la carte */
  onPress?: () => void;
}
```

### Mode `full` (par défaut) — écran de leçon :

```
┌─────────────────────────────────┐
│                                 │
│            ب                    │  ← Forme isolée (xlarge, centrée)
│                                 │
│   Finale  Médiane  Initiale     │  ← Les 3 autres formes (medium)
│    ـب      ـبـ       بـ          │
│                                 │
│   Ba (b)                        │  ← Nom FR + translittération
│   /b/ — Labiale                 │  ← IPA + description
│                                 │
│   ● Se connecte à gauche        │  ← Infos de connexion
│   ● Se connecte à droite        │
└─────────────────────────────────┘
```

- Fond : blanc avec bordure arrondie (border-radius 16)
- Ombre douce (shadowOpacity 0.08)
- Les 3 formes positionnelles (hors isolée) sont affichées en ligne sous la forme principale
- La forme highlightée a un fond émeraude clair
- Palette : fond `#FFFFFF`, bordure `#E8E2D9`, accent `#2A9D8F`

### Mode `compact` — utilisé dans les listes :

```
┌──────────────────────┐
│   ب    Ba  /b/       │  ← Forme isolée + nom + IPA sur une ligne
└──────────────────────┘
```

### Mode `quiz` — utilisé dans les exercices :

Affiche uniquement la forme demandée en `highlightedForm`, grande taille, sans info textuelle. C'est le mode "quel est cette lettre ?".

**Checkpoint :**
- [ ] `src/components/arabic/LetterCard.tsx` compile sans erreur
- [ ] Le mode `full` affiche les 4 formes avec les infos de connexion
- [ ] Le mode `compact` affiche une version condensée
- [ ] Les formes positionnelles s'affichent correctement en arabe (pas de caractères cassés)
- [ ] L'ordre d'affichage des 3 formes non-isolées est bien Finale → Médiane → Initiale (lecture RTL)

---

## MISSION 3 — Composant HarakatToggle

**Action :**
Crée `src/components/arabic/HarakatToggle.tsx`.

Un petit toggle à 3 positions que l'utilisateur peut taper pour changer le mode d'affichage des harakats.

### Props :

```typescript
interface HarakatToggleProps {
  value: 'always' | 'never' | 'tap_reveal';
  onChange: (mode: 'always' | 'never' | 'tap_reveal') => void;
}
```

### Rendu :

3 icônes/labels en ligne, le mode actif est en surbrillance émeraude :
- 👁️ Toujours (`always`)
- 👆 Au tap (`tap_reveal`)
- 🚫 Masqués (`never`)

Le toggle est compact (hauteur 36, fond gris clair `#F5F0EB`, border-radius 18).

**Checkpoint :**
- [ ] `src/components/arabic/HarakatToggle.tsx` compile sans erreur
- [ ] Les 3 modes sont cliquables et l'état actif est visuellement distinct
- [ ] Le composant est réutilisable (pas de state interne, contrôlé par le parent)

---

## MISSION 4 — Seed des leçons du Module 1 dans Supabase

**Action :**
Crée une nouvelle migration Supabase pour insérer les leçons du Module 1 (L'alphabet vivant).

```bash
npx supabase migration new seed_module1_lessons
```

Le Module 1 contient **7 leçons**, chacune introduisant 4 lettres (sauf la dernière qui en a 4 + une révision cumulative) :

```sql
-- Leçon 1 : Alif, Ba, Ta, Tha — les fondations
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Alif, Ba, Ta, Tha — les fondations',
  'أ ب ت ث',
  'Tes 4 premières lettres. Ba, Ta et Tha partagent la même forme — seuls les points changent.',
  1, 20, 8
);

-- Leçon 2 : Jim, Ha, Kha — la coupe
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Jim, Ha, Kha — la coupe',
  'ج ح خ',
  'Trois lettres en forme de coupe. Le point change de position à chaque fois.',
  2, 20, 8
);

-- Leçon 3 : Dal, Dhal, Ra, Zay — les non-connectantes
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Dal, Dhal, Ra, Zay — celles qui ne s''attachent pas',
  'د ذ ر ز',
  'Ces 4 lettres ne se connectent jamais à la lettre suivante. Deux paires de jumeaux à distinguer.',
  3, 20, 8
);

-- Leçon 4 : Sin, Shin, Sad, Dad — les dents et les emphatiques
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Sin, Shin, Sad, Dad — dents et sons profonds',
  'س ش ص ض',
  'Sin et Shin ont des dents. Sad et Dad sont tes premières emphatiques — des sons uniques à l''arabe.',
  4, 25, 10
);

-- Leçon 5 : Taa, Dhaa, Ayn, Ghayn — les puissantes
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Taa, Dhaa, Ayn, Ghayn — les puissantes',
  'ط ظ ع غ',
  'Deux emphatiques de plus, puis Ayn — le son le plus emblématique de l''arabe.',
  5, 25, 10
);

-- Leçon 6 : Fa, Qaf, Kaf, Lam — vers la fluidité
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Fa, Qaf, Kaf, Lam — vers la fluidité',
  'ف ق ك ل',
  'Fa et Qaf se ressemblent — attention aux points. Lam forme une ligature spéciale avec Alif (لا).',
  6, 20, 8
);

-- Leçon 7 : Mim, Nun, Ha', Waw, Ya — la ligne d'arrivée
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Mim, Nun, Ha'', Waw, Ya — la ligne d''arrivée',
  'م ن ه و ي',
  'Les 5 dernières lettres. Après cette leçon, tu connais tout l''alphabet arabe.',
  7, 30, 12
);
```

**Important :** Le module "L'alphabet vivant" doit déjà exister dans la table `modules` (il a été seedé à l'étape 0). Vérifie avec `SELECT * FROM modules;` que la ligne existe et que le `title_fr` correspond.

Ensuite applique la migration :
```bash
npx supabase db reset
```

**Checkpoint :**
- [ ] La migration s'applique sans erreur
- [ ] `SELECT count(*) FROM lessons WHERE module_id = (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant');` retourne 7
- [ ] Les leçons sont ordonnées de 1 à 7 (sort_order)
- [ ] Les XP et durées estimées sont correctement remplies

---

## MISSION 5 — Hook useLetters : charger les lettres depuis Supabase

**Action :**
Crée `src/hooks/useLetters.ts`.

Ce hook charge les 28 lettres depuis Supabase et les expose aux composants.

```typescript
// src/hooks/useLetters.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/remote';

export interface Letter {
  id: string;
  sort_order: number;
  name_ar: string;
  name_fr: string;
  transliteration: string;
  ipa: string;
  form_isolated: string;
  form_initial: string;
  form_medial: string;
  form_final: string;
  connects_left: boolean;
  connects_right: boolean;
  is_sun_letter: boolean;
  articulation_group: string;
  articulation_fr: string;
  pedagogy_notes: string;
  audio_url: string | null;
}

async function fetchLetters(): Promise<Letter[]> {
  const { data, error } = await supabase
    .from('letters')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Letter[];
}

/** Charge les 28 lettres triées par ordre alphabétique arabe */
export function useLetters() {
  return useQuery({
    queryKey: ['letters'],
    queryFn: fetchLetters,
    staleTime: Infinity,  // Les lettres ne changent pas en session
  });
}

/** Charge les lettres d'une leçon spécifique (par plage de sort_order) */
export function useLettersForLesson(startOrder: number, endOrder: number) {
  return useQuery({
    queryKey: ['letters', startOrder, endOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .gte('sort_order', startOrder)
        .lte('sort_order', endOrder)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Letter[];
    },
    staleTime: Infinity,
  });
}
```

**Avant de coder :** Vérifie que `@tanstack/react-query` est installé et qu'un `QueryClientProvider` wrappe l'app dans `app/_layout.tsx`. Si ce n'est pas le cas :
```bash
npx expo install @tanstack/react-query
```
Et ajoute le provider dans le layout racine :
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

// Dans le JSX du layout :
<QueryClientProvider client={queryClient}>
  {/* ... le reste */}
</QueryClientProvider>
```

**Checkpoint :**
- [ ] `src/hooks/useLetters.ts` compile sans erreur
- [ ] `@tanstack/react-query` est installé et le provider est dans le layout
- [ ] `useLetters()` retourne 28 lettres quand Supabase tourne
- [ ] Les lettres sont triées par `sort_order`

---

## MISSION 6 — Hook useLessons : charger les leçons d'un module

**Action :**
Crée `src/hooks/useLessons.ts`.

```typescript
// src/hooks/useLessons.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/remote';

export interface Lesson {
  id: string;
  module_id: string;
  title_fr: string;
  title_ar: string;
  description_fr: string;
  sort_order: number;
  xp_reward: number;
  estimated_minutes: number;
}

async function fetchLessonsForModule(moduleId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Lesson[];
}

export function useLessons(moduleId: string) {
  return useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => fetchLessonsForModule(moduleId),
    enabled: !!moduleId,
    staleTime: Infinity,
  });
}
```

**Checkpoint :**
- [ ] `src/hooks/useLessons.ts` compile sans erreur
- [ ] `useLessons(moduleId)` retourne 7 leçons pour le Module 1

---

## MISSION 7 — Écran "Apprendre" : liste des modules et leçons

**Action :**
Refactore `app/(tabs)/learn.tsx` pour afficher la vraie liste des modules et leçons (pas un placeholder).

### Structure de l'écran :

```
┌─────────────────────────────────────┐
│  Apprendre                    🔍    │  ← Header
├─────────────────────────────────────┤
│                                     │
│  📖 L'alphabet vivant         7/7   │  ← Module 1 (expandable)
│  ─────────────────────────────      │
│  │ 1. أ ب ت ث — les fondations  ✅ │  ← Leçon (status icône)
│  │ 2. ج ح خ — la coupe          ✅ │
│  │ 3. د ذ ر ز — non-connectantes 🔓│
│  │ 4. س ش ص ض — dents & emph.   🔒│  ← Locked
│  │ 5. ط ظ ع غ — les puissantes  🔒│
│  │ 6. ف ق ك ل — vers la fluidité🔒│
│  │ 7. م ن ه و ي — ligne d'arrivée🔒│
│                                     │
│  🎯 Les harakats démystifiés   🔒  │  ← Module 2 (locked)
│  📚 Lire ses premiers mots     🔒  │  ← Module 3 (locked)
│  💬 Construire du sens          🔒  │  ← Module 4 (locked)
│                                     │
└─────────────────────────────────────┘
```

### Logique :

1. Charger les 4 modules depuis Supabase (`SELECT * FROM modules ORDER BY sort_order`)
2. Le Module 1 est toujours déverrouillé. Les autres sont locked au MVP.
3. Au tap sur un module, afficher/masquer ses leçons (accordion)
4. Au tap sur une leçon déverrouillée, naviguer vers `app/lesson/[id].tsx`
5. Statuts des leçons (au MVP, sans vrai tracking de progression pour l'instant) :
   - Leçon 1 : `available` (première leçon, toujours accessible)
   - Leçons 2-7 : `locked` (déverrouillées séquentiellement dans une future étape)
   - Pour l'instant, rendre TOUTES les leçons du Module 1 cliquables pour tester

### Style :

- Chaque module est une carte (fond blanc, border-radius 12, ombre légère)
- Le titre du module affiche le titre arabe + français + le compteur de leçons
- Chaque leçon dans l'accordion affiche : numéro + titre arabe + titre français + icône de statut
- Icônes de statut : ✅ completed, 🔓 available, 🔒 locked
- Les leçons locked sont en opacité réduite (0.5) et non cliquables

**Checkpoint :**
- [ ] L'onglet "Apprendre" affiche les 4 modules depuis Supabase
- [ ] Le Module 1 est expandable et affiche ses 7 leçons
- [ ] Les modules 2-4 sont affichés mais locked (opacité réduite)
- [ ] Le tap sur une leçon navigue vers `/lesson/[id]`
- [ ] Le texte arabe des titres utilise la police Amiri

---

## MISSION 8 — Écran de leçon : présentation des lettres

**Action :**
Crée `app/lesson/[id].tsx` — l'écran de leçon dynamique.

Cet écran a deux phases :
1. **Phase présentation** : montrer les lettres de la leçon une par une
2. **Phase exercices** : enchaîner les exercices (Mission 9)

Pour cette mission, implémente uniquement la **phase présentation**.

### Mapping leçon → lettres :

Chaque leçon couvre des lettres spécifiques. Utilise le `sort_order` des lettres pour mapper :

| Leçon | sort_order des lettres |
|-------|----------------------|
| 1 | 1–4 (Alif, Ba, Ta, Tha) |
| 2 | 5–7 (Jim, Ha, Kha) |
| 3 | 8–11 (Dal, Dhal, Ra, Zay) |
| 4 | 12–15 (Sin, Shin, Sad, Dad) |
| 5 | 16–19 (Taa, Dhaa, Ayn, Ghayn) |
| 6 | 20–23 (Fa, Qaf, Kaf, Lam) |
| 7 | 24–28 (Mim, Nun, Ha', Waw, Ya) |

**Approche recommandée :** Crée un mapping `lessonSortOrder → [startLetterOrder, endLetterOrder]` basé sur le `sort_order` de la leçon. Par exemple, leçon avec `sort_order: 1` → lettres `sort_order` 1 à 4.

Le mapping exact :
```typescript
const LESSON_LETTER_RANGES: Record<number, [number, number]> = {
  1: [1, 4],   // Alif, Ba, Ta, Tha
  2: [5, 7],   // Jim, Ha, Kha
  3: [8, 11],  // Dal, Dhal, Ra, Zay
  4: [12, 15], // Sin, Shin, Sad, Dad
  5: [16, 19], // Taa, Dhaa, Ayn, Ghayn
  6: [20, 23], // Fa, Qaf, Kaf, Lam
  7: [24, 28], // Mim, Nun, Ha', Waw, Ya
};
```

### Structure de l'écran (phase présentation) :

```
┌─────────────────────────────────────┐
│  ← Retour     Leçon 1    2/4       │  ← Header : titre + compteur lettre
├─────────────────────────────────────┤
│  ● ● ○ ○                           │  ← Indicateur de progression (dots)
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │         [LetterCard]        │    │  ← LetterCard mode full
│  │         mode="full"         │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  "Identique au B français.          │  ← pedagogy_notes du seed
│   Un point sous la ligne de base.   │
│   Première lettre à enseigner..."   │
│                                     │
│  ┌─────────┐    ┌──────────────┐    │
│  │ 🔊 Écouter │  │   Suivant →   │   │  ← Boutons d'action
│  └─────────┘    └──────────────┘    │
└─────────────────────────────────────┘
```

### Comportement :

1. L'écran charge les lettres de la leçon via `useLettersForLesson(start, end)`
2. Affiche les lettres une par une (swipe horizontal ou bouton "Suivant")
3. Pour chaque lettre :
   - Affiche la `LetterCard` en mode `full`
   - Affiche les `pedagogy_notes` en dessous (texte français, police Inter)
   - Bouton "Écouter" (placeholder — pas d'audio au MVP, mais le bouton existe)
4. Indicateur de progression : dots en haut (remplis = vus, vide = restants)
5. Après la dernière lettre, le bouton "Suivant" passe à la phase exercices (Mission 9)
6. Le `HarakatToggle` est affiché en haut à droite pour que l'utilisateur puisse expérimenter

**Checkpoint :**
- [ ] `app/lesson/[id].tsx` existe et se charge sans erreur
- [ ] Les lettres de la leçon s'affichent via `LetterCard` mode full
- [ ] Les `pedagogy_notes` sont affichées en dessous de chaque carte
- [ ] Le swipe ou bouton "Suivant" passe à la lettre suivante
- [ ] L'indicateur de progression (dots) reflète la position courante
- [ ] Le bouton retour ramène à l'écran "Apprendre"

---

## MISSION 9 — Exercise Engine : types et registry

**Action :**
Crée les fondations du système d'exercices générique.

### 9.1 — Types des exercices

Crée `src/types/exercise.ts` :

```typescript
// src/types/exercise.ts

/** Types d'exercices supportés */
export type ExerciseType =
  | 'mcq'            // QCM (texte, image ou audio)
  | 'match'          // Association (tap)
  | 'fill_blank'     // Texte à trou
  | 'trace'          // Tracé de lettre (canvas)
  | 'listen_select'; // Écouter + choisir

/** Texte localisé (arabe + français) */
export interface LocalizedText {
  ar?: string;
  fr?: string;
}

/** Option dans un QCM ou une association */
export interface ExerciseOption {
  id: string;
  text: LocalizedText;
  /** Texte arabe vocalisé (avec harakats) */
  text_vocalized?: string;
  correct: boolean;
}

/** Configuration d'un exercice (stockée en JSONB dans Supabase) */
export interface ExerciseConfig {
  id: string;
  type: ExerciseType;
  prompt: LocalizedText;
  /** Sous-titre / instruction (ex: "Choisis la bonne lettre") */
  instruction_fr?: string;
  options?: ExerciseOption[];
  correct_answer?: string | string[];
  audio_url?: string;
  /** Données spécifiques au type (ex: letter_id pour trace) */
  metadata?: Record<string, unknown>;
  display_settings?: {
    show_harakats?: boolean;
    show_transliteration?: boolean;
  };
}

/** Résultat d'un exercice complété */
export interface ExerciseResult {
  exercise_id: string;
  correct: boolean;
  time_ms: number;
  attempts: number;
  user_answer: string | string[];
}

/** Props communes à tous les composants d'exercice */
export interface ExerciseComponentProps {
  config: ExerciseConfig;
  onComplete: (result: ExerciseResult) => void;
}
```

### 9.2 — Exercise Registry

Crée `src/components/exercises/index.ts` :

```typescript
// src/components/exercises/index.ts

import type { ExerciseType, ExerciseComponentProps } from '../../types/exercise';
import type { ComponentType } from 'react';
import { MCQExercise } from './MCQExercise';

/** Registry des composants d'exercice par type */
const exerciseRegistry = new Map<ExerciseType, ComponentType<ExerciseComponentProps>>();

// Enregistrer les exercices disponibles
exerciseRegistry.set('mcq', MCQExercise);
// exerciseRegistry.set('match', MatchExercise);    // TODO: Étape future
// exerciseRegistry.set('trace', TraceExercise);      // TODO: Étape future
// exerciseRegistry.set('fill_blank', FillBlankExercise); // TODO: Étape future

export function getExerciseComponent(type: ExerciseType): ComponentType<ExerciseComponentProps> | undefined {
  return exerciseRegistry.get(type);
}

export { exerciseRegistry };
```

### 9.3 — ExerciseRenderer

Crée `src/components/exercises/ExerciseRenderer.tsx` :

```typescript
// src/components/exercises/ExerciseRenderer.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ExerciseConfig, ExerciseResult } from '../../types/exercise';
import { getExerciseComponent } from './index';

interface ExerciseRendererProps {
  config: ExerciseConfig;
  onComplete: (result: ExerciseResult) => void;
}

export function ExerciseRenderer({ config, onComplete }: ExerciseRendererProps) {
  const Component = getExerciseComponent(config.type);

  if (!Component) {
    return (
      <View style={styles.error}>
        <Text>Type d'exercice non supporté : {config.type}</Text>
      </View>
    );
  }

  return <Component config={config} onComplete={onComplete} />;
}

const styles = StyleSheet.create({
  error: {
    padding: 20,
    alignItems: 'center',
  },
});
```

**Checkpoint :**
- [ ] `src/types/exercise.ts` compile sans erreur
- [ ] `src/components/exercises/index.ts` compile (le registry contient `mcq`)
- [ ] `src/components/exercises/ExerciseRenderer.tsx` compile
- [ ] Le pattern registry fonctionne : `getExerciseComponent('mcq')` retourne un composant

---

## MISSION 10 — Composant MCQExercise (premier exercice)

**Action :**
Crée `src/components/exercises/MCQExercise.tsx`.

C'est le premier type d'exercice : un QCM avec prompt en arabe et 3-4 options.

### Structure :

```
┌─────────────────────────────────────┐
│                                     │
│  Quelle est cette lettre ?          │  ← instruction_fr
│                                     │
│            ب                        │  ← prompt.ar (ArabicText, xlarge)
│                                     │
│  ┌───────────────────────────┐      │
│  │   Ba                      │      │  ← Option A
│  └───────────────────────────┘      │
│  ┌───────────────────────────┐      │
│  │   Ta                      │      │  ← Option B
│  └───────────────────────────┘      │
│  ┌───────────────────────────┐      │
│  │   Tha                     │      │  ← Option C
│  └───────────────────────────┘      │
│                                     │
└─────────────────────────────────────┘
```

### Comportement :

1. Affiche le prompt (arabe en grand, via `ArabicText`)
2. Affiche l'instruction en français au-dessus
3. Affiche les options sous forme de cartes cliquables
4. Au tap sur une option :
   - Si correct : la carte passe en vert (`#2A9D8F`), feedback positif, attendre 800ms puis appeler `onComplete`
   - Si incorrect : la carte passe en rouge doux (`#E76F51`), légère vibration (si haptic activé), la bonne réponse est mise en surbrillance verte, attendre 1200ms puis appeler `onComplete`
5. Le résultat `ExerciseResult` inclut `correct`, `time_ms` (depuis l'affichage), `attempts` (1 si premier coup, 2+ si erreur)
6. Après feedback, l'utilisateur ne peut plus taper (les options sont disabled)

### Feedback visuel :

- Correct : fond vert clair, icône ✓, texte "Bravo !" en bas
- Incorrect : fond rouge clair sur l'option tapée, fond vert clair sur la bonne réponse, texte "La bonne réponse était [X]" en bas

### Variantes du prompt :

Le MCQ est flexible. Le prompt peut être :
- Une lettre arabe → "Quel est son nom ?" (options en français)
- Un nom français → "Quelle lettre ?" (options en arabe)
- Une forme positionnelle → "Quelle est la forme isolée de cette lettre ?" (options en arabe)

Le composant n'a pas besoin de savoir quelle variante c'est — il rend le `prompt` et les `options` tels quels.

**Checkpoint :**
- [ ] `src/components/exercises/MCQExercise.tsx` compile sans erreur
- [ ] Le prompt s'affiche correctement (arabe en grand OU français)
- [ ] Les options sont cliquables et le feedback visuel fonctionne (vert/rouge)
- [ ] Le composant appelle `onComplete` avec le bon `ExerciseResult`
- [ ] Après un tap, les options sont disabled (pas de double-tap)
- [ ] Le timer `time_ms` est correct

---

## MISSION 11 — Intégrer les exercices dans l'écran de leçon

**Action :**
Modifie `app/lesson/[id].tsx` pour ajouter la phase exercices après la présentation des lettres.

### Flux complet d'une leçon :

```
Phase 1 : Présentation (Mission 8)
  → Lettre 1 → Lettre 2 → ... → Dernière lettre
  → Bouton "Commencer les exercices"

Phase 2 : Exercices
  → Exercice 1 (MCQ) → Exercice 2 (MCQ) → ... → Exercice N
  → Écran de résultats
```

### Génération des exercices :

Au MVP, les exercices ne sont PAS stockés en base. Ils sont **générés dynamiquement** à partir des lettres de la leçon. Crée un générateur :

`src/engines/exercise-generator.ts` :

```typescript
// src/engines/exercise-generator.ts

import type { ExerciseConfig, ExerciseOption } from '../types/exercise';
import type { Letter } from '../hooks/useLetters';

/**
 * Génère un set d'exercices MCQ pour une leçon de lettres.
 * Chaque lettre de la leçon produit 2-3 exercices :
 * 1. Voir la lettre arabe → trouver le nom français
 * 2. Voir le nom français → trouver la lettre arabe
 * 3. (optionnel) Identifier la forme positionnelle
 */
export function generateLetterExercises(
  lessonLetters: Letter[],
  allLetters: Letter[],
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];

  for (const letter of lessonLetters) {
    // Exercice 1 : Lettre arabe → nom français
    exercises.push({
      id: `mcq-ar-to-fr-${letter.id}`,
      type: 'mcq',
      instruction_fr: 'Quelle est cette lettre ?',
      prompt: { ar: letter.form_isolated },
      options: generateOptions(letter, lessonLetters, allLetters, 'ar_to_fr'),
    });

    // Exercice 2 : Nom français → lettre arabe
    exercises.push({
      id: `mcq-fr-to-ar-${letter.id}`,
      type: 'mcq',
      instruction_fr: `Trouve la lettre "${letter.name_fr}"`,
      prompt: { fr: `${letter.name_fr} (${letter.transliteration})` },
      options: generateOptions(letter, lessonLetters, allLetters, 'fr_to_ar'),
    });
  }

  // Mélanger l'ordre des exercices
  return shuffleArray(exercises);
}

function generateOptions(
  correctLetter: Letter,
  lessonLetters: Letter[],
  allLetters: Letter[],
  direction: 'ar_to_fr' | 'fr_to_ar',
): ExerciseOption[] {
  // Prendre 2-3 distracteurs parmi les confusion_pairs si possible,
  // sinon parmi les lettres de la leçon, sinon parmi toutes les lettres
  const distractors = pickDistractors(correctLetter, lessonLetters, allLetters, 2);

  const options: ExerciseOption[] = [
    {
      id: correctLetter.id,
      text: direction === 'ar_to_fr'
        ? { fr: correctLetter.name_fr }
        : { ar: correctLetter.form_isolated },
      correct: true,
    },
    ...distractors.map(d => ({
      id: d.id,
      text: direction === 'ar_to_fr'
        ? { fr: d.name_fr }
        : { ar: d.form_isolated },
      correct: false,
    })),
  ];

  return shuffleArray(options);
}

function pickDistractors(
  correct: Letter,
  lessonLetters: Letter[],
  allLetters: Letter[],
  count: number,
): Letter[] {
  // Priorité aux lettres de la même leçon (hors la correcte)
  const candidates = lessonLetters.filter(l => l.id !== correct.id);

  // Si pas assez, compléter avec d'autres lettres
  if (candidates.length < count) {
    const others = allLetters.filter(
      l => l.id !== correct.id && !candidates.find(c => c.id === l.id)
    );
    candidates.push(...others);
  }

  return shuffleArray(candidates).slice(0, count);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

### Écran de résultats (fin de leçon) :

Après le dernier exercice, afficher un récapitulatif simple :
- Score : X/Y correct
- Temps total
- Bouton "Continuer" → retour à l'écran "Apprendre"
- Message d'encouragement adapté au score :
  - 100% : "Parfait ! 🎉"
  - ≥ 70% : "Bien joué ! Continue comme ça."
  - < 70% : "Pas mal ! Refais la leçon pour consolider."

**Checkpoint :**
- [ ] `src/engines/exercise-generator.ts` compile et génère des exercices corrects
- [ ] L'écran de leçon enchaîne présentation → exercices → résultats
- [ ] Les exercices MCQ utilisent `ExerciseRenderer` + `MCQExercise`
- [ ] Les distracteurs sont pertinents (lettres de la même leçon en priorité)
- [ ] L'écran de résultats affiche le score et un message adapté
- [ ] Le bouton "Continuer" ramène à l'onglet Apprendre

---

## MISSION 12 — Vérification end-to-end

**Action :**
Lance l'app et parcours le flux complet du Module 1 :

```bash
npx expo start
```

### Scénario de test :

1. **Compléter l'onboarding** (ou le skipper s'il est déjà fait)
2. **Onglet Apprendre** :
   - Les 4 modules s'affichent
   - Le Module 1 montre ses 7 leçons
   - Tap sur la Leçon 1
3. **Leçon 1 — Présentation** :
   - Alif s'affiche en `LetterCard` mode full avec les 4 formes
   - Les pedagogy_notes s'affichent en dessous
   - Swipe ou tap "Suivant" → Ba → Ta → Tha
   - Le HarakatToggle fonctionne
4. **Leçon 1 — Exercices** :
   - 6-8 exercices MCQ s'enchaînent
   - Le feedback vert/rouge fonctionne
   - Les distracteurs sont les lettres de la leçon (Ba, Ta, Tha, Alif)
5. **Écran de résultats** :
   - Le score est correct
   - Tap "Continuer" ramène à l'écran Apprendre
6. **Test avec une autre leçon** (Leçon 2 : Jim, Ha, Kha)

### Points de vigilance :

- Le texte arabe s'affiche correctement avec la police Amiri
- Les formes positionnelles avec kashida (ـ) rendent bien
- Les diacritiques ne sont pas coupés
- Les transitions entre lettres et exercices sont fluides
- Aucun crash quand Supabase ne retourne pas de données

**Checkpoint final de l'étape :**
- [ ] Le composant ArabicText rend le texte arabe en RTL avec police Amiri
- [ ] Le composant LetterCard affiche les 4 formes positionnelles
- [ ] L'écran Apprendre affiche 4 modules et 7 leçons pour le Module 1
- [ ] Une leçon complète fonctionne : présentation → exercices MCQ → résultats
- [ ] Le generateur d'exercices produit des MCQ pertinents avec bons distracteurs
- [ ] L'Exercise Registry est en place et extensible
- [ ] Aucun crash, aucun warning critique

---

## RÉSUMÉ DE L'ÉTAPE 2

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Composant `ArabicText` (RTL, harakats adaptatifs) | ✅ |
| 2 | Composant `LetterCard` (3 modes, 4 formes) | ✅ |
| 3 | Composant `HarakatToggle` (3 positions) | ✅ |
| 4 | Seed 7 leçons du Module 1 dans Supabase | ✅ |
| 5 | Hook `useLetters` (React Query + Supabase) | ✅ |
| 6 | Hook `useLessons` | ✅ |
| 7 | Écran Apprendre (modules + leçons + accordion) | ✅ |
| 8 | Écran de leçon — phase présentation | ✅ |
| 9 | Exercise Engine (types + registry + renderer) | ✅ |
| 10 | Composant MCQExercise | ✅ |
| 11 | Intégration exercices dans l'écran de leçon + résultats | ✅ |
| 12 | Vérification end-to-end | ✅ |

> **Prochaine étape après validation :** Étape 3 — Système SRS (répétition espacée) + onglet Réviser fonctionnel
