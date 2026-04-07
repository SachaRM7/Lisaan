# ÉTAPE 13E — Moteur de Révision Polymorphique + Entraînement Libre

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe pour francophones.
> Étapes terminées : 0–4 (fondations + onboarding + alphabet + SRS + profil), 4.5 (offline-first), 5–9 (harakats + mots + sens + audio + gamification), 10.5–10.7 (pivot vocabulaire + sections), 11 (grammaire + conjugaison + reorder + dialogue), 12–12D (design system + reskin + navigation + célébrations), 13–13D (auth + guest mode + polish).
>
> Cette étape transforme la révision mono-MCQ en moteur polymorphique complet : **6 modes** (Flashcard, QCM, Écrire, Associer, Écouter, Examen), un algo qui choisit le mode optimal par carte, un validateur de réponse écrite avec tolérance configurable, et un mode Entraînement Libre.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (CRITIQUE — post-É13D)** :
> - **Offline-first** : Hooks lisent depuis **SQLite local**. JAMAIS d'import de `src/db/remote` dans hooks/stores/engines/composants.
> - **Auth** : `effectiveUserId()` de `useUserStore` = SEULE source de vérité pour le user_id.
> - **Exercise Engine** : `ExerciseRenderer` + `exerciseRegistry` (contient `mcq`, `match`, `reorder`, `dialogue`, `listen_select`). On ÉTEND, on ne remplace PAS.
> - **SRS** : `srs.ts` (SM-2), item_types : `letter`, `diacritic`, `word`, `sentence`. Pas de modification.
> - **Design** : `useTheme()` obligatoire. Jost UI, Amiri arabe. JAMAIS de hex en dur.
> - **Settings** : `useSettingsStore` Zustand avec `harakats_mode`, `transliteration_mode`, `exercise_direction`, etc.
> - **`remote.ts`** importé UNIQUEMENT dans : `sync-manager.ts`, `content-sync.ts`, `user-data-pull.ts`, `guest-migration.ts`, `auth.tsx`, `_layout.tsx`.

---

## MISSION 1 — Types TypeScript

### 1.1 — Ajouter `flashcard` et `write` dans ExerciseType

Dans `src/types/exercise.ts`, ajouter à l'union existante (ne rien supprimer) :

```typescript
export type ExerciseType =
  | 'mcq' | 'match' | 'fill_blank' | 'trace' | 'listen_select'
  | 'reorder' | 'dialogue'
  | 'flashcard'      // NOUVEAU — auto-évaluation flip
  | 'write';         // NOUVEAU — réponse écrite libre
```

### 1.2 — Champs flashcard et write dans ExerciseConfig

Ajouter dans `ExerciseConfig` (ne rien écraser) :

```typescript
flashcard_back?: LocalizedText;
flashcard_back_vocalized?: string;
write_accepted_answers?: string[];
write_answer_lang?: 'ar' | 'fr';
```

### 1.3 — Créer `src/types/review.ts`

```typescript
import type { ExerciseType } from './exercise';

export type ReviewDirection = 'ar_to_fr' | 'fr_to_ar' | 'mixed';
export type ReviewSessionMode = 'daily' | 'free';
export type WriteTolerance = 'strict' | 'normal' | 'indulgent';

export interface ReviewSessionConfig {
  mode: ReviewSessionMode;
  free_options?: {
    direction: ReviewDirection;
    forced_exercise_type?: ExerciseType | null;
    module_ids?: string[];
    max_cards?: number;
    exam_mode?: boolean;
  };
}

export interface ExamQuestionResult {
  exercise_id: string;
  exercise_type: ExerciseType;
  prompt_text: string;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
}
```

### 1.4 — Ajouter `write_tolerance` dans settings

Dans `src/types/settings.ts`, ajouter `write_tolerance: WriteTolerance` à `UserSettings` et `write_tolerance: 'normal'` à `DEFAULT_SETTINGS`.

**Checkpoint :**
- [ ] `ExerciseType` inclut `flashcard` et `write`
- [ ] `src/types/review.ts` compile
- [ ] `UserSettings` a `write_tolerance`
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 2 — Validateur de réponse écrite + normaliseur arabe

