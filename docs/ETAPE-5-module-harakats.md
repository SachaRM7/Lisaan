# ÉTAPE 5 — Module 2 : Les harakats démystifiés

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> Étapes terminées : 0 (Supabase + polices), 1 (onboarding), 2 (composants arabes + leçons Module 1 + MCQ), 3 (SRS + onglet Réviser + progression), 4 (profil/réglages + streaks/XP + propagation settings), **4.5 (migration infrastructure : Supabase Cloud + offline-first SQLite)**.
> Cette étape construit le Module 2 complet : les 8 diacritiques arabes (harakats), 6 leçons progressives, un nouveau type d'exercice (Match/Association), un générateur d'exercices dédié, et le déverrouillage conditionnel du Module 2.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (post-É4.5 — CRITIQUE)** :
> - **Offline-first** : Tous les hooks lisent depuis **SQLite local** (`src/db/local-queries.ts`). JAMAIS d'import de `src/db/remote` dans les hooks ou stores.
> - **Seuls** `content-sync.ts` et `sync-manager.ts` parlent à Supabase Cloud.
> - Après chaque écriture locale (progression, SRS), appeler `runSync()` en fire-and-forget.
> - **Pas de CLI Supabase** : les migrations SQL s'exécutent dans le Dashboard Supabase Cloud (SQL Editor).
> - Les exercices sont générés dynamiquement côté client (pas stockés en base).
> - La table `diacritics` existe déjà avec 8 lignes (seedées en É0, sync dans SQLite par É4.5).
> - Le Module 2 existe dans la table `modules` mais est locked.
> - L'Exercise Engine (É2) utilise un registry plugin extensible. Le SRS supporte `item_type: 'diacritic'`.

---

## MISSION 1 — Enrichir les diacritiques + seeder les leçons du Module 2

**Contexte :**
La table `diacritics` existe déjà avec 8 lignes dans Supabase Cloud, mais elle manque de données pédagogiques (`pedagogy_notes`, `visual_description`, `example_letters`). On a aussi besoin des 6 leçons du Module 2.

**Action :**

### 1.1 — Exécuter le SQL dans Supabase Cloud

Ouvre le **Dashboard Supabase Cloud** → **SQL Editor** → Nouvelle requête.
Colle et exécute le SQL suivant :

