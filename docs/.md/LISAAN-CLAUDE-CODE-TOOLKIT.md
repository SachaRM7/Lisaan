# LISAAN — Kit d'outillage Claude Code

> **Ce document est un prompt Claude Code.**
> Colle-le dans Claude Code à la racine du projet Lisaan.
> Il crée : le CLAUDE.md, 4 slash commands, 3 hooks, et 3 subagents.
> Exécute chaque mission dans l'ordre. Checkpoint à la fin de chaque mission.

---

## MISSION 1 — Créer le CLAUDE.md

Crée le fichier `CLAUDE.md` à la racine du projet avec le contenu exact ci-dessous.

> **Attention :** Ce fichier est lu automatiquement par Claude Code à chaque session. Il encode les invariants du projet pour éviter de les répéter dans chaque prompt d'étape. Ne le modifie JAMAIS sauf instruction explicite d'Opus.

```markdown
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
```

**Checkpoint Mission 1 :**
- [ ] `CLAUDE.md` existe à la racine du projet
- [ ] Le contenu correspond exactement au bloc ci-dessus
- [ ] `cat CLAUDE.md | head -5` affiche `# LISAAN — لِسَان`

---

## MISSION 2 — Créer les slash commands

### 2a — `/checkpoint`

```bash
mkdir -p .claude/commands
```

Crée `.claude/commands/checkpoint.md` :

```markdown
# Checkpoint de validation

Exécute la batterie complète de validations pour la mission en cours :

## 1. TypeScript
```bash
npx tsc --noEmit
```
Doit retourner 0 erreur. Si des erreurs, liste-les et corrige-les.

## 2. Architecture offline-first
```bash
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/ src/engines/ --include="*.ts" --include="*.tsx" | grep -v content-sync | grep -v sync-manager | grep -v user-data-pull | grep -v guest-migration
```
Doit retourner ZÉRO résultat. Si des violations, corrige-les.

## 3. Couleurs hardcodées
```bash
grep -rn "#[0-9A-Fa-f]\{6\}" src/components/ src/screens/ app/ --include="*.tsx" | grep -v theme | grep -v constants | grep -v ".test." | grep -v node_modules
```
Vérifie chaque résultat. Si c'est une couleur hardcodée hors du fichier theme, signale-la.

## 4. userId direct (doit être effectiveUserId)
```bash
grep -rn "useUserStore.*\.userId[^(]" src/ app/ --include="*.ts" --include="*.tsx" | grep -v "effectiveUserId" | grep -v ".d.ts" | grep -v node_modules | grep -v useUserStore.ts
```
Si des résultats, ce sont des usages de userId qui devraient passer par effectiveUserId().

## 5. LineHeight arabe
```bash
grep -rn "lineHeight" src/components/arabic/ --include="*.tsx"
```
Vérifie que toutes les valeurs sont ≥ 1.8 pour le texte arabe.

## Rapport
Présente un résumé : ✅ pour chaque check qui passe, ❌ pour chaque violation avec le fichier et la ligne.
```

### 2b — `/architecture-guard`

Crée `.claude/commands/architecture-guard.md` :

```markdown
# Architecture Guard — Vérification complète des invariants

Exécute toutes les vérifications d'architecture du projet Lisaan en une passe.

## Vérifications à exécuter

### 1. Imports remote.ts
```bash
echo "=== REMOTE IMPORTS ==="
grep -rn "from.*db/remote\|from.*supabase\|import.*supabase" src/ app/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts"
```
Résultats attendus UNIQUEMENT dans : content-sync.ts, sync-manager.ts, user-data-pull.ts, guest-migration.ts, auth.tsx, _layout.tsx.
Tout autre fichier = VIOLATION CRITIQUE.

### 2. Exercise registry
```bash
echo "=== EXERCISE REGISTRY ==="
grep -rn "exerciseRegistry.set\|exerciseRegistry.register" src/ --include="*.ts" --include="*.tsx"
```
Vérifie que chaque ExerciseType déclaré dans `src/types/exercise.ts` a une entrée correspondante dans le registry.

### 3. Composants sans hooks DB
```bash
echo "=== COMPOSANTS DB DIRECTS ==="
grep -rn "getLocalDB\|executeQuery\|SELECT.*FROM\|INSERT.*INTO\|UPDATE.*SET" src/components/ --include="*.tsx"
```
Les composants ne doivent JAMAIS faire de requêtes SQLite directes. Ils passent par les hooks.

### 4. Engines sans JSX
```bash
echo "=== ENGINES JSX ==="
grep -rn "React\.\|<View\|<Text\|<TouchableOpacity\|useState\|useEffect" src/engines/ --include="*.ts"
```
Les engines ne doivent JAMAIS contenir de JSX ou de hooks React.

### 5. Schema consistency
```bash
echo "=== SCHEMA LOCAL ==="
grep -c "CREATE TABLE" src/db/schema-local.ts
echo "=== CONTENT SYNC TABLES ==="
grep -c "syncTable\|TABLES_TO_SYNC\|tableName" src/engines/content-sync.ts
```
Le nombre de tables contenu dans schema-local.ts doit correspondre aux tables syncées dans content-sync.ts.

## Résumé
Pour chaque vérification, affiche ✅ ou ❌ avec détails. Propose un fix pour chaque violation.
```