Créer `src/engines/answer-validator.ts` :

```typescript
// === NORMALISATION ARABE ===

export function stripHarakats(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

export function normalizeArabic(text: string): string {
  let r = text.trim();
  r = stripHarakats(r);
  r = r.replace(/[أإآ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي'); // hamza
  r = r.replace(/ة(?=\s|$)/g, 'ه');  // taa marbuta
  r = r.replace(/ى/g, 'ي');           // alif maqsura
  return r.replace(/\s+/g, ' ');
}

export function normalizeFrench(text: string): string {
  return text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

// === LEVENSHTEIN ===

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
    }
  return dp[m][n];
}

// === VALIDATEUR ===

export interface ValidationResult {
  isCorrect: boolean;
  isExact: boolean;
  distance: number;
  closestCorrectAnswer: string;
  feedback: string;
}

export function validateWrittenAnswer(
  userAnswer: string,
  correctAnswers: string[],
  lang: 'ar' | 'fr',
  tolerance: 'strict' | 'normal' | 'indulgent',
): ValidationResult {
  if (!userAnswer.trim()) {
    return { isCorrect: false, isExact: false, distance: 999,
      closestCorrectAnswer: correctAnswers[0] ?? '', feedback: 'Tape ta réponse.' };
  }

  const normalize = lang === 'ar' ? normalizeArabic : normalizeFrench;
  const input = normalize(userAnswer);
  let bestDist = Infinity, bestAnswer = correctAnswers[0] ?? '';

  for (const ans of correctAnswers) {
    const d = levenshtein(input, normalize(ans));
    if (d < bestDist) { bestDist = d; bestAnswer = ans; }
    if (d === 0) return { isCorrect: true, isExact: true, distance: 0,
      closestCorrectAnswer: ans, feedback: 'Parfait !' };
  }

  const maxDist = tolerance === 'strict' ? 0 : tolerance === 'normal' ? 1 : 2;

  if (bestDist <= maxDist) {
    return { isCorrect: true, isExact: false, distance: bestDist,
      closestCorrectAnswer: bestAnswer, feedback: `Presque ! Réponse exacte : ${bestAnswer}` };
  }
  return { isCorrect: false, isExact: false, distance: bestDist,
    closestCorrectAnswer: bestAnswer, feedback: `Bonne réponse : ${bestAnswer}` };
}
```

**Checkpoint :**
- [ ] `stripHarakats('كِتَابٌ')` → `'كتاب'`
- [ ] `validateWrittenAnswer('livrr', ['livre'], 'fr', 'normal')` → `isCorrect: true`
- [ ] `validateWrittenAnswer('livrr', ['livre'], 'fr', 'strict')` → `isCorrect: false`
- [ ] `validateWrittenAnswer('كتاب', ['كِتَابٌ'], 'ar', 'normal')` → `isCorrect: true`
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 3 — Composant FlashcardExercise

Créer `src/components/exercises/FlashcardExercise.tsx`. Respecte `ExerciseComponentProps`.

**Comportement :**
- Face avant : prompt (arabe hero 56px ou français 28px). Hint "Tap pour retourner" en bas.
- Tap → animation flip (`Animated.spring` sur `rotateY`, `backfaceVisibility: 'hidden'`).
- Face arrière : `flashcard_back` (ou `correct_answer` en fallback).
- Après flip, 3 boutons en row (hauteur 56, radius pill) :
  - "Raté" 😕 → fond `status.errorLight`, texte `status.error` → `onComplete({ correct: false, user_answer: 'missed' })`
  - "Presque" 🤔 → fond `accent.gold` 15% opacité, texte `accent.gold` → `onComplete({ correct: true, user_answer: 'almost' })`
  - "Je l'avais" 😊 → fond `status.successLight`, texte `status.success` → `onComplete({ correct: true, user_answer: 'knew_it' })`
- Carte : 85% largeur, ratio 1.4:1, radius xl=32, fond `background.card`, ombre `medium`.
- **Tout via `useTheme()`.**