```sql
-- ============================================================
-- MIGRATION : Module 2 — Les harakats démystifiés
-- ============================================================

-- 1. Enrichir la table diacritics avec les colonnes pédagogiques
ALTER TABLE diacritics
  ADD COLUMN IF NOT EXISTS pedagogy_notes TEXT,
  ADD COLUMN IF NOT EXISTS visual_description TEXT,
  ADD COLUMN IF NOT EXISTS example_letters TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS transliteration TEXT,
  ADD COLUMN IF NOT EXISTS ipa TEXT;

-- 2. Mettre à jour les diacritiques existants avec les données pédagogiques

-- Fatha (فَتْحَة) — sort_order 1
UPDATE diacritics SET
  pedagogy_notes = 'La fatha est la voyelle courte la plus fréquente en arabe. C''est un petit trait diagonal au-dessus de la lettre. Elle produit le son "a" bref, comme dans "papa". En français, ce son est naturel — c''est la voyelle la plus facile à reconnaître.',
  visual_description = 'Petit trait oblique (/) placé AU-DESSUS de la lettre',
  example_letters = ARRAY['بَ', 'تَ', 'سَ', 'نَ', 'كَ', 'مَ'],
  transliteration = 'a',
  ipa = '/a/'
WHERE name_fr = 'Fatha' OR name_fr = 'fatha';

-- Kasra (كَسْرَة) — sort_order 2
UPDATE diacritics SET
  pedagogy_notes = 'La kasra est un petit trait diagonal SOUS la lettre. Elle produit le son "i" bref, comme dans "lit". Astuce : la kasra est en bas → son "i" = bouche étirée (en bas du visage). C''est le miroir inversé de la fatha.',
  visual_description = 'Petit trait oblique (/) placé EN-DESSOUS de la lettre',
  example_letters = ARRAY['بِ', 'تِ', 'سِ', 'نِ', 'كِ', 'مِ'],
  transliteration = 'i',
  ipa = '/i/'
WHERE name_fr = 'Kasra' OR name_fr = 'kasra';

-- Damma (ضَمَّة) — sort_order 3
UPDATE diacritics SET
  pedagogy_notes = 'La damma ressemble à un petit "و" (waw) miniature au-dessus de la lettre. Elle produit le son "ou" bref, comme dans "loup". Moyen mnémotechnique : la damma a une forme arrondie → le son "ou" arrondit les lèvres.',
  visual_description = 'Petit و (waw miniature) placé AU-DESSUS de la lettre',
  example_letters = ARRAY['بُ', 'تُ', 'سُ', 'نُ', 'كُ', 'مُ'],
  transliteration = 'u',
  ipa = '/u/'
WHERE name_fr = 'Damma' OR name_fr = 'damma';

-- Fathatan (فَتْحَتَان) — sort_order 4
UPDATE diacritics SET
  pedagogy_notes = 'Le fathatan est un double fatha : deux petits traits au-dessus de la lettre. Il produit le son "-an". On le trouve souvent en fin de mot pour marquer un nom indéfini à l''accusatif. Exemple : كِتَابًا (kitāban = un livre, à l''accusatif).',
  visual_description = 'Deux petits traits obliques (//) placés AU-DESSUS de la lettre',
  example_letters = ARRAY['بًا', 'كِتَابًا', 'عِلْمًا'],
  transliteration = '-an',
  ipa = '/an/'
WHERE name_fr = 'Fathatan' OR name_fr = 'fathatan';

-- Kasratan (كَسْرَتَان) — sort_order 5
UPDATE diacritics SET
  pedagogy_notes = 'Le kasratan est un double kasra : deux traits sous la lettre. Il produit le son "-in". Il marque souvent un nom indéfini au génitif. Exemple : كِتَابٍ (kitābin = d''un livre).',
  visual_description = 'Deux petits traits obliques (//) placés EN-DESSOUS de la lettre',
  example_letters = ARRAY['بٍ', 'كِتَابٍ', 'عِلْمٍ'],
  transliteration = '-in',
  ipa = '/in/'
WHERE name_fr = 'Kasratan' OR name_fr = 'kasratan';

-- Dammatan (ضَمَّتَان) — sort_order 6
UPDATE diacritics SET
  pedagogy_notes = 'Le dammatan est un double damma au-dessus de la lettre. Il produit le son "-oun" (parfois noté "-un"). Il marque un nom indéfini au nominatif. Exemple : كِتَابٌ (kitābun = un livre).',
  visual_description = 'Deux petits و empilés AU-DESSUS de la lettre',
  example_letters = ARRAY['بٌ', 'كِتَابٌ', 'عِلْمٌ'],
  transliteration = '-un',
  ipa = '/un/'
WHERE name_fr = 'Dammatan' OR name_fr = 'dammatan';

-- Soukoun (سُكُون) — sort_order 7
UPDATE diacritics SET
  pedagogy_notes = 'Le soukoun est un petit cercle au-dessus de la lettre. Il signifie : PAS de voyelle après cette consonne. C''est le "silence" vocalique. Il crée des groupes de consonnes : مَكْتَب (mak-tab). Sans le soukoun, chaque consonne aurait une voyelle.',
  visual_description = 'Petit cercle (°) placé AU-DESSUS de la lettre',
  example_letters = ARRAY['بْ', 'تْ', 'مَكْتَب', 'بَابْ'],
  transliteration = '(aucun son)',
  ipa = '∅'
WHERE name_fr = 'Soukoun' OR name_fr = 'soukoun' OR name_fr = 'Sukun' OR name_fr = 'sukun';

-- Chadda (شَدَّة) — sort_order 8
UPDATE diacritics SET
  pedagogy_notes = 'La chadda (ou shadda) est un petit "w" au-dessus de la lettre. Elle signifie : cette consonne est DOUBLÉE (prononcée deux fois). Exemple : مُحَمَّد (Mu-ham-mad). La chadda se combine avec les autres harakats : بَّ (ba doublé avec fatha), بِّ (bi doublé avec kasra), بُّ (bu doublé avec damma).',
  visual_description = 'Petit w (شكل حرف w) placé AU-DESSUS de la lettre',
  example_letters = ARRAY['بّ', 'مُحَمَّد', 'شَدَّة', 'أُمَّة'],
  transliteration = '(double la consonne)',
  ipa = 'Cː (géminée)'
WHERE name_fr = 'Chadda' OR name_fr = 'chadda' OR name_fr = 'Shadda' OR name_fr = 'shadda';

-- 3. Créer la table confusion_pairs_diacritics
-- (Les paires de confusion des diacritiques — comme confusion_pairs pour les lettres)
CREATE TABLE IF NOT EXISTS diacritic_confusion_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diacritic_ids TEXT[] NOT NULL,
  description_fr TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO diacritic_confusion_pairs (diacritic_ids, description_fr) VALUES
  ((SELECT ARRAY_AGG(id::text) FROM diacritics WHERE name_fr IN ('Fatha', 'fatha', 'Kasra', 'kasra', 'Damma', 'damma')),
   'Les trois voyelles courtes — confusion fréquente chez les débutants'),
  ((SELECT ARRAY_AGG(id::text) FROM diacritics WHERE name_fr IN ('Fatha', 'fatha', 'Fathatan', 'fathatan')),
   'Fatha simple vs double (tanwin)'),
  ((SELECT ARRAY_AGG(id::text) FROM diacritics WHERE name_fr IN ('Kasra', 'kasra', 'Kasratan', 'kasratan')),
   'Kasra simple vs double (tanwin)'),
  ((SELECT ARRAY_AGG(id::text) FROM diacritics WHERE name_fr IN ('Damma', 'damma', 'Dammatan', 'dammatan')),
   'Damma simple vs double (tanwin)');

-- 4. Seeder les 6 leçons du Module 2
-- D'abord, récupérer l'ID du Module 2
-- (Le module_id doit correspondre au module "Les harakats démystifiés" seedé en É0)

INSERT INTO lessons (module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
SELECT
  m.id,
  v.title_fr,
  v.title_ar,
  v.description_fr,
  v.sort_order,
  v.xp_reward,
  v.estimated_minutes
FROM modules m,
(VALUES
  ('La Fatha — le son "a"', 'الفَتْحَة', 'Découvre la fatha : un petit trait qui transforme toute consonne en syllabe avec le son "a".', 1, 15, 5),
  ('La Kasra — le son "i"', 'الكَسْرَة', 'La kasra se glisse sous la lettre et produit le son "i". Compare-la avec la fatha.', 2, 15, 5),
  ('La Damma — le son "ou"', 'الضَّمَّة', 'La damma, petit waw miniature, donne le son "ou". Tu maîtrises maintenant les 3 voyelles courtes !', 3, 15, 5),
  ('Le Tanwin — les terminaisons nasales', 'التَّنْوِين', 'Quand les voyelles se dédoublent, elles ajoutent un "n" nasal. Fathatan, kasratan, dammatan.', 4, 20, 6),
  ('Le Soukoun — le silence', 'السُّكُون', 'Un petit cercle qui dit "stop" : pas de voyelle ici. Essentiel pour lire les vrais mots arabes.', 5, 20, 6),
  ('La Chadda — la consonne doublée', 'الشَّدَّة', 'La chadda double une consonne. Elle se combine avec les voyelles. Dernier diacritique, et non des moindres !', 6, 25, 7)
) AS v(title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
WHERE m.sort_order = 2;  -- Module 2

-- DONE
```

**Important — adaptation nécessaire :**
Les noms des diacritiques dans ta base (`name_fr`) peuvent varier en casse ou en orthographe (ex: "Fatha" vs "fatha", "Sukun" vs "Soukoun"). Avant d'exécuter le SQL :
1. Dans le SQL Editor, exécute d'abord : `SELECT id, name_fr, name_ar FROM diacritics ORDER BY sort_order;`
2. Ajuste les clauses `WHERE` si nécessaire
3. Exécute le SQL complet

### 1.2 — Re-synchroniser le contenu local

Après avoir exécuté le SQL dans le Dashboard Cloud, le contenu local (SQLite) est désormais obsolète. Il faut forcer un re-sync.

**Option A (rapide)** : Supprime l'app du simulateur/device et relance — le premier lancement re-téléchargera tout le contenu.

**Option B (propre)** : Ajoute une fonction temporaire ou un bouton dans l'écran Profil/Settings qui appelle `syncContentFromCloud()` depuis `src/engines/content-sync.ts`. Cela re-téléchargera les tables `diacritics` et `lessons` enrichies.

> **Note** : `content-sync.ts` (É4.5) fait déjà un SELECT * + upsert complet pour chaque table contenu. Les nouvelles colonnes (`pedagogy_notes`, `visual_description`, `example_letters`, `transliteration`, `ipa`) et les nouvelles leçons seront automatiquement sync si le schéma SQLite local les supporte. Vérifie que `schema-local.ts` contient bien ces colonnes dans la table `diacritics` (elles ont été ajoutées en É4.5).

**Checkpoint :**
- [ ] Le SQL s'exécute sans erreur dans le Dashboard Supabase Cloud
- [ ] Dans le SQL Editor : `SELECT pedagogy_notes, example_letters FROM diacritics WHERE sort_order = 1;` retourne les données de la fatha
- [ ] Les 8 diacritiques ont tous des `pedagogy_notes` non-null
- [ ] `SELECT COUNT(*) FROM lessons WHERE module_id = (SELECT id FROM modules WHERE sort_order = 2);` retourne 6
- [ ] Les 6 leçons ont les bons `sort_order` (1 à 6)
- [ ] La table `diacritic_confusion_pairs` contient 4 lignes
- [ ] Après re-sync (ou réinstall), `getAllDiacritics()` depuis SQLite local retourne les 8 diacritiques avec `pedagogy_notes` remplis

