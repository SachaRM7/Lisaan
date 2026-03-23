# ÉTAPE 8 — Audio natif : lettres, mots, phrases

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> Étapes terminées : 0→7. É7 = Module 4 (phrases nominales, pronoms, fill_blank, dialogues, SRS sentences).
> Cette étape intègre l'audio natif pour les lettres (M1), les mots (M3/M4) et les phrases (M4), via Supabase Storage + cache local expo-file-system. Les réglages audio (auto-play, vitesse, mute) définis en É4 sont maintenant câblés à un vrai système de lecture.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (offline-first — CRITIQUE)** :
> - Tous les hooks lisent depuis **SQLite local**. JAMAIS d'import `src/db/remote` dans hooks/stores.
> - `content-sync.ts` et `sync-manager.ts` sont les seuls à parler à Supabase.
> - Après chaque écriture locale, appeler `runSync()` en fire-and-forget.
> - **Pas de CLI Supabase** : migrations SQL dans le Dashboard Cloud (SQL Editor).

> **Philosophie audio de cette étape** :
> - Les fichiers audio réels (locuteur natif) ne sont pas encore enregistrés → on utilise **expo-speech** comme fallback TTS pendant le développement.
> - L'infrastructure (Storage, schema, cache) est 100% prête pour accueillir les vrais MP3 dès qu'ils sont disponibles.
> - Quand `audio_url` est rempli en base → on joue le fichier. Quand il est NULL → fallback expo-speech.
> - Cette séparation permet de livrer É8 sans bloquer sur les enregistrements.

---

## MISSION 1 — Dépendances audio

**Contexte :** expo-av et expo-file-system sont peut-être déjà installés (expo-av est inclus dans les presets Expo Go). Vérifier et installer si absent. expo-speech est inclus dans Expo SDK.

**Action :**

```bash
# Vérifier ce qui est déjà installé
cat package.json | grep -E "expo-av|expo-file-system|expo-speech"

# Installer si absent
npx expo install expo-av expo-file-system expo-speech
```

Ajouter dans `app.json` si absent :
```json
{
  "expo": {
    "plugins": [
      ["expo-av", { "microphonePermission": false }]
    ]
  }
}
```

**Checkpoint :**
- [ ] `expo-av`, `expo-file-system`, `expo-speech` présents dans package.json
- [ ] Pas d'erreur au démarrage (`npx expo start`)

---

## MISSION 2 — Supabase Storage : bucket lisaan-audio

**Contexte :** Les fichiers audio seront stockés dans Supabase Storage dans un bucket public. La structure de chemin est : `letters/{letter_id}.mp3`, `words/{word_id}.mp3`, `sentences/{sentence_id}.mp3`.

**Action dans le Dashboard Supabase Cloud — Storage :**

1. Créer un bucket nommé `lisaan-audio`, public (cocher "Public bucket").
2. Politique RLS : lecture publique (SELECT) pour tous, écriture réservée au service role.

**Action dans le Dashboard — SQL Editor :**

Ajouter les colonnes `audio_url` aux tables existantes :

```sql
-- Lettres
ALTER TABLE letters
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Mots
ALTER TABLE words
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Phrases
ALTER TABLE sentences
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Valeurs de test (placeholder — à remplacer par les vrais MP3)
-- Laisse NULL pour l'instant ; le fallback expo-speech prendra le relais.
```

**Note pour Sacha :** Quand les enregistrements natifs sont prêts, uploader les MP3 dans le bucket puis mettre à jour les lignes avec l'URL publique Supabase Storage (`https://<project>.supabase.co/storage/v1/object/public/lisaan-audio/letters/...`).

**Checkpoint :**
- [ ] Bucket `lisaan-audio` visible dans le Dashboard Storage
- [ ] Colonne `audio_url` présente dans `letters`, `words`, `sentences`
- [ ] Upload de test d'un fichier MP3 bidon → URL publique accessible dans le navigateur

---

## MISSION 3 — Schéma SQLite local : table audio_cache

**Contexte :** Le schéma local (schema-local.ts) doit stocker les métadonnées du cache audio : quelle URL a été téléchargée, vers quel chemin local, quand.

**Action — modifier `src/db/schema-local.ts` :**

Ajouter après la dernière table existante :