### 2c — `/new-mission`

Crée `.claude/commands/new-mission.md` :

```markdown
# Démarrer une nouvelle mission

Avant de commencer une mission du fichier d'étape :

## 1. État du repo
```bash
git status --short
git log --oneline -3
```

## 2. TypeScript propre
```bash
npx tsc --noEmit 2>&1 | tail -5
```
Si erreurs existantes, les lister AVANT de commencer. Ne pas les introduire, mais ne pas non plus les corriger si elles ne sont pas dans le périmètre de cette mission.

## 3. Lecture du contexte
Lis le fichier d'étape dans /docs/ pour identifier la mission à exécuter. Confirme :
- Numéro de la mission
- Objectif en une phrase
- Fichiers qui seront touchés
- Dépendances avec les missions précédentes

## 4. Confirmation
Demande confirmation avant de commencer l'implémentation.

$ARGUMENTS contient le numéro de mission (ex: `/new-mission 3`). Si vide, demande le numéro.
```

### 2d — `/regression`

Crée `.claude/commands/regression.md` :

```markdown
# Test de régression complet

Exécute une vérification de non-régression sur l'ensemble des modules Lisaan.

## 1. Compilation
```bash
npx tsc --noEmit
```

## 2. Architecture
```bash
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/ src/engines/ --include="*.ts" --include="*.tsx" | grep -v content-sync | grep -v sync-manager | grep -v user-data-pull | grep -v guest-migration
```

## 3. Imports circulaires
```bash
# Vérifier les imports potentiellement circulaires entre engines
grep -rn "from.*engines/" src/engines/ --include="*.ts" | grep -v node_modules
```
Signaler tout import entre engines qui pourrait créer un cycle.

## 4. Exports manquants
```bash
# Vérifier que les composants d'exercice sont exportés
ls -la src/components/exercises/
cat src/components/exercises/index.ts
```
Chaque fichier d'exercice doit avoir une entrée dans le registry.

## 5. Types cohérents
```bash
# Vérifier l'union ExerciseType
grep -A 20 "export type ExerciseType" src/types/exercise.ts
```
Comparer avec les entrées du registry.

## 6. Schéma SQLite
```bash
# Compter les tables
grep "CREATE TABLE" src/db/schema-local.ts
```

## Rapport
Résumé complet avec ✅/❌ par vérification. Si tout passe, affiche "✅ Régression OK — prêt pour la mission suivante".
```

**Checkpoint Mission 2 :**
- [ ] `.claude/commands/checkpoint.md` existe
- [ ] `.claude/commands/architecture-guard.md` existe
- [ ] `.claude/commands/new-mission.md` existe
- [ ] `.claude/commands/regression.md` existe
- [ ] Les 4 commandes sont invocables via `/checkpoint`, `/architecture-guard`, `/new-mission`, `/regression`

---

## MISSION 3 — Créer les hooks Claude Code

Crée ou modifie `.claude/settings.json` pour ajouter les hooks suivants.