---

## MISSION 2 — Hook useDiacritics (lecture SQLite)

**Action :**
Crée `src/hooks/useDiacritics.ts` — même pattern que `useLetters.ts` post-É4.5 : **lecture depuis SQLite local**, jamais depuis Supabase.

### 2.1 — Ajouter les fonctions CRUD dans local-queries.ts

Si elles n'existent pas déjà (elles ont été créées en É4.5), vérifie que `src/db/local-queries.ts` contient `getAllDiacritics()` et `getDiacriticsBySortOrders()`. Si ce n'est pas le cas, ajoute-les :

```typescript
// Dans src/db/local-queries.ts — ajouter si absent :

export async function getAllDiacritics() {
  const db = getLocalDB();
  const rows = await db.getAllAsync<any>('SELECT * FROM diacritics ORDER BY sort_order ASC');
  return rows.map(d => ({
    ...d,
    example_letters: d.example_letters ? JSON.parse(d.example_letters) : [],
  }));
}

export async function getDiacriticsBySortOrders(sortOrders: number[]) {
  const db = getLocalDB();
  const placeholders = sortOrders.map(() => '?').join(',');
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM diacritics WHERE sort_order IN (${placeholders}) ORDER BY sort_order ASC`,
    sortOrders
  );
  return rows.map(d => ({
    ...d,
    example_letters: d.example_letters ? JSON.parse(d.example_letters) : [],
  }));
}
```

### 2.2 — Créer le hook

Crée `src/hooks/useDiacritics.ts` :

```typescript
// src/hooks/useDiacritics.ts

import { useQuery } from '@tanstack/react-query';
import { getAllDiacritics, getDiacriticsBySortOrders } from '../db/local-queries';

export interface Diacritic {
  id: string;
  name_ar: string;
  name_fr: string;
  symbol: string;
  sound_effect: string;
  audio_url: string | null;
  category: 'vowel_short' | 'vowel_long' | 'tanwin' | 'other';
  sort_order: number;
  pedagogy_notes: string | null;
  visual_description: string | null;
  example_letters: string[];
  transliteration: string | null;
  ipa: string | null;
}

/** Tous les diacritiques (depuis SQLite local) */
export function useDiacritics() {
  return useQuery({
    queryKey: ['diacritics'],
    queryFn: getAllDiacritics,
    staleTime: Infinity,
  });
}

/** Diacritiques pour une leçon spécifique du Module 2 (depuis SQLite local) */
export function useDiacriticsForLesson(sortOrders: number[]) {
  return useQuery({
    queryKey: ['diacritics', 'lesson', sortOrders],
    queryFn: () => getDiacriticsBySortOrders(sortOrders),
    enabled: sortOrders.length > 0,
    staleTime: Infinity,
  });
}
```

**Checkpoint :**
- [ ] `src/hooks/useDiacritics.ts` compile sans erreur
- [ ] **Aucun import de `src/db/remote` ou `supabase`** dans ce fichier
- [ ] `useDiacritics()` retourne 8 diacritiques avec les champs enrichis (pedagogy_notes, example_letters, etc.) depuis SQLite local
- [ ] `useDiacriticsForLesson([1])` retourne uniquement la fatha

---

## MISSION 3 — Composant DiacriticCard

**Action :**
Crée `src/components/arabic/DiacriticCard.tsx`.

C'est la carte de présentation d'un diacritique, équivalent de `LetterCard` pour le Module 2. Elle montre le diacritique sur une lettre exemple, son nom, son effet sonore, et les variantes sur plusieurs lettres.

### Props :

```typescript
interface DiacriticCardProps {
  /** Données du diacritique */
  diacritic: Diacritic;
  /** Mode d'affichage */
  mode: 'compact' | 'full';
  /** Lettre de base pour la démonstration (défaut: ب) */
  baseLetter?: string;
  /** Afficher les settings de l'utilisateur */
  showTransliteration?: boolean;
  /** Taille du texte arabe */
  fontSize?: 'medium' | 'large' | 'xlarge';
}
```

### Structure mode `full` :

```
┌─────────────────────────────────────┐
│                                     │
│           بَ                        │  ← Lettre de base + diacritique (ArabicText, xlarge)
│           ba                        │  ← Translittération (si activée)
│                                     │
│  ┌─────────────────────────────┐    │
│  │  فَتْحَة — Fatha             │    │  ← Nom ar + fr
│  │  Son : "a" bref              │    │  ← sound_effect
│  │  ╱ au-dessus de la lettre    │    │  ← visual_description
│  └─────────────────────────────┘    │
│                                     │
│  Sur d'autres lettres :             │  ← Titre section exemples
│                                     │
│   بَ    تَ    سَ    نَ    كَ    مَ   │  ← example_letters en ligne (scrollable)
│   ba    ta    sa    na    ka    ma  │  ← Translittérations
│                                     │
└─────────────────────────────────────┘
```

### Structure mode `compact` :

```
┌──────────────────┐
│    بَ             │  ← Lettre base + diacritique (large)
│    Fatha          │  ← Nom français
│    son "a"        │  ← sound_effect (une ligne)
└──────────────────┘
```

### Comportement :

1. **Lettre de base** : Par défaut `ب` (ba). Le diacritique est rendu combiné avec cette lettre pour montrer sa position visuelle (au-dessus ou en-dessous).
2. **Section exemples** : Affiche les `example_letters` du diacritique en ligne horizontale scrollable. Chaque exemple est un mini-`ArabicText` avec la translittération en dessous.
3. **Rendu RTL** : Le texte arabe utilise ArabicText avec les bons paramètres.
4. **Settings** : La translittération respecte `showTransliteration` (propagé depuis useSettingsStore, comme dans les composants existants).
5. **Style** : Fond blanc, border-radius 16, padding 24, ombre légère. La lettre avec diacritique est centrée et très grande (xlarge = 56pt). Les exemples sont en taille medium (28pt).

**Checkpoint :**
- [ ] `src/components/arabic/DiacriticCard.tsx` compile sans erreur
- [ ] Mode `full` affiche le diacritique sur la lettre base, le nom ar/fr, le son, la description visuelle, et les exemples
- [ ] Mode `compact` affiche une version condensée
- [ ] Les diacritiques au-dessus (fatha, damma, shadda, sukun) et en-dessous (kasra) s'affichent correctement
- [ ] Les `example_letters` s'affichent en ligne horizontale
- [ ] La translittération respecte le setting utilisateur

---

## MISSION 4 — Composant SyllableDisplay

**Action :**
Crée `src/components/arabic/SyllableDisplay.tsx`.

Ce composant affiche une grille de syllabes : toutes les combinaisons lettre + diacritique. C'est un outil pédagogique central pour le Module 2 — il montre comment un même diacritique transforme différentes lettres, ou comment une même lettre change avec différents diacritiques.

### Props :

```typescript
interface SyllableDisplayProps {
  /** Mode d'affichage */
  mode: 'single_diacritic' | 'compare_diacritics';
  /** Les diacritiques à afficher (1 pour single, 2-3 pour compare) */
  diacritics: Diacritic[];
  /** Les lettres à utiliser comme base (sort_orders des lettres) */
  letterForms: string[];  // ex: ['بَ', 'تَ', 'سَ'] pour single ou juste les lettres ['ب', 'ت', 'س']
  /** Translittérations correspondantes */
  transliterations?: string[];
  /** Afficher les translittérations */
  showTransliteration?: boolean;
  /** Callback quand une syllabe est tapée */
  onSyllableTap?: (syllable: string, diacriticId: string) => void;
}
```

### Structure mode `single_diacritic` :

```
┌─────────────────────────────────────┐
│  Fatha (son "a")                    │
│                                     │
│   بَ    تَ    سَ    نَ    كَ         │  ← Syllabes en grille
│   ba    ta    sa    na    ka        │  ← Translittérations
│                                     │
└─────────────────────────────────────┘
```

### Structure mode `compare_diacritics` :

```
┌─────────────────────────────────────┐
│         ب      ت      س      ن     │  ← Lettres de base (header)
│  ──────────────────────────────     │
│  Fatha  بَ     تَ     سَ     نَ     │  ← Ligne fatha
│  Kasra  بِ     تِ     سِ     نِ     │  ← Ligne kasra
│  Damma  بُ     تُ     سُ     نُ     │  ← Ligne damma
└─────────────────────────────────────┘
```

### Comportement :

1. **Mode `single_diacritic`** : Affiche une ligne de syllabes pour un seul diacritique appliqué à plusieurs lettres. Utile dans les leçons 1-3 (une voyelle à la fois).
2. **Mode `compare_diacritics`** : Affiche une grille de comparaison — lignes = diacritiques, colonnes = lettres. Utile dans les exercices de reconnaissance.
3. **Tap sur une syllabe** : Appelle `onSyllableTap` (utilisé par les exercices).
4. **Animations** : Les syllabes apparaissent avec un léger stagger (50ms entre chaque). L'animation utilise `Reanimated` si disponible, sinon un simple `Animated` natif.
5. **Style** : Chaque syllabe est dans un mini-cadre avec fond beige très léger (`#FFF8F0`), border-radius 8, padding 12. Le texte arabe est en taille `large` (40pt). Le nom du diacritique est en Inter, couleur `#2A9D8F`.