```typescript
// Table audio_cache
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS audio_cache (
    id TEXT PRIMARY KEY,           -- SHA de l'URL ou "{type}_{item_id}"
    remote_url TEXT NOT NULL,
    local_path TEXT NOT NULL,      -- chemin FileSystem.documentDirectory + 'audio/...'
    downloaded_at INTEGER NOT NULL,
    file_size INTEGER,
    UNIQUE(remote_url)
  );
`);
```

Aussi : étendre les tables `letters`, `words`, `sentences` locales pour inclure `audio_url` :

```typescript
// Dans CREATE TABLE letters :
audio_url TEXT,

// Dans CREATE TABLE words :
audio_url TEXT,

// Dans CREATE TABLE sentences :
audio_url TEXT,
```

**Checkpoint :**
- [ ] Table `audio_cache` créée (supprimer l'app et relancer pour forcer la migration)
- [ ] `letters`, `words`, `sentences` locales ont une colonne `audio_url`
- [ ] Pas d'erreur de schema

---

## MISSION 4 — content-sync : synchroniser audio_url + 10 tables → 13 tables

**Contexte :** Le content-sync actuel (É7) synchronise 10 tables. Il faut : (a) inclure `audio_url` dans les SELECT pour letters/words/sentences, (b) ajouter la logique de pré-téléchargement des fichiers audio en arrière-plan après sync.

**Action — modifier `src/db/content-sync.ts` :**

**4a.** Dans les requêtes SELECT pour `letters`, `words`, `sentences`, ajouter `audio_url` :

```typescript
// Exemple pour letters :
const { data: letters } = await supabase
  .from('letters')
  .select('id, char, char_with_tashkeel, transliteration, name_ar, name_fr, category, sort_order, audio_url, ...')
  .order('sort_order');

// INSERT dans SQLite local — inclure audio_url
await db.runAsync(
  `INSERT OR REPLACE INTO letters (..., audio_url) VALUES (..., ?)`,
  [..., letter.audio_url ?? null]
);
```

Idem pour `words` et `sentences`.

**4b.** Après la sync du contenu, lancer le pré-téléchargement audio en fire-and-forget :

```typescript
import { prefetchAudio } from './audio-cache-service';

// À la fin de syncContent(), après toutes les tables :
prefetchAudio().catch(err => console.warn('[content-sync] prefetch audio failed:', err));
```

**Checkpoint :**
- [ ] `audio_url` persisté en SQLite local pour letters, words, sentences
- [ ] `prefetchAudio()` appelé après sync (fire-and-forget, n'interrompt pas le flux)
- [ ] Aucune régression sur les 10 tables existantes

---

## MISSION 5 — AudioCacheService (`src/services/audio-cache-service.ts`)

**Contexte :** Service central qui gère : téléchargement d'un fichier audio, vérification du cache local, nettoyage. Utilisé par le hook `useAudio`.

**Action — créer `src/services/audio-cache-service.ts` :**

```typescript
import * as FileSystem from 'expo-file-system';
import { getLocalDB } from '../db/local-db';

const AUDIO_DIR = FileSystem.documentDirectory + 'audio/';

async function ensureAudioDir() {
  const info = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
}

function urlToFilename(url: string): string {
  // Derive a stable filename from the URL
  return url.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '_') ?? 'audio.mp3';
}

export async function getLocalAudioPath(remoteUrl: string): Promise<string | null> {
  const db = getLocalDB();
  const cached = await db.getFirstAsync<{ local_path: string }>(
    'SELECT local_path FROM audio_cache WHERE remote_url = ?',
    [remoteUrl]
  );
  if (!cached) return null;
  
  const info = await FileSystem.getInfoAsync(cached.local_path);
  if (!info.exists) {
    // File deleted — clean up cache entry
    await db.runAsync('DELETE FROM audio_cache WHERE remote_url = ?', [remoteUrl]);
    return null;
  }
  return cached.local_path;
}

export async function downloadAndCacheAudio(remoteUrl: string): Promise<string> {
  // Check cache first
  const cached = await getLocalAudioPath(remoteUrl);
  if (cached) return cached;

  await ensureAudioDir();
  const filename = urlToFilename(remoteUrl);
  const localPath = AUDIO_DIR + filename;

  const result = await FileSystem.downloadAsync(remoteUrl, localPath);
  if (result.status !== 200) throw new Error(`Audio download failed: ${result.status}`);

  const db = getLocalDB();
  const cacheId = `audio_${filename}`;
  await db.runAsync(
    `INSERT OR REPLACE INTO audio_cache (id, remote_url, local_path, downloaded_at, file_size)
     VALUES (?, ?, ?, ?, ?)`,
    [cacheId, remoteUrl, localPath, Date.now(), result.headers['Content-Length'] ? parseInt(result.headers['Content-Length']) : null]
  );

  return localPath;
}

