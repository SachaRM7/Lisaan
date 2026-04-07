# ÉTAPE 16 — Audio natif & SRS étendu aux conjugaisons

> Étapes terminées : 0 → 15.
> Cette étape : dimension sonore (TTS `expo-speech`) sur toute l'app + extension SRS aux conjugaisons et règles de grammaire.
> Règle : missions séquentielles, checkpoints obligatoires.

> **Philosophie de cette étape** :
> - L'audio n'est pas un gadget : entendre un mot arabe juste après l'avoir lu active une deuxième voie mémorielle. Pour une langue à alphabet non-latin, la correspondance graphème-phonème doit être **entendue**, pas seulement lue.
> - On utilise `expo-speech` (TTS device, locale `ar-SA`) comme provider initial : offline, zéro dépendance, couverture 100% du contenu existant. Le hook `useAudio` abstrait le provider — Phase 3 pourra injecter des fichiers audio professionnels sans toucher aux composants.
> - Le SRS de Lisaan couvrait jusqu'ici les lettres et les mots. C'est insuffisant : un apprenant peut reconnaître اُكْتُبْ visuellement sans savoir le produire. Les cartes de conjugaison et de grammaire ferment cette lacune.
> - Le Réviser tab devient le **centre de révision universel** : lettres, mots, conjugaisons, règles — filtrables, audibles, et toujours offline-first.

---

## Périmètre de É16

| Domaine | Contenu | Nouvelles tables/composants |
|---------|---------|----------------------------|
| Audio | Hook `useAudio`, composant `AudioButton`, intégration M1–M10 | — (aucune table) |
| SRS étendu | `card_type` élargi, cartes conjugaison + grammaire | `grammar_rules` (Supabase + SQLite) |
| Réviser | Filtres par catégorie, cartes conjugaison audibles | — |
| Profile | Stats SRS ventilées par type | — |

**Ce qui est OUT de É16 :**
- Fichiers audio pré-enregistrés (Phase 3 — remplacement du TTS par des assets pro)
- Reconnaissance vocale / exercices de prononciation (Phase 3)
- SRS pour le vocabulaire dialectal (Phase 3)
- Tajwid audio (Phase 3)
- Notifications push de révision (É17)

---

## MISSION 0 — Scan initial

Lance `@codebase-scout` puis confirme l'état du repo avant de commencer. Vérifie en particulier : le `exerciseRegistry` actuel (doit contenir `mcq`, `match`, `reorder`, `dialogue`, `listen_select`, `flashcard`, `write`, `fill_blank`, `speed_round`, `memory_match`), la table `srs_cards` (item_types actuels : `letter`, `diacritic`, `word`, `sentence`), la table `grammar_rules` (créée en É11, étendue ici), et le Réviser tab existant (moteur polymorphique É13E).

---

## MISSION 1 — Infrastructure audio : `useAudio` hook + `AudioButton` component

### 1a — Installation des dépendances

```bash
npx expo install expo-speech expo-haptics
```

> `expo-av` est déjà dans le projet (É12 ou antérieur). S'il est absent, l'installer également.

### 1b — Hook `useAudio`

Créer `src/hooks/useAudio.ts` :

```typescript
/**
 * useAudio — abstraction du provider audio pour Lisaan.
 *
 * Provider actuel : expo-speech (TTS device, offline).
 * Provider Phase 3 : fichiers .mp3 pré-enregistrés via expo-av.
 *
 * Usage :
 *   const { speak, stop, isPlaying } = useAudio();
 *   speak('مَرْحَبًا');
 */

import { useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';

export type AudioProvider = 'tts' | 'file';

interface UseAudioOptions {
  provider?: AudioProvider;
  language?: string;  // défaut : 'ar-SA'
  pitch?: number;     // défaut : 1.0
  rate?: number;      // défaut : 0.75 (légèrement ralenti pour l'apprentissage)
}

interface UseAudioReturn {
  speak: (text: string, options?: UseAudioOptions) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  error: string | null;
}

const DEFAULT_OPTIONS: Required<UseAudioOptions> = {
  provider: 'tts',
  language: 'ar-SA',
  pitch: 1.0,
  rate: 0.75,
};

export function useAudio(defaults: UseAudioOptions = {}): UseAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opts = { ...DEFAULT_OPTIONS, ...defaults };

  const speak = useCallback(async (text: string, overrides: UseAudioOptions = {}) => {
    const finalOpts = { ...opts, ...overrides };
    setError(null);

    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) Speech.stop();

      setIsPlaying(true);
      await new Promise<void>((resolve, reject) => {
        Speech.speak(text, {
          language: finalOpts.language,
          pitch: finalOpts.pitch,
          rate: finalOpts.rate,
          onDone: () => { setIsPlaying(false); resolve(); },
          onError: (err) => { setIsPlaying(false); reject(err); },
          onStopped: () => { setIsPlaying(false); resolve(); },
        });
      });
    } catch (err) {
      setIsPlaying(false);
      setError('Audio non disponible sur cet appareil');
    }
  }, [opts]);

  const stop = useCallback(() => {
    Speech.stop();
    setIsPlaying(false);
  }, []);

  return { speak, stop, isPlaying, error };
}
```