**Checkpoint :**
- [ ] `src/components/arabic/SyllableDisplay.tsx` compile sans erreur
- [ ] Mode `single_diacritic` affiche une ligne de syllabes correctement
- [ ] Mode `compare_diacritics` affiche une grille lettre × diacritique
- [ ] Le texte arabe avec diacritiques est bien rendu (pas de chevauchement)
- [ ] Les translittérations s'affichent en dessous de chaque syllabe quand activées
- [ ] Le callback `onSyllableTap` fonctionne

---

## MISSION 5 — Nouveau type d'exercice : MatchExercise (Association)

**Action :**

### 5.1 — Ajouter le type dans exercise.ts

Modifie `src/types/exercise.ts` pour ajouter le support du type `match` :

```typescript
// Ajoute à ExerciseConfig :
/** Paires pour l'exercice Match (association) */
matchPairs?: MatchPair[];

// Nouveau type :
export interface MatchPair {
  id: string;
  left: LocalizedText;      // Élément gauche (ex: syllabe arabe)
  right: LocalizedText;     // Élément droit (ex: nom du diacritique)
  left_vocalized?: string;  // Version vocalisée du texte gauche
}
```

### 5.2 — Créer le composant MatchExercise

Crée `src/components/exercises/MatchExercise.tsx`.

C'est un exercice d'association par tap : l'utilisateur voit deux colonnes et doit associer chaque élément de gauche avec le bon élément de droite.

#### Structure :

```
┌─────────────────────────────────────┐
│                                     │
│  Associe chaque syllabe             │  ← instruction_fr
│  à son diacritique                  │
│                                     │
│   ┌──────┐          ┌──────────┐    │
│   │  بَ  │ ───────→ │  Fatha   │    │  ← Paire correcte (connectée)
│   └──────┘          └──────────┘    │
│   ┌──────┐          ┌──────────┐    │
│   │  بِ  │          │  Damma   │    │  ← Non encore associé
│   └──────┘          └──────────┘    │
│   ┌──────┐          ┌──────────┐    │
│   │  بُ  │          │  Kasra   │    │  ← Non encore associé
│   └──────┘          └──────────┘    │
│                                     │
│  2/3                                │  ← Compteur de paires trouvées
│                                     │
└─────────────────────────────────────┘
```

#### Comportement :

1. **Deux colonnes** : gauche = éléments arabes (syllabes), droite = éléments français (noms de diacritiques). L'ordre de la colonne droite est mélangé.
2. **Mécanique de tap** :
   - L'utilisateur tape un élément gauche → il devient "sélectionné" (surbrillance bleue `#3B82F6`)
   - Puis tape un élément droit → test de la correspondance
   - Si correct : les deux éléments passent en vert (`#2A9D8F`), une ligne les connecte, ils deviennent disabled
   - Si incorrect : les deux passent brièvement en rouge (`#E76F51`, 600ms), shake animation, puis reviennent à l'état normal
   - L'utilisateur peut aussi taper d'abord à droite puis à gauche
3. **Complétion** : Quand toutes les paires sont trouvées, attendre 800ms puis appeler `onComplete` avec le résultat
4. **Résultat** : `ExerciseResult` avec `correct = true` si toutes les paires trouvées au premier essai pour chaque paire, `attempts` = nombre total de tentatives (incluant les erreurs), `time_ms` = temps total
5. **Animation** : Ligne de connexion animée entre les paires correctes (simple ligne ou trait courbe SVG, couleur `#2A9D8F`)

#### Style :

- Les éléments gauche ont un fond `#FFF8F0` avec texte arabe en police Amiri (taille large)
- Les éléments droite ont un fond `#F0F9FF` avec texte français en Inter
- Sélectionné : bordure bleue `#3B82F6`, fond légèrement bleuté
- Correct : bordure et fond vert doux `#D1FAE5`, texte `#065F46`
- Incorrect : shake animation + flash rouge, puis retour normal
- Les connexions correctes sont des lignes pointillées vertes entre les paires

### 5.3 — Enregistrer dans le registry

Modifie `src/components/exercises/index.ts` :

