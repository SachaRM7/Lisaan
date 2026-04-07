# ÉTAPE 10.7 — Sections, persistance de session & modes relecture/exercice

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe pour francophones.
> Étapes terminées : 0 → 10.5. É10.5 = Pivot vocabulaire (fréquence d'abord, racines en lumière).
> Cette étape refond le flow de leçon pour résoudre trois problèmes critiques de rétention :
> 1. Leçons monolithiques indigestes (jusqu'à 56 points + 86 exercices d'affilée)
> 2. Perte de progression mid-session (quitter = tout recommencer)
> 3. Flux lecture→exercices couplé et non-rejouable (impossible de relire ou re-pratiquer séparément)

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (offline-first — CRITIQUE)** :
> - Tous les hooks lisent depuis **SQLite local**. JAMAIS d'import `src/db/remote` dans hooks/stores/components/engines.
> - `content-sync.ts` et `sync-manager.ts` sont les seuls à parler à Supabase.
> - Après chaque écriture locale, appeler `runSync()` en fire-and-forget.
> - **Pas de CLI Supabase** : migrations SQL dans le Dashboard Cloud (SQL Editor).
> - Les exercices sont générés dynamiquement côté client (pas stockés en base).

> **Philosophie de cette étape** :
> - **Micro-learning** : chaque section = 4-6 items de présentation + 8-12 exercices = ~3-5 minutes.
> - **Zéro perte** : chaque réponse est sauvegardée immédiatement en SQLite local.
> - **Rejouabilité** : une leçon complétée offre "Relire" et "S'exercer" par section.
> - **Impact DB minimal** : PAS de nouvelle table Supabase Cloud. Une seule table SQLite locale (`lesson_session`), non synchronisée (état transitoire).
> - **Les generators changent leur signature de retour** (sections au lieu d'un tableau plat) mais le contenu des exercices ne change pas.
> - **Aucune régression** sur XP, badges, SRS, streaks, module completion — ces mécaniques se déclenchent toujours en fin de leçon complète.

> **Impact sur É11+** : Positif. Les generators de grammaire et conjugaison (É11) pourront directement adopter le pattern `LessonSection[]`. Le flow section est transparent pour eux.

---

## Périmètre de É10.7

| Action | Détail |
|--------|--------|
| Types | `LessonSection`, `SectionProgress`, `LessonSessionState` |
| Table SQLite | `lesson_session` (locale uniquement, PAS sync vers Cloud) |
| Generators refacto | Les 4 generators retournent `LessonSection[]` au lieu de `ExerciseConfig[]` |
| Écran leçon refacto | `lesson/[id].tsx` → 3 modes : first-time, resume, replay |
| Nouveau composant | `SectionPlayer` — orchestre la présentation + exercices d'UNE section |
| Nouveau composant | `LessonHub` — écran d'accueil d'une leçon déjà commencée/complétée |
| Sauvegarde | Chaque réponse persiste immédiatement dans `lesson_session` |

**Ce qui est OUT de É10.7 :**
- Modification des tables Supabase Cloud (aucune migration Cloud)
- Modification du content-sync (aucune nouvelle table de contenu)
- Modification du SRS, badges, streaks, XP (ils se déclenchent toujours pareil, en fin de leçon)
- Modification du contenu des exercices (les generators produisent les mêmes exercices, juste regroupés en sections)

---

## MISSION 1 — Types TypeScript : sections et session

**Contexte :** Définir les types centraux qui seront utilisés par les generators, l'écran de leçon, et la persistance de session.

**Action — créer `src/types/section.ts` :**

```typescript
// src/types/section.ts

import type { ExerciseConfig, ExerciseResult } from './exercise';

/**
 * Une section est l'unité atomique de consommation dans une leçon.
 * Elle contient :
 * - Des items de présentation (teaching) : LetterCards, WordCards, SentenceCards...
 * - Des exercices générés pour ces items
 * 
 * Taille cible : 4-6 items de teaching + 8-12 exercices = ~3-5 minutes.
 */
export interface LessonSection {
  /** Identifiant unique de la section dans la leçon (ex: "section-1", "section-2") */
  id: string;
  /** Titre court affiché dans la mini-roadmap (ex: "Mots de la famille") */
  title_fr: string;
  /** Index dans la leçon (0-based) */
  index: number;
  /** IDs des items de présentation (letter IDs, word IDs, sentence IDs...) */
  teachingItemIds: string[];
  /** Exercices générés pour cette section */
  exercises: ExerciseConfig[];
}

/**
 * Résultat complet d'une leçon découpée en sections.
 * Retourné par tous les generators.
 */
export interface LessonSections {
  /** Le type de contenu de la leçon (pour savoir quel composant de teaching utiliser) */
  contentType: 'letters' | 'diacritics' | 'words' | 'sentences' | 'grammar' | 'conjugation';
  /** Les sections ordonnées */
  sections: LessonSection[];
}

/**
 * Progression d'une section dans une session en cours.
 */
export interface SectionProgress {
  sectionId: string;
  /** true = les items de teaching ont tous été lus */
  teachingCompleted: boolean;
  /** Index du prochain exercice à jouer (0 = pas encore commencé) */
  nextExerciseIndex: number;
  /** Résultats des exercices déjà complétés */
  exerciseResults: ExerciseResult[];
  /** Statut global de la section */
  status: 'not_started' | 'teaching' | 'exercises' | 'completed';
}

/**
 * État complet d'une session de leçon en cours.
 * Persisté dans SQLite local (table lesson_session).
 */
export interface LessonSessionState {
  lessonId: string;
  userId: string;
  /** Index de la section active (0-based) */
  currentSectionIndex: number;
  /** Progression par section */
  sectionProgress: SectionProgress[];
  /** Timestamp de dernière mise à jour */
  updatedAt: string;
}
```

**Checkpoint M1 :**
- [ ] `src/types/section.ts` compile sans erreur
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] Les types sont exportés et importables depuis d'autres fichiers

---

## MISSION 2 — Table SQLite locale `lesson_session`

**Contexte :** Table transitoire, locale uniquement. Elle stocke l'état d'une session de leçon en cours (quelle section, quels exercices déjà faits). Elle est supprimée quand la leçon est complétée. Elle n'est PAS synchronisée vers Supabase Cloud — c'est de l'état éphémère de navigation, pas de la donnée de progression.

**Action — modifier `src/db/schema-local.ts` :**

Ajouter dans `initLocalSchema()`, **après** toutes les tables existantes :

```sql
-- ============================================================
-- TABLE SESSION — État transitoire des leçons en cours (É10.7)
-- PAS synchronisée vers Cloud. Supprimée à la complétion.
-- ============================================================

CREATE TABLE IF NOT EXISTS lesson_session (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  current_section_index INTEGER NOT NULL DEFAULT 0,
  section_progress TEXT NOT NULL DEFAULT '[]',  -- JSON : SectionProgress[]
  updated_at TEXT NOT NULL,
  UNIQUE(lesson_id, user_id)
);
```

**Action — ajouter les fonctions CRUD dans `src/db/local-queries.ts` :**

```typescript
// ============================================================
// Lesson Session (É10.7) — État transitoire des leçons en cours
// ============================================================

import type { LessonSessionState, SectionProgress } from '../types/section';

/**
 * Récupère la session en cours pour une leçon donnée.
 * Retourne null si aucune session n'existe (leçon pas commencée ou déjà complétée).
 */
export async function getLessonSession(
  lessonId: string,
  userId: string
): Promise<LessonSessionState | null> {
  const db = getLocalDB();
  const row = await db.getFirstAsync<{
    lesson_id: string;
    user_id: string;
    current_section_index: number;
    section_progress: string;
    updated_at: string;
  }>(
    'SELECT * FROM lesson_session WHERE lesson_id = ? AND user_id = ?',
    [lessonId, userId]
  );
  if (!row) return null;
  return {
    lessonId: row.lesson_id,
    userId: row.user_id,
    currentSectionIndex: row.current_section_index,
    sectionProgress: JSON.parse(row.section_progress),
    updatedAt: row.updated_at,
  };
}

/**
 * Crée ou met à jour la session d'une leçon.
 * Appelé à chaque changement d'état (avancer dans les teachings, répondre à un exercice, changer de section).
 */
export async function upsertLessonSession(state: LessonSessionState): Promise<void> {
  const db = getLocalDB();
  const id = `session-${state.lessonId}-${state.userId}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO lesson_session
     (id, lesson_id, user_id, current_section_index, section_progress, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      state.lessonId,
      state.userId,
      state.currentSectionIndex,
      JSON.stringify(state.sectionProgress),
      now,
    ]
  );
}