export async function prefetchAudio(): Promise<void> {
  // Pre-download all audio_urls present in local DB
  const db = getLocalDB();
  type AudioRow = { audio_url: string };
  
  const queries = [
    db.getAllAsync<AudioRow>('SELECT audio_url FROM letters WHERE audio_url IS NOT NULL'),
    db.getAllAsync<AudioRow>('SELECT audio_url FROM words WHERE audio_url IS NOT NULL'),
    db.getAllAsync<AudioRow>('SELECT audio_url FROM sentences WHERE audio_url IS NOT NULL'),
  ];

  const results = await Promise.all(queries);
  const allUrls = results.flat().map(r => r.audio_url);

  // Download sequentially to avoid hammering the network
  for (const url of allUrls) {
    try {
      await downloadAndCacheAudio(url);
    } catch (e) {
      console.warn('[prefetchAudio] failed for', url, e);
    }
  }
}

export async function clearAudioCache(): Promise<void> {
  const db = getLocalDB();
  const rows = await db.getAllAsync<{ local_path: string }>('SELECT local_path FROM audio_cache');
  for (const row of rows) {
    await FileSystem.deleteAsync(row.local_path, { idempotent: true });
  }
  await db.runAsync('DELETE FROM audio_cache');
}
```

**Checkpoint :**
- [ ] `downloadAndCacheAudio(url)` télécharge et retourne le chemin local
- [ ] Deuxième appel avec la même URL → retourne depuis le cache (pas de re-download)
- [ ] `prefetchAudio()` ne plante pas si aucun audio_url n'est renseigné (0 URL → no-op)
- [ ] `clearAudioCache()` vide le répertoire et la table

---

## MISSION 6 — Hook `useAudio` (`src/hooks/useAudio.ts`)

**Contexte :** Hook React qui orchestre : récupération du chemin (cache ou download), lecture via expo-av, fallback expo-speech si `audio_url` est null. Consomme les settings utilisateur (auto_play, audio_speed, audio_enabled).

**Action — créer `src/hooks/useAudio.ts` :**

```typescript
import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useSettingsStore } from '../stores/settings-store';
import { downloadAndCacheAudio } from '../services/audio-cache-service';

export type AudioState = 'idle' | 'loading' | 'playing' | 'error';

interface UseAudioOptions {
  audioUrl?: string | null;
  fallbackText?: string;       // Arabic text for TTS fallback
  fallbackLanguage?: string;   // 'ar' par défaut
  autoPlay?: boolean;          // override le setting global
}

export function useAudio(options: UseAudioOptions) {
  const { audioUrl, fallbackText, fallbackLanguage = 'ar', autoPlay } = options;
  const soundRef = useRef<Audio.Sound | null>(null);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  
  const settings = useSettingsStore(s => s.settings);
  const isEnabled = settings.audio_enabled !== false;
  const speed = settings.audio_speed ?? 'normal';
  const globalAutoPlay = settings.audio_autoplay ?? false;
  
  const shouldAutoPlay = autoPlay ?? globalAutoPlay;

  const rateForSpeed = (s: string) =>
    s === 'slow' ? 0.65 : s === 'native' ? 1.25 : 1.0;

  const play = useCallback(async () => {
    if (!isEnabled) return;
    setAudioState('loading');

    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (audioUrl) {
        // Try to play cached/remote file
        const localPath = await downloadAndCacheAudio(audioUrl);
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: localPath },
          { shouldPlay: true, rate: rateForSpeed(speed), volume: 1.0 }
        );
        soundRef.current = sound;
        setAudioState('playing');
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            setAudioState('idle');
          }
        });
      } else if (fallbackText) {
        // TTS fallback via expo-speech
        setAudioState('playing');
        Speech.speak(fallbackText, {
          language: fallbackLanguage,
          rate: rateForSpeed(speed) * 0.8, // Speech.speak rate scale differs
          onDone: () => setAudioState('idle'),
          onError: () => setAudioState('error'),
        });
      } else {
        setAudioState('idle');
      }
    } catch (e) {
      console.warn('[useAudio] play error:', e);
      setAudioState('error');
    }
  }, [audioUrl, fallbackText, fallbackLanguage, isEnabled, speed]);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
    Speech.stop();
    setAudioState('idle');
  }, []);

  return { play, stop, audioState, isEnabled };
}
```

**Checkpoint :**
- [ ] Hook exporté sans erreur TypeScript
- [ ] `audio_enabled = false` → `play()` est no-op
- [ ] `audioUrl = null` + `fallbackText` renseigné → expo-speech se lance
- [ ] `audioUrl` renseigné → fichier téléchargé/caché + lecture expo-av
- [ ] **Aucun import `src/db/remote`**

---

## MISSION 7 — Composant `AudioButton` (`src/components/AudioButton.tsx`)

**Contexte :** Bouton réutilisable qui encapsule `useAudio`. Affiché partout où il y a du son (LetterCard, WordCard, SentenceCard, exercises).

**Action — créer `src/components/AudioButton.tsx` :**

```typescript
import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudio, UseAudioOptions } from '../hooks/useAudio';
import { colors } from '../constants/design-tokens';