### 1c — Composant `AudioButton`

Créer `src/components/AudioButton.tsx` :

```typescript
/**
 * AudioButton — bouton universel de lecture audio pour Lisaan.
 *
 * Props :
 *   text       : texte arabe à lire
 *   size       : 'sm' | 'md' | 'lg' (défaut 'md')
 *   variant    : 'icon' | 'pill' (défaut 'icon')
 *   rate       : vitesse de lecture (défaut 0.75)
 *   onPlayEnd  : callback optionnel après lecture
 *
 * Comportement :
 *   - Tap → lecture audio + haptic light
 *   - Pendant lecture → icône animée (pulsation), tap arrête
 *   - Erreur → icône muted, tooltip discret
 *   - RTL natif (le bouton s'aligne correctement dans les layouts arabe)
 */

import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../hooks/useAudio';
import { useTheme } from '../hooks/useTheme'; // hook existant pour design tokens

interface AudioButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'pill';
  rate?: number;
  onPlayEnd?: () => void;
  style?: object;
}

const ICON_SIZES = { sm: 16, md: 22, lg: 28 };
const TOUCH_SIZES = { sm: 32, md: 44, lg: 56 };

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  size = 'md',
  variant = 'icon',
  rate = 0.75,
  onPlayEnd,
  style,
}) => {
  const { speak, stop, isPlaying, error } = useAudio({ rate });
  const { colors } = useTheme();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      stop();
    } else {
      await speak(text);
      onPlayEnd?.();
    }
  }, [isPlaying, speak, stop, text, onPlayEnd]);

  const iconSize = ICON_SIZES[size];
  const touchSize = TOUCH_SIZES[size];
  const icon = error ? '🔇' : isPlaying ? '⏹' : '🔊';

  if (variant === 'pill') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={isPlaying ? 'Arrêter la lecture' : 'Écouter la prononciation'}
        accessibilityRole="button"
        style={[styles.pill, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '44' }, style]}
      >
        <Text style={{ fontSize: iconSize }}>{icon}</Text>
        <Text style={[styles.pillText, { color: colors.primary, fontSize: iconSize - 4 }]}>
          {isPlaying ? 'Arrêter' : 'Écouter'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={isPlaying ? 'Arrêter la lecture' : 'Écouter la prononciation'}
        accessibilityRole="button"
        style={[
          styles.iconBtn,
          { width: touchSize, height: touchSize, borderRadius: touchSize / 2 },
          isPlaying && { backgroundColor: colors.primary + '22' },
          style,
        ]}
      >
        <Text style={{ fontSize: iconSize }}>{icon}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  pillText: { fontWeight: '600' },
});
```

### 1d — Export dans index des composants

Dans `src/components/index.ts`, ajouter :
```typescript
export { AudioButton } from './AudioButton';
```

### Checkpoint M1
- [ ] `expo-speech` installé sans erreur
- [ ] `useAudio` : `speak('مَرْحَبًا')` → audio arabe joué sur simulateur/device
- [ ] `AudioButton` variant='icon' et variant='pill' rendus visibles
- [ ] `isPlaying` toggle correct : tap pendant lecture → arrêt
- [ ] Haptic feedback au tap
- [ ] `/checkpoint` → tout vert

---

## MISSION 2 — Intégration audio dans Module 1 (lettres) et Module 2 (harakats)

### 2a — `LetterCard` : AudioButton sur la lettre isolée

Dans `src/components/LetterCard.tsx`, ajouter un `AudioButton` size='lg' en overlay ou sous la lettre.

La lettre à prononcer = `letter.isolated` (forme isolée, ex : `بَ`).

Si la lettre a des harakats actifs, prononcer avec harakats. Si harakats désactivés, prononcer la consonne seule.

```typescript
// Dans LetterCard — ajouter dans le JSX, après le texte arabe principal :
import { AudioButton } from './AudioButton';

// Dans le return :
<AudioButton
  text={showHarakats ? letter.isolated : letter.isolated_no_vowel}
  size="lg"
  rate={0.6}  // très lent pour les lettres
  style={{ position: 'absolute', top: 8, right: 8 }}
/>
```

> **Note** : Si `letter.isolated_no_vowel` n'existe pas dans le type `Letter`, utiliser `letter.isolated` pour les deux cas — le TTS arabe gère déjà les consonnes sans harakats.

### 2b — `HarakatToggle` : AudioButton sur chaque harakat

Dans l'écran ou composant affichant les harakats (M2), ajouter un `AudioButton` size='sm' à côté de chaque ligne harakat.

La valeur à prononcer = syllabe exemple du harakat (ex : `بَ` pour fatha, `بُ` pour damma, `بِ` pour kasra).

```typescript
// Exemple dans la liste des harakats :
{harakats.map(h => (
  <View key={h.id} style={styles.harakatRow}>
    <ArabicText text={h.example} size="xl" />
    <AudioButton text={h.example} size="sm" rate={0.65} />
    <Text style={styles.harakatName}>{h.name_fr}</Text>
  </View>
))}
```

