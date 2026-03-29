# PATCH É14–É16 — Correctifs de compatibilité

> **But :** Ce document accompagne les fichiers `ETAPE-14-present-situations.md`, `ETAPE-15-imperatif-futur-minijeux.md` et `ETAPE-16-audio-srs-etendu.md`. Claude Code doit le lire AVANT d'exécuter chacune de ces étapes et appliquer les corrections décrites ci-dessous en plus des instructions du fichier d'étape.
>
> **Pourquoi :** Ces trois étapes ont été rédigées avant l'insertion de É10.7 (sections), É12/É12B/É12D (reskin, navigation, célébrations), É13 (auth/guest mode) et le Design System Lisaan. Elles sont correctes sur le fond (seed SQL, logique métier, types d'exercices) mais leurs composants UI et certains patterns d'accès aux données doivent être mis à jour.

---

## 1. DESIGN SYSTEM — S'applique aux 3 fichiers

### Règle générale

**Chaque composant UI créé dans É14, É15 ou É16 doit :**

1. Importer et utiliser `useTheme()` depuis `src/contexts/ThemeProvider` (ou le chemin réel du projet)
2. Utiliser les tokens du thème pour TOUTES les couleurs, espacements, radius et ombres — zéro couleur hex en dur
3. Utiliser la police **Jost** (Regular/Medium/SemiBold) pour tout le texte UI français
4. Utiliser la police **Amiri** pour tout le texte arabe pédagogique
5. Respecter l'échelle typographique du DS : `h1=24, h2=20, body=16, small=14, tiny=12` pour l'UI ; `arabicHero=48, arabicDisplay=64, arabicTitle=36, arabicBody=28, arabicSmall=22` pour l'arabe
6. Utiliser `getShadows()` pour les ombres (jamais d'ombre noire standard)
7. Appliquer `borderRadius` du DS : `sm=8, md=16, lg=24, xl=32, pill=9999`

### Composants concernés par fichier

**ETAPE-14 (présent + situations) :**
- Aucun nouveau composant UI dans ce fichier (seed SQL + generators uniquement)
- Si un nouvel écran est créé pour les dialogues situés (marché, famille, voyage) → utiliser le pattern distraction-free du DS (fond `background.main`, croix fermeture, barre progression fine)

**ETAPE-15 (impératif + futur + mini-jeux) :**
- `SpeedRoundExercise` → fond `background.main`, options en Card exercice DS (fond `background.card`, radius md=16, bordures par état), timer affiché en `brand.primary` avec Jost-SemiBold, bouton Valider = Button primary pill
- `MemoryMatchExercise` → grille de cartes fond `background.card`, radius md=16, ombre `subtle`. Carte retournée : fond `brand.light`, bordure 2px `brand.primary`. Match correct : `status.successLight` + bordure `status.success`. Match incorrect : `status.errorLight` + bordure `status.error` + shake
- `DailyChallengeScreen` → fond `background.main`, card du défi fond `background.card` radius lg=24 ombre `medium`, titre Jost-SemiBold h1, badge XP en `accent.gold`, bouton "Jouer" = Button primary pill

**ETAPE-16 (audio + SRS étendu) :**
- `AudioButton` → deux variantes : `icon` (cercle 40x40, fond `background.group`, icône speaker `brand.primary`) et `pill` (height 36, radius pill, fond `brand.light`, texte Jost-Medium small 14px `brand.primary`, icône speaker). États : playing = fond `brand.primary` + icône `text.inverse`
- `ConjugationCard` (Réviser) → fond `background.card`, radius md=16, padding 24. Recto : texte arabe `arabicDisplay`, AudioButton. Verso : traduction Jost-Regular body, boutons SM-2 en row (Button ghost pour "Raté", Button secondary pour "Difficile", Button primary pour "Bien/Parfait")
- `GrammarCard` (Réviser) → même pattern que ConjugationCard mais verso = titre règle Jost-SemiBold h2 + explication Jost-Regular body
- Filtres Réviser → chips horizontaux scrollables, hauteur 36, radius pill. Chip actif : fond `brand.primary` texte `text.inverse`. Chip inactif : fond `background.group` texte `text.secondary`. Badge count à droite du texte dans un mini-cercle `accent.gold`
- Section SRS dans Profile → fond `background.card`, radius lg=24, 4 mini-cards en grid 2x2 (ou row scrollable). Chaque mini-card : fond `background.group`, radius md=16, padding 16. Anneau SVG `brand.primary` (track `background.group`), valeur Jost-SemiBold h2 au centre, label Jost-Regular tiny en dessous

---

## 2. AUTH / GUEST MODE — S'applique aux 3 fichiers

### Règle générale

Depuis É13, l'app supporte deux modes : **Guest** (pas de compte, pas de sync PUSH) et **Auth** (compte Supabase, sync actif).

**Partout où du code utilise `userId` pour les opérations de données :**
```typescript
// ❌ INTERDIT :
const userId = useUserStore(s => s.userId);

// ✅ CORRECT :
const userId = useUserStore(s => s.effectiveUserId());
// ou dans un contexte non-hook :
const userId = useUserStore.getState().effectiveUserId();
```

### Corrections spécifiques

**ETAPE-14 (présent + situations) :**
- Mission 1 seed SQL : aucun changement (les seeds Cloud ne dépendent pas du userId)
- Si un generator utilise `userId` pour charger les mots/conjugaisons → remplacer par `effectiveUserId()`

**ETAPE-15 (impératif + futur + mini-jeux) :**
- `DailyChallengeScreen` : le `daily_challenge_progress` doit utiliser `effectiveUserId()`
- Checkpoint 6 (`useDailyChallenge` hook) : le `user_id` dans `daily_challenge_progress` = `effectiveUserId()`
- Les analytics PostHog doivent vérifier le consentement analytics AVANT d'envoyer :
  ```typescript
  const { analyticsEnabled } = useSettingsStore();
  if (analyticsEnabled) {
    posthog.capture('event_name', { ... });
  }
  ```

**ETAPE-16 (audio + SRS étendu) :**
- `seedConjugationSRSCards()` et `seedGrammarSRSCards()` : le `user_id` inséré dans `srs_cards` doit être `effectiveUserId()`
- Le hook `useReviserCards` doit filtrer par `effectiveUserId()`
- Les 3 events PostHog (M7) doivent vérifier le consentement analytics
- Le badge "Maître des verbes" (M8) doit utiliser `effectiveUserId()` pour le query et le stockage

---

## 3. FLOW DE LEÇON EN SECTIONS (É10.7) — S'applique à É14 et É15

### Contexte

Depuis É10.7, les generators retournent `LessonSection[]` au lieu d'un tableau plat `ExerciseConfig[]`. Chaque section contient :
```typescript
interface LessonSection {
  id: string;
  title_fr: string;
  index: number;
  teachingItemIds: string[];
  exercises: ExerciseConfig[];
}
```

### Corrections

**ETAPE-14 (présent + situations) :**
- Le generator de conjugaison présent (s'il étend celui de É11 `conjugation-exercise-generator.ts`) doit retourner `LessonSection[]`
- Regrouper les exercices de chaque leçon en sections : par exemple leçon 701 (3 verbes) → 1 section par verbe (teaching = conjugaison du verbe, exercices = MCQ + fill_blank sur ce verbe)
- Les dialogues situés (M8 : marché, famille, voyage) forment chacun une section complète

**ETAPE-15 (impératif + futur + mini-jeux) :**
- Les exercices impératif (M9) doivent être sectionnés (ex : section 1 = impératif masculin, section 2 = impératif féminin, section 3 = impératif pluriel)
- Les exercices futur proche (M10) : section 1 = سَوْفَ + مضارع, section 2 = سَـ + مضارع, section 3 = négation لَنْ
- `SpeedRoundExercise` et `MemoryMatchExercise` sont des types d'exercice dans le registre — ils apparaissent DANS des sections, pas à la place des sections

---

## 4. NAVIGATION (É12B) — S'applique aux 3 fichiers

### Contexte

Depuis É12B, la navigation Learn utilise un pattern drill-down :
- `app/(tabs)/learn.tsx` → liste des modules (cards cliquables)
- `app/module/[id].tsx` → détail d'un module (liste des leçons avec stagger animation)
- `app/lesson/[id].tsx` → leçon (SectionPlayer)

### Corrections

**ETAPE-15 (impératif + futur + mini-jeux) :**
- Le `DailyChallengeScreen` doit être un écran séparé accessible :
  - Depuis la tab bar (si un onglet dédié est ajouté) OU
  - Depuis une card hero sur l'écran Learn (recommandé : card "Défi du jour" en haut du Learn, sous la card "Reprendre")
  - Route proposée : `app/daily-challenge.tsx` (modal ou stack screen)
- Les deep-links mentionnés dans l'étape (/learn, /review) doivent correspondre aux routes réelles : `/(tabs)/learn`, `/(tabs)/review`

**ETAPE-16 (audio + SRS étendu) :**
- Les filtres dans le Réviser tab → intégrés dans `app/(tabs)/review.tsx` existant
- La section SRS dans le Profile → intégrée dans `app/(tabs)/profile.tsx` existant

---

## 5. SYSTÈME DE CÉLÉBRATIONS (É12D) — S'applique à É15 et É16

### Contexte

É12D a déjà créé :
- L'écran "Leçon Terminée" avec médaillon doré (pas de confettis/cliparts)
- L'écran "Module Complété" avec pattern Zellige subtil
- Le `MatchExercise` redesigné avec grille 2 colonnes premium
- L'empty state "Rien à réviser" avec motif géométrique
- L'écran de décision post-leçon (Relire / S'exercer)
- Le XPFloatingLabel (+X XP en fade-up)

### Corrections

**ETAPE-15 (impératif + futur + mini-jeux) :**
- Quand le défi quotidien est complété → réutiliser le pattern "Leçon Terminée" de É12D (médaillon doré, card score, card stats XP/streak) — ne PAS créer un nouvel écran de célébration
- Si un badge est gagné via le défi → utiliser le pattern badge celebration existant de É12D (modal overlay sombre, card centrale fond `background.card`, accents or)

**ETAPE-16 (audio + SRS étendu) :**
- Le badge "Maître des verbes" (M8) → quand débloqué, utiliser `BadgeCelebration` existant (modal de É12D). NE PAS recréer un composant de célébration de badge.
- Le badge s'affiche dans la grille des trophées du profil (pattern É12D : 80x80, fond `background.card`, ombre subtle, accents `accent.gold`)

---

## 6. DÉCALAGE DE NUMÉROTATION — Clarification

Les fichiers utilisent une numérotation interne différente de leur nom de fichier :

| Fichier | Titre interne | À lire comme |
|---------|--------------|--------------|
| `ETAPE-14-present-situations.md` | "É12" | Étape après É11 (Phase 2 grammaire) |
| `ETAPE-15-imperatif-futur-minijeux.md` | "É13" | Étape après la précédente |
| `ETAPE-16-audio-srs-etendu.md` | "É14" | Étape après la précédente |

**Claude Code doit ignorer la numérotation interne** et suivre l'ordre des fichiers (14 → 15 → 16). Les prérequis "É0→11 terminées" / "É0→12 terminées" / "É0→13 terminées" dans les en-têtes sont **corrects** en termes de contenu (ils font référence à la chaîne logique), même si les numéros de fichier sont différents.

---

## 7. CHECKLIST CLAUDE CODE — Avant chaque mission créant un composant UI

Avant de coder, vérifier mentalement :

- [ ] `useTheme()` importé et utilisé
- [ ] Police Jost pour le texte français, Amiri pour l'arabe
- [ ] Couleurs = tokens du thème (zéro hex en dur)
- [ ] `effectiveUserId()` au lieu de `userId` brut
- [ ] Generator retourne `LessonSection[]` si applicable
- [ ] Events PostHog conditionnés à `analyticsEnabled`
- [ ] Ombres via `getShadows()` (pas de shadow noire standard)
- [ ] Célébrations réutilisent les patterns É12D existants
- [ ] Routes utilisent les chemins réels (`/(tabs)/learn`, `/(tabs)/review`, `app/module/[id]`)
- [ ] `npx tsc --noEmit` → 0 erreur après chaque mission

---

*Document produit par Claude Opus — Mars 2026. À placer dans /docs aux côtés du fichier d'étape en cours.*