Enregistrer : `exerciseRegistry.set('flashcard', FlashcardExercise);`

**Checkpoint :**
- [ ] Flip fonctionne, 3 boutons apparaissent après, `onComplete` appelé correctement
- [ ] `useTheme()` partout, aucun hex en dur
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 4 — Composant WriteExercise

Créer `src/components/exercises/WriteExercise.tsx`. Respecte `ExerciseComponentProps`.

**Comportement :**
- Affiche : instruction + zone hero prompt + TextInput + bouton "Valider".
- Si `write_answer_lang === 'ar'` : textAlign right, font Amiri 24px.
- Si `write_answer_lang === 'fr'` : textAlign left, font Jost 18px, `autoCapitalize: 'none'`, `autoCorrect: false`.
- Bouton "Valider" : Button primary, disabled si champ vide.
- Au tap Valider :
  1. Lire `useSettingsStore().write_tolerance`
  2. Appeler `validateWrittenAnswer(input, correctAnswers, lang, tolerance)`
  3. Afficher feedback inline (1.5s) :
     - Exact → fond `status.successLight`, "Parfait !"
     - Presque → fond `accent.gold` 15%, "Presque ! Réponse exacte : X"
     - Faux → fond `status.errorLight`, "Bonne réponse : X"
  4. Appeler `onComplete` après le délai
- `correctAnswers` = `config.write_accepted_answers` ou `[config.correct_answer]`
- Supporter `config.metadata.suppressFeedback` (pour mode examen) : si true, `onComplete` immédiat sans feedback visuel
- Wrapper dans `KeyboardAvoidingView`
- **Tout via `useTheme()`.**

TextInput style : fond `background.card`, border 2px `border.medium`, radius md=16, height 56. Focus : border `brand.primary`.

Enregistrer : `exerciseRegistry.set('write', WriteExercise);`

**Checkpoint :**
- [ ] Champ texte focusable, clavier s'ouvre
- [ ] Bouton disabled si vide
- [ ] Feedback correct : exact→vert, presque→doré, faux→rouge
- [ ] Tolérance lue depuis `useSettingsStore`
- [ ] `suppressFeedback` → pas de feedback visuel
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 5 — Réglage de tolérance dans Settings

### 5.1 — Store
Ajouter `write_tolerance` dans `useSettingsStore` (state initial = `'normal'`). Inclure dans `loadSettings()` et `upsertSettings()`.

### 5.2 — Migration SQLite
```sql
ALTER TABLE user_settings ADD COLUMN write_tolerance TEXT DEFAULT 'normal';
```
L'exécuter au démarrage si la colonne n'existe pas (vérifier avec `PRAGMA table_info`).

### 5.3 — UI
Ajouter un `SettingRow` sélecteur dans l'écran Profil/Settings, section exercices :
- Label : "Tolérance (réponse écrite)"
- Options : `strict` → "Strict", `normal` → "Normal — 1 faute tolérée", `indulgent` → "Indulgent — 2 fautes + synonymes"

**Checkpoint :**
- [ ] Le sélecteur s'affiche, persiste après redémarrage
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 6 — ReviewModeSelector + quality mappings

### 6.1 — Créer `src/engines/review-mode-selector.ts`

```typescript
import type { SRSCard } from './srs';
import type { ExerciseType } from '../types/exercise';

interface ModeCtx { card: SRSCard; hasAudio: boolean; matchAvailable: boolean; }

export function selectReviewMode(ctx: ModeCtx): ExerciseType {
  const { card, hasAudio, matchAvailable } = ctx;
  if (card.ease_factor < 1.8) return 'mcq';
  if (card.repetitions <= 1) return 'mcq';
  if (card.repetitions >= 6 && card.ease_factor >= 2.3) return 'flashcard';
  if (card.repetitions >= 4) return 'write';

  const v = hashVariety(card.id, card.repetitions);
  if (hasAudio && v % 4 === 0) return 'listen_select';
  if (matchAvailable && v % 4 === 1) return 'match';
  if (v % 4 === 2) return 'write';
  return 'mcq';
}

function hashVariety(id: string, rep: number): number {
  let h = 0;
  const s = `${id}-${rep}-${new Date().toDateString()}`;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

export function selectModesForSession(
  cards: SRSCard[],
  audioMap: Map<string, boolean>,
  matchableTypes: SRSCard['item_type'][] = ['letter', 'diacritic'],
): Map<string, ExerciseType> {
  const r = new Map<string, ExerciseType>();
  for (const c of cards) r.set(c.id, selectReviewMode({
    card: c, hasAudio: audioMap.get(c.item_id) ?? false,
    matchAvailable: matchableTypes.includes(c.item_type),
  }));
  return r;
}
```