### 2c — MCQ : AudioButton sur les options arabes

Dans `src/components/exercises/MCQExercise.tsx` (ou équivalent), ajouter un `AudioButton` size='sm' à côté de chaque option qui contient du texte arabe.

Règle de détection : si l'option contient un caractère arabe (regex `/[\u0600-\u06FF]/`), afficher l'AudioButton.

```typescript
const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

// Dans le render des options :
<TouchableOpacity key={idx} onPress={() => handleSelect(idx)} style={styles.option}>
  <Text style={styles.optionText}>{option}</Text>
  {isArabic(option) && (
    <AudioButton text={option} size="sm" style={{ marginLeft: 8 }} />
  )}
</TouchableOpacity>
```

### 2d — FillBlank : AudioButton sur la phrase

Dans `src/components/exercises/FillBlankExercise.tsx`, ajouter un `AudioButton` variant='pill' sous la phrase arabe de contexte.

```typescript
// Après le texte de la phrase :
<AudioButton text={sentence_ar_complete} variant="pill" rate={0.7} />
// Note : sentence_ar_complete = phrase avec la réponse correcte complétée (pour révision post-validation)
// Pendant l'exercice actif, lire sentence_ar avec un espace ou pause à la place du blank
```

### Checkpoint M2
- [ ] LetterCard : tap sur 🔊 → lecture de la lettre en arabe
- [ ] HarakatToggle : tap sur chaque harakat → prononciation de la syllabe
- [ ] MCQExercise : options arabes ont un AudioButton sm
- [ ] FillBlankExercise : AudioButton pill sous la phrase
- [ ] Aucune régression visuelle M1–M2 (layout non cassé)
- [ ] `/checkpoint` → tout vert

---

## MISSION 3 — Intégration audio dans M3–M10

### 3a — Règle générale (à appliquer module par module)

Pour **chaque exercice MCQ** contenant du texte arabe dans le prompt ou les options : ajouter `AudioButton` size='sm'.

Pour **chaque exercice FillBlank** : ajouter `AudioButton` sur la phrase de contexte.

Pour **chaque carte de dialogue** (`DialogueExercise`) : ajouter `AudioButton` sur chaque réplique arabe.

Pour **chaque leçon** avec une `ArabicText` de titre visible : ajouter `AudioButton` size='md' à côté du titre.

### 3b — Composant `LessonHeader` audio

Si un composant `LessonHeader` (ou équivalent) affiche le titre arabe de la leçon, lui passer le `title_ar` et afficher un `AudioButton` size='md'.

```typescript
// Dans LessonHeader (ou dans l'écran de leçon) :
<View style={styles.headerRow}>
  <ArabicText text={lesson.title_ar} size="xl" />
  <AudioButton text={lesson.title_ar} size="md" rate={0.75} />
</View>
```

### 3c — `DialogueExercise` : audio sur chaque tour

Dans `src/components/exercises/DialogueExercise.tsx`, chaque réplique arabe (personnage + apprenant) reçoit un `AudioButton` size='sm' :

```typescript
{turn.text_ar && (
  <View style={styles.turnRow}>
    <ArabicText text={turn.text_ar} />
    <AudioButton text={turn.text_ar} size="sm" rate={0.7} />
  </View>
)}
```

### 3d — `SpeedRoundExercise` : audio sur la question

Dans `SpeedRoundExercise`, si la question contient du texte arabe, ajouter `AudioButton` size='sm'. L'auto-play au début de chaque question est optionnel (configurable via un setting "Audio automatique" — voir M8).

### 3e — `MemoryMatchExercise` : audio sur flip d'une carte arabe

Dans `MemoryMatchExercise`, quand une carte arabe est retournée (flip), appeler `speak(card.text_ar)` automatiquement.

```typescript
// Dans le gestionnaire onCardFlip :
const handleCardFlip = (card: MemoryCard) => {
  if (card.type === 'arabic') {
    speak(card.text_ar);
  }
  // ... logique match existante
};
```

### Checkpoint M3
- [ ] Module 3–8 : au moins 1 AudioButton visible par exercice MCQ avec texte arabe
- [ ] DialogueExercise : chaque réplique arabe a un AudioButton
- [ ] SpeedRound : question arabe a un AudioButton
- [ ] MemoryMatch : flip d'une carte arabe déclenche speech
- [ ] Aucune régression de layout dans M3–M10
- [ ] `/checkpoint` → tout vert

---

## MISSION 4 — Extension du schéma SRS (Supabase + SQLite)

### 4a — Migration Supabase (SQL Editor Dashboard)