```typescript
import { MatchExercise } from './MatchExercise';

// Ajoute au registry :
exerciseRegistry.set('match', MatchExercise);
```

**Checkpoint :**
- [ ] `MatchExercise.tsx` compile sans erreur
- [ ] Le composant affiche deux colonnes avec les éléments à associer
- [ ] Le tap sélectionne un élément, le second tap teste la correspondance
- [ ] Feedback vert pour correct, rouge + shake pour incorrect
- [ ] Les paires correctes sont connectées visuellement
- [ ] `onComplete` est appelé avec le bon `ExerciseResult` quand tout est associé
- [ ] Le registry contient `mcq` ET `match`

---

## MISSION 6 — Générateur d'exercices harakats

**Action :**
Crée `src/engines/harakat-exercise-generator.ts`.

Ce générateur crée des exercices pour les leçons du Module 2, en utilisant les diacritiques et les lettres connues de l'utilisateur.

```typescript
// src/engines/harakat-exercise-generator.ts

import type { ExerciseConfig, ExerciseOption, MatchPair } from '../types/exercise';
import type { Diacritic } from '../hooks/useDiacritics';
import type { Letter } from '../hooks/useLetters';

/**
 * Mapping leçon (sort_order dans Module 2) → diacritiques (sort_order)
 *
 * Leçon 1 : Fatha (sort_order 1)
 * Leçon 2 : Kasra (sort_order 2)
 * Leçon 3 : Damma (sort_order 3)
 * Leçon 4 : Tanwin — Fathatan, Kasratan, Dammatan (sort_order 4, 5, 6)
 * Leçon 5 : Soukoun (sort_order 7)
 * Leçon 6 : Chadda (sort_order 8)
 */
export const LESSON_DIACRITIC_RANGES: Record<number, number[]> = {
  1: [1],           // Fatha
  2: [2],           // Kasra
  3: [3],           // Damma
  4: [4, 5, 6],     // Tanwin (les trois)
  5: [7],           // Soukoun
  6: [8],           // Chadda
};

/**
 * Lettres de base utilisées pour les exemples de syllabes.
 * On utilise les premières lettres enseignées dans le Module 1 (les plus familières).
 */
const BASE_LETTER_FORMS = ['ب', 'ت', 'س', 'ن', 'ك', 'م'];
const BASE_LETTER_NAMES = ['Ba', 'Ta', 'Sin', 'Nun', 'Kaf', 'Mim'];

/**
 * Génère un set d'exercices pour une leçon du Module 2.
 *
 * @param lessonSortOrder - Le sort_order de la leçon dans le Module 2 (1-6)
 * @param lessonDiacritics - Les diacritiques de la leçon courante
 * @param allDiacritics - Tous les diacritiques (pour les distracteurs)
 * @param knownLetters - Les lettres connues de l'utilisateur (du Module 1)
 */
export function generateHarakatExercises(
  lessonSortOrder: number,
  lessonDiacritics: Diacritic[],
  allDiacritics: Diacritic[],
  knownLetters: Letter[],
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];

  // Sélectionner 4-6 lettres de base (parmi les connues, sinon fallback)
  const baseLetters = knownLetters.length >= 4
    ? knownLetters.slice(0, 6)
    : knownLetters;

  for (const diacritic of lessonDiacritics) {
    // === EXERCICE 1 : MCQ — Identifier le diacritique ===
    // Prompt : syllabe arabe (بَ) → "Quel diacritique vois-tu ?"
    if (diacritic.example_letters.length > 0) {
      const exampleSyllable = diacritic.example_letters[0]; // ex: "بَ"
      exercises.push({
        id: `mcq-identify-diacritic-${diacritic.id}`,
        type: 'mcq',
        instruction_fr: 'Quel diacritique est sur cette lettre ?',
        prompt: { ar: exampleSyllable },
        options: generateDiacriticOptions(diacritic, allDiacritics, 'name'),
      });
    }

    // === EXERCICE 2 : MCQ — Quel son produit ce diacritique ? ===
    // Prompt : nom du diacritique → "Quel son produit la fatha ?"
    exercises.push({
      id: `mcq-sound-of-${diacritic.id}`,
      type: 'mcq',
      instruction_fr: `Quel son produit la ${diacritic.name_fr.toLowerCase()} ?`,
      prompt: { ar: diacritic.name_ar, fr: diacritic.name_fr },
      options: generateDiacriticOptions(diacritic, allDiacritics, 'sound'),
    });

    // === EXERCICE 3 : MCQ inversé — Trouver la syllabe ===
    // Prompt : "Trouve la syllabe avec fatha" → options en arabe
    if (diacritic.example_letters.length > 0) {
      exercises.push({
        id: `mcq-find-syllable-${diacritic.id}`,
        type: 'mcq',
        instruction_fr: `Trouve la syllabe avec ${diacritic.name_fr.toLowerCase()}`,
        prompt: { fr: `${diacritic.name_fr} — son "${diacritic.transliteration}"` },
        options: generateSyllableOptions(diacritic, allDiacritics),
      });
    }
  }

  // === EXERCICE 4 : Match (association) ===
  // Uniquement pour les leçons avec comparaison (leçons 2, 3, 4)
  if (lessonSortOrder >= 2 && lessonSortOrder <= 4) {
    const matchDiacritics = getMatchDiacritics(lessonSortOrder, allDiacritics);
    if (matchDiacritics.length >= 2) {
      exercises.push({
        id: `match-diacritics-lesson-${lessonSortOrder}`,
        type: 'match',
        instruction_fr: 'Associe chaque syllabe à son diacritique',
        prompt: {},
        matchPairs: generateMatchPairs(matchDiacritics),
      });
    }
  }

  // === EXERCICE 5 : MCQ de discrimination visuelle ===
  // "Laquelle de ces syllabes a une kasra ?" avec 3 options arabes
  if (lessonSortOrder >= 2) {
    const previousDiacritics = allDiacritics.filter(d =>
      d.sort_order <= Math.min(lessonSortOrder, 3) // fatha, kasra, damma max
    );
    if (previousDiacritics.length >= 2) {
      const targetDiac = lessonDiacritics[0];
      exercises.push({
        id: `mcq-visual-discrimination-${targetDiac.id}`,
        type: 'mcq',
        instruction_fr: `Laquelle de ces syllabes porte une ${targetDiac.name_fr.toLowerCase()} ?`,
        prompt: { fr: targetDiac.name_fr },
        options: generateVisualDiscriminationOptions(targetDiac, previousDiacritics),
      });
    }
  }

  return shuffleArray(exercises);
}

// ---- Fonctions helper ----

function generateDiacriticOptions(
  correct: Diacritic,
  allDiacritics: Diacritic[],
  mode: 'name' | 'sound',
): ExerciseOption[] {
  // Distracteurs : prendre les autres diacritiques de la même catégorie d'abord
  const sameCategory = allDiacritics.filter(
    d => d.id !== correct.id && d.category === correct.category
  );
  const others = allDiacritics.filter(
    d => d.id !== correct.id && d.category !== correct.category
  );
  const distractors = [...sameCategory, ...others].slice(0, 2);

  const options: ExerciseOption[] = [
    {
      id: correct.id,
      text: mode === 'name'
        ? { fr: correct.name_fr }
        : { fr: `"${correct.transliteration}" — ${correct.sound_effect}` },
      correct: true,
    },
    ...distractors.map(d => ({
      id: d.id,
      text: mode === 'name'
        ? { fr: d.name_fr }
        : { fr: `"${d.transliteration}" — ${d.sound_effect}` },
      correct: false,
    })),
  ];

  return shuffleArray(options);
}

function generateSyllableOptions(
  correct: Diacritic,
  allDiacritics: Diacritic[],
): ExerciseOption[] {
  // La bonne réponse : première syllabe exemple du diacritique correct
  const correctSyllable = correct.example_letters[0];

  // Distracteurs : mêmes lettres de base avec d'autres diacritiques
  const baseLetter = 'ب'; // On utilise ba comme base standard
  const distractors = allDiacritics
    .filter(d => d.id !== correct.id && d.example_letters.length > 0)
    .slice(0, 2)
    .map(d => d.example_letters[0]);

  const options: ExerciseOption[] = [
    { id: correct.id, text: { ar: correctSyllable }, correct: true },
    ...distractors.map((syllable, i) => ({
      id: `distractor-${i}`,
      text: { ar: syllable },
      correct: false,
    })),
  ];

  return shuffleArray(options);
}

function generateVisualDiscriminationOptions(
  target: Diacritic,
  candidates: Diacritic[],
): ExerciseOption[] {
  const correctExample = target.example_letters[0];
  const distractors = candidates
    .filter(d => d.id !== target.id)
    .slice(0, 2)
    .map(d => d.example_letters[0]);

  const options: ExerciseOption[] = [
    { id: target.id, text: { ar: correctExample }, correct: true },
    ...distractors.map((ex, i) => ({
      id: `visual-distractor-${i}`,
      text: { ar: ex },
      correct: false,
    })),
  ];

  return shuffleArray(options);
}

function getMatchDiacritics(lessonSortOrder: number, allDiacritics: Diacritic[]): Diacritic[] {
  // Pour la leçon 2 (kasra), comparer fatha vs kasra
  // Pour la leçon 3 (damma), comparer fatha vs kasra vs damma
  // Pour la leçon 4 (tanwin), comparer les 3 tanwins
  if (lessonSortOrder === 2) {
    return allDiacritics.filter(d => d.sort_order <= 2); // fatha + kasra
  }
  if (lessonSortOrder === 3) {
    return allDiacritics.filter(d => d.sort_order <= 3); // fatha + kasra + damma
  }
  if (lessonSortOrder === 4) {
    return allDiacritics.filter(d => d.sort_order >= 4 && d.sort_order <= 6); // les 3 tanwins
  }
  return [];
}

function generateMatchPairs(diacritics: Diacritic[]): MatchPair[] {
  return diacritics.map(d => ({
    id: d.id,
    left: { ar: d.example_letters[0] || d.symbol },  // Syllabe ou symbole
    right: { fr: d.name_fr },
    left_vocalized: d.example_letters[0],
  }));
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

**Checkpoint :**
- [ ] `src/engines/harakat-exercise-generator.ts` compile sans erreur
- [ ] `generateHarakatExercises(1, [fatha], allDiacritics, letters)` retourne 3+ exercices MCQ
- [ ] `generateHarakatExercises(3, [damma], allDiacritics, letters)` retourne des MCQ + 1 Match
- [ ] Les options des MCQ contiennent toujours 3 éléments (1 correct + 2 distracteurs)
- [ ] Les `matchPairs` contiennent le bon nombre de paires
- [ ] Les exercices sont mélangés (ordre aléatoire)

---

## MISSION 7 — Refactoring de l'écran de leçon pour supporter Module 2

**Action :**
Modifie `app/lesson/[id].tsx` pour détecter le type de contenu (lettres vs diacritiques) et rendre le bon flow de présentation.

### Détection du module

Quand l'écran de leçon se charge, il doit déterminer à quel module appartient la leçon :

```typescript
// Ajouter au hook ou au composant :
// 1. Charger la leçon pour obtenir module_id
// 2. Charger le module pour obtenir sort_order
// 3. Si module sort_order === 1 → flow lettres (existant)
//    Si module sort_order === 2 → flow diacritiques (nouveau)

