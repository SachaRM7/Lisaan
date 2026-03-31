# LISAAN — لِسَان

App React Native (Expo SDK 52+) d'apprentissage de l'arabe pour francophones.

## Identité

Lisaan enseigne l'arabe littéraire (MSA), les dialectes et l'arabe coranique aux francophones. L'app valorise la calligraphie arabe, ne simplifie jamais à outrance, et traite chaque apprenant comme un adulte intelligent. Le texte arabe est le ROI de chaque écran.

## Stack

- **Mobile** : React Native + Expo SDK 52+, TypeScript strict
- **Navigation** : Expo Router (file-based)
- **State** : Zustand + React Query
- **Animations** : React Native Reanimated 3
- **DB locale** : expo-sqlite (WAL mode) — `lisaan.db`
- **Backend** : Supabase Cloud (PostgreSQL + Auth + Storage), région Europe, free tier
- **Auth** : Supabase Auth (email, Google, Apple) + Guest Mode
- **Analytics** : PostHog
- **CI/CD** : EAS Build + EAS Submit
- **Polices** : Amiri (arabe), Jost (UI française)

## Architecture offline-first — RÈGLE D'OR

Tous les hooks, stores, engines et composants lisent depuis **SQLite local uniquement**.
JAMAIS d'import de `src/db/remote.ts` en dehors des fichiers autorisés.

### Fichiers autorisés à importer `remote.ts` (LISTE EXHAUSTIVE)

- `src/engines/content-sync.ts` — PULL contenu Cloud → SQLite
- `src/engines/sync-manager.ts` — PUSH progression SQLite → Cloud
- `src/engines/user-data-pull.ts` — Pull initial progression Cloud → SQLite
- `src/engines/guest-migration.ts` — Migration Guest → Auth
- `app/auth.tsx` — Écran d'authentification
- `app/_layout.tsx` — Init séquence de démarrage

### Vérification
```bash
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/ src/engines/ --include="*.ts" --include="*.tsx" | grep -v content-sync | grep -v sync-manager | grep -v user-data-pull | grep -v guest-migration
# → DOIT retourner ZÉRO résultat
```

### Flux de données

- **Contenu pédagogique (PULL)** : Supabase → `content-sync.ts` → SQLite → hooks/composants
- **Progression utilisateur (PUSH)** : hooks/engines → SQLite (synced_at = NULL) → `sync-manager.ts` → Supabase (fire-and-forget)
- Après chaque écriture locale, appeler `runSync()` en fire-and-forget
- Conflit : last-write-wins, MAX(score) pour user_progress

## Auth & User ID

- `useUserStore.getState().effectiveUserId()` est la **SEULE** source de vérité pour le user_id
- `effectiveUserId()` = `isGuest ? guestId : userId`
- Ne JAMAIS utiliser `userId` directement — toujours `effectiveUserId()`
- Persistance via Zustand + AsyncStorage

## Exercise Engine — Pattern Plugin Registry
```typescript
// Ajouter un nouveau type d'exercice = 3 étapes :
// 1. Ajouter le type dans ExerciseType (src/types/exercise.ts)
// 2. Créer le composant dans src/components/exercises/
// 3. L'enregistrer dans exerciseRegistry (src/components/exercises/index.ts)
const Component = exerciseRegistry.get(config.type);
// Le ExerciseRenderer dispatch automatiquement
```

### Types d'exercices existants

`mcq` · `match` · `fill_blank` · `trace` · `listen_select` · `reorder` · `dialogue` · `flashcard` · `write` · `speed_round` · `memory_match`

### Générateurs d'exercices

Les exercices sont générés dynamiquement côté client, pas stockés en base :
- `exercise-generator.ts` — lettres (M1)
- `harakat-exercise-generator.ts` — harakats (M2)
- `word-exercise-generator.ts` — mots (M3-M4)
- Conjugaisons et dialogue : générés via les tables `conjugation_entries` et `dialogue_scenarios`

## SRS — Algorithme SM-2

- Fichier : `src/engines/srs.ts`
- Item types : `letter` · `diacritic` · `word` · `sentence`
- Quality mapping : 5 (correct <3s) · 4 (correct ≥3s) · 3 (correct 2e essai) · 1 (incorrect)
- Reset si quality < 3 → interval = 10min, ease -= 0.2
- Plafond : 180 jours
- Paires de confusion : lettres similaires plafonnées à 7j si l'une des deux n'est pas maîtrisée

## Moteur de Révision Polymorphique (post-É13E)

6 modes de révision : Flashcard · QCM · Écrire · Associer · Écouter · Examen
- L'algo choisit le mode optimal par carte
- Validateur de réponse écrite avec tolérance configurable (strict/normal/indulgent)
- Normalisation arabe : strip harakats, hamza, taa marbuta, alif maqsura
- Mode Entraînement Libre avec filtres par direction, module, type d'exercice

## Design System

- **Hook obligatoire** : `useTheme()` pour TOUTES les couleurs, spacings, shadows
- **JAMAIS** de hex en dur, de couleur hardcodée, de valeur hors tokens
- Polices : `Amiri-Regular` / `Amiri-Bold` (arabe), `Jost-Regular` / `Jost-Medium` / `Jost-SemiBold` (UI)
- LineHeight arabe : **minimum 1.8** (sécurité harakats). Ne JAMAIS descendre en-dessous.
- Ombres : teintées émeraude (`shadowColor` du thème), jamais noires
- Tab bar : pilule flottante avec glassmorphism, 72px, margins 24, radius pill
- Erreurs : rouge en bordure/texte uniquement, fond `errorLight` (rose pâle), jamais de rouge plein