/**
 * Supprime la session d'une leçon.
 * Appelé quand la leçon est complétée (toutes les sections terminées).
 */
export async function deleteLessonSession(lessonId: string, userId: string): Promise<void> {
  const db = getLocalDB();
  await db.runAsync(
    'DELETE FROM lesson_session WHERE lesson_id = ? AND user_id = ?',
    [lessonId, userId]
  );
}
```

**Checkpoint M2 :**
- [ ] `schema-local.ts` compile. `npx expo start` → SQLite s'initialise sans erreur
- [ ] La table `lesson_session` est créée (vérifier dans les logs de démarrage)
- [ ] `getLessonSession` retourne null quand aucune session n'existe
- [ ] `upsertLessonSession` crée/met à jour une session
- [ ] `deleteLessonSession` supprime proprement la session
- [ ] **Aucun import `src/db/remote` dans `local-queries.ts`** pour ces nouvelles fonctions
- [ ] Les tables existantes ne sont pas affectées
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 3 — Helper de découpage en sections : `createSections`

**Contexte :** Fonction utilitaire qui prend un tableau d'items et un nombre max par section, et retourne des groupes. Utilisée par tous les generators.

**Action — créer `src/engines/section-utils.ts` :**

```typescript
// src/engines/section-utils.ts

import type { ExerciseConfig } from '../types/exercise';
import type { LessonSection, LessonSections } from '../types/section';

/** Taille cible d'une section : 4-6 items de teaching */
export const DEFAULT_SECTION_SIZE = 5;

/** Nombre min d'items pour justifier un split (en dessous, une seule section suffit) */
export const MIN_ITEMS_TO_SPLIT = 7;

/**
 * Découpe un tableau d'items en groupes de taille `sectionSize`.
 * Si le total est inférieur à MIN_ITEMS_TO_SPLIT, retourne un seul groupe.
 */
export function chunkItems<T>(items: T[], sectionSize: number = DEFAULT_SECTION_SIZE): T[][] {
  if (items.length < MIN_ITEMS_TO_SPLIT) {
    return [items];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += sectionSize) {
    chunks.push(items.slice(i, i + sectionSize));
  }
  // Si la dernière section est trop petite (< 3 items), fusionner avec la précédente
  if (chunks.length > 1 && chunks[chunks.length - 1].length < 3) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1].push(...last);
  }
  return chunks;
}

/**
 * Construit un LessonSection à partir d'un chunk d'items et de ses exercices.
 */
export function buildSection(
  index: number,
  titleFr: string,
  itemIds: string[],
  exercises: ExerciseConfig[],
): LessonSection {
  return {
    id: `section-${index}`,
    title_fr: titleFr,
    index,
    teachingItemIds: itemIds,
    exercises,
  };
}

/**
 * Assemble les sections en un LessonSections complet.
 */
export function buildLessonSections(
  contentType: LessonSections['contentType'],
  sections: LessonSection[],
): LessonSections {
  return { contentType, sections };
}
```

**Checkpoint M3 :**
- [ ] `section-utils.ts` compile sans erreur
- [ ] `chunkItems([1,2,3,4,5,6,7,8,9,10], 5)` → `[[1,2,3,4,5], [6,7,8,9,10]]`
- [ ] `chunkItems([1,2,3,4,5], 5)` → `[[1,2,3,4,5]]` (pas de split, < MIN_ITEMS_TO_SPLIT)
- [ ] `chunkItems([1,2,3,4,5,6,7,8,9,10,11], 5)` → `[[1,2,3,4,5], [6,7,8,9,10,11]]` (fusion dernière section trop petite)
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 4 — Refactoring `word-exercise-generator.ts` : retour en sections

**Contexte :** C'est le generator du Module 3 — le plus impacté par le problème de volume. Actuellement il retourne `ExerciseConfig[]`. Il doit retourner `LessonSections`.

**Principe du découpage :**
- Type `simple` ou `solar_lunar` (leçons 3.1, 3.2) : 8 mots → probablement 1-2 sections
- Type `theme` (leçons 3.3-3.6) : 8-11 mots → 2-3 sections de 4-5 mots
- La logique de génération d'exercices par mot **ne change pas** — on la factorise juste par section

**Action — modifier `src/engines/word-exercise-generator.ts` :**

### 4a — Ajouter les imports

```typescript
import type { LessonSection, LessonSections } from '../types/section';
import { chunkItems, buildSection, buildLessonSections, DEFAULT_SECTION_SIZE } from './section-utils';
```

### 4b — Renommer l'ancienne fonction et créer la nouvelle signature

L'ancienne fonction `generateWordExercises` qui retourne `ExerciseConfig[]` est renommée en `_generateWordExercisesFlat` (usage interne).

Créer une nouvelle fonction publique :

```typescript
/**
 * Génère les sections d'une leçon du Module 3.
 * Chaque section contient les IDs des mots à présenter + les exercices associés.
 *
 * @returns LessonSections avec contentType 'words'
 */