type LessonContentType = 'letters' | 'diacritics';

function getLessonContentType(moduleSortOrder: number): LessonContentType {
  if (moduleSortOrder === 1) return 'letters';
  if (moduleSortOrder === 2) return 'diacritics';
  return 'letters'; // fallback
}
```

### Nouveau mapping leçon → diacritiques

Comme le mapping `LESSON_LETTER_RANGES` (É2), ajoute dans le même fichier ou dans un helper :

```typescript
// Déjà défini dans harakat-exercise-generator.ts, réexporter si besoin
import { LESSON_DIACRITIC_RANGES } from '../engines/harakat-exercise-generator';
```

### Phase présentation pour les diacritiques

Quand `contentType === 'diacritics'` :

1. Charger les diacritiques de la leçon via `useDiacriticsForLesson(sortOrders)`
2. Afficher chaque diacritique avec `DiacriticCard` mode `full`
3. Afficher `pedagogy_notes` en dessous
4. Afficher un `SyllableDisplay` mode `single_diacritic` pour montrer les exemples
5. Pour les leçons 2+ : ajouter un `SyllableDisplay` mode `compare_diacritics` en bonus (compare avec les diacritiques précédents)

### Structure de l'écran (mode diacritiques) :

```
┌─────────────────────────────────────┐
│  ← Retour     Leçon 1    1/1       │  ← Header (1 seul diacritique par leçon 1-3)
├─────────────────────────────────────┤
│  ● ○ ○                             │  ← Progression (si plusieurs diacritiques)
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      [DiacriticCard]        │    │  ← DiacriticCard mode full
│  │       mode="full"           │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  "La fatha est la voyelle courte    │  ← pedagogy_notes
│   la plus fréquente..."            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   [SyllableDisplay]          │    │  ← Exemples de syllabes
│  │   mode="single_diacritic"    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────┐    ┌──────────────┐    │
│  │ 🔊 Écouter │  │   Suivant →   │   │
│  └─────────┘    └──────────────┘    │
└─────────────────────────────────────┘
```

### Phase exercices pour les diacritiques

Après la présentation, le flow exercices utilise `generateHarakatExercises()` au lieu de `generateLetterExercises()` :

```typescript
if (contentType === 'diacritics') {
  const exercises = generateHarakatExercises(
    lessonSortOrder,  // sort_order de la leçon dans le Module 2
    lessonDiacritics,
    allDiacritics,
    knownLetters,     // lettres du Module 1 (toutes ou celles déjà apprises)
  );
  // Passer au ExerciseRenderer
}
```

### Hook pour obtenir le module d'une leçon

Le hook `useLesson(lessonId)` a été créé en É4.5 et lit depuis SQLite via `getLessonWithModule()`. Vérifie qu'il existe dans `src/hooks/useLessons.ts` :

```typescript
// Déjà dans useLessons.ts (post-É4.5) — vérifier sa présence :
import { getLessonWithModule } from '../db/local-queries';

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLessonWithModule(lessonId),
    enabled: !!lessonId,
    staleTime: Infinity,
  });
}
```

Si `getLessonWithModule` n'est pas dans `local-queries.ts`, ajoute-le :

```typescript
// Dans src/db/local-queries.ts — ajouter si absent :
export async function getLessonWithModule(lessonId: string) {
  const db = getLocalDB();
  return db.getFirstAsync<any>(
    `SELECT l.*, m.sort_order as module_sort_order
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE l.id = ?`,
    [lessonId]
  );
}
```

**Checkpoint :**
- [ ] L'écran de leçon détecte correctement si la leçon appartient au Module 1 (lettres) ou Module 2 (diacritiques)
- [ ] Les leçons du Module 1 fonctionnent toujours comme avant (aucune régression)
- [ ] Les leçons du Module 2 affichent `DiacriticCard` en mode full pendant la présentation
- [ ] Les `pedagogy_notes` des diacritiques s'affichent
- [ ] Le `SyllableDisplay` apparaît après la DiacriticCard
- [ ] La phase exercices utilise `generateHarakatExercises()` et produit des MCQ et des Match
- [ ] Le `MatchExercise` fonctionne dans le flow de la leçon
- [ ] L'écran de résultats affiche le score correctement

---

## MISSION 8 — Déverrouillage du Module 2

**Action :**
Le Module 2 doit se déverrouiller automatiquement quand l'utilisateur a terminé TOUTES les leçons du Module 1 (7 leçons avec status `completed`).

### Logique de déverrouillage

Modifie l'écran `app/(tabs)/learn.tsx` et/ou le hook de progression (É3) :

```typescript
/**
 * Vérifie si un module est déverrouillé.
 *
 * Règles :
 * - Module 1 (sort_order 1) : toujours déverrouillé
 * - Module 2 (sort_order 2) : déverrouillé quand TOUTES les leçons du Module 1 sont completed
 * - Module 3+ : locked au MVP
 */