### 6.2 — Quality mappings dans `srs.ts`

```typescript
export function flashcardResultToQuality(userAnswer: string, timeMs: number): number {
  if (userAnswer === 'knew_it') return timeMs > 10000 ? 4 : 5;
  if (userAnswer === 'almost') return 3;
  return 1; // missed
}

export function writeResultToQuality(isCorrect: boolean, isExact: boolean, timeMs: number): number {
  if (!isCorrect) return 1;
  if (isExact && timeMs < 5000) return 5;
  if (isExact) return 4;
  return 3; // correct mais tolérance appliquée
}
```

**Checkpoint :**
- [ ] rep=0 → mcq, rep=4 → write, rep=7 + ease=2.5 → flashcard
- [ ] `flashcardResultToQuality('knew_it', 2000)` → 5
- [ ] `writeResultToQuality(true, false, 4000)` → 3
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 7 — Étendre review-exercise-generator.ts

Lire le fichier actuel avant de modifier. Les nouvelles fonctions reçoivent des données normalisées (agnostiques du item_type).

### 7.1 — `generateFlashcardExercise(card, itemData, direction)` → ExerciseConfig type `'flashcard'`
- `itemData` = `{ arabic, french, transliteration?, audio_url? }`
- Si ar→fr : prompt arabe, back français. Si fr→ar : inversé.

### 7.2 — `generateWriteExercise(card, itemData, direction, acceptedAnswers?)` → ExerciseConfig type `'write'`
- `write_accepted_answers` = acceptedAnswers ou `[itemData.french]` (ou `[itemData.arabic]`)
- `write_answer_lang` = 'fr' si ar→fr, 'ar' si fr→ar

### 7.3 — `generateMatchReviewExercise(cards[], itemsData[])` → ExerciseConfig type `'match'`
- Construit les `matchPairs` depuis les paires arabe↔français
- Metadata : `card_ids` (tous les IDs pour la mise à jour SRS groupée)

### 7.4 — `generatePolymorphicReviewExercise(card, itemData, distractors, options?)` → ExerciseConfig
- Options : `forcedType?`, `direction?`, `hasAudio?`, `acceptedAnswers?`
- Si `forcedType` fourni → l'utiliser. Sinon → `selectReviewMode()`
- Switch sur le type : flashcard → 7.1, write → 7.2, match → fallback MCQ (groupage géré en session), mcq/listen_select → MCQ classique

### 7.5 — `generateMCQFromItemData(card, itemData, distractors, direction)` → MCQ agnostique
- 3 options (1 correcte + 2 distracteurs), mélangées

**Checkpoint :**
- [ ] Chaque générateur retourne le bon type
- [ ] Write ar→fr a `write_answer_lang: 'fr'`
- [ ] Match a `matchPairs` de 3-4 éléments
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 8 — review-session.tsx : polymorphisme + match groupé

### 8.1 — Parsing config
```typescript
const params = useLocalSearchParams<{ config?: string }>();
const sessionConfig: ReviewSessionConfig = params.config
  ? JSON.parse(params.config) : { mode: 'daily' };
```

### 8.2 — `resolveItemData(card)` : résout les données depuis SQLite

Switch sur `card.item_type` :
- `'letter'` → `SELECT form_isolated, name_fr, transliteration, audio_url FROM letters WHERE id = ?`
- `'diacritic'` → `SELECT name_ar, name_fr, transliteration FROM diacritics WHERE id = ?`
- `'word'` → `SELECT arabic_vocalized, translation_fr, transliteration, audio_url FROM words WHERE id = ?`
- `'sentence'` → `SELECT arabic_vocalized, translation_fr, transliteration FROM sentences WHERE id = ?`