export function generateWordLessonSections(
  lessonSortOrder: number,
  lessonWords: Word[],
  allWords: Word[],
  roots: Root[],
): LessonSections {
  const config = LESSON_WORD_CONFIG[lessonSortOrder];
  if (!config) {
    return buildLessonSections('words', []);
  }

  // Découper les mots en chunks
  const wordChunks = chunkItems(lessonWords, DEFAULT_SECTION_SIZE);

  const sections: LessonSection[] = wordChunks.map((chunkWords, index) => {
    // Générer les exercices pour CE chunk de mots uniquement
    const exercises = _generateExercisesForWords(config, chunkWords, allWords, roots);

    // Titre de la section
    const title = wordChunks.length === 1
      ? config.theme ?? 'Vocabulaire'
      : `Partie ${index + 1}`;

    return buildSection(
      index,
      title,
      chunkWords.map(w => w.id),
      exercises,
    );
  });

  return buildLessonSections('words', sections);
}
```

### 4c — Extraire `_generateExercisesForWords`

Factoriser la logique actuelle de `generateWordExercises` dans une fonction interne qui prend un sous-ensemble de mots :

```typescript
/**
 * Génère les exercices pour un sous-ensemble de mots (une section).
 * Logique identique à l'ancien generateWordExercises, mais sur un subset.
 */