> **Important :** Si `.claude/settings.json` existe déjà, FUSIONNE les hooks avec la config existante. Ne pas écraser les settings existants (permissions, model, etc.).

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(*.ts)",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsc --noEmit 2>&1 | tail -20; exit 0"
          }
        ]
      },
      {
        "matcher": "Write(*.tsx)",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsc --noEmit 2>&1 | tail -20; exit 0"
          }
        ]
      },
      {
        "matcher": "Write(src/hooks/*.ts)",
        "hooks": [
          {
            "type": "command",
            "command": "grep -l 'from.*db/remote\\|from.*supabase' src/hooks/*.ts 2>/dev/null && echo '❌ VIOLATION: hook importe remote.ts!' || echo '✅ Hooks clean'; exit 0"
          }
        ]
      },
      {
        "matcher": "Write(src/engines/*.ts)",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(echo $CLAUDE_TOOL_INPUT | grep -o '\"file_path\":\"[^\"]*\"' | cut -d'\"' -f4); if echo $FILE | grep -qE 'content-sync|sync-manager|user-data-pull|guest-migration'; then echo '✅ Sync file OK'; else grep -l 'from.*db/remote\\|from.*supabase' \"$FILE\" 2>/dev/null && echo \"❌ VIOLATION: $FILE importe remote.ts!\" || echo '✅ Engine clean'; fi; exit 0"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo $CLAUDE_TOOL_INPUT | grep -qiE 'rm.*-rf.*src|drop.*table|supabase.*db.*reset|DELETE.*FROM.*(?!WHERE)' && echo '❌ BLOCKED: Commande potentiellement destructrice détectée' && exit 2; exit 0"
          }
        ]
      }
    ]
  }
}
```

> **Note technique sur les hooks :**
> - `exit 0` = hook passe, l'action continue
> - `exit 2` = hook bloque l'action et renvoie le message d'erreur à Claude
> - Les hooks PostToolUse sont informatifs (exit 0 toujours) — ils alertent mais ne bloquent pas
> - Le hook PreToolUse sur Bash est un garde-fou : il bloque les commandes destructrices

**Checkpoint Mission 3 :**
- [ ] `.claude/settings.json` contient la section `hooks`
- [ ] Les hooks PostToolUse sont présents pour Write(*.ts) et Write(*.tsx)
- [ ] Le hook PreToolUse Bash est présent
- [ ] Le JSON est valide : `cat .claude/settings.json | python3 -m json.tool`

---

## MISSION 4 — Créer les subagents

### 4a — Subagent `regression-tester`

```bash
mkdir -p .claude/agents
```

Crée `.claude/agents/regression-tester.md` :

```markdown
---
name: regression-tester
description: Teste les régressions sur l'ensemble des modules Lisaan. Utilise-le après chaque mission complétée ou avant de commencer une nouvelle étape.
tools: Read, Bash, Grep, Glob
model: sonnet
---

Tu es un testeur de régression spécialisé pour le projet Lisaan (app React Native d'apprentissage de l'arabe).

## Ta mission

Vérifier que les modifications récentes n'ont cassé aucun module existant (M1 → M10).

## Checks à exécuter systématiquement

### 1. Compilation TypeScript
```bash
npx tsc --noEmit 2>&1
```
ZÉRO erreur attendu. Si erreurs, liste chacune avec fichier:ligne.

### 2. Invariant offline-first
```bash
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/ src/engines/ --include="*.ts" --include="*.tsx" | grep -v content-sync | grep -v sync-manager | grep -v user-data-pull | grep -v guest-migration
```
ZÉRO résultat attendu.

### 3. Exercise registry complet
Lis `src/types/exercise.ts` pour extraire tous les ExerciseType.
Lis `src/components/exercises/index.ts` pour extraire tous les types enregistrés.
Compare les deux listes. Signale tout type manquant dans le registry.

### 4. Schemas cohérents
Compte les CREATE TABLE dans `src/db/schema-local.ts`.
Vérifie que `content-sync.ts` synce toutes les tables de contenu.

### 5. Imports effectiveUserId
```bash
grep -rn "\.userId[^(]" src/ app/ --include="*.ts" --include="*.tsx" | grep -v effectiveUserId | grep -v ".d.ts" | grep -v node_modules | grep -v useUserStore.ts | grep -v types/
```
Tout usage de `userId` en dehors de `useUserStore.ts` qui ne passe pas par `effectiveUserId()` est suspect.

### 6. Design tokens
```bash
grep -rn "color.*['\"]#" src/components/ app/ --include="*.tsx" | grep -v theme.ts | grep -v constants | grep -v node_modules | grep -v ".test."
```
Signale toute couleur hardcodée.

## Format du rapport