Retourne `{ arabic, french, transliteration?, audio_url? }` normalisé.

### 8.3 — `loadDistractors(card, allCards, limit=3)` : charge distracteurs du même item_type

### 8.4 — Groupage match

```typescript
function groupMatchCards(cards, modeMap): { singles, matchGroups } {
  // Cartes assignées 'match' → groupées par item_type en paquets de 4
  // Restes < 4 → fallback MCQ
}
```

### 8.5 — Quality routing

```typescript
switch (currentExercise.type) {
  case 'flashcard': quality = flashcardResultToQuality(result.user_answer, result.time_ms); break;
  case 'write': quality = writeResultToQuality(result.correct, result.attempts === 1 && result.correct, result.time_ms); break;
  case 'match': quality = result.correct ? (result.time_ms < 30000 ? 5 : 4) : 2; break;
  default: quality = exerciseResultToQuality(result.correct, result.attempts, result.time_ms);
}

if (sessionConfig.mode === 'daily') updateSRSCard(currentCard.id, quality);
// Pour match groupé : mettre à jour TOUTES les cartes du groupe
```

### 8.6 — `effectiveUserId()` utilisé partout

**Checkpoint :**
- [ ] Sans param : mode daily, MCQ pour nouvelles, Write pour intermédiaires, Flashcard pour maîtrisées
- [ ] Match groupé par 4, restes en MCQ
- [ ] Quality correct pour chaque type
- [ ] `effectiveUserId()` partout
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 9 — Mode Examen

### 9.1 — Flag dans review-session
```typescript
const isExam = sessionConfig.free_options?.exam_mode ?? false;
const [examResults, setExamResults] = useState<ExamQuestionResult[]>([]);
```

### 9.2 — Suppression du feedback
Passer `config.metadata.suppressFeedback = true` à chaque exercice en mode examen. Les composants MCQExercise, WriteExercise, FlashcardExercise vérifient ce flag et appellent `onComplete` immédiatement sans feedback visuel.

**IMPORTANT :** FlashcardExercise reste identique en exam (l'auto-éval EST le feedback). Pour MCQ et Write, ajouter :
```typescript
if (config.metadata?.suppressFeedback) {
  onComplete(result); // immédiat, pas de délai, pas de vert/rouge
  return;
}
```

### 9.3 — Accumulation
```typescript
if (isExam) {
  setExamResults(prev => [...prev, {
    exercise_id: result.exercise_id,
    exercise_type: currentExercise.type,
    prompt_text: currentExercise.prompt.ar ?? currentExercise.prompt.fr ?? '',
    correct_answer: currentExercise.correct_answer ?? currentExercise.flashcard_back?.fr ?? '',
    user_answer: typeof result.user_answer === 'string' ? result.user_answer : '',
    is_correct: result.correct,
  }]);
  advanceToNext(0); // pas de SRS
  return;
}
```

### 9.4 — `ExamResultScreen`

Créer `src/components/review/ExamResultScreen.tsx` :
- Note en grand : "17/20" (Jost-SemiBold 48px, `brand.primary`) + pourcentage + ProgressBar
- Section "Corrections" : uniquement les erreurs. Chaque erreur = card avec prompt arabe (ArabicText), "Ta réponse" en rouge, "Bonne réponse" en vert
- Si 100% : "Parfait !" + médaillon doré
- Bouton "Continuer" → retour Réviser

Afficher à la fin de session en mode exam :
```typescript
if (isExam && sessionFinished) {
  return <ExamResultScreen results={examResults} onContinue={() => router.back()} />;
}
```

**Checkpoint :**
- [ ] Exam : aucun feedback vert/rouge après chaque question
- [ ] ExamResultScreen : note + corrections des erreurs seulement
- [ ] Pas de SRS update en exam
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 10 — Écran free-training.tsx

Créer `app/free-training.tsx` — écran de configuration Entraînement Libre.

**5 sections :**

1. **DIRECTION** : Radio (Arabe→Français / Français→Arabe / Mix●)
2. **TYPE D'EXERCICE** : Radio (🃏 Flashcard / 📝 QCM / ✍️ Écrire / 🔗 Associer / 🎯 L'algo décide●)
   - "Associer" grisé + tooltip "4 cartes minimum" si < 4 cartes SRS du même type dans le scope
