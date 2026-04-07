# ÉTAPE 1 — Flux d'onboarding complet

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> L'étape 0 est terminée : Supabase tourne en local, migration appliquée (28 lettres, 8 diacritiques, 4 modules, 6 racines, 6 mots), polices arabes installées, app qui démarre.
> Cette étape implémente le flux d'onboarding (5 écrans de questions + 1 écran de recommandation).

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Architecture navigation** : Expo Router file-based. L'onboarding utilise un **groupe de routes dédié** `app/(onboarding)/` avec un Stack navigator interne. Cela permet des transitions fluides entre étapes et un back natif propre. L'écran `_layout.tsx` du groupe configure le Stack sans header (header masqué, l'onboarding a sa propre UI de progression).

---

## MISSION 1 — Types TypeScript de l'onboarding

**Action :**
Crée le fichier `src/types/onboarding.ts` avec tous les types nécessaires.

```typescript
// src/types/onboarding.ts

/** Variantes linguistiques supportées par Lisaan */
export type Variant = 'msa' | 'darija' | 'egyptian' | 'levantine' | 'khaliji' | 'quranic';

/** Motivations possibles (multi-choix) */
export type Motivation =
  | 'quran'
  | 'family'
  | 'travel'
  | 'media'
  | 'books'
  | 'business'
  | 'culture';

/** Niveaux de base en arabe */
export type ArabicLevel =
  | 'zero'           // Aucune — je pars de zéro
  | 'few_letters'    // Je connais quelques lettres
  | 'slow_reader'    // Je sais lire mais lentement
  | 'oral_only'      // Je comprends à l'oral mais je ne sais pas lire/écrire
  | 'intermediate';  // Je me débrouille mais je veux progresser

/** Objectifs prioritaires */
export type PrimaryGoal =
  | 'read_fluently'      // Lire l'arabe couramment
  | 'basic_conversation' // Avoir une conversation basique
  | 'understand_quran'   // Comprendre le Coran sans traduction
  | 'master_grammar';    // Maîtriser la grammaire et l'écriture

/** Dialectes de contact */
export type DialectContact =
  | 'none'       // Aucun en particulier
  | 'darija'     // Marocain
  | 'egyptian'   // Égyptien
  | 'levantine'  // Levantin (libanais, syrien, palestinien)
  | 'khaliji';   // Du Golfe

/** Temps quotidien disponible */
export type DailyTime = '5min' | '10min' | '15-20min' | '20min+';

/** Réponses complètes de l'onboarding */
export interface OnboardingAnswers {
  motivations: Motivation[];           // Q1 — multi-choix
  arabic_level: ArabicLevel;           // Q2 — choix unique
  primary_goal: PrimaryGoal;           // Q3 — choix unique
  dialect_contact: DialectContact;     // Q4 — choix unique
  daily_time: DailyTime;              // Q5 — choix unique
}

/** Score de pertinence par variante (0 à 1) */
export interface VariantScores {
  msa: number;
  darija: number;
  egyptian: number;
  levantine: number;
  khaliji: number;
  quranic: number;
}

/** Résultat de la recommandation */
export interface OnboardingRecommendation {
  scores: VariantScores;
  recommended: Variant;
  message_fr: string;                  // Message personnalisé expliquant la reco
  available: boolean;                  // true si la variante recommandée est dispo au MVP (= msa uniquement)
}

/** Étape courante dans le flux d'onboarding */
export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 'recommendation';
```

**Checkpoint :**
- [ ] `src/types/onboarding.ts` existe et compile sans erreur (`npx tsc --noEmit`)
- [ ] Tous les types correspondent exactement aux 5 questions du doc d'architecture (section 5.1)
- [ ] Aucun `any` dans le fichier

---

## MISSION 2 — Logique de scoring (onboarding-scorer.ts)

**Action :**
Crée le fichier `src/engines/onboarding-scorer.ts` avec la matrice de poids et la fonction de calcul.

La logique suit exactement la section 5.2 du doc d'architecture :

```typescript
// src/engines/onboarding-scorer.ts

import type {
  OnboardingAnswers,
  VariantScores,
  OnboardingRecommendation,
  Motivation,
  Variant,
} from '../types/onboarding';

/**
 * Matrice de poids par motivation.
 * 'dialect_preferred' est résolu dynamiquement selon la réponse Q4.
 */
const MOTIVATION_WEIGHTS: Record<Motivation, Partial<VariantScores> & { dialect_preferred?: number }> = {
  quran:    { msa: 0.6, quranic: 0.4 },
  family:   { msa: 0.3, dialect_preferred: 0.7 },
  travel:   { msa: 0.4, dialect_preferred: 0.6 },
  media:    { msa: 0.3, egyptian: 0.5, levantine: 0.2 },
  books:    { msa: 0.9, quranic: 0.1 },
  business: { msa: 0.7, khaliji: 0.3 },
  culture:  { msa: 0.8, quranic: 0.2 },
};

/** Messages personnalisés par variante recommandée */
const RECOMMENDATION_MESSAGES: Record<Variant, string> = {
  msa: "L'arabe standard moderne (MSA) est ta meilleure porte d'entrée. C'est la langue commune à tous les pays arabophones — presse, livres, discours officiels. Une fois le MSA acquis, passer à un dialecte sera beaucoup plus naturel.",
  darija: "Le darija marocain correspond à tes objectifs. Cependant, au MVP, nous commençons par le MSA — l'alphabet et les sons sont identiques. Tu n'apprendras ça qu'une seule fois, et le darija sera bientôt disponible.",
  egyptian: "L'arabe égyptien est le dialecte le plus compris dans le monde arabe grâce au cinéma et à la musique. On commence par le MSA pour l'alphabet — les sons et les lettres sont les mêmes. Le module égyptien arrive bientôt.",
  levantine: "Le levantin (libanais, syrien, palestinien) correspond à tes objectifs. On commence par le MSA pour les fondamentaux — l'alphabet est le même partout. Le module levantin arrive bientôt.",
  khaliji: "L'arabe du Golfe correspond à tes objectifs professionnels. On commence par le MSA — la base est commune. Le module khaliji arrive bientôt.",
  quranic: "L'arabe coranique est ton objectif principal. Le MSA partage 90% de sa grammaire et de son vocabulaire avec l'arabe classique. C'est le chemin le plus efficace. Le module tajwid et vocabulaire coranique arrive en phase 3.",
};

/** Variantes disponibles au MVP */
const AVAILABLE_VARIANTS: Set<Variant> = new Set(['msa']);

/**
 * Calcule les scores de pertinence par variante à partir des réponses d'onboarding.
 */
export function computeVariantScores(answers: OnboardingAnswers): VariantScores {
  const scores: VariantScores = {
    msa: 0, darija: 0, egyptian: 0,
    levantine: 0, khaliji: 0, quranic: 0,
  };

  // Résoudre le dialecte préféré (Q4)
  const dialectMap: Record<string, Variant> = {
    darija: 'darija',
    egyptian: 'egyptian',
    levantine: 'levantine',
    khaliji: 'khaliji',
  };
  const preferredDialect: Variant | null =
    answers.dialect_contact !== 'none'
      ? dialectMap[answers.dialect_contact] ?? null
      : null;

  // Accumuler les poids de chaque motivation sélectionnée
  for (const motivation of answers.motivations) {
    const weights = MOTIVATION_WEIGHTS[motivation];
    for (const [key, value] of Object.entries(weights)) {
      if (key === 'dialect_preferred') {
        // Distribuer vers le dialecte préféré, ou vers MSA si aucun
        const target = preferredDialect ?? 'msa';
        scores[target] += value as number;
      } else {
        scores[key as keyof VariantScores] += value as number;
      }
    }
  }

  // Bonus Q3 (objectif prioritaire)
  if (answers.primary_goal === 'understand_quran') {
    scores.quranic += 0.3;
    scores.msa += 0.1;
  } else if (answers.primary_goal === 'basic_conversation' && preferredDialect) {
    scores[preferredDialect] += 0.3;
  } else if (answers.primary_goal === 'read_fluently') {
    scores.msa += 0.2;
  } else if (answers.primary_goal === 'master_grammar') {
    scores.msa += 0.3;
  }

  // Bonus Q4 direct (dialecte de contact)
  if (preferredDialect) {
    scores[preferredDialect] += 0.2;
  }

  // Normaliser les scores (0 à 1)
  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
  if (total > 0) {
    for (const key of Object.keys(scores) as Array<keyof VariantScores>) {
      scores[key] = Math.round((scores[key] / total) * 100) / 100;
    }
  }

  return scores;
}

/**
 * Produit la recommandation finale à partir des scores.
 */
export function computeRecommendation(answers: OnboardingAnswers): OnboardingRecommendation {
  const scores = computeVariantScores(answers);

  // Trouver la variante avec le score le plus élevé
  let recommended: Variant = 'msa';
  let maxScore = 0;
  for (const [key, value] of Object.entries(scores) as Array<[Variant, number]>) {
    if (value > maxScore) {
      maxScore = value;
      recommended = key;
    }
  }

  return {
    scores,
    recommended,
    message_fr: RECOMMENDATION_MESSAGES[recommended],
    available: AVAILABLE_VARIANTS.has(recommended),
  };
}

/**
 * Convertit daily_time en minutes pour user.daily_goal_minutes.
 */
export function dailyTimeToMinutes(dt: OnboardingAnswers['daily_time']): number {
  const map: Record<typeof dt, number> = {
    '5min': 5,
    '10min': 10,
    '15-20min': 15,
    '20min+': 25,
  };
  return map[dt];
}
```

**Checkpoint :**
- [ ] `src/engines/onboarding-scorer.ts` compile sans erreur
- [ ] La fonction `computeRecommendation` retourne `msa` pour un profil `motivations: ['books'], dialect_contact: 'none'`
- [ ] La fonction retourne un score `darija` élevé pour `motivations: ['family'], dialect_contact: 'darija'`
- [ ] Tous les scores sont normalisés entre 0 et 1
- [ ] `dailyTimeToMinutes('10min')` retourne `10`

---

## MISSION 3 — Store Zustand pour l'onboarding

**Action :**
Crée le fichier `src/stores/useOnboardingStore.ts`.

Ce store gère :
- Les réponses en cours (partielles pendant le flux)
- L'étape courante
- La recommandation calculée
- Un flag `completed` persisté via AsyncStorage

```typescript
// src/stores/useOnboardingStore.ts

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  OnboardingAnswers,
  OnboardingRecommendation,
  OnboardingStep,
  Motivation,
  ArabicLevel,
  PrimaryGoal,
  DialectContact,
  DailyTime,
} from '../types/onboarding';
import { computeRecommendation, dailyTimeToMinutes } from '../engines/onboarding-scorer';

const ONBOARDING_COMPLETED_KEY = 'lisaan_onboarding_completed';

interface OnboardingState {
  // État du flux
  currentStep: OnboardingStep;
  isCompleted: boolean;
  isLoading: boolean;

  // Réponses partielles (remplies au fur et à mesure)
  motivations: Motivation[];
  arabicLevel: ArabicLevel | null;
  primaryGoal: PrimaryGoal | null;
  dialectContact: DialectContact | null;
  dailyTime: DailyTime | null;

  // Résultat
  recommendation: OnboardingRecommendation | null;

  // Actions
  setMotivations: (m: Motivation[]) => void;
  setArabicLevel: (l: ArabicLevel) => void;
  setPrimaryGoal: (g: PrimaryGoal) => void;
  setDialectContact: (d: DialectContact) => void;
  setDailyTime: (t: DailyTime) => void;
  goToStep: (step: OnboardingStep) => void;
  computeAndSetRecommendation: () => void;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 1,
  isCompleted: false,
  isLoading: true,
  motivations: [],
  arabicLevel: null,
  primaryGoal: null,
  dialectContact: null,
  dailyTime: null,
  recommendation: null,

  setMotivations: (m) => set({ motivations: m }),
  setArabicLevel: (l) => set({ arabicLevel: l }),
  setPrimaryGoal: (g) => set({ primaryGoal: g }),
  setDialectContact: (d) => set({ dialectContact: d }),
  setDailyTime: (t) => set({ dailyTime: t }),
  goToStep: (step) => set({ currentStep: step }),

  computeAndSetRecommendation: () => {
    const { motivations, arabicLevel, primaryGoal, dialectContact, dailyTime } = get();
    if (!arabicLevel || !primaryGoal || !dialectContact || !dailyTime) return;

    const answers: OnboardingAnswers = {
      motivations,
      arabic_level: arabicLevel,
      primary_goal: primaryGoal,
      dialect_contact: dialectContact,
      daily_time: dailyTime,
    };

    const recommendation = computeRecommendation(answers);
    set({ recommendation, currentStep: 'recommendation' });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    set({ isCompleted: true });
  },

  checkOnboardingStatus: async () => {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    const completed = value === 'true';
    set({ isCompleted: completed, isLoading: false });
    return completed;
  },

  reset: () => set({
    currentStep: 1,
    motivations: [],
    arabicLevel: null,
    primaryGoal: null,
    dialectContact: null,
    dailyTime: null,
    recommendation: null,
  }),
}));
```

**Avant de coder :** vérifie que `@react-native-async-storage/async-storage` est installé. Sinon :
```bash
npx expo install @react-native-async-storage/async-storage
```

**Checkpoint :**
- [ ] `src/stores/useOnboardingStore.ts` compile sans erreur
- [ ] Le package `@react-native-async-storage/async-storage` est dans les dépendances
- [ ] Le store expose `checkOnboardingStatus`, `completeOnboarding`, `computeAndSetRecommendation`

---

## MISSION 4 — Layout et écrans d'onboarding (navigation)

**Action :**
Crée le groupe de routes `app/(onboarding)/` avec la structure suivante :

```
app/(onboarding)/
├── _layout.tsx        # Stack navigator, header masqué
├── step1.tsx          # Q1 — Motivations (multi-choix)
├── step2.tsx          # Q2 — Niveau actuel (choix unique)
├── step3.tsx          # Q3 — Objectif prioritaire (choix unique)
├── step4.tsx          # Q4 — Dialecte de contact (choix unique)
├── step5.tsx          # Q5 — Temps quotidien (choix unique)
└── recommendation.tsx # Écran de résultat avec barres de pertinence
```

### 4.1 — Layout du groupe

```typescript
// app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    />
  );
}
```

### 4.2 — Composant partagé : OnboardingShell

Crée `src/components/onboarding/OnboardingShell.tsx` — un wrapper commun à tous les écrans d'onboarding. Il affiche :
- Une barre de progression (étape X/5)
- Le titre de la question
- Un sous-titre optionnel (ex : « Plusieurs réponses possibles »)
- Un bouton "Suivant" en bas (disabled tant que rien n'est sélectionné)
- Un bouton "Retour" discret en haut à gauche (sauf étape 1)

Ce composant utilise les couleurs du thème Lisaan :
- Fond : blanc cassé (`#FEFBF6`)
- Barre de progression : vert émeraude (`#2A9D8F`)
- Texte principal : noir profond (`#1A1A2E`)
- Bouton suivant : vert émeraude, texte blanc, border-radius 12, hauteur 52

### 4.3 — Composant partagé : OptionCard

Crée `src/components/onboarding/OptionCard.tsx` — une carte cliquable pour les options.
- Mode `single` : une seule sélection à la fois (radio-like)
- Mode `multi` : toggle on/off (checkbox-like)
- État visuel : non sélectionné (bordure grise) / sélectionné (bordure émeraude + fond émeraude léger)
- Icône optionnelle à gauche (emoji ou icône)

### 4.4 — Les 5 écrans de questions

Chaque écran :
1. Utilise `OnboardingShell` comme wrapper
2. Affiche les options via `OptionCard`
3. Met à jour le store Zustand via l'action correspondante
4. Navigue vers l'étape suivante au tap sur "Suivant" via `router.push('/(onboarding)/stepN')`

**Données des questions :**

**Step 1 — Motivations (multi-choix, min 1 sélection)**
- Titre : "Pourquoi veux-tu apprendre l'arabe ?"
- Sous-titre : "Plusieurs réponses possibles"
- Options :
  - 🕌 Comprendre le Coran → `quran`
  - 👨‍👩‍👧 Communiquer avec ma famille → `family`
  - ✈️ Voyager dans un pays arabophone → `travel`
  - 🎬 Regarder des films / séries → `media`
  - 📚 Lire des livres / de la presse → `books`
  - 💼 Travailler / faire des affaires → `business`
  - 🌍 Curiosité intellectuelle → `culture`

**Step 2 — Niveau (choix unique)**
- Titre : "As-tu déjà des bases en arabe ?"
- Options :
  - Aucune — je pars de zéro → `zero`
  - Je connais quelques lettres → `few_letters`
  - Je sais lire mais lentement → `slow_reader`
  - Je comprends à l'oral mais pas lire/écrire → `oral_only`
  - Je me débrouille mais je veux progresser → `intermediate`

**Step 3 — Objectif (choix unique)**
- Titre : "Si tu devais choisir UN objectif ?"
- Options :
  - 📖 Lire l'arabe couramment → `read_fluently`
  - 🗣️ Avoir une conversation basique → `basic_conversation`
  - 🕋 Comprendre le Coran sans traduction → `understand_quran`
  - ✍️ Maîtriser la grammaire et l'écriture → `master_grammar`

**Step 4 — Dialecte (choix unique)**
- Titre : "Avec quel dialecte es-tu le plus en contact ?"
- Options :
  - 🤷 Aucun en particulier → `none`
  - 🇲🇦 Marocain (darija) → `darija`
  - 🇪🇬 Égyptien → `egyptian`
  - 🇱🇧 Levantin (libanais, syrien, palestinien) → `levantine`
  - 🇸🇦 Du Golfe (khaliji) → `khaliji`

**Step 5 — Temps quotidien (choix unique)**
- Titre : "Combien de temps par jour peux-tu consacrer ?"
- Options :
  - ⚡ 5 minutes → `5min`
  - ⏱️ 10 minutes → `10min`
  - 🕐 15–20 minutes → `15-20min`
  - 🔥 Plus de 20 minutes → `20min+`
- Au tap sur "Suivant", appeler `computeAndSetRecommendation()` puis `router.push('/(onboarding)/recommendation')`

**Checkpoint :**
- [ ] `app/(onboarding)/_layout.tsx` existe et utilise `<Stack>`
- [ ] Les 5 fichiers `step1.tsx` à `step5.tsx` existent
- [ ] `src/components/onboarding/OnboardingShell.tsx` existe
- [ ] `src/components/onboarding/OptionCard.tsx` existe
- [ ] La navigation entre les 5 étapes fonctionne (push/back)
- [ ] Le store est mis à jour à chaque étape (vérifier via console.log temporaire)

---

## MISSION 5 — Écran de recommandation

**Action :**
Crée `app/(onboarding)/recommendation.tsx`.

Cet écran affiche les résultats du scoring. Il doit suivre fidèlement la spec de la section 5.3 du doc d'architecture.

### Structure de l'écran :

1. **Titre :** "Ton parcours idéal" (ou "Voici notre recommandation")

2. **Barres de pertinence :**
   - Afficher les variantes dont le score est > 0, triées par score décroissant
   - Chaque barre = nom de la variante (en français) + barre horizontale animée + pourcentage
   - La variante recommandée est mise en surbrillance (fond émeraude léger, badge "Recommandé")
   - Noms à afficher :
     - `msa` → "Arabe standard (MSA)"
     - `darija` → "Marocain (Darija)"
     - `egyptian` → "Égyptien"
     - `levantine` → "Levantin"
     - `khaliji` → "Golfe (Khaliji)"
     - `quranic` → "Arabe coranique"

3. **Message personnalisé :**
   - Le texte de `recommendation.message_fr` affiché dans un encadré doux (fond sable, bordure arrondie)

4. **Message de réassurance :**
   - Toujours affiché : *« L'alphabet et les sons sont les mêmes pour toutes les variantes. Tu n'apprendras ça qu'une seule fois. »*
   - Style : texte plus petit, couleur grise, italique

5. **Si la variante recommandée n'est PAS disponible (`available === false`) :**
   - Afficher un badge "Bientôt disponible" sur la variante
   - Modifier le CTA principal en : "Commencer par le MSA" (avec sous-texte : "Le module [variante] sera ajouté prochainement")

6. **Boutons d'action :**
   - CTA principal : "Commencer avec [variante recommandée]" (ou "Commencer par le MSA" si pas dispo)
     - Plein, vert émeraude, texte blanc
   - CTA secondaire : "Choisir une autre variante" → Ouvre une modale ou un bottom sheet avec la liste complète
     - Texte seul, couleur émeraude, sous le CTA principal

### Au tap sur le CTA principal :

1. Appeler `completeOnboarding()` sur le store
2. Synchroniser vers Supabase (voir Mission 6)
3. Naviguer vers `/(tabs)/learn` avec `router.replace('/(tabs)/learn')`

**Checkpoint :**
- [ ] `app/(onboarding)/recommendation.tsx` existe et s'affiche après step5
- [ ] Les barres de pertinence affichent les bons pourcentages
- [ ] Le message personnalisé correspond à la variante recommandée
- [ ] Le message de réassurance est toujours visible
- [ ] Si la variante recommandée n'est pas MSA, le badge "Bientôt disponible" apparaît
- [ ] Le CTA navigue vers les tabs

---

## MISSION 6 — Sync Supabase des réponses d'onboarding

**Action :**
Crée la fonction de sync dans `src/engines/onboarding-sync.ts`.

Cette fonction :
1. Construit l'objet `OnboardingAnswers` complet à partir du store
2. Fait un `upsert` dans la table `users` avec :
   - `onboarding_answers` : le JSON des réponses
   - `recommended_variant` : la variante recommandée
   - `active_variant` : la variante choisie par l'utilisateur (MSA au MVP)
   - `daily_goal_minutes` : converti via `dailyTimeToMinutes()`
3. Gère les erreurs réseau gracieusement (l'onboarding ne doit JAMAIS bloquer l'utilisateur même si le réseau est down — le flag local `isCompleted` fait foi, la sync se fera au prochain lancement)

```typescript
// src/engines/onboarding-sync.ts

import { supabase } from '../db/remote';
import type { OnboardingAnswers, Variant } from '../types/onboarding';
import { dailyTimeToMinutes } from './onboarding-scorer';

interface SyncParams {
  answers: OnboardingAnswers;
  recommendedVariant: Variant;
  chosenVariant: Variant;  // Ce que l'utilisateur a réellement choisi (peut différer de la reco)
}

export async function syncOnboardingToSupabase(params: SyncParams): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[onboarding-sync] No authenticated user, skipping sync');
      return false;
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        onboarding_answers: params.answers as unknown as Record<string, unknown>,
        recommended_variant: params.recommendedVariant,
        active_variant: params.chosenVariant,
        daily_goal_minutes: dailyTimeToMinutes(params.answers.daily_time),
      }, { onConflict: 'id' });

    if (error) {
      console.error('[onboarding-sync] Supabase error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[onboarding-sync] Network error:', err);
    return false;
  }
}
```

**Intégration :** Appeler `syncOnboardingToSupabase` dans le handler du CTA de l'écran de recommandation, en mode fire-and-forget (ne pas bloquer la navigation sur le résultat).

**Checkpoint :**
- [ ] `src/engines/onboarding-sync.ts` compile sans erreur
- [ ] La fonction utilise le client Supabase existant dans `src/db/remote.ts`
- [ ] L'échec de sync ne bloque pas l'utilisateur (fire-and-forget)
- [ ] Les champs `onboarding_answers`, `recommended_variant`, `active_variant`, `daily_goal_minutes` sont envoyés

---

## MISSION 7 — Routing conditionnel (onboarding déjà fait ?)

**Action :**
Modifie `app/_layout.tsx` (le layout racine) pour vérifier au démarrage si l'onboarding est déjà complété.

**Logique :**
1. Au montage de l'app, appeler `checkOnboardingStatus()` du store
2. Pendant le chargement : afficher le splash screen (ou un écran blanc avec le logo Lisaan)
3. Si `isCompleted === false` : rediriger vers `/(onboarding)/step1`
4. Si `isCompleted === true` : laisser les `(tabs)` s'afficher normalement

**Implémentation suggérée :**
Utiliser `useEffect` + `router.replace` dans le layout racine, ou utiliser le pattern `initialRouteName` conditionnel d'Expo Router.

Le pattern recommandé avec Expo Router :
```typescript
// Dans app/_layout.tsx, après le chargement des polices et du status onboarding :
const { isCompleted, isLoading, checkOnboardingStatus } = useOnboardingStore();

useEffect(() => {
  checkOnboardingStatus();
}, []);

useEffect(() => {
  if (isLoading) return;
  if (!isCompleted) {
    router.replace('/(onboarding)/step1');
  }
}, [isLoading, isCompleted]);
```

**Important :** Ne pas casser le chargement des polices qui existe déjà dans `_layout.tsx`. Le check d'onboarding doit coexister avec `useFonts`.

**Checkpoint :**
- [ ] Au premier lancement (AsyncStorage vide), l'app ouvre sur `step1`
- [ ] Après avoir complété l'onboarding, un relancement ouvre directement sur les tabs
- [ ] Le splash screen reste visible pendant le chargement (polices + status)
- [ ] Aucune régression : les polices se chargent toujours correctement

---

## MISSION 8 — Vérification end-to-end

**Action :**
Lance l'app et parcours le flux complet :

```bash
npx expo start
```

Scénario de test complet :

1. **Premier lancement :**
   - L'app s'ouvre sur l'écran de motivation (step1)
   - Sélectionner "Comprendre le Coran" + "Lire des livres"
   - Tap "Suivant" → step2
   - Sélectionner "Aucune — je pars de zéro"
   - Tap "Suivant" → step3
   - Sélectionner "Comprendre le Coran sans traduction"
   - Tap "Suivant" → step4
   - Sélectionner "Aucun en particulier"
   - Tap "Suivant" → step5
   - Sélectionner "10 minutes"
   - Tap "Suivant" → écran de recommandation
   - Vérifier : MSA devrait être recommandé (~60-70%), coranique (~30-40%)
   - Tap "Commencer" → arrive sur les tabs (onglet Apprendre)

2. **Relancement :**
   - Fermer et rouvrir l'app
   - Vérifier qu'on arrive directement sur les tabs (pas d'onboarding)

3. **Test avec dialecte :**
   - Reset l'onboarding (via dev tools ou en vidant AsyncStorage)
   - Sélectionner "Communiquer avec ma famille" + dialecte "Marocain"
   - Vérifier que darija a un score élevé
   - Vérifier que le badge "Bientôt disponible" apparaît
   - Vérifier que le CTA dit "Commencer par le MSA"

4. **Test navigation retour :**
   - Vérifier que le bouton retour fonctionne à chaque étape
   - Vérifier que les sélections précédentes sont conservées (le store les garde)

**Checkpoint final de l'étape :**
- [ ] Le flux complet fonctionne (5 écrans + recommandation)
- [ ] Les barres de pertinence affichent des pourcentages cohérents
- [ ] Le routing conditionnel fonctionne (onboarding skip si déjà fait)
- [ ] Le bouton retour conserve les sélections
- [ ] La sync Supabase est tentée (vérifier dans Supabase Studio si un user existe)
- [ ] Aucun crash, aucun warning critique
- [ ] Les polices arabes sont toujours chargées correctement

---

## RÉSUMÉ DE L'ÉTAPE 1

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Types TypeScript (`src/types/onboarding.ts`) | ✅ |
| 2 | Logique de scoring (`src/engines/onboarding-scorer.ts`) | ✅ |
| 3 | Store Zustand (`src/stores/useOnboardingStore.ts`) | ✅ |
| 4 | Layout + 5 écrans de questions + composants partagés | ✅ |
| 5 | Écran de recommandation avec barres de pertinence | ✅ |
| 6 | Sync Supabase des réponses | ✅ |
| 7 | Routing conditionnel (skip onboarding si déjà fait) | ✅ |
| 8 | Vérification end-to-end | ✅ |

> **Prochaine étape après validation :** Étape 2 — Module 1 : L'alphabet vivant (affichage des lettres, composant ArabicText, LetterCard, premier exercice MCQ)