```
🧪 RAPPORT DE RÉGRESSION LISAAN
Date : [date]
Commit : [git log --oneline -1]

1. TypeScript      : ✅ 0 erreur | ❌ N erreurs
2. Offline-first   : ✅ Clean | ❌ N violations
3. Exercise types  : ✅ N/N enregistrés | ❌ N manquants
4. Schema sync     : ✅ Cohérent | ❌ Incohérent
5. effectiveUserId : ✅ Clean | ❌ N usages directs
6. Design tokens   : ✅ Clean | ❌ N hardcodées

VERDICT : ✅ PRÊT / ❌ CORRECTIONS NÉCESSAIRES
```
```

### 4b — Subagent `codebase-scout`

Crée `.claude/agents/codebase-scout.md` :

```markdown
---
name: codebase-scout
description: Explore le codebase Lisaan et produit un résumé structuré de l'état actuel. Utilise-le en début de session ou avant de commencer une nouvelle étape.
tools: Read, Bash, Grep, Glob
model: sonnet
---

Tu es un explorateur de codebase spécialisé pour le projet Lisaan.

## Ta mission

Scanner le repo et produire un résumé structuré de l'état actuel pour que la session principale puisse travailler efficacement.

## Actions

### 1. Structure du projet
```bash
find src/ app/ -name "*.ts" -o -name "*.tsx" | head -80
```

### 2. Modules et leçons
```bash
echo "=== MODULES ==="
grep -r "module_id\|id.*mod-" src/db/ --include="*.ts" | head -20
```

### 3. Types d'exercices
```bash
echo "=== EXERCISE TYPES ==="
grep "ExerciseType" src/types/exercise.ts
echo "=== REGISTRY ==="
grep "Registry\|registry\|\.set\|\.register" src/components/exercises/index.ts
```

### 4. Stores Zustand
```bash
echo "=== STORES ==="
ls src/stores/
for f in src/stores/*.ts; do echo "--- $f ---"; head -30 "$f"; done
```

### 5. Hooks existants
```bash
echo "=== HOOKS ==="
ls src/hooks/
```

### 6. Engines existants
```bash
echo "=== ENGINES ==="
ls src/engines/
```

### 7. Derniers changements
```bash
git log --oneline -10
git diff --stat HEAD~3
```

### 8. Dépendances clés
```bash
cat package.json | grep -E "expo-sqlite|reanimated|supabase|zustand|expo-av|posthog|confetti|sentry" | head -20
```

## Format de sortie

```
📍 ÉTAT DU CODEBASE LISAAN
Date : [date]
Branch : [git branch --show-current]
Dernier commit : [git log --oneline -1]

MODULES : M1(alphabet) M2(harakats) M3(mots) M4(sens) M5(grammaire) M6(verbes passé) M7(présent) M8(situations) M9(impératif) M10(futur)

EXERCISE TYPES : [liste]
STORES : [liste]
HOOKS : [liste]
ENGINES : [liste]

FICHIERS RÉCEMMENT MODIFIÉS :
[top 10]

PRÊT POUR : [prochaine étape identifiée]
```
```

### 4c — Subagent `arabic-content-validator`

Crée `.claude/agents/arabic-content-validator.md` :

```markdown
---
name: arabic-content-validator
description: Valide le contenu arabe (seed SQL, harakats, conjugaisons, translittérations). Utilise-le après chaque mission qui ajoute du contenu linguistique.
tools: Read, Bash, Grep, Glob
model: sonnet
---

Tu es un validateur de contenu arabe pour le projet Lisaan.

## Expertise

Tu connais :
- Les 28 lettres arabes et leurs 4 formes positionnelles
- Le système de harakats (fatha, kasra, damma, sukun, shadda, tanwin)
- La conjugaison arabe (passé/présent/impératif, formes I-X)
- Les patterns morphologiques (wazn)
- Les conventions de translittération

## Checks à exécuter

### 1. Cohérence harakats dans le seed
Pour chaque entrée dans les fichiers SQL de seed :
- `arabic_vocalized` doit contenir des harakats
- `arabic` (sans harakats) doit être le même texte sans diacritiques Unicode [\u064B-\u065F\u0670]
- La translittération doit correspondre aux harakats