3. **CONTENU** : Radio (📚 Tout● / modules dynamiques via `useModules()`, locked = grisé)
4. **NOMBRE** : Slider discret (10, 15, 20●, 25, 30, 40)
5. **MODE EXAMEN** : Toggle OFF par défaut. ON = "Pas de feedback, note à la fin"

**Bouton "Lancer"** → construit `ReviewSessionConfig` et `router.push('/review-session', { config: JSON.stringify(config) })`

**Styles :** `useTheme()`, labels section Jost-Medium 12px uppercase `text.secondary`, radio cards style exercice du DS.

`effectiveUserId()` pour charger modules/progression.

**Checkpoint :**
- [ ] 5 sections fonctionnelles
- [ ] "Écrire" disponible, "Associer" grisable
- [ ] Toggle Examen fonctionne
- [ ] Navigue avec bon config
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 11 — Intégrer dans l'onglet Réviser

Modifier `app/(tabs)/review.tsx` :

**État "cartes dues"** : 2 boutons
- "Commencer la révision" → Button primary (existant, inchangé) → `/review-session` sans param
- "Entraînement libre" → Button secondary → `/free-training`

**État "à jour"** : "Entraînement libre" seul en Button primary

**État "vide"** : message encourageant, aucun bouton

**Checkpoint :**
- [ ] 2 boutons quand dues, 1 quand à jour, 0 quand vide
- [ ] Navigation correcte
- [ ] Aucune régression visuelle É12

---

## MISSION 12 — Mode free : filtrage des cartes

### 12.1 — Chargement conditionnel dans review-session
```typescript
const userId = useUserStore.getState().effectiveUserId();
if (sessionConfig.mode === 'daily') {
  cards = await getDueCards(userId);
} else {
  cards = sessionConfig.free_options?.module_ids?.length
    ? await getSRSCardsByModules(userId, sessionConfig.free_options.module_ids)
    : await getSRSCardsForUser(userId);
  cards = cards.sort(() => Math.random() - 0.5).slice(0, sessionConfig.free_options?.max_cards ?? 20);
}
```

### 12.2 — `getSRSCardsByModules` dans `local-queries.ts`

Joint `srs_cards` avec les tables de contenu pour 4 item_types :
- `letter` → JOIN letters → lessons → modules
- `diacritic` → JOIN diacritics → lessons → modules
- `word` → JOIN words (via module_id direct ou via lessons — adapter au schéma)
- `sentence` → JOIN sentences (idem)

Retourne l'union des 4 queries. `.catch(() => [])` pour les JOINs qui pourraient échouer si le schéma diffère.

### 12.3 — Pas de SRS update en mode free ni exam

**Checkpoint :**
- [ ] Free filtre par module, limite à max_cards
- [ ] Pas de SRS update en free/exam
- [ ] `effectiveUserId()` partout
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 13 — Colonne Supabase pour write_tolerance

Dans le **Dashboard Supabase Cloud** → **SQL Editor** :

```sql
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS write_tolerance TEXT DEFAULT 'normal';
```

Vérifier que `content-sync.ts` et `local-queries.ts` incluent `write_tolerance` dans les opérations read/write de `user_settings`.

**Checkpoint :**
- [ ] Colonne existe dans Supabase
- [ ] Migration SQLite locale appliquée
- [ ] `upsertSettings` écrit `write_tolerance`

---

## MISSION 14 — Tests end-to-end

### 14.1 — Révision quotidienne
1. Cartes rep 0-1 → MCQ. Rep 2-3 → MCQ/Write/Match. Rep 4-5 → Write. Rep 6+ → Flashcard.
2. Write : taper réponse → feedback selon tolérance. Match : 4 paires. Flashcard : flip + auto-éval.
3. SRS mis à jour en daily. Cartes échouées (quality < 3) reviennent.