```sql
-- ============================================================
-- ÉTAPE 16 — Extension SRS
-- Ajouter grammar_rules et étendre srs_cards
-- ============================================================

-- 1. Nouvelle table grammar_rules
CREATE TABLE IF NOT EXISTS grammar_rules (
  id           TEXT PRIMARY KEY,
  module_id    TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  title_fr     TEXT NOT NULL,
  title_ar     TEXT,
  rule_fr      TEXT NOT NULL,           -- explication en français
  example_ar   TEXT NOT NULL,           -- exemple en arabe (avec harakats)
  example_fr   TEXT NOT NULL,           -- traduction de l'exemple
  audio_key    TEXT,                    -- clé future pour fichier audio pro (Phase 3)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grammar_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grammar_rules_public_read" ON grammar_rules FOR SELECT USING (true);

-- 2. Étendre card_type dans srs_cards
-- Si card_type est un ENUM :
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'srs_card_type') THEN
    ALTER TYPE srs_card_type ADD VALUE IF NOT EXISTS 'conjugation';
    ALTER TYPE srs_card_type ADD VALUE IF NOT EXISTS 'grammar_rule';
  END IF;
END$$;

-- Si card_type est un TEXT avec contrainte CHECK, l'assouplir :
-- ALTER TABLE srs_cards DROP CONSTRAINT IF EXISTS srs_cards_card_type_check;
-- ALTER TABLE srs_cards ADD CONSTRAINT srs_cards_card_type_check
--   CHECK (card_type IN ('letter','word','conjugation','grammar_rule'));

-- 3. Index pour performance
CREATE INDEX IF NOT EXISTS idx_grammar_rules_module ON grammar_rules(module_id);
CREATE INDEX IF NOT EXISTS idx_srs_cards_card_type ON srs_cards(card_type);

-- 4. Seed grammar_rules — 8 règles fondamentales (M5, M7, M9, M10)
INSERT INTO grammar_rules (id, module_id, sort_order, title_fr, title_ar, rule_fr, example_ar, example_fr) VALUES

-- Module 5 — Phrase nominale
('gr-501', 'module-5', 1,
 'La phrase nominale',
 'الجملة الاسمية',
 'Une phrase nominale arabe commence par un nom ou un pronom. Elle n''a pas de verbe « être » au présent.',
 'الْبَيْتُ كَبِيرٌ',
 'La maison est grande.'),

('gr-502', 'module-5', 2,
 'L''accord en genre',
 'التطابق في الجنس',
 'L''adjectif s''accorde en genre avec le nom. Féminin = ajout de ة (tā'' marbūṭa).',
 'الْمَدْرَسَةُ كَبِيرَةٌ',
 'L''école est grande.'),

-- Module 7 — Présent (مضارع)
('gr-701', 'module-7', 1,
 'La conjugaison au présent',
 'الفعل المضارع',
 'Le مضارع exprime une action en cours ou habituelle. Il se forme avec des préfixes (يَـ / تَـ / أَـ / نَـ) ajoutés à la racine.',
 'يَكْتُبُ الطَّالِبُ',
 'L''étudiant écrit.'),

('gr-702', 'module-7', 2,
 'Négation du présent : لَا',
 'نفي المضارع بـ لا',
 'Pour nier une action au présent, on place لَا devant le مضارع. Le verbe reste au cas nominatif (ضمة).',
 'لَا يَذْهَبُ إِلَى الْمَدْرَسَةِ',
 'Il ne va pas à l''école.'),

-- Module 9 — Impératif
('gr-901', 'module-9', 1,
 'Formation de l''impératif',
 'صياغة فعل الأمر',
 'L''impératif se forme en retirant le préfixe تَـ du مضارع et en ajoutant une hamza de liaison si le début est consonantique.',
 'اُكْتُبْ رِسَالَةً',
 'Écris une lettre !'),

('gr-902', 'module-9', 2,
 'L''impératif négatif : لَا + مضارع مجزوم',
 'النهي',
 'Pour interdire, on utilise لَا suivie du مضارع au mode مجزوم (sukūn en finale, pas de ضمة).',
 'لَا تَكْتُبْ هُنَا',
 'N''écris pas ici !'),

-- Module 10 — Futur proche
('gr-1001', 'module-10', 1,
 'Le futur avec سَوْفَ / سَـ',
 'المستقبل بـ سوف / سـ',
 'Le futur se forme avec la particule سَوْفَ (longue) ou le préfixe سَـ (court) devant le مضارع. Les deux sont équivalents.',
 'سَوْفَ أُسَافِرُ غَدًا',
 'Je voyagerai demain.'),

('gr-1002', 'module-10', 2,
 'Futur négatif : لَنْ + مضارع منصوب',
 'نفي المستقبل بـ لن',
 'Pour nier au futur, لَنْ rend le مضارع منصوب (fatḥa ou alif en finale selon la conjugaison).',
 'لَنْ أَذْهَبَ إِلَى الْعَمَلِ',
 'Je n''irai pas au travail.')

ON CONFLICT (id) DO NOTHING;
```

### 4b — Migration SQLite locale

Dans `src/db/migrations/` (ou fichier de migration SQLite existant), ajouter :