### 2. Conjugaisons complètes
Pour chaque verbe dans `conjugation_entries` :
- Vérifier les 8 pronoms (ana, anta, anti, huwa, hiya, nahnu, antum, hum)
- Vérifier que les préfixes/suffixes du présent sont corrects :
  - أَ (ana), تَ (anta/anti/antum), يَ (huwa/hum), تَ (hiya), نَ (nahnu)
- Vérifier que les traductions françaises sont cohérentes

### 3. IDs uniques
```bash
grep -rn "INSERT INTO" docs/*.md _backup_migrations/*.sql 2>/dev/null | grep -oP "'[a-z]+-[^']+'" | sort | uniq -d
```
Aucun ID dupliqué ne doit exister.

### 4. Paires de confusion
Vérifier que les paires de confusion dans `lisaan-seed-letters.json` sont symétriques (si A confond avec B, B confond avec A).

## Format du rapport

```
🔤 VALIDATION CONTENU ARABE
Scope : [fichiers vérifiés]

1. Harakats          : ✅ OK | ❌ N incohérences
2. Conjugaisons      : ✅ Complètes | ❌ N manquantes
3. IDs uniques       : ✅ OK | ❌ N doublons
4. Paires confusion  : ✅ Symétriques | ❌ N asymétriques

DÉTAILS :
[liste des problèmes trouvés avec corrections suggérées]
```
```

**Checkpoint Mission 4 :**
- [ ] `.claude/agents/regression-tester.md` existe
- [ ] `.claude/agents/codebase-scout.md` existe
- [ ] `.claude/agents/arabic-content-validator.md` existe
- [ ] `ls .claude/agents/` affiche les 3 fichiers

---

## MISSION 5 — Validation finale

### 5a — Vérifier la structure complète

```bash
echo "=== CLAUDE.md ==="
head -3 CLAUDE.md

echo "=== COMMANDS ==="
ls .claude/commands/

echo "=== AGENTS ==="
ls .claude/agents/

echo "=== SETTINGS (hooks) ==="
cat .claude/settings.json | python3 -m json.tool | grep -A2 "hooks"
```

### 5b — Commit

```bash
git add CLAUDE.md .claude/
git commit -m "feat: add Claude Code toolkit (CLAUDE.md + 4 commands + 3 hooks + 3 subagents)

- CLAUDE.md: project memory with architecture rules, design system, patterns
- /checkpoint: validation battery for missions
- /architecture-guard: full invariant check
- /new-mission: structured mission start
- /regression: complete regression test
- PostToolUse hooks: auto tsc + offline-first guard
- PreToolUse hook: dangerous command blocker
- Subagents: regression-tester, codebase-scout, arabic-content-validator"
```

**Checkpoint final :**
- [ ] `CLAUDE.md` à la racine — ~200 lignes, tous les invariants du projet
- [ ] 4 slash commands dans `.claude/commands/`
- [ ] Hooks dans `.claude/settings.json` (3 PostToolUse + 1 PreToolUse)
- [ ] 3 subagents dans `.claude/agents/`
- [ ] Commit créé avec message descriptif
- [ ] `npx tsc --noEmit` → 0 erreur (le toolkit ne touche pas au code)

---

## UTILISATION POST-INSTALLATION

### Commandes disponibles

| Commande | Quand l'utiliser |
|----------|-----------------|
| `/checkpoint` | Après chaque mission pour valider |
| `/architecture-guard` | En cas de doute sur l'architecture |
| `/new-mission 3` | Pour démarrer la mission 3 d'une étape |
| `/regression` | Avant de commencer une nouvelle étape |

### Subagents disponibles

| Agent | Invocation | Quand |
|-------|-----------|-------|
| `regression-tester` | `@regression-tester` ou automatique | Après chaque mission complétée |
| `codebase-scout` | `@codebase-scout` | Début de session / nouvelle étape |
| `arabic-content-validator` | `@arabic-content-validator` | Après ajout de contenu arabe (seed SQL) |

### Hooks automatiques

| Événement | Action | Impact |
|-----------|--------|--------|
| Écriture .ts/.tsx | `npx tsc --noEmit` | Détection immédiate d'erreurs TS |
| Écriture dans hooks/ | Vérif import remote.ts | Bloque les violations offline-first |
| Écriture dans engines/ | Vérif import remote.ts (sauf sync files) | Idem |
| Commande Bash dangereuse | BLOQUÉE (exit 2) | Empêche `rm -rf src/`, `DROP TABLE`, etc. |