### 14.2 — Entraînement libre : Écrire
1. Config : ar→fr, Écrire, Tout, 10 cartes. 2. "livr" pour "livre" → tolérance normal → "Presque !". 3. Changer strict → "livr" rejeté. 4. SRS PAS mis à jour.

### 14.3 — Mode Examen
1. QCM, 15 questions, Examen ON. 2. Aucun feedback vert/rouge. 3. Fin → ExamResultScreen : "12/15" + 3 corrections.

### 14.4 — Associer en révision
1. 4+ cartes letter → type Associer → Match 4 paires. 2. < 4 cartes → Associer grisé dans free-training.

### 14.5 — Guest mode
1. Guest → free-training → fonctionne. 2. Daily → SRS local fonctionne. 3. Pas de sync PUSH.

### 14.6 — Vérifications techniques
```bash
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/ src/engines/
# → AUCUN résultat

grep -rn "from.*remote\|from.*supabase" app/ --include="*.tsx" | grep -v auth.tsx | grep -v _layout.tsx
# → AUCUN résultat

npx tsc --noEmit  # → 0 erreur

grep -rn "flashcard\|write" src/components/exercises/ src/engines/
# → flashcard et write enregistrés
```

**Checkpoint final É13E :**
- [ ] FlashcardExercise + WriteExercise créés et enregistrés
- [ ] answer-validator : normalisation arabe + Levenshtein + 3 niveaux tolérance
- [ ] write_tolerance dans Settings (store + SQLite + Supabase + UI)
- [ ] ReviewModeSelector : mcq/write/flashcard/match selon repetitions/ease
- [ ] generatePolymorphicReviewExercise route vers 4 générateurs
- [ ] Match groupé par 4, fallback MCQ si < 4
- [ ] Mode Examen : pas de feedback, ExamResultScreen avec note + corrections
- [ ] free-training : 5 types + toggle Examen + direction + scope + count
- [ ] Onglet Réviser : 2 boutons quand dues, 1 quand à jour
- [ ] effectiveUserId() partout, guest compatible
- [ ] useTheme() partout, 0 hex en dur
- [ ] npx tsc --noEmit → 0 erreur
- [ ] Aucune régression

---

## RÉSUMÉ

| # | Mission | Livrable |
|---|---------|----------|
| 1 | Types | `flashcard` + `write` + `ReviewSessionConfig` + `WriteTolerance` + `ExamQuestionResult` |
| 2 | answer-validator.ts | Normaliseur arabe + Levenshtein + validateur 3 niveaux |
| 3 | FlashcardExercise | Flip + 3 boutons + registry |
| 4 | WriteExercise | TextInput + validation + feedback + registry |
| 5 | Settings tolérance | Store + SQLite + UI sélecteur |
| 6 | ReviewModeSelector | Algo sélection + flashcardResultToQuality + writeResultToQuality |
| 7 | Générateurs étendus | Flashcard + Write + Match groupé + orchestrateur polymorphique |
| 8 | review-session polymorphique | resolveItemData + match groupé + quality routing |
| 9 | Mode Examen | suppressFeedback + accumulation + ExamResultScreen |
| 10 | free-training.tsx | 5 types + Examen + direction + scope + count |
| 11 | Onglet Réviser | Bouton "Entraînement libre" |
| 12 | Mode free | getSRSCardsByModules + filtrage + no SRS update |
| 13 | Colonne Supabase | write_tolerance dans user_settings |
| 14 | Tests E2E | Daily + Free + Write + Exam + Match + Guest + régression |

---

## GESTION /docs

**Garder :** `ETAPE-13E-review-engine-polymorphique.md` + `lisaan-seed-letters.json`
**Supprimer :** `ETAPE-13D-AUTH-PIXELFIX.md`

---

> **Prochaine étape :** É14 — Conjugaison présent (مضارع) + fill_blank + dialogues contextualisés.