interface AudioButtonProps extends UseAudioOptions {
  size?: number;
  color?: string;
  style?: object;
}

export function AudioButton({ size = 24, color, style, ...audioOptions }: AudioButtonProps) {
  const { play, audioState, isEnabled } = useAudio(audioOptions);
  
  if (!isEnabled) return null;

  const iconColor = color ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={play}
      style={[styles.button, style]}
      accessibilityLabel="Écouter la prononciation"
      disabled={audioState === 'loading' || audioState === 'playing'}
    >
      {audioState === 'loading' ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : audioState === 'playing' ? (
        <Ionicons name="volume-high" size={size} color={iconColor} />
      ) : (
        <Ionicons name="volume-medium-outline" size={size} color={iconColor} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

**Checkpoint :**
- [ ] `AudioButton` s'affiche sans erreur
- [ ] États visuels : idle → icône outline, loading → spinner, playing → icône pleine
- [ ] `isEnabled = false` → composant ne rend rien (retourne null)

---

## MISSION 8 — Intégration dans LetterCard (Module 1)

**Contexte :** `LetterCard` est le composant principal du Module 1. Il affiche une lettre avec ses formes positionnelles. Ajouter un `AudioButton` qui joue le son de la lettre.

**Action — modifier `src/components/LetterCard.tsx` :**

1. Ajouter la prop `audioUrl?: string | null`.
2. Ajouter la prop `arabicText: string` (le caractère de la lettre, pour fallback TTS).
3. Intégrer `AudioButton` dans le layout de la carte :

```typescript
import { AudioButton } from './AudioButton';

// Dans le JSX de LetterCard :
<View style={styles.header}>
  <ArabicText style={styles.mainChar}>{letter.char}</ArabicText>
  <AudioButton
    audioUrl={letter.audio_url}
    fallbackText={letter.char}
    size={28}
    style={styles.audioBtn}
  />
</View>
```

**Auto-play :** Si le réglage `audio_autoplay` est activé, déclencher `play()` au montage :

```typescript
const { play, audioState } = useAudio({
  audioUrl: letter.audio_url,
  fallbackText: letter.char,
});

useEffect(() => {
  if (autoPlay) { play(); }
}, []);  // Au montage uniquement
```

**Checkpoint :**
- [ ] AudioButton visible dans LetterCard
- [ ] Tap → son joué (TTS arabe si pas de fichier)
- [ ] `audio_autoplay = true` → son joué au montage de la carte
- [ ] Aucune régression (leçons M1 fonctionnent toujours)

---

## MISSION 9 — Intégration dans WordCard (Modules 3 & 4)

**Contexte :** `WordCard` affiche un mot arabe avec sa translittération, racine, traduction. Même pattern que LetterCard.

**Action — modifier `src/components/WordCard.tsx` :**

```typescript
import { AudioButton } from './AudioButton';

// Dans le JSX de WordCard, à côté du mot arabe :
<View style={styles.wordRow}>
  <ArabicText style={styles.arabicWord}>{word.char}</ArabicText>
  <AudioButton
    audioUrl={word.audio_url}
    fallbackText={word.char}
    size={24}
  />
</View>
```

**Checkpoint :**
- [ ] AudioButton visible dans WordCard
- [ ] TTS fallback fonctionne (prononce le mot en arabe)
- [ ] Modules 3 et 4 sans régression

---

## MISSION 10 — Intégration dans SentenceCard (Module 4)

**Contexte :** `SentenceCard` affiche une phrase arabe. L'audio de phrase joue la phrase entière.

**Action — modifier `src/components/SentenceCard.tsx` :**

```typescript
import { AudioButton } from './AudioButton';

// Dans le JSX, en tête de carte :
<View style={styles.sentenceRow}>
  <AudioButton
    audioUrl={sentence.audio_url}
    fallbackText={sentence.arabic}
    size={22}
    style={styles.audioBtn}
  />
  <ArabicText style={styles.arabic}>{sentence.arabic}</ArabicText>
</View>
```

**Checkpoint :**
- [ ] AudioButton dans SentenceCard
- [ ] TTS joue la phrase arabe complète (fallback)
- [ ] Module 4 sans régression

---

## MISSION 11 — Intégration dans les exercices MCQ (audio_question)

**Contexte :** Type d'exercice "écoute et identifie" — on joue un son, l'utilisateur choisit la bonne lettre/mot parmi 4 options. Ce type était prévu dans le brief mais pas implémenté. L'implémenter maintenant que l'audio existe.

**Action :**

**11a.** Créer le type d'exercice dans les générateurs (M1 existant) :

Dans `src/exercises/letter-exercise-generator.ts` (ou le générateur M1), ajouter une fonction :

```typescript
function generateAudioMCQ(letter: Letter, allLetters: Letter[]): Exercise {
  const distractors = pickDistractors(letter, allLetters, 3);
  return {
    id: `audio-mcq-${letter.id}`,
    type: 'mcq',
    question: 'Quelle lettre entends-tu ?',
    audioUrl: letter.audio_url ?? undefined,
    audioFallbackText: letter.char,
    options: shuffle([letter, ...distractors]).map(l => ({
      id: l.id,
      label: l.char,
      correct: l.id === letter.id,
    })),
  };
}
```

**11b.** Dans `ExerciseRenderer` (ou `MCQExercise`), détecter la présence de `audioUrl`/`audioFallbackText` et afficher un `AudioButton` auto-play à la place du texte de question :

```typescript
// Dans MCQExercise.tsx :
{exercise.audioUrl || exercise.audioFallbackText ? (
  <AudioButton
    audioUrl={exercise.audioUrl}
    fallbackText={exercise.audioFallbackText}
    autoPlay={true}
    size={40}
    style={styles.bigAudioBtn}
  />
) : (
  <Text style={styles.question}>{exercise.question}</Text>
)}
```

**Checkpoint :**
- [ ] Un exercice `audio_question` peut être généré pour une lettre
- [ ] Dans MCQExercise, le bouton audio est affiché à la place du texte de question
- [ ] Auto-play au chargement de l'exercice
- [ ] Options textuelles (les lettres) restent cliquables normalement

---

## MISSION 12 — Settings : propager audio_enabled, audio_speed, audio_autoplay

**Contexte :** Ces trois réglages existent dans le store Zustand depuis É4 mais n'étaient connectés à rien. Ils sont maintenant consommés par `useAudio`. Vérifier la propagation.

**Action — vérifications dans `src/stores/settings-store.ts` :**

S'assurer que les champs suivants sont présents dans le type `UserSettings` :
```typescript
audio_enabled: boolean;    // true par défaut
audio_autoplay: boolean;   // false par défaut
audio_speed: 'slow' | 'normal' | 'native';  // 'normal' par défaut
```

Dans l'écran Settings (É4), vérifier que les toggles et selects mettent bien à jour le store.

**Action — ajouter une entrée "Vider le cache audio" dans les réglages :**

```typescript
import { clearAudioCache } from '../../services/audio-cache-service';

// Dans l'écran Réglages, section "Avancé" :
<TouchableOpacity onPress={async () => {
  await clearAudioCache();
  Alert.alert('Cache audio vidé', 'Les fichiers seront re-téléchargés à la prochaine lecture.');
}}>
  <Text>Vider le cache audio</Text>
</TouchableOpacity>
```

**Checkpoint :**
- [ ] `audio_enabled = false` → tous les AudioButton disparaissent de l'app
- [ ] `audio_speed = 'slow'` → lecture ralentie (expo-av rate ≈ 0.65)
- [ ] `audio_autoplay = true` → LetterCard joue le son au montage
- [ ] "Vider le cache audio" → vide la table + le dossier local

---

## MISSION 13 — Vérification end-to-end (online + offline + régression)

**Action :**

```bash
npx expo start
```

### Scénario de test complet :

**1. Baseline offline :**
   - Mettre l'appareil/simulateur en mode avion
   - Ouvrir l'app → charger une leçon M1 → taper AudioButton
   - → TTS fallback fonctionne (expo-speech, pas de réseau)

**2. Sync + prefetch :**
   - Revenir en ligne, forcer un re-sync (supprimer l'app ou vider les données)
   - Vérifier dans les logs que `prefetchAudio()` est appelé après sync
   - Si des `audio_url` sont renseignés en base → vérifier le téléchargement dans le log

**3. Cache :**
   - Jouer un son avec `audio_url` renseigné → téléchargement
   - Remettre en mode avion → rejouer le même son → lit depuis le cache local (pas de réseau)

**4. Settings :**
   - `audio_enabled = false` → pas de bouton audio nulle part
   - `audio_speed = slow` → son ralenti perceptible
   - `audio_autoplay = true` → son joué automatiquement en ouvrant une leçon M1

**5. Régression complète :**
   - Modules 1, 2, 3, 4 jouables de bout en bout
   - SRS fonctionne (letters, diacritics, words, sentences)
   - Aucun crash, aucun warning critique

```bash
# Vérification architecture offline-first
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/
# → Aucun résultat attendu
```

**Checkpoint final :**
- [ ] SQL Cloud : colonnes `audio_url` dans `letters`, `words`, `sentences`
- [ ] Bucket `lisaan-audio` créé dans Supabase Storage
- [ ] Table `audio_cache` en SQLite local
- [ ] `AudioCacheService` : download, cache, prefetch, clear
- [ ] `useAudio` hook : expo-av + expo-speech fallback + settings
- [ ] `AudioButton` : states idle/loading/playing, respects `isEnabled`
- [ ] `LetterCard` : AudioButton + auto-play
- [ ] `WordCard` : AudioButton
- [ ] `SentenceCard` : AudioButton
- [ ] MCQ audio_question : exercice "écoute et identifie"
- [ ] Settings : audio_enabled / audio_speed / audio_autoplay câblés
- [ ] "Vider le cache audio" dans les réglages
- [ ] Mode avion : TTS fallback fonctionne pour toutes les cartes
- [ ] Mode avion après sync : audio caché joue sans réseau
- [ ] Aucune régression Modules 1→4
- [ ] **Aucun hook ni store n'importe `src/db/remote`**
- [ ] Aucun crash, aucun warning critique

---

## RÉSUMÉ DE L'ÉTAPE 8

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Install expo-av + expo-file-system + expo-speech | ⬜ |
| 2 | Supabase Storage : bucket lisaan-audio + colonnes audio_url | ⬜ |
| 3 | SQLite local : table audio_cache + audio_url dans letters/words/sentences | ⬜ |
| 4 | content-sync : sync audio_url + prefetchAudio() | ⬜ |
| 5 | AudioCacheService : download, cache, prefetch, clear | ⬜ |
| 6 | Hook useAudio : expo-av + fallback expo-speech + settings | ⬜ |
| 7 | Composant AudioButton : states visuels + accessibilité | ⬜ |
| 8 | LetterCard : AudioButton + auto-play | ⬜ |
| 9 | WordCard : AudioButton | ⬜ |
| 10 | SentenceCard : AudioButton | ⬜ |
| 11 | MCQ audio_question : exercice écoute-et-identifie | ⬜ |
| 12 | Settings : propagation audio_enabled/speed/autoplay + clear cache | ⬜ |
| 13 | Vérification end-to-end + régression | ⬜ |

> **Note enregistrements natifs :** Les colonnes `audio_url` sont prêtes. Quand les MP3 natifs sont enregistrés, les uploader dans `lisaan-audio/{letters|words|sentences}/{id}.mp3` et mettre à jour les lignes SQL. L'app bascule automatiquement du fallback TTS vers le fichier réel sans aucun changement de code.

> **Prochaine étape après validation :** Étape 9 — Gamification avancée : animations de complétion de module, classement XP, badges de progression, celebrations (lettres, mots, phrases maîtrisés).

---

## GESTION /docs

**Fichiers à conserver dans /docs :**
- `ETAPE-8-audio.md` (ce fichier)
- `lisaan-seed-letters.json` (référence lettres)

**Fichiers à supprimer de /docs :**
- `ETAPE-7-module-construire-du-sens.md` (terminée)