### Palette clé (light)

- Background : `#FDFBF7` (main), `#FFFFFF` (card), `#F5F2EA` (group)
- Brand : `#0F624C` (primary), `#E5EFEB` (light), `#0A4334` (dark)
- Gold : `#D4AF37` (streaks, étoiles, récompenses)
- Texte arabe : `#000000` (noir pur, EXCLUSIF au texte arabe)

## Settings

Store : `useSettingsStore` (Zustand) — lit/écrit SQLite, sync fire-and-forget.

Settings existants : `harakats_mode` · `transliteration_mode` · `translation_mode` · `exercise_direction` · `audio_autoplay` · `audio_speed` · `font_size` · `haptic_feedback` · `write_tolerance`

## Modules existants

| # | Module | Étape | Contenu clé |
|---|--------|-------|-------------|
| M1 | L'alphabet vivant | É2 | 28 lettres, 4 formes, MCQ |
| M2 | Les harakats | É5 | Diacritiques, syllabes, match |
| M3 | Premiers mots | É6+É10.5 | Vocabulaire fréquence, thèmes quotidien, racines en lumière |
| M4 | Construire du sens | É7 | Phrases nominales, pronoms, dialogues simples |
| M5 | Grammaire essentielle | É11 | Phrase nominale, genre, article, idāfa, reorder |
| M6 | Mes premiers verbes | É11 | Conjugaison passé, 6 verbes, dialogue engine |
| M7 | Au présent | É14 | Conjugaison مضارع, 10 verbes, fill_blank |
| M8 | Situations de vie | É14 | 3 dialogues situés, formes II-III |
| M9 | L'impératif | É15 | الأمر, 10 verbes × 3 formes |
| M10 | Futur proche | É15 | سَوْفَ / سَـ, speed_round, memory_match |

## Tables DB (SQLite local miroir Supabase)

### Contenu

`letters` · `diacritics` · `roots` · `words` · `word_variants` · `sentences` · `modules` · `lessons` · `grammar_rules` · `conjugation_entries` · `dialogue_scenarios`

### Utilisateur

`user_progress` · `srs_cards` · `user_settings` · `badges` · `user_badges` · `daily_challenges` · `user_daily_challenges`

### Système

`sync_metadata` (SQLite uniquement — last_synced_at par table)

## Séquence de démarrage (app/_layout.tsx)

1. Charger les polices (useFonts : Amiri + Jost)
2. Ouvrir SQLite + créer schéma (openLocalDB + initLocalSchema)
3. Vérifier sync contenu (needsContentSync)
   → Si non : ContentDownloadScreen + syncContentFromCloud()
4. Si user auth : pullUserDataFromCloud() (une fois)
5. Lancer listener NetInfo (startSyncListener)
6. Afficher l'app

## Conventions de code

- Tout fichier TS/TSX doit compiler : `npx tsc --noEmit` → 0 erreur
- Imports relatifs pour le projet, pas d'alias @/
- Les engines ne contiennent JAMAIS de JSX — pure logique TS
- Les hooks ne contiennent JAMAIS d'appel réseau direct
- Les composants ne font JAMAIS de requête SQLite directe — passent par les hooks
- Nommage exercice : PascalCase pour le composant, snake_case pour le type (`FillBlankExercise` / `fill_blank`)
- IDs en base : format `{type}-{nom}-{détail}` (ex: `conj-kataba-present-ana`, `word-kitab`, `lesson-M7L01`)

## Migrations SQL

- Pas de CLI Supabase locale
- Toutes les migrations dans le Dashboard Supabase Cloud (SQL Editor)
- Schéma SQLite local dans `src/db/schema-local.ts`
- Nouvelles tables : créer dans Supabase Cloud + ajouter dans schema-local.ts + ajouter dans content-sync.ts

## Workflow Opus ↔ Claude Code

- Claude Opus = cerveau stratégique : produit les .md d'étape avec missions numérotées
- Claude Code = exécuteur : suit les missions dans l'ordre, checkpoint par checkpoint
- Chaque mission est une liste d'actions atomiques
- Ne passe JAMAIS à la mission suivante sans valider le checkpoint
- En cas de doute ou d'ambiguïté → STOP et demander clarification

## Gamification

- Badges sont des données (table `badges`), pas du code. Ajouter un badge = INSERT, pas de code.
- XP : attribués à la complétion de leçon (champ `xp_reward` dans `lessons`)
- Streaks : compteur journalier dans useUserStore
- Célébrations : confettis (react-native-confetti-cannon) réservés aux moments exceptionnels
- Animations XP : Reanimated 3, flottantes, 60fps UI thread

## Ne PAS faire

- ❌ Importer `remote.ts` hors de la liste autorisée
- ❌ Utiliser `userId` au lieu de `effectiveUserId()`
- ❌ Hardcoder des couleurs hex
- ❌ Descendre le lineHeight arabe sous 1.8
- ❌ Modifier `srs.ts` sauf instruction explicite
- ❌ Ajouter un exercice sans l'enregistrer dans le registry
- ❌ Créer des migrations Supabase via CLI (utiliser le Dashboard Cloud)
- ❌ Faire des requêtes Supabase directes dans les hooks
- ❌ Utiliser des ombres noires (toujours teintées via shadowColor du thème)
- ❌ Passer à la mission suivante sans valider le checkpoint