function isModuleUnlocked(
  moduleSortOrder: number,
  progressByModule: Record<string, LessonProgress[]>,
  modules: Module[],
): boolean {
  if (moduleSortOrder === 1) return true;

  if (moduleSortOrder === 2) {
    const module1 = modules.find(m => m.sort_order === 1);
    if (!module1) return false;
    const module1Progress = progressByModule[module1.id] || [];
    const module1Lessons = module1Progress.length;
    const module1Completed = module1Progress.filter(p => p.status === 'completed').length;
    // Le Module 1 a 7 leçons — toutes doivent être completed
    return module1Lessons > 0 && module1Completed >= 7;
  }

  return false; // Modules 3+ locked au MVP
}
```

### Mise à jour de l'écran Apprendre

Dans `learn.tsx` :

1. Charger la progression de toutes les leçons du Module 1
2. Si toutes les 7 sont `completed` → Module 2 s'affiche comme déverrouillé (cliquable, accordion fonctionnel)
3. Sinon → Module 2 reste en opacité réduite avec un message "Termine le Module 1 pour débloquer"
4. Quand Module 2 est déverrouillé et qu'on l'expand, afficher les 6 leçons du Module 2
5. La première leçon du Module 2 est `available`, les suivantes se déverrouillent séquentiellement (même logique que Module 1 dans É3)

### Feedback de déverrouillage

Quand l'utilisateur termine la dernière leçon du Module 1 et revient à l'écran Apprendre :
- Le Module 2 passe de locked à unlocked avec une animation subtile (glow + scale)
- Un petit toast ou banner s'affiche : "🎉 Module 2 débloqué ! Découvre les harakats."
- Le texte du Module 2 passe de grisé/opaque à normal

**Checkpoint :**
- [ ] Le Module 2 est locked tant que le Module 1 n'est pas 100% terminé
- [ ] Quand les 7 leçons du Module 1 sont `completed`, le Module 2 se déverrouille
- [ ] Le Module 2 déverrouillé est expandable et affiche ses 6 leçons
- [ ] La première leçon du Module 2 est `available`, les autres sont `locked`
- [ ] Les leçons du Module 2 se déverrouillent séquentiellement (comme Module 1)
- [ ] Le feedback de déverrouillage (toast/banner) s'affiche
- [ ] Les Modules 3-4 restent locked

---

## MISSION 9 — SRS : créer les cartes diacritiques après chaque leçon

**Action :**
Le système SRS (É3, refactoré en É4.5) supporte déjà `item_type: 'diacritic'`. Les hooks SRS écrivent dans SQLite local et sync en fire-and-forget. Il faut maintenant créer les cartes SRS pour les diacritiques quand l'utilisateur termine une leçon du Module 2.

### Modification de la logique post-leçon

Dans l'écran de leçon (`app/lesson/[id].tsx`), après la complétion d'une leçon du Module 2, utilise le hook `useCreateSRSCardsForLesson` (refactoré en É4.5 pour écrire en SQLite) :

```typescript
// Après la phase exercices, quand la leçon du Module 2 est terminée :
const createSRSCards = useCreateSRSCardsForLesson();