```sql
-- SQLite : grammar_rules
CREATE TABLE IF NOT EXISTS grammar_rules (
  id           TEXT PRIMARY KEY,
  module_id    TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  title_fr     TEXT NOT NULL,
  title_ar     TEXT,
  rule_fr      TEXT NOT NULL,
  example_ar   TEXT NOT NULL,
  example_fr   TEXT NOT NULL,
  audio_key    TEXT,
  synced_at    INTEGER
);

-- SQLite : étendre srs_cards (card_type est déjà TEXT, pas de migration nécessaire si CHECK absent)
-- Vérifier que la contrainte existante n'empêche pas 'conjugation' et 'grammar_rule'
-- Si une contrainte existe, la supprimer dans SQLite (recréer la table) :
-- CREATE TABLE srs_cards_new AS SELECT * FROM srs_cards;
-- DROP TABLE srs_cards;
-- ALTER TABLE srs_cards_new RENAME TO srs_cards;
-- (+ recréer les index)
```

### Checkpoint M4

> **Note cohérence** : La table `grammar_rules` a été créée en É11 avec un schéma initial. Cette mission l'étend avec des colonnes supplémentaires (`audio_key`) et ajoute de nouvelles règles. Vérifier d'abord l'état de la table existante avec `@codebase-scout`.

- [ ] Table `grammar_rules` étendue dans Supabase avec 8 règles seedées
- [ ] Table `grammar_rules` étendue dans SQLite
- [ ] `card_type` accepte `'conjugation'` et `'grammar_rule'` dans Supabase et SQLite
- [ ] `SELECT * FROM grammar_rules` → 8+ lignes dans Supabase SQL Editor
- [ ] `/checkpoint` → tout vert

---

## MISSION 5 — Sync des grammar_rules + seed des cartes SRS

### 5a — Sync `grammar_rules` dans `content-sync.ts`

Dans `src/services/content-sync.ts`, ajouter la sync de `grammar_rules` (même pattern que `conjugation_entries`) :

```typescript
// Dans la fonction syncAll() ou syncContent() :
async function syncGrammarRules() {
  const { data, error } = await supabase
    .from('grammar_rules')
    .select('*')
    .order('module_id, sort_order');

  if (error || !data) return;

  const db = await getLocalDB();
  await db.runAsync('DELETE FROM grammar_rules');
  for (const rule of data) {
    await db.runAsync(
      `INSERT INTO grammar_rules (id, module_id, sort_order, title_fr, title_ar, rule_fr, example_ar, example_fr, audio_key, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rule.id, rule.module_id, rule.sort_order, rule.title_fr, rule.title_ar,
       rule.rule_fr, rule.example_ar, rule.example_fr, rule.audio_key, Date.now()]
    );
  }
}
```

### 5b — Seed automatique des cartes SRS conjugaison

Créer `src/services/srs-seed.ts` :

```typescript
/**
 * srs-seed.ts — génère les cartes SRS pour conjugaisons et grammaire
 * depuis les tables locales SQLite.
 *
 * À appeler une fois après la première sync, puis à chaque nouvelle entrée.
 * Idempotent : INSERT OR IGNORE sur l'id de la carte.
 */

import { getLocalDB } from '../db/local';
import type { SRSCard } from '../types';

export async function seedConjugationSRSCards(): Promise<number> {
  const db = await getLocalDB();

  // Récupérer toutes les entrées de conjugaison non encore en SRS
  const conjugations = await db.getAllAsync<{
    id: string; verb_root: string; conjugated_form: string;
    person: string; tense: string; translation_fr: string;
  }>(
    `SELECT ce.id, ce.verb_root, ce.conjugated_form, ce.person, ce.tense, ce.translation_fr
     FROM conjugation_entries ce
     LEFT JOIN srs_cards sc ON sc.content_id = ce.id AND sc.card_type = 'conjugation'
     WHERE sc.id IS NULL`
  );

  let inserted = 0;
  for (const entry of conjugations) {
    const cardId = `srs-conj-${entry.id}`;
    await db.runAsync(
      `INSERT OR IGNORE INTO srs_cards
         (id, user_id, card_type, content_id, front_text, back_text,
          easiness, interval, repetitions, next_review, created_at)
       VALUES (?, 'local', 'conjugation', ?, ?, ?, 2.5, 1, 0, ?, ?)`,
      [
        cardId,
        entry.id,
        entry.conjugated_form,                           // recto : forme arabe
        `${entry.translation_fr} (${entry.tense}, ${entry.person})`, // verso
        Date.now(),
        Date.now(),
      ]
    );
    inserted++;
  }
  return inserted;
}

export async function seedGrammarSRSCards(): Promise<number> {
  const db = await getLocalDB();

  const rules = await db.getAllAsync<{
    id: string; title_fr: string; example_ar: string; rule_fr: string;
  }>(
    `SELECT gr.id, gr.title_fr, gr.example_ar, gr.rule_fr
     FROM grammar_rules gr
     LEFT JOIN srs_cards sc ON sc.content_id = gr.id AND sc.card_type = 'grammar_rule'
     WHERE sc.id IS NULL`
  );

  let inserted = 0;
  for (const rule of rules) {
    const cardId = `srs-gram-${rule.id}`;
    await db.runAsync(
      `INSERT OR IGNORE INTO srs_cards
         (id, user_id, card_type, content_id, front_text, back_text,
          easiness, interval, repetitions, next_review, created_at)
       VALUES (?, 'local', 'grammar_rule', ?, ?, ?, 2.5, 1, 0, ?, ?)`,
      [
        cardId,
        rule.id,
        rule.example_ar,   // recto : exemple arabe
        rule.rule_fr,      // verso : règle en français
        Date.now(),
        Date.now(),
      ]
    );
    inserted++;
  }
  return inserted;
}
```

### 5c — Appel au démarrage

Dans `src/services/sync-manager.ts`, après la sync des conjugations et grammar_rules :

```typescript
import { seedConjugationSRSCards, seedGrammarSRSCards } from './srs-seed';