function _generateExercisesForWords(
  config: { type: string; theme?: string },
  sectionWords: Word[],
  allWords: Word[],
  roots: Root[],
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];

  if (config.type === 'simple' || config.type === 'revision') {
    // MCQ AR→FR pour chaque mot
    for (const word of sectionWords) {
      exercises.push({
        id: `mcq-ar-to-fr-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        options: generateTranslationOptions(word, allWords, 'ar_to_fr'),
        metadata: { word_id: word.id },
      });
    }

    // MCQ FR→AR pour la moitié des mots
    for (const word of sectionWords.slice(0, Math.ceil(sectionWords.length / 2))) {
      exercises.push({
        id: `mcq-fr-to-ar-${word.id}`,
        type: 'mcq',
        instruction_fr: `Trouve le mot "${word.translation_fr}"`,
        prompt: { fr: word.translation_fr },
        options: generateTranslationOptions(word, allWords, 'fr_to_ar'),
        metadata: { word_id: word.id },
      });
    }

    // MCQ décodage pour max 4 mots
    for (const word of sectionWords.slice(0, Math.min(4, sectionWords.length))) {
      exercises.push({
        id: `mcq-decode-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Comment se prononce ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        options: generateDecodingOptions(word, allWords),
        metadata: { word_id: word.id },
      });
    }
  }

  if (config.type === 'solar_lunar') {
    // Exercices article solaires/lunaires pour chaque mot
    for (const word of sectionWords) {
      exercises.push({
        id: `mcq-article-${word.id}`,
        type: 'mcq',
        instruction_fr: `Comment se prononce "le/la" + "${word.transliteration}" ?`,
        prompt: { ar: word.arabic_vocalized, fr: word.translation_fr },
        options: generateArticleOptions(word),
        metadata: { word_id: word.id },
      });
    }
    // + MCQ traduction classiques
    for (const word of sectionWords) {
      exercises.push({
        id: `mcq-ar-to-fr-solar-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        options: generateTranslationOptions(word, allWords, 'ar_to_fr'),
        metadata: { word_id: word.id },
      });
    }
  }

  if (config.type === 'theme') {
    // MCQ AR→FR
    for (const word of sectionWords) {
      exercises.push({
        id: `mcq-ar-to-fr-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        options: generateTranslationOptions(word, allWords, 'ar_to_fr'),
        metadata: { word_id: word.id },
      });
    }

    // MCQ FR→AR (moitié)
    for (const word of sectionWords.slice(0, Math.ceil(sectionWords.length / 2))) {
      exercises.push({
        id: `mcq-fr-to-ar-${word.id}`,
        type: 'mcq',
        instruction_fr: `Trouve le mot "${word.translation_fr}"`,
        prompt: { fr: word.translation_fr },
        options: generateTranslationOptions(word, allWords, 'fr_to_ar'),
        metadata: { word_id: word.id },
      });
    }

    // MCQ décodage (max 4)
    for (const word of sectionWords.slice(0, Math.min(4, sectionWords.length))) {
      exercises.push({
        id: `mcq-decode-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Comment se prononce ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        options: generateDecodingOptions(word, allWords),
        metadata: { word_id: word.id },
      });
    }

    // Match (si ≥ 4 mots dans la section)
    if (sectionWords.length >= 4) {
      exercises.push({
        id: `match-theme-${config.theme}-s${sectionWords[0]?.id}`,
        type: 'match',
        instruction_fr: 'Associe les mots à leur traduction',
        prompt: { fr: '' },
        matchPairs: sectionWords.slice(0, 4).map(w => ({
          id: w.id,
          left: { ar: w.arabic_vocalized },
          right: { fr: w.translation_fr },
        })),
        metadata: {},
      });
    }

    // Bonus racine (identique à l'existant)
    const rootGroups = new Map<string, Word[]>();
    for (const word of sectionWords) {
      if (word.root_id) {
        const group = rootGroups.get(word.root_id) || [];
        group.push(word);
        rootGroups.set(word.root_id, group);
      }
    }
    for (const [rootId, rootWords] of rootGroups) {
      if (rootWords.length >= 2) {
        const root = roots.find(r => r.id === rootId);
        if (root) {
          exercises.push({
            id: `mcq-root-bonus-${rootId}-s${sectionWords[0]?.id}`,
            type: 'mcq',
            instruction_fr: 'Ces mots partagent une racine. Laquelle ?',
            prompt: {
              ar: rootWords.map(w => w.arabic_vocalized).join(' — '),
              fr: rootWords.map(w => w.translation_fr).join(', '),
            },
            options: shuffleArray([
              { id: rootId, text: { ar: root.consonants.join(' - '), fr: root.core_meaning_fr }, correct: true },
              ...roots
                .filter(r => r.id !== rootId)
                .slice(0, 2)
                .map(r => ({
                  id: r.id,
                  text: { ar: r.consonants.join(' - '), fr: r.core_meaning_fr },
                  correct: false,
                })),
            ]),
            metadata: { root_id: rootId },
          });
        }
      }
    }
  }

  return shuffleArray(exercises);
}
```

### 4d — Garder une fonction de compatibilité

Pour ne pas casser les appels existants pendant la transition, garder l'ancienne signature comme wrapper :

```typescript
/**
 * @deprecated Utiliser generateWordLessonSections() à la place.
 * Conservé temporairement pour compatibilité pendant le refactoring de lesson/[id].tsx.
 */
export function generateWordExercises(
  lessonSortOrder: number,
  lessonWords: Word[],
  allWords: Word[],
  roots: Root[],
): ExerciseConfig[] {
  const sections = generateWordLessonSections(lessonSortOrder, lessonWords, allWords, roots);
  return sections.sections.flatMap(s => s.exercises);
}
```

**Checkpoint M4 :**
- [ ] `generateWordLessonSections()` retourne un `LessonSections` avec contentType `'words'`
- [ ] Pour une leçon de 8 mots theme='family' : 2 sections de 4-5 mots chacune
- [ ] Pour une leçon de 11 mots theme='places' : 2-3 sections
- [ ] Pour une leçon de 8 mots type='simple' (< MIN_ITEMS_TO_SPLIT) : 1 seule section
- [ ] `generateWordExercises()` (wrapper de compatibilité) retourne les mêmes exercices qu'avant (tableau plat)
- [ ] Les helpers (generateTranslationOptions, shuffleArray, etc.) ne sont PAS modifiés
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] **Aucun import `src/db/remote`**

---

## MISSION 5 — Refactoring `sentence-exercise-generator.ts` : retour en sections

**Contexte :** Generator du Module 4. Même approche que Mission 4.

**Action — modifier `src/engines/sentence-exercise-generator.ts` :**

### 5a — Ajouter imports et nouvelle fonction publique

```typescript
import type { LessonSection, LessonSections } from '../types/section';
import { chunkItems, buildSection, buildLessonSections, DEFAULT_SECTION_SIZE } from './section-utils';
```

### 5b — Créer `generateSentenceLessonSections`

```typescript
/**
 * Génère les sections d'une leçon du Module 4.
 * Découpage par type de leçon :
 * - Leçons de phrases (démonstratifs, possessifs, etc.) : sections par groupes de phrases
 * - Leçon fill_blank : 1 section unique (exercices seuls, pas de teaching)
 * - Leçon dialogue : 1 section par dialogue
 */
export function generateSentenceLessonSections(
  lessonSortOrder: number,
  lessonSentences: Sentence[],
  allSentences: Sentence[],
  allWords: Word[],
  dialoguesWithTurns?: { dialogue: Dialogue; turns: DialogueTurn[] }[],
): LessonSections {
  const config = LESSON_SENTENCE_CONFIG[lessonSortOrder];
  if (!config) {
    return buildLessonSections('sentences', []);
  }

  const sections: LessonSection[] = [];

  if (config.type === 'demonstrative' || config.type === 'possessive' || config.type === 'nominal') {
    // Découper les phrases en sections
    const sentenceChunks = chunkItems(lessonSentences, DEFAULT_SECTION_SIZE);

    sentenceChunks.forEach((chunkSentences, index) => {
      const exercises = _generateExercisesForSentences(
        config.type, chunkSentences, allSentences, allWords,
      );

      sections.push(buildSection(
        index,
        sentenceChunks.length === 1 ? config.title_fr ?? 'Phrases' : `Partie ${index + 1}`,
        chunkSentences.map(s => s.id),
        exercises,
      ));
    });
  }

  if (config.type === 'fill_blank') {
    // Pas de teaching phase — juste des exercices
    const exercises = _generateFillBlankExercises(lessonSentences, allWords);
    sections.push(buildSection(0, 'Complète les phrases', [], exercises));
  }

  if (config.type === 'dialogue' && dialoguesWithTurns) {
    // 1 section par dialogue
    dialoguesWithTurns.forEach(({ dialogue, turns }, index) => {
      const exercises = _generateDialogueExercises(dialogue, turns);
      sections.push(buildSection(
        index,
        dialogue.title_fr,
        turns.map(t => t.id),
        exercises,
      ));
    });
  }

  return buildLessonSections('sentences', sections);
}
```

### 5c — Extraire les fonctions internes

Factoriser la logique existante de `generateSentenceExercises` en fonctions internes :
- `_generateExercisesForSentences(type, sentences, allSentences, allWords)` — MCQ AR→FR, FR→AR, genre démonstratif, possessifs
- `_generateFillBlankExercises(sentences, allWords)` — fill_blank existant
- `_generateDialogueExercises(dialogue, turns)` — MCQ dialogue existant

> **Important** : Le contenu de chaque exercice est IDENTIQUE à l'existant. On déplace juste le code dans des fonctions séparées appelables par section.

### 5d — Garder le wrapper de compatibilité

```typescript
/**
 * @deprecated Utiliser generateSentenceLessonSections() à la place.
 */
export function generateSentenceExercises(
  lessonSortOrder: number,
  lessonSentences: Sentence[],
  allSentences: Sentence[],
  allWords: Word[],
  dialoguesWithTurns?: { dialogue: Dialogue; turns: DialogueTurn[] }[],
): ExerciseConfig[] {
  const sections = generateSentenceLessonSections(
    lessonSortOrder, lessonSentences, allSentences, allWords, dialoguesWithTurns,
  );
  return sections.sections.flatMap(s => s.exercises);
}
```

**Checkpoint M5 :**
- [ ] `generateSentenceLessonSections()` retourne un `LessonSections` avec contentType `'sentences'`
- [ ] Leçons 1-4 : sections par groupes de phrases
- [ ] Leçon 5 (fill_blank) : 1 section sans teaching
- [ ] Leçon 6 (dialogues) : 1 section par dialogue
- [ ] Le wrapper de compatibilité retourne les mêmes exercices qu'avant
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] **Aucun import `src/db/remote`**

---

## MISSION 6 — Refactoring des generators de lettres et harakats

**Contexte :** Les Modules 1 et 2 ont des leçons courtes (3-5 lettres, 6-8 diacritiques). Le découpage en sections ne les changera pas visuellement (1 seule section par leçon), mais il faut qu'ils adoptent le même type de retour `LessonSections` pour que l'écran de leçon ait une interface uniforme.

### 6a — Modifier `src/engines/exercise-generator.ts` (Module 1 — Lettres)

Ajouter les imports et créer :

```typescript
import type { LessonSections } from '../types/section';
import { buildSection, buildLessonSections } from './section-utils';

/**
 * Génère les sections d'une leçon du Module 1 (Lettres).
 * En pratique : 1 seule section car les leçons ont 3-5 lettres.
 */
export function generateLetterLessonSections(
  lessonSortOrder: number,
  lessonLetters: Letter[],
  allLetters: Letter[],
): LessonSections {
  // Générer les exercices avec la logique existante
  const exercises = generateLetterExercises(lessonSortOrder, lessonLetters, allLetters);

  const section = buildSection(
    0,
    `Lettres ${lessonLetters[0]?.name_fr ?? ''} → ${lessonLetters[lessonLetters.length - 1]?.name_fr ?? ''}`,
    lessonLetters.map(l => l.id),
    exercises,
  );

  return buildLessonSections('letters', [section]);
}
```

> `generateLetterExercises` (l'ancienne fonction) reste en place et inchangée — on la wrappe simplement.

### 6b — Modifier `src/engines/harakat-exercise-generator.ts` (Module 2 — Harakats)

Même approche :

```typescript
import type { LessonSections } from '../types/section';
import { buildSection, buildLessonSections } from './section-utils';

/**
 * Génère les sections d'une leçon du Module 2 (Harakats).
 * En pratique : 1 seule section car les leçons ont peu de diacritiques.
 */
export function generateHarakatLessonSections(
  lessonSortOrder: number,
  lessonDiacritics: Diacritic[],
  allDiacritics: Diacritic[],
  letters: Letter[],
): LessonSections {
  const exercises = generateHarakatExercises(lessonSortOrder, lessonDiacritics, allDiacritics, letters);

  const section = buildSection(
    0,
    lessonDiacritics.map(d => d.name_fr).join(', '),
    lessonDiacritics.map(d => d.id),
    exercises,
  );

  return buildLessonSections('diacritics', [section]);
}
```

**Checkpoint M6 :**
- [ ] `generateLetterLessonSections()` retourne `LessonSections` avec 1 section
- [ ] `generateHarakatLessonSections()` retourne `LessonSections` avec 1 section
- [ ] Les anciennes fonctions (`generateLetterExercises`, `generateHarakatExercises`) restent intactes et fonctionnelles
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 7 — Composant `SectionPlayer`

**Contexte :** Composant qui orchestre le déroulement d'UNE section : phase teaching (présentation des items) → phase exercices. C'est lui qui remplace l'ancien flow monolithique.

**Action — créer `src/components/lesson/SectionPlayer.tsx` :**

### Props

```typescript
interface SectionPlayerProps {
  /** La section à jouer */
  section: LessonSection;
  /** Le type de contenu (pour savoir quel composant de teaching utiliser) */
  contentType: LessonSections['contentType'];
  /** Progression existante de cette section (pour reprise) */
  initialProgress: SectionProgress;
  /** Les données de contenu nécessaires au rendering (lettres, mots, phrases...) */
  contentData: {
    letters?: Letter[];
    diacritics?: Diacritic[];
    words?: Word[];
    roots?: Root[];
    sentences?: Sentence[];
    dialogues?: { dialogue: Dialogue; turns: DialogueTurn[] }[];
  };
  /** Settings utilisateur (harakats, translittération, traduction) */
  settings: UserSettings;
  /** Callback à chaque changement de progression (pour persister) */
  onProgressUpdate: (progress: SectionProgress) => void;
  /** Callback quand la section est complétée */
  onSectionComplete: (progress: SectionProgress) => void;
}
```

### Structure interne

Le composant gère deux phases internes :

**Phase 1 — Teaching (si `teachingItemIds.length > 0`) :**
- Affiche les items un par un (LetterCard, WordCard, SentenceCard, etc. selon `contentType`)
- Navigation par bouton "Suivant" (identique au flow actuel)
- Indicateur de progression : dots en haut
- Quand le dernier item est vu → passer à la phase exercices
- Appeler `onProgressUpdate` avec `teachingCompleted: true`

**Phase 2 — Exercices :**
- Utilise `ExerciseRenderer` existant (AUCUNE modification de ExerciseRenderer)
- Commence à `initialProgress.nextExerciseIndex` (pour reprise mid-session)
- À chaque réponse :
  1. Ajouter le `ExerciseResult` dans `exerciseResults`
  2. Incrémenter `nextExerciseIndex`
  3. Appeler `onProgressUpdate` avec la progression mise à jour
- Quand le dernier exercice est répondu → appeler `onSectionComplete`

### Comportement clé

```typescript
// Pseudo-code du flow interne
const [phase, setPhase] = useState<'teaching' | 'exercises'>(
  initialProgress.teachingCompleted ? 'exercises' : 'teaching'
);
const [teachingIndex, setTeachingIndex] = useState(0);
const [exerciseIndex, setExerciseIndex] = useState(initialProgress.nextExerciseIndex);
const [results, setResults] = useState<ExerciseResult[]>(initialProgress.exerciseResults);

// Quand un exercice est complété :
const handleExerciseComplete = (result: ExerciseResult) => {
  const newResults = [...results, result];
  const newIndex = exerciseIndex + 1;
  setResults(newResults);
  setExerciseIndex(newIndex);

  const updatedProgress: SectionProgress = {
    sectionId: section.id,
    teachingCompleted: true,
    nextExerciseIndex: newIndex,
    exerciseResults: newResults,
    status: newIndex >= section.exercises.length ? 'completed' : 'exercises',
  };

  if (newIndex >= section.exercises.length) {
    onSectionComplete(updatedProgress);
  } else {
    onProgressUpdate(updatedProgress);
  }
};
```

### UI

```
Phase Teaching :
┌─────────────────────────────────────┐
│  ← Retour    Section 1    3/5       │
│  ● ● ● ○ ○                         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     [WordCard / LetterCard] │    │
│  │         mode="full"         │    │
│  └─────────────────────────────┘    │
│                                     │
│  "Notes pédagogiques..."           │
│                                     │
│  [         Suivant →          ]     │
└─────────────────────────────────────┘

Phase Exercices :
┌─────────────────────────────────────┐
│  Section 1     Exercice 3/10        │
│  ████████░░░░░░░░░░                 │  ← ProgressBar
│                                     │
│  ┌─────────────────────────────┐    │
│  │    [ExerciseRenderer]       │    │
│  │    (composant existant,     │    │
│  │     aucune modification)    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

> **Note :** Le rendu de la phase Teaching pour chaque `contentType` reprend EXACTEMENT le code de présentation qui existe déjà dans `lesson/[id].tsx`. Il faut le déplacer dans SectionPlayer, pas le réécrire. C'est un move, pas un rewrite.

**Checkpoint M7 :**
- [ ] `SectionPlayer.tsx` compile sans erreur
- [ ] Phase teaching affiche les items un par un avec navigation
- [ ] Phase exercices utilise `ExerciseRenderer` sans modification
- [ ] `onProgressUpdate` est appelé à chaque étape (teaching terminé, exercice répondu)
- [ ] `onSectionComplete` est appelé quand le dernier exercice est terminé
- [ ] La reprise fonctionne : si `initialProgress.nextExerciseIndex = 5`, les exercices commencent au 6e
- [ ] Aucune modification de `ExerciseRenderer`, `MCQExercise`, `MatchExercise`, `FillBlankExercise`
- [ ] **Aucun import `src/db/remote`**

---

## MISSION 8 — Composant `LessonHub`

**Contexte :** Nouvel écran qui s'affiche quand l'utilisateur ouvre une leçon qui a déjà été commencée ou complétée. Il remplace l'ancien comportement "on recommence tout depuis le début".

**Action — créer `src/components/lesson/LessonHub.tsx` :**

### Props

```typescript
interface LessonHubProps {
  lesson: Lesson;
  sections: LessonSection[];
  /** Progression par section (vide si première fois) */
  sectionProgress: SectionProgress[];
  /** Status global de la leçon dans user_progress */
  lessonStatus: 'not_started' | 'in_progress' | 'completed';
  /** Callbacks */
  onStartFromBeginning: () => void;
  onResumeAtSection: (sectionIndex: number) => void;
  onReplayTeaching: (sectionIndex: number) => void;
  onReplayExercises: (sectionIndex: number) => void;
  onBack: () => void;
}
```

### 3 modes d'affichage

**Mode 1 — Première fois (`lessonStatus === 'not_started'`)** :
Ne pas afficher le LessonHub. Aller directement au SectionPlayer (section 0).

**Mode 2 — En cours (`lessonStatus === 'in_progress'`)** :
```
┌─────────────────────────────────────┐
│  ← Retour        Leçon : Ma famille │
│                                     │
│  Tu en étais à la section 2/3       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ✅ Section 1 : Partie 1      │  │  ← Complétée (grisée, tap = options relire/exercer)
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ ◐  Section 2 : Partie 2      │  │  ← En cours (bordure active)
│  │    Exercice 5/12              │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 🔒 Section 3 : Partie 3      │  │  ← Pas encore commencée
│  └───────────────────────────────┘  │
│                                     │
│  [    Reprendre où j'en étais   ]   │  ← CTA principal
└─────────────────────────────────────┘
```

**Mode 3 — Complétée (`lessonStatus === 'completed'`)** :
```
┌─────────────────────────────────────┐
│  ← Retour        Leçon : Ma famille │
│                                     │
│  ✅ Leçon complétée !               │
│  Score : 85%   XP : +30             │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Section 1 : Partie 1         │  │
│  │  [📖 Relire]  [💪 S'exercer] │  │  ← 2 boutons par section
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Section 2 : Partie 2         │  │
│  │  [📖 Relire]  [💪 S'exercer] │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Section 3 : Partie 3         │  │
│  │  [📖 Relire]  [💪 S'exercer] │  │
│  └───────────────────────────────┘  │
│                                     │
│  [   Tout refaire depuis le début  ]│  ← Secondaire
└─────────────────────────────────────┘
```

### Comportement

- "Reprendre où j'en étais" → `onResumeAtSection(currentSectionIndex)` — reprend au `SectionPlayer` avec la progression existante
- "Relire" → `onReplayTeaching(sectionIndex)` — lance le `SectionPlayer` en mode teaching-only (pas d'exercices à la fin, juste la lecture des items)
- "S'exercer" → `onReplayExercises(sectionIndex)` — lance le `SectionPlayer` en mode exercices-only (saute la phase teaching, re-génère les exercices aléatoirement)
- "Tout refaire depuis le début" → `onStartFromBeginning()` — supprime la session et relance depuis Section 0

**Style :**
- Fond `#FAFAF5` (palette Lisaan)
- Sections complétées : fond blanc, icône ✅, opacité pleine
- Section en cours : bordure `#2D6A4F`, fond blanc
- Section verrouillée : fond grisé `#F0F0F0`, icône 🔒, non-cliquable
- Boutons "Relire" / "S'exercer" : petits, côte à côte, outline style
- CTA principal : fond `#2D6A4F`, texte blanc, pleine largeur

**Checkpoint M8 :**
- [ ] `LessonHub.tsx` compile sans erreur
- [ ] Mode en_cours : affiche les sections avec leur statut + CTA "Reprendre"
- [ ] Mode complétée : affiche "Relire" et "S'exercer" par section
- [ ] Tap sur "Relire" → appelle `onReplayTeaching(index)`
- [ ] Tap sur "S'exercer" → appelle `onReplayExercises(index)`
- [ ] Section verrouillée : non cliquable
- [ ] **Aucun import `src/db/remote`**

---

## MISSION 9 — Refactoring de `app/lesson/[id].tsx`

**Contexte :** C'est la mission la plus importante. L'écran de leçon passe d'un flow monolithique (présentation de TOUT → exercices de TOUT) à un flow piloté par sections.

### 9a — Nouveau state machine

L'écran de leçon a désormais 4 états :

```typescript
type LessonScreenMode =
  | 'loading'           // Chargement des données et de la session
  | 'hub'               // LessonHub (leçon en cours ou complétée)
  | 'playing'           // SectionPlayer actif (une section en cours)
  | 'lesson_complete';  // Toutes les sections terminées → écran de résultat
```

### 9b — Séquence au chargement

```typescript
// 1. Charger la leçon, le module, les données de contenu (existant)
// 2. Générer les LessonSections via le bon generator
// 3. Vérifier le status dans user_progress
// 4. Charger la lesson_session (si elle existe)
// 5. Décider du mode initial :

const lessonStatus = progress?.status ?? 'not_started';
const existingSession = await getLessonSession(lessonId, userId);

if (lessonStatus === 'not_started' && !existingSession) {
  // Première fois → démarrer directement en mode 'playing', section 0
  setMode('playing');
  setCurrentSectionIndex(0);
} else if (existingSession) {
  // Session en cours → afficher le hub
  setMode('hub');
} else if (lessonStatus === 'completed') {
  // Déjà complétée → afficher le hub (mode replay)
  setMode('hub');
}
```

### 9c — Orchestration des sections

```typescript
// Quand SectionPlayer signale une section complète :
const handleSectionComplete = async (progress: SectionProgress) => {
  // Mettre à jour la session
  const nextIndex = currentSectionIndex + 1;
  const updatedSectionProgress = [...sessionState.sectionProgress];
  updatedSectionProgress[currentSectionIndex] = progress;

  if (nextIndex >= lessonSections.sections.length) {
    // TOUTES les sections sont terminées → compléter la leçon
    await deleteLessonSession(lessonId, userId);
    await handleLessonComplete(updatedSectionProgress);
  } else {
    // Passer à la section suivante
    const newSession: LessonSessionState = {
      ...sessionState,
      currentSectionIndex: nextIndex,
      sectionProgress: updatedSectionProgress,
    };
    await upsertLessonSession(newSession);
    setCurrentSectionIndex(nextIndex);
    // Le SectionPlayer se réinitialise avec la nouvelle section
  }
};

// Quand SectionPlayer signale un changement de progression mid-section :
const handleProgressUpdate = async (progress: SectionProgress) => {
  const updatedSectionProgress = [...sessionState.sectionProgress];
  updatedSectionProgress[currentSectionIndex] = progress;

  const newSession: LessonSessionState = {
    ...sessionState,
    sectionProgress: updatedSectionProgress,
  };
  await upsertLessonSession(newSession);
};
```

### 9d — Complétion de leçon (IDENTIQUE au flow actuel)

La fonction `handleLessonComplete` reste **identique** à ce qui existe :
1. Calculer le score global (moyenne des scores de toutes les sections)
2. Écrire dans `user_progress` (status = 'completed')
3. Ajouter XP, déclencher XPFloatingLabel
4. Vérifier badges (checkBadges)
5. Créer les cartes SRS
6. Vérifier si module complet → ModuleCompleteScreen
7. Sinon → naviguer vers le résultat

> **CRITIQUE** : Le code existant de `handleLessonComplete` (É9, Mission 10) ne change PAS. On change juste le moment où il est appelé : au lieu d'être appelé après le dernier exercice du tableau plat, il est appelé après la dernière section.

### 9e — Gestion des modes replay

```typescript
// Depuis LessonHub — mode "Relire"
const handleReplayTeaching = (sectionIndex: number) => {
  setReplayMode('teaching_only');
  setCurrentSectionIndex(sectionIndex);
  setMode('playing');
};

// Depuis LessonHub — mode "S'exercer"
const handleReplayExercises = (sectionIndex: number) => {
  setReplayMode('exercises_only');
  setCurrentSectionIndex(sectionIndex);
  setMode('playing');
};
```

Le `SectionPlayer` reçoit un prop `replayMode?: 'teaching_only' | 'exercises_only'` :
- `teaching_only` : affiche les items de teaching puis revient au hub (pas d'exercices, pas de XP, pas de score)
- `exercises_only` : saute la phase teaching, va directement aux exercices (re-générés aléatoirement)

### 9f — Ce qui est SUPPRIMÉ de lesson/[id].tsx

- L'ancien code de la phase présentation monolithique (remplacé par SectionPlayer)
- L'ancien code de la phase exercices monolithique (remplacé par SectionPlayer)
- Le mapping `getLessonContentType` → remplacé par `LessonSections.contentType`

### 9g — Ce qui est CONSERVÉ de lesson/[id].tsx

- Le chargement de la leçon et du module (hooks existants)
- Le chargement des données de contenu (lettres, mots, phrases, etc.)
- La logique `handleLessonComplete` (XP, badges, SRS, module-complete)
- Les composants `XPFloatingLabel` et `BadgeUnlockModal`
- Le header avec bouton retour
- La navigation post-complétion

**Checkpoint M9 :**
- [ ] L'écran de leçon charge et affiche correctement pour chaque module (1, 2, 3, 4)
- [ ] **Première visite** : démarre directement en SectionPlayer, section 0
- [ ] **Quitter mid-section** (back button) : la session est sauvegardée
- [ ] **Revenir sur la leçon** : le LessonHub s'affiche avec la progression
- [ ] **"Reprendre"** : reprend exactement là où on en était (bon exercice, bon index)
- [ ] **Complétion** : toutes les sections terminées → XP + badges + SRS + navigation (identique à l'existant)
- [ ] **Leçon complétée + retour** : LessonHub mode replay avec "Relire" / "S'exercer" par section
- [ ] **"Relire"** : affiche les items de teaching, pas d'exercices
- [ ] **"S'exercer"** : lance les exercices directement (exercices re-shufflés)
- [ ] **Module 1** : fonctionne (1 section, lettres)
- [ ] **Module 2** : fonctionne (1 section, harakats)
- [ ] **Module 3** : fonctionne (2-3 sections, mots)
- [ ] **Module 4** : fonctionne (sections par type)
- [ ] L'ancien flow monolithique est entièrement supprimé
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] **Aucun import `src/db/remote`**

---

## MISSION 10 — Vérification end-to-end + régression

### 10a — Scénarios de test sections

```
1. Module 3, Leçon 3.3 "Ma famille" (8 mots) :
   - Affiche 2 sections (~4 mots chacune)
   - Section 1 : 4 WordCards + ~8 exercices
   - Section 2 : 4 WordCards + ~8 exercices
   - Micro-célébration entre les sections (transition fluide)

2. Module 3, Leçon 3.5 "Mon environnement" (11 mots) :
   - Affiche 2-3 sections
   - Pas de section de 1-2 mots isolés (fusion)

3. Module 1, Leçon 1 (4 lettres) :
   - 1 seule section (pas de split, < 7 items)
   - Comportement identique à l'ancien flow
```

### 10b — Scénarios de test persistance

```
1. Commencer Leçon 3.3, voir 2 WordCards de Section 1, quitter
   → Revenir → LessonHub affiche Section 1 "en cours"
   → "Reprendre" → reprend au 3e WordCard

2. Commencer Leçon 3.3, finir Section 1, commencer Section 2, répondre à 3 exercices, quitter
   → Revenir → LessonHub affiche Section 1 ✅, Section 2 "en cours (3/8)"
   → "Reprendre" → reprend au 4e exercice de Section 2

3. Commencer une leçon, couper le réseau (mode avion), continuer
   → La session se sauvegarde en SQLite local
   → Tout fonctionne offline
```

### 10c — Scénarios de test replay

```
1. Compléter Leçon 3.3 entièrement
   → Revenir sur la leçon → LessonHub mode "complétée"
   → Tap "Relire" Section 1 → voit les 4 WordCards, pas d'exercices
   → Retour au hub
   → Tap "S'exercer" Section 2 → lance les exercices directement
   → Pas de XP supplémentaire (replay = pas de XP)

2. Tap "Tout refaire depuis le début" → supprime la session → recommence comme neuf
   → CETTE FOIS, XP et badges fonctionnent normalement (c'est un "redo" complet)
```

### 10d — Régression É0–É10.5

```
1. Onboarding : 5 écrans → recommandation → parcours standard
2. Module 1 alphabet : 7 leçons, 1 section chacune, MCQ, tracé
3. Module 2 harakats : exercices syllabiques, 1 section par leçon
4. Module 3 premiers mots : 6 leçons, 2-3 sections chacune (leçons 3.3-3.6)
5. Module 4 construire du sens : sections par type de contenu
6. SRS : révision lettres + diacritiques + mots + phrases
7. Streak et XP après chaque leçon COMPLÈTE (pas après chaque section)
8. Badges : déclenchement inchangé (fin de leçon)
9. Profil : streaks, XP, stats, trophées
10. Settings : 8 settings propagés dans SectionPlayer
11. Mode avion : tout fonctionne (SQLite local, session persistée)
12. Audio : lettres et mots jouables dans les sections
```

### 10e — Vérification architecture

```bash
# Aucun import db/remote hors sync files
grep -rn "from.*db/remote\|from.*supabase" \
  src/hooks/ src/stores/ src/components/ src/engines/
# → Seul feedback-service.ts (si présent) doit apparaître

npx tsc --noEmit
# → 0 erreur
```

### 10f — Vérification des données

```
1. Supprimer l'app et relancer (re-sync complet)
2. Pas de nouvelle table dans Supabase Cloud (aucune migration Cloud)
3. lesson_session table existe en SQLite local
4. Compléter une leçon → lesson_session SUPPRIMÉE pour cette leçon
5. user_progress contient la complétion (identique à avant)
6. srs_cards créées (identique à avant)
```

### Checkpoint final É10.7

- [ ] Types `LessonSection`, `SectionProgress`, `LessonSessionState` définis
- [ ] Table `lesson_session` en SQLite local (PAS dans Supabase)
- [ ] CRUD `getLessonSession`, `upsertLessonSession`, `deleteLessonSession` fonctionnels
- [ ] `section-utils.ts` : `chunkItems`, `buildSection`, `buildLessonSections` fonctionnels
- [ ] Les 4 generators retournent `LessonSections` (+ wrappers de compatibilité)
- [ ] `SectionPlayer` : phase teaching → phase exercices → onComplete
- [ ] `LessonHub` : mode en_cours, mode complétée, boutons relire/exercer
- [ ] `lesson/[id].tsx` : 4 modes (loading, hub, playing, lesson_complete)
- [ ] Persistance mid-session : chaque réponse sauvegardée immédiatement
- [ ] Reprise : revenir sur une leçon → reprend exactement au bon endroit
- [ ] Replay : leçon complétée → relire ou s'exercer par section
- [ ] Module 1 : 1 section par leçon, flow identique visuellement
- [ ] Module 2 : 1 section par leçon, flow identique visuellement
- [ ] Module 3 : 2-3 sections par leçon thématique, micro-learning effectif
- [ ] Module 4 : sections par type de contenu
- [ ] XP, badges, SRS, streaks : déclenchés en fin de leçon complète (inchangé)
- [ ] Aucune migration Supabase Cloud
- [ ] Mode avion fonctionne
- [ ] **Aucun hook/store/component/engine n'importe `src/db/remote`**
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] Aucune régression Modules 1-4, Gamification, Audio, Profil, Settings

---

## RÉSUMÉ DE L'ÉTAPE 10.7

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Types TypeScript : `LessonSection`, `SectionProgress`, `LessonSessionState` | ⬜ |
| 2 | Table SQLite `lesson_session` + CRUD `local-queries.ts` | ⬜ |
| 3 | `section-utils.ts` : helpers de découpage | ⬜ |
| 4 | `word-exercise-generator.ts` → retourne `LessonSections` | ⬜ |
| 5 | `sentence-exercise-generator.ts` → retourne `LessonSections` | ⬜ |
| 6 | `exercise-generator.ts` + `harakat-exercise-generator.ts` → retournent `LessonSections` | ⬜ |
| 7 | Composant `SectionPlayer` (teaching → exercices, une section) | ⬜ |
| 8 | Composant `LessonHub` (reprise, replay, relire/exercer) | ⬜ |
| 9 | Refactoring `lesson/[id].tsx` (state machine 4 modes) | ⬜ |
| 10 | Vérification end-to-end + régression É0–É10.5 | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs après É10.7 :**
- `ETAPE-10_7-sections-session-persistence.md` (ce fichier)
- `lisaan-seed-letters.json` (toujours utile)

**Fichiers à supprimer de /docs :**
- `ETAPE-10_5-pivot-vocabulaire.md` (terminée)

---

## NOTE STRATÉGIQUE

> Cette étape résout les 3 problèmes de rétention identifiés (leçons indigestes, perte mid-session, pas de rejouabilité) **sans toucher au schema Supabase Cloud, sans modifier le contenu, et sans casser les mécaniques de gamification**.
>
> Le pattern `LessonSections` est conçu pour être adopté par les futurs generators :
> - É11 (grammaire + conjugaison) → `generateGrammarLessonSections()` et `generateConjugationLessonSections()`
> - É12+ (présent, impératif, etc.) → même pattern
>
> La table `lesson_session` est volontairement locale et transitoire. Si un jour on veut synchroniser les sessions entre devices, il suffira d'ajouter un sync push — mais c'est out du MVP.
>
> **Impact sur É11** : É11 peut directement adopter le pattern section dès le départ. Ses generators retourneront `LessonSections` nativement.