if (contentType === 'diacritics') {
  // Créer une carte SRS pour chaque diacritique de la leçon
  createSRSCards.mutate({
    itemIds: lessonDiacritics.map(d => d.id),
    itemType: 'diacritic',
  });
}
```

> **Rappel É4.5** : `useCreateSRSCardsForLesson` écrit dans SQLite local (`upsertSRSCard` de `local-queries.ts`) avec `synced_at = NULL`, puis appelle `runSync()` en fire-and-forget. Pas besoin d'importer Supabase ici.

### Révision des diacritiques dans l'onglet Réviser

L'onglet Réviser (É3) charge les cartes SRS depuis SQLite local (refactoré en É4.5). Vérifie que :

1. Les cartes `diacritic` apparaissent dans la liste de révision quand elles sont dues
2. Le composant de révision sait afficher un diacritique (pas seulement une lettre)

Modifie le composant de révision pour gérer le type `diacritic` :

```typescript
// Dans l'écran de révision, quand on affiche une carte :
if (card.item_type === 'letter') {
  // Existant : afficher LetterCard
}
if (card.item_type === 'diacritic') {
  // Nouveau : afficher DiacriticCard mode compact
  // Charger le diacritique via son item_id depuis SQLite (useDiacritics ou query directe)
  // Afficher un MCQ "Quel est ce diacritique ?" avec le même pattern
}
```

**Checkpoint :**
- [ ] Compléter une leçon du Module 2 crée des cartes SRS de type `diacritic` **dans SQLite local**
- [ ] Après sync (automatique ou au retour de connexion), les cartes apparaissent dans Supabase Cloud
- [ ] Les cartes diacritiques apparaissent dans l'onglet Réviser quand elles sont dues
- [ ] La révision d'un diacritique affiche `DiacriticCard` en mode compact
- [ ] Le système SRS met à jour correctement les intervalles pour les diacritiques
- [ ] Pas de régression : les cartes `letter` fonctionnent toujours
- [ ] **Aucun import de `src/db/remote` dans l'écran de leçon ni dans l'écran de révision**

---

## MISSION 10 — Vérification end-to-end

**Action :**
Lance l'app et parcours le flux complet du Module 2 :

```bash
npx expo start
```

### Scénario de test :

1. **Prérequis** : Compléter toutes les leçons du Module 1 (ou simuler en mettant toutes les progressions à `completed` en base)

2. **Déverrouillage** :
   - Aller sur l'onglet Apprendre
   - Vérifier que le Module 2 est déverrouillé
   - L'expand affiche les 6 leçons
   - Seule la leçon 1 est `available`

3. **Leçon 1 — La Fatha** :
   - Phase présentation : `DiacriticCard` affiche la fatha sur ب
   - Les `pedagogy_notes` s'affichent
   - Le `SyllableDisplay` montre بَ تَ سَ نَ كَ مَ
   - Bouton "Suivant" → Phase exercices
   - 3-4 exercices MCQ (identifier la fatha, son de la fatha, trouver la syllabe)
   - Écran de résultats → Score correct
   - Retour à l'onglet Apprendre → Leçon 2 déverrouillée

4. **Leçon 2 — La Kasra** :
   - Même flow, mais avec la kasra
   - Les exercices incluent la comparaison fatha vs kasra
   - L'exercice Match apparaît (associer بَ→Fatha, بِ→Kasra)

5. **Leçon 3 — La Damma** :
   - Idem avec damma
   - Le Match compare les 3 voyelles (fatha, kasra, damma)
   - Le `SyllableDisplay` mode `compare_diacritics` montre la grille 3×6

6. **Onglet Réviser** :
   - Après avoir complété quelques leçons, vérifier que des cartes SRS `diacritic` apparaissent
   - Réviser un diacritique → DiacriticCard en mode compact

7. **Module 1 — Régression** :
   - Revenir au Module 1, ouvrir une leçon → le flow lettres fonctionne toujours
   - Les exercices MCQ du Module 1 ne sont pas affectés

8. **Offline-first — vérification critique** :
   - Passer en mode avion APRÈS avoir fait le content sync
   - Ouvrir une leçon du Module 2 → le contenu s'affiche (depuis SQLite)
   - Compléter la leçon → la progression est enregistrée localement
   - Repasser en ligne → vérifier dans le Dashboard Supabase Cloud que la progression et les cartes SRS ont été sync

### Points de vigilance :

- Les diacritiques arabes s'affichent correctement (pas de chevauchement, bon positionnement au-dessus/en-dessous)
- Le `MatchExercise` fonctionne bien visuellement (colonnes alignées, feedback correct)
- Les `SyllableDisplay` sont lisibles (taille suffisante, espacement correct)
- La navigation entre modules est fluide
- Le déverrouillage séquentiel des leçons du Module 2 fonctionne
- Les settings (harakats mode, transliteration, font size) sont propagés dans les nouveaux composants
- Aucun crash quand les données SQLite ne sont pas encore chargées
- **CRITIQUE : `grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/` ne retourne AUCUN résultat** (seuls `content-sync.ts` et `sync-manager.ts` importent Supabase)

**Checkpoint final de l'étape :**
- [ ] Le SQL Cloud s'exécute sans erreur (8 diacritiques enrichis + 6 leçons)
- [ ] Le contenu est sync dans SQLite local (diacritiques + leçons Module 2)
- [ ] Le Module 2 se déverrouille correctement quand le Module 1 est terminé
- [ ] Les 6 leçons du Module 2 sont jouables de bout en bout (présentation + exercices + résultats)
- [ ] Le composant `DiacriticCard` affiche les diacritiques correctement en mode full et compact
- [ ] Le composant `SyllableDisplay` affiche les grilles de syllabes
- [ ] Le `MatchExercise` fonctionne (association par tap, feedback visuel)
- [ ] Le générateur d'exercices produit des MCQ et des Match pertinents
- [ ] Les cartes SRS `diacritic` sont créées dans SQLite et synchronisées vers Cloud
- [ ] Aucune régression sur le Module 1 (lettres, MCQ, progression)
- [ ] Les settings utilisateur sont propagés dans tous les nouveaux composants
- [ ] **Aucun hook ni store n'importe `src/db/remote`**
- [ ] L'app fonctionne en mode avion (contenu déjà sync)
- [ ] Aucun crash, aucun warning critique

---

## RÉSUMÉ DE L'ÉTAPE 5

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | SQL Cloud : enrichissement diacritiques + 6 leçons Module 2 + re-sync SQLite | ⬜ |
| 2 | Hook `useDiacritics` (React Query + **SQLite local**) | ⬜ |
| 3 | Composant `DiacriticCard` (full + compact) | ⬜ |
| 4 | Composant `SyllableDisplay` (single + compare) | ⬜ |
| 5 | Composant `MatchExercise` + enregistrement registry | ⬜ |
| 6 | Générateur d'exercices harakats (`harakat-exercise-generator.ts`) | ⬜ |
| 7 | Refactoring écran de leçon (support Module 2 : détection content type + flow diacritiques) | ⬜ |
| 8 | Déverrouillage conditionnel du Module 2 + feedback | ⬜ |
| 9 | SRS : cartes diacritiques **SQLite** + sync Cloud + révision dans l'onglet Réviser | ⬜ |
| 10 | Vérification end-to-end (online + **offline**) | ⬜ |

> **Prochaine étape après validation :** Étape 6 — Module 3 : Lire ses premiers mots (mots simples, racines, lecture progressive)

---

## GESTION /docs

**Fichiers à conserver dans /docs :**
- `ETAPE-5-module-harakats.md` (ce fichier — remplace les précédents)
- `lisaan-seed-letters.json` (toujours utile comme référence)

**Fichiers à supprimer de /docs :**
- `ETAPE-4-profil-reglages.md` (si encore présent)
- `ETAPE-4.5-migration-offline-first.md` (si encore présent — terminée)

**Fichiers qui restent dans le projet Opus (PAS dans /docs) :**
- `lisaan-brief-projet-mvp.docx`
- `lisaan-architecture-data-model.docx` (V2 — mis à jour post-É4.5)