// Après syncConjugations() et syncGrammarRules() :
const conjCards = await seedConjugationSRSCards();
const gramCards = await seedGrammarSRSCards();
console.log(`[SRS Seed] Conjugation: +${conjCards}, Grammar: +${gramCards}`);
```

### Checkpoint M5
- [ ] `grammar_rules` synced dans SQLite après `runSync()`
- [ ] `seedConjugationSRSCards()` → N cartes insérées (N = nb `conjugation_entries` existantes)
- [ ] `seedGrammarSRSCards()` → 8 cartes insérées
- [ ] `SELECT card_type, COUNT(*) FROM srs_cards GROUP BY card_type` → 4+ types présents
- [ ] Idempotent : relancer seed → 0 nouvelles insertions
- [ ] `/checkpoint` → tout vert

---

## MISSION 6 — Réviser tab : filtres par catégorie + cartes conjugaison/grammaire

### 6a — Filtres dans le Réviser tab

Dans `src/screens/ReviserScreen.tsx` (ou équivalent), ajouter une barre de filtres au-dessus de la liste de cartes :

```typescript
type SRSFilter = 'all' | 'letter' | 'word' | 'conjugation' | 'grammar_rule';

const FILTER_LABELS: Record<SRSFilter, string> = {
  all: 'Tout',
  letter: 'Lettres',
  word: 'Mots',
  conjugation: 'Conjugaisons',
  grammar_rule: 'Grammaire',
};

// Afficher uniquement les filtres pour lesquels il y a des cartes dues
// (éviter d'afficher "Conjugaisons" si 0 cartes dues de ce type)
```

La liste de cartes filtrée doit requêter SQLite :
```sql
SELECT * FROM srs_cards
WHERE next_review <= strftime('%s','now') * 1000
  AND (card_type = ? OR ? = 'all')
ORDER BY next_review ASC
LIMIT 20
```

### 6b — Carte de conjugaison dans le Réviser

Créer `src/components/srs/ConjugationCard.tsx` :

```typescript
/**
 * ConjugationCard — carte SRS pour une forme verbale.
 *
 * Recto : forme arabe (ex : اُكْتُبِي) + AudioButton
 * Verso : traduction + tense + personne + règle courte
 */

interface ConjugationCardProps {
  card: SRSCard; // card_type === 'conjugation'
  onRate: (quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  showBack: boolean;
  onReveal: () => void;
}

// Recto :
// - ArabicText size="display" text={card.front_text}
// - AudioButton size="lg" rate={0.65}

// Verso (après révélation) :
// - ArabicText size="xl" text={card.front_text} (rappel)
// - AudioButton size="md"
// - Text : card.back_text (traduction + contexte)
// - Boutons SM-2 : ✗ Raté / ~ Difficile / ✓ Bien / ⚡ Parfait
```

### 6c — Carte de grammaire dans le Réviser

Créer `src/components/srs/GrammarCard.tsx` :

```typescript
/**
 * GrammarCard — carte SRS pour une règle de grammaire.
 *
 * Recto : exemple arabe (ex : اُكْتُبْ رِسَالَةً) + AudioButton
 * Verso : titre de la règle + explication complète en français
 */

// Recto :
// - ArabicText size="display" text={card.front_text}
// - AudioButton size="lg" rate={0.7}
// - Indice discret : "Quelle règle illustre cet exemple ?"

// Verso :
// - Text title : rule.title_fr (récupéré via JOIN grammar_rules)
// - Text : rule.rule_fr
// - ArabicText text={card.front_text} (rappel + audio)
// - Boutons SM-2
```

> **Note Claude Code** : Pour récupérer `rule_fr` et `title_fr`, faire un JOIN SQLite dans le hook qui charge la carte, ou stocker ces infos en `back_text` à la création (M5 les stocke déjà dans `back_text`).

### 6d — Hook `useReviserCards`

Créer ou mettre à jour `src/hooks/useReviserCards.ts` :

```typescript
interface UseReviserCardsOptions {
  filter: SRSFilter;
  limit?: number;
}

interface UseReviserCardsReturn {
  cards: SRSCard[];
  counts: Record<SRSFilter, number>;  // pour afficher les badges sur les filtres
  isLoading: boolean;
  rateCard: (cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => Promise<void>;
  refreshCards: () => Promise<void>;
}
```

### Checkpoint M6

> **Note cohérence (post-É13E)** : Le Réviser tab a déjà un moteur polymorphique (6 modes : flashcard, MCQ, write, match, listen_select, examen). Les nouveaux `ConjugationCard` et `GrammarCard` s'intègrent dans ce moteur via `resolveItemData()` (É13E M8.2). Vérifier que `resolveItemData` est étendu pour les nouveaux `card_type`.

- [ ] Filtres 'Tout / Lettres / Mots / Conjugaisons / Grammaire' visibles dans Réviser
- [ ] Filtre 'Conjugaisons' → cartes avec front arabe + AudioButton
- [ ] Filtre 'Grammaire' → cartes avec exemple arabe + explication français
- [ ] SM-2 rating fonctionne sur les nouvelles cartes (interval mis à jour dans SQLite)
- [ ] Badge count correct sur chaque filtre (ex : "Conjugaisons (12)")
- [ ] Mode avion → Réviser fonctionne entièrement depuis SQLite
- [ ] `/checkpoint` → tout vert

---

## MISSION 7 — Setting "Audio automatique" + analytics

### 7a — Setting dans le Profile

Dans les settings existants (É4), ajouter un toggle "Audio automatique" :

```typescript
// Dans src/stores/settingsStore.ts (ou équivalent), ajouter :
autoPlayAudio: boolean;  // défaut : false
setAutoPlayAudio: (value: boolean) => void;
```

Le setting "Audio automatique" contrôle :
- SpeedRound : lit la question automatiquement au début de chaque question
- MemoryMatch : lit les cartes retournées automatiquement (déjà en M3)
- Exercices : lit le prompt arabe automatiquement à l'affichage de l'exercice

### 7b — Propagation du setting

Dans `useAudio`, lire `autoPlayAudio` depuis le store :
```typescript
// Dans les composants d'exercice, ajouter un useEffect conditionnel :
const { autoPlayAudio } = useSettingsStore();
const { speak } = useAudio();

useEffect(() => {
  if (autoPlayAudio && promptAr) {
    speak(promptAr);
  }
}, [promptAr]); // déclenche à chaque nouvel exercice
```

### 7c — Analytics PostHog (3 nouveaux events)

```typescript
// Event 1 : lecture audio déclenchée
posthog.capture('audio_played', {
  text_length: text.length,
  source: 'letter_card' | 'mcq_option' | 'fill_blank' | 'srs_card' | 'dialogue',
  module_id: currentModuleId,
  auto_play: isAutoPlay,
});

// Event 2 : carte SRS conjugaison/grammaire révisée
posthog.capture('srs_card_reviewed', {
  card_type: card.card_type,  // 'conjugation' | 'grammar_rule'
  quality: quality,            // 0–5
  interval_new: newInterval,
});

// Event 3 : filtre Réviser utilisé
posthog.capture('reviser_filter_changed', {
  filter: selectedFilter,
  cards_due: counts[selectedFilter],
});
```

### Checkpoint M7
- [ ] Toggle "Audio automatique" visible dans Settings
- [ ] `autoPlayAudio = true` → lecture auto au premier exercice d'une leçon
- [ ] `autoPlayAudio = false` → aucune lecture auto (comportement par défaut)
- [ ] 3 events PostHog visibles dans le dashboard
- [ ] `/checkpoint` → tout vert

---

## MISSION 8 — Stats SRS dans le Profile

### 8a — Section "Ma progression SRS" dans ProfileScreen

Dans `src/screens/ProfileScreen.tsx`, ajouter une section affichant la répartition des cartes SRS par type :

```typescript
interface SRSStats {
  letter: { total: number; mastered: number; due: number };
  word: { total: number; mastered: number; due: number };
  conjugation: { total: number; mastered: number; due: number };
  grammar_rule: { total: number; mastered: number; due: number };
}
```

Requête SQLite :
```sql
SELECT
  card_type,
  COUNT(*) as total,
  SUM(CASE WHEN interval >= 21 THEN 1 ELSE 0 END) as mastered,
  SUM(CASE WHEN next_review <= strftime('%s','now') * 1000 THEN 1 ELSE 0 END) as due
FROM srs_cards
GROUP BY card_type
```

Affichage : 4 mini-cartes horizontales (Lettres / Mots / Conjugaisons / Grammaire), chacune avec un anneau de progression (SVG simple ou `react-native-svg` si déjà installé), total + mastérisées.

### 8b — Badge "Maître des verbes"

Si `mastered >= 20` pour `card_type = 'conjugation'`, afficher un badge "🏆 Maître des verbes" dans le profil.
Stocker ce badge en SQLite (dans la table `badges` existante) :

```sql
-- Dans Supabase, ajouter ce badge si absent :
INSERT INTO badges (id, name_fr, name_ar, icon, condition_type, condition_value)
VALUES ('badge-verb-master', 'Maître des verbes', 'سيد الأفعال', '🏆', 'srs_conjugation_mastered', 20)
ON CONFLICT (id) DO NOTHING;
```

### Checkpoint M8
- [ ] Section SRS dans Profile : 4+ types affichés avec totaux corrects
- [ ] Anneau de progression visuellement correct (mastered / total)
- [ ] Badge "Maître des verbes" débloqué si condition remplie
- [ ] Aucune régression sur les stats existantes (XP, streak, badges)
- [ ] `/checkpoint` → tout vert

---

## MISSION 9 — Tests end-to-end + régression complète

### 9a — Validation automatique toolkit

Lance `@regression-tester`. Tous les axes doivent être ✅.

### 9b — Validation contenu arabe

Lance `@arabic-content-validator` sur les seeds de É16 (grammar_rules, cartes SRS conjugaison/grammaire).

### 9c — Vérification audio sur device/simulateur

1. Simulateur iOS / émulateur Android — vérifier que `expo-speech` fonctionne
2. Prononcer : 'بِسْمِ اللَّهِ' → audio arabe natif
3. Prononcer 'اُكْتُبِي' → audio correct (impératif féminin)
4. AudioButton : tap → lecture, tap pendant lecture → arrêt
5. variant='pill' et variant='icon' : layout non cassé RTL

### 9d — Vérification SRS étendu

1. Réviser tab → filtre 'Conjugaisons' → N cartes affichées
2. Réviser tab → filtre 'Grammaire' → 8 cartes affichées
3. Coter une carte conjugaison → interval mis à jour dans SQLite
4. Coter une carte grammaire → interval mis à jour dans SQLite
5. Relancer l'app → cartes re-chargées correctement depuis SQLite

### 9e — Mode avion

1. Couper le réseau
2. Ouvrir n'importe quelle leçon M1–M10 → AudioButton présent
3. Tap AudioButton → audio joué (expo-speech est offline)
4. Réviser tab → toutes les cartes chargées (SQLite)
5. Setting "Audio automatique" → fonctionne offline

### 9f — Régression M1–M10

1. Compléter une leçon M1 (lettres) → XP + streak OK
2. Compléter une leçon M9 (impératif) → XP OK
3. Défi quotidien → complété, badge si applicable
4. SpeedRound → score sauvegardé
5. MemoryMatch → completion sauvegardée
6. Profil → stats SRS correctes
7. Aucune console error lors de la navigation complète

### Checkpoint final É16

- [ ] `@regression-tester` → tout vert
- [ ] `@arabic-content-validator` → pas d'erreur
- [ ] `/checkpoint` → tout vert
- [ ] Sync : grammar_rules dans SQLite (8+ règles)
- [ ] Sync : srs_cards conjugation (N cartes depuis conjugation_entries)
- [ ] Sync : srs_cards grammar_rule (8 cartes)
- [ ] AudioButton : icon et pill, 2 tailles, audio arabe fonctionnel
- [ ] M1–M10 : AudioButton présent sur prompts/options arabes
- [ ] DialogueExercise : audio sur chaque réplique
- [ ] SpeedRound : AudioButton sur question
- [ ] MemoryMatch : auto-speech au flip
- [ ] Réviser : 4 filtres (Lettres / Mots / Conjugaisons / Grammaire)
- [ ] Réviser : cartes conjugaison et grammaire avec audio
- [ ] Setting "Audio automatique" propagé à tous les exercices
- [ ] Profile : section SRS avec 4+ types + anneau de progression
- [ ] Badge "Maître des verbes" débloqué si condition
- [ ] 3 events PostHog visibles
- [ ] Mode avion : audio + SRS fonctionnels
- [ ] Aucune régression M1–M10

---

## RÉSUMÉ DE L'ÉTAPE 16

| Mission | Livrable | Statut |
|---------|----------|--------|
| 0 | `@codebase-scout` — scan initial du repo | ⬜ |
| 1 | `useAudio` hook + `AudioButton` component (icon + pill) | ⬜ |
| 2 | Audio intégré dans M1 (LetterCard, HarakatToggle, MCQ, FillBlank) | ⬜ |
| 3 | Audio intégré dans M2–M10 (Dialogue, SpeedRound, MemoryMatch) | ⬜ |
| 4 | Extension `grammar_rules` + `srs_cards` card_type étendu | ⬜ |
| 5 | `srs-seed.ts` + cartes SRS conjugaison + grammaire | ⬜ |
| 6 | Réviser tab : filtres + ConjugationCard + GrammarCard | ⬜ |
| 7 | Setting "Audio automatique" + 3 events PostHog | ⬜ |
| 8 | Profile : stats SRS par type + badge "Maître des verbes" | ⬜ |
| 9 | `@regression-tester` + `@arabic-content-validator` + tests manuels | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs après É16 :**
- `ETAPE-16-audio-srs-etendu.md` (ce fichier)
- `lisaan-seed-letters.json`

**Fichiers à supprimer de /docs :**
- `ETAPE-15-imperatif-futur-minijeux.md` (terminée)

---

> **Prochaine étape après validation :** Étape 17 — Notifications push (révisions quotidiennes, rappel défi), dialectes Phase 3 (module Darija intro), et premier module d'arabe coranique (vocabulaire des 10 sourates les plus récitées).
