# ÉTAPE 17 — Notifications push, module Darija & module Coranique

> Étapes terminées : 0 → 16.
> Cette étape : notifications push locales, module Darija (dialecte marocain intro), et premier module d'arabe coranique (vocabulaire sourates courtes).
> Règle : missions séquentielles, checkpoints obligatoires.

> **Philosophie de cette étape** :
> - Les notifications push sont le premier mécanisme de rétention externe : une app d'apprentissage sans rappel quotidien perd 40–60% de ses utilisateurs en J7. Le système doit être respectueux (jamais intrusif), configurable à la minute près, et entièrement offline-capable (scheduling local, pas serveur push).
> - Le module Darija est la première validation de l'architecture multi-dialecte : la table `word_variants` a été conçue dès É0 pour ça. Si ajouter 40 mots darija ne touche pas au code, l'architecture tient sa promesse.
> - L'arabe coranique est la motivation n°1 des utilisateurs selon le brief. Le module doit être traité avec soin : vocabulaire de Al-Fatiha + 9 sourates courtes, audio lent et clair, notes de tajwid introductives (pas de cours complet).

---

## Périmètre de É17

| Domaine | Contenu | Nouvelles tables/composants |
|---------|---------|----------------------------|
| Notifications | Scheduling local, permissions, settings heure, types révision + défi | — (expo-notifications, pas de table) |
| Module Darija | 40 mots MSA → Darija dans `word_variants`, leçons intro, composant DiffBadge | `dialect_lessons` (optionnel) |
| Module Coranique | Vocabulaire 10 sourates courtes, notes tajwid intro, composant QuranWord | `quran_entries`, `surah_lessons` |
| SRS | Cartes `quran_word` dans srs_cards, filtre "Coran" dans Réviser | — |

**Ce qui est OUT de É17 :**
- Reconnaissance vocale / exercices de prononciation (Phase 3 tardive)
- Cours de tajwid complets (Phase 3 tardive)
- Autres dialectes (égyptien, levantin, khaliji) — uniquement Darija dans cette étape
- Notifications serveur (Firebase Cloud Messaging) — scheduling local uniquement
- Tajwid interactif (colorisation des règles) — Phase 3 tardive

---

## MISSION 0 — Scan initial

Lance `@codebase-scout` puis confirme l'état du repo avant de commencer. Vérifie en particulier : la table `word_variants` (doit exister depuis É0), la table `srs_cards` (item_types actuels : `letter`, `diacritic`, `word`, `sentence`, `conjugation`, `grammar_rule`), le `settingsStore` Zustand, et le Réviser tab (moteur polymorphique É13E + filtres É16).

---

## MISSION 1 — Infrastructure notifications push (scheduling local)

### 1a — Installation

```bash
npx expo install expo-notifications expo-device
```

> `expo-notifications` gère le scheduling local (révisions, défi) sans serveur FCM/APNs au MVP. Le scheduling local est offline-first par nature.

### 1b — Service `src/services/notification-service.ts`

```typescript
/**
 * notification-service.ts — service de notifications push pour Lisaan.
 *
 * Stratégie : scheduling LOCAL uniquement (pas de serveur push au MVP).
 * - Rappel révision quotidienne : heure configurable par l'utilisateur
 * - Rappel défi quotidien : 30 min avant minuit si défi non complété
 * - Aucune notification si l'utilisateur a déjà ouvert l'app aujourd'hui
 *
 * Règles de respect :
 * - Max 1 notification de révision par jour
 * - Max 1 notification de défi par jour
 * - Silence total si le streak est à 0 (utilisateur inactif > 7j → pas de spam)
 * - L'utilisateur peut désactiver chaque type indépendamment
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type NotificationType = 'daily_review' | 'daily_challenge' | 'streak_risk';

interface NotificationSettings {
  dailyReviewEnabled: boolean;
  dailyReviewHour: number;    // 0–23, défaut : 18
  dailyReviewMinute: number;  // 0–59, défaut : 0
  dailyChallengeEnabled: boolean;
  streakRiskEnabled: boolean; // notifier si risque de perdre un streak > 3
}

// Configuration du handler (affichage en foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false; // simulateur : skip
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('lisaan-reminders', {
      name: 'Rappels Lisaan',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A96E',
    });
  }
  
  return finalStatus === 'granted';
}

export async function scheduleReviewNotification(
  hour: number,
  minute: number
): Promise<string | null> {
  // Annuler le scheduling précédent du même type
  await cancelNotificationsByType('daily_review');
  
  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'لِسَان — Révision du jour',
      body: getReviewNotificationBody(), // rotation de messages
      data: { type: 'daily_review' as NotificationType },
      sound: false,
    },
    trigger,
  });
  
  return id;
}

export async function scheduleChallengeReminder(): Promise<string | null> {
  // Rappel défi : 23h30 chaque soir
  await cancelNotificationsByType('daily_challenge');
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'لِسَان — Défi du jour',
      body: 'Ton défi quotidien t\'attend. 2 minutes suffisent.',
      data: { type: 'daily_challenge' as NotificationType },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 23,
      minute: 30,
    },
  });
  
  return id;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function cancelNotificationsByType(type: NotificationType): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// Rotation de messages pour éviter la lassitude
const REVIEW_MESSAGES = [
  'Tu as des cartes à réviser. 3 minutes pour rester au top.',
  'Quelques mots arabes t\'attendent. N\'oublie pas ta progression.',
  'Révision du jour disponible. Ton cerveau est prêt.',
  'المراجعة — Une session rapide pour consolider tes acquis.',
  'Tes lettres arabes méritent 5 minutes de ton attention.',
];

function getReviewNotificationBody(): string {
  return REVIEW_MESSAGES[Math.floor(Math.random() * REVIEW_MESSAGES.length)];
}
```

### 1c — Intégration dans `app/_layout.tsx`

Après le step d'authentification, initialiser les notifications :

```typescript
import { requestNotificationPermissions } from '@/services/notification-service';
import { useSettingsStore } from '@/stores/settingsStore';

// Dans le composant layout, après auth :
const { notifDailyReviewEnabled, notifHour, notifMinute, notifChallengeEnabled } = useSettingsStore();

useEffect(() => {
  (async () => {
    const granted = await requestNotificationPermissions();
    if (!granted) return;
    
    if (notifDailyReviewEnabled) {
      await scheduleReviewNotification(notifHour, notifMinute);
    }
    if (notifChallengeEnabled) {
      await scheduleChallengeReminder();
    }
  })();
}, []); // Une seule fois au démarrage
```

### 1d — Listener deep-link

```typescript
// Dans app/_layout.tsx, ajouter le listener :
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const type = response.notification.request.content.data?.type as NotificationType;
    
    if (type === 'daily_review') {
      router.push('/(tabs)/review');
    } else if (type === 'daily_challenge') {
      router.push('/(tabs)/learn?openChallenge=true');
    }
  });
  
  return () => subscription.remove();
}, []);
```

### 1e — Ajout au `settingsStore` (Zustand + SQLite)

Dans `src/stores/settingsStore.ts`, ajouter :

```typescript
// Nouveaux champs settings notifications :
notifDailyReviewEnabled: boolean;    // défaut : true
notifHour: number;                   // défaut : 18
notifMinute: number;                 // défaut : 0
notifChallengeEnabled: boolean;      // défaut : true
notifStreakRiskEnabled: boolean;     // défaut : true

// Actions :
setNotifDailyReview: (enabled: boolean) => void;
setNotifTime: (hour: number, minute: number) => void;
setNotifChallenge: (enabled: boolean) => void;
```

Les nouveaux champs doivent être persistés dans la table `user_settings` SQLite (colonnes à ajouter) et synced vers Supabase.

**Migration SQLite à ajouter dans `schema-local.ts` :**
```sql
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notif_review_enabled INTEGER DEFAULT 1;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notif_hour INTEGER DEFAULT 18;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notif_minute INTEGER DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notif_challenge_enabled INTEGER DEFAULT 1;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notif_streak_risk_enabled INTEGER DEFAULT 1;
```

> **Note** : SQLite ne supporte pas `ADD COLUMN IF NOT EXISTS` dans toutes les versions. Utiliser un try/catch ou vérifier `PRAGMA table_info(user_settings)` avant.

**Migration Supabase (SQL Editor Dashboard) :**
```sql
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS notif_review_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_hour SMALLINT DEFAULT 18,
  ADD COLUMN IF NOT EXISTS notif_minute SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notif_challenge_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_streak_risk_enabled BOOLEAN DEFAULT true;
```

### 1f — UI Settings notifications dans le Profile

Dans l'écran Settings (Profile), ajouter une section "Rappels" :

```
Section "Rappels"
├── Toggle "Révision quotidienne"   [ON/OFF]
├── TimePicker "Heure du rappel"    [18:00]  → visible seulement si toggle ON
├── Toggle "Défi quotidien"         [ON/OFF]
└── Toggle "Alerte streak à risque" [ON/OFF]
```

Pour le TimePicker, utiliser un sélecteur simple (deux ScrollPicker, heures 0–23 + minutes 0–55 par pas de 5). Pas de dépendance externe — un `FlatList` horizontal suffira.

### Checkpoint M1
- [ ] `expo-notifications` installé sans erreur
- [ ] Simulateur : `requestPermissions()` → prompt système affiché
- [ ] `scheduleReviewNotification(18, 0)` → notification reçue (test trigger immédiat)
- [ ] Tap sur notification → deep-link vers /review
- [ ] Toggle review OFF → `cancelNotificationsByType('daily_review')` appelé
- [ ] TimePicker : changer l'heure → reschedule automatique
- [ ] Nouveaux champs dans `user_settings` SQLite + Supabase
- [ ] `/checkpoint` → tout vert

---

## MISSION 2 — Seed Darija dans `word_variants` + leçons

### 2a — Migration Supabase : seed word_variants darija

La table `word_variants` existe déjà depuis É0. Il suffit d'insérer les variantes darija pour les mots MSA déjà en base.

**Principe pédagogique :** Le module Darija ne réenseigne pas l'alphabet. Il part du vocabulaire MSA connu et montre ses transformations en darija marocain. Chaque mot darija est ancré à son équivalent MSA via `word_id`.

> ### ⛔ ÉTAPE BLOQUANTE — À faire AVANT d'exécuter le moindre INSERT
>
> Le SQL ci-dessous contient des placeholders `'<word_id_...>'` qui ne sont **pas des valeurs réelles**.
> Exécuter le SQL tel quel provoquera des erreurs de clé étrangère.
>
> **Avant tout, exécuter ce SELECT dans le SQL Editor Supabase pour récupérer les vrais UUIDs :**
>
> ```sql
> SELECT id, arabic FROM words
> WHERE arabic IN (
>   'شكراً', 'أهلاً', 'مرحبا', 'لاباس',
>   'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة',
>   'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
>   'بيت', 'ماء', 'أكل', 'سيارة', 'مكتبة',
>   'ذهب', 'جاء', 'أكل', 'شرب', 'نعم', 'لا'
> );
> ```
>
> **Pour chaque mot trouvé :** remplacer le placeholder correspondant (ex: `'<word_id_shukran>'`) par l'UUID réel retourné.
>
> **Si un mot est absent de la table `words` :** l'insérer d'abord dans `words` avec ses champs obligatoires, puis récupérer son UUID généré avant de continuer.
>
> ✅ Seulement quand TOUS les placeholders sont remplacés par de vrais UUIDs → exécuter le seed.

**Seed dans le SQL Editor Supabase — 40 mots fondamentaux :**

```sql
-- ============================================================
-- ÉTAPE 17 — Seed word_variants darija
-- Variantes marocaines des mots MSA existants
-- ============================================================

-- Note : remplacer les UUIDs word_id par les vrais IDs de ta table words.
-- Ce script est un template — adapter les word_id à ta base.

-- Formules de politesse
INSERT INTO word_variants (id, word_id, variant, arabic, arabic_vocalized, transliteration, notes_fr) VALUES
('wv-dar-001', '<word_id_shukran>', 'darija', 'شكراً', 'شُكْراً', 'šukran', 'Identique au MSA — utilisé partout au Maroc'),
('wv-dar-002', '<word_id_ahlan>', 'darija', 'أهلاً', 'أَهْلاً', 'ahlan', 'Bonjour informel. Variante : مرحبا mərḥba'),
('wv-dar-003', '<word_id_marhaba>', 'darija', 'مرحبا', 'مَرْحَبا', 'mərḥba', 'Salut / Bonjour — très courant au Maroc'),
('wv-dar-004', '<word_id_labas>', 'darija', 'لاباس', 'لَابَاس', 'lābās', 'Ça va ? / Pas de problème — calque du français "il n''y a pas"'),

-- Nombres (1–10 en darija marocain)
('wv-dar-010', '<word_id_wahid>', 'darija', 'واحد', 'وَاحِد', 'wāḥed', 'Identique au MSA'),
('wv-dar-011', '<word_id_ithnan>', 'darija', 'جوج', 'جُوج', 'jūj', 'Deux — très différent du MSA اثنان'),
('wv-dar-012', '<word_id_thalatha>', 'darija', 'تلتة', 'تِلْتَة', 'tlta', 'Trois — contraction du MSA ثلاثة'),
('wv-dar-013', '<word_id_arbaa>', 'darija', 'ربعة', 'رَبْعَة', 'rəbʕa', 'Quatre'),
('wv-dar-014', '<word_id_khamsa>', 'darija', 'خمسة', 'خَمْسَة', 'ḵamsa', 'Cinq — proche du MSA'),
('wv-dar-015', '<word_id_sitta>', 'darija', 'ستة', 'سِتَّة', 'setta', 'Six — identique'),
('wv-dar-016', '<word_id_sabaa>', 'darija', 'سبعة', 'سَبْعَة', 'sebʕa', 'Sept'),
('wv-dar-017', '<word_id_thamania>', 'darija', 'تمنية', 'تَمْنِية', 'tmənya', 'Huit — diverge du MSA ثمانية'),
('wv-dar-018', '<word_id_tisaa>', 'darija', 'تسعة', 'تِسْعَة', 'tesʕud', 'Neuf'),
('wv-dar-019', '<word_id_ashara>', 'darija', 'عشرة', 'عَشْرَة', 'ʕšra', 'Dix — proche du MSA'),

-- Vie quotidienne
('wv-dar-020', '<word_id_bayt>', 'darija', 'دار', 'دَار', 'dār', 'Maison — le MSA بيت existe aussi mais دار est plus courant'),
('wv-dar-021', '<word_id_maa>', 'darija', 'لما / فين', 'لَمَّا / فِين', 'lma / fīn', 'De l''eau — مَا reste valide'),
('wv-dar-022', '<word_id_akl>', 'darija', 'ماكلة', 'مَاكْلَة', 'māklə', 'Nourriture — du verbe كَل (manger en darija)'),
('wv-dar-023', '<word_id_sayara>', 'darija', 'طوموبيل', 'طُومُوبِيل', 'ṭomobīl', 'Voiture — emprunt du français automobile'),
('wv-dar-024', '<word_id_maktaba>', 'darija', 'مكتبة', 'مَكْتَبَة', 'maktba', 'Librairie/bibliothèque — identique au MSA'),

-- Verbes courants (forme de base darija)
('wv-dar-030', '<word_id_dhahaba>', 'darija', 'مشى', 'مْشَى', 'mša', 'Aller/partir — remplace ذهب en darija'),
('wv-dar-031', '<word_id_jaaa>', 'darija', 'جاء / جي', 'جَاء / جِي', 'jā / jī', 'Venir — forme courte جي très courante'),
('wv-dar-032', '<word_id_akala>', 'darija', 'كَل', 'كَل', 'kəl', 'Manger — كَل au lieu de أَكَل'),
('wv-dar-033', '<word_id_shariba>', 'darija', 'شرب', 'شْرَب', 'šrəb', 'Boire — proche du MSA'),
('wv-dar-034', '<word_id_naam>', 'darija', 'إيه / واه', 'إِيهْ / وَاهْ', 'īh / wāh', 'Oui — نعم est compris mais peu utilisé'),
('wv-dar-035', '<word_id_la>', 'darija', 'لا', 'لَا', 'lā', 'Non — identique au MSA')

ON CONFLICT (id) DO NOTHING;
```



### 2b — Composant `DialectBadge`

Créer `src/components/arabic/DialectBadge.tsx` :

```typescript
/**
 * DialectBadge — badge affiché sur les mots qui ont une variante dialectale.
 *
 * Usage : à côté d'un mot dans une leçon pour signaler qu'une version darija existe.
 *
 * Props :
 *   variant : 'darija' | 'egyptian' | 'levantine' | 'quranic'
 *   showFull : si true, affiche le nom complet. Si false, icône seule.
 */

const VARIANT_CONFIG = {
  darija:   { label: 'Darija',   short: 'DZ', color: '#2E7D32', bg: '#E8F5E9' },
  egyptian: { label: 'Égyptien', short: 'EG', color: '#1565C0', bg: '#E3F2FD' },
  levantine:{ label: 'Levantin', short: 'LV', color: '#6A1B9A', bg: '#F3E5F5' },
  quranic:  { label: 'Coranique',short: 'QR', color: '#E65100', bg: '#FFF3E0' },
};

// Rendu : petit badge coloré (ex : "🇲🇦 Darija" ou juste "DZ")
```

### 2c — Composant `DarijaComparisonCard`

Créer `src/components/arabic/DarijaComparisonCard.tsx` :

```typescript
/**
 * DarijaComparisonCard — affiche côte à côte le mot MSA et sa variante darija.
 *
 * Layout :
 * ┌─────────────────────────────────────────┐
 * │  MSA              →    DARIJA           │
 * │  بَيْت (bayt)          دَار (dār)       │
 * │  Maison                Maison           │
 * │  [🔊]                  [🔊]             │
 * └─────────────────────────────────────────┘
 *
 * La flèche signale la transformation. La couleur MSA = neutre.
 * La couleur Darija = vert (couleur Maroc).
 */
```

### 2d — Leçons Darija dans Supabase

Ajouter un module Darija et ses premières leçons :

```sql
-- Module Darija
INSERT INTO modules (id, title_fr, title_ar, description_fr, sort_order, icon)
VALUES (
  'module-darija-1',
  'Darija — Marocain de base',
  'الدارجة المغربية',
  'Les 40 mots fondamentaux pour survivre au Maroc. Partez du MSA que vous connaissez.',
  11,
  '🇲🇦'
) ON CONFLICT (id) DO NOTHING;

-- Leçon 1 : Salutations darija
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  'lesson-darija-101',
  'module-darija-1',
  'Salutations marocaines',
  'التحيات المغربية',
  'MSA vs Darija : comment se saluer au Maroc',
  1, 30, 8
) ON CONFLICT (id) DO NOTHING;

-- Leçon 2 : Nombres darija
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  'lesson-darija-102',
  'module-darija-1',
  'Compter en darija',
  'العدد بالدارجة',
  'Les chiffres de 1 à 10 — surprises garanties !',
  2, 30, 10
) ON CONFLICT (id) DO NOTHING;

-- Leçon 3 : Vie quotidienne darija
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  'lesson-darija-103',
  'module-darija-1',
  'La vie de tous les jours',
  'الحياة اليومية',
  'Maison, nourriture, transport, oui/non',
  3, 40, 12
) ON CONFLICT (id) DO NOTHING;
```

### 2e — Hook `useDarijaVariants`

Créer `src/hooks/useDarijaVariants.ts` :

```typescript
/**
 * Retourne les variantes darija pour une liste de word_ids.
 * Lit depuis SQLite local (word_variants table).
 */

export function useDarijaVariants(wordIds: string[]): Map<string, WordVariant> {
  // SELECT * FROM word_variants
  // WHERE word_id IN (?) AND variant = 'darija'
  // Retourne une Map<word_id, WordVariant>
}
```

### Checkpoint M2
- [ ] `SELECT COUNT(*) FROM word_variants WHERE variant = 'darija'` → 35+ lignes dans Supabase
- [ ] Module `module-darija-1` et 3 leçons visibles dans l'app (onglet Learn)
- [ ] `DialectBadge` rendu correct ("🇲🇦 Darija" ou "DZ")
- [ ] `DarijaComparisonCard` : MSA → Darija côte à côte, AudioButton sur les deux
- [ ] `useDarijaVariants` retourne une Map correcte depuis SQLite
- [ ] `@arabic-content-validator` sur les seeds darija → pas d'erreur
- [ ] `/checkpoint` → tout vert

---

## MISSION 3 — Schéma et seed du module Arabe Coranique

### 3a — Migration Supabase : table `quran_entries`

```sql
-- ============================================================
-- ÉTAPE 15 — Module Coranique
-- ============================================================

-- Table quran_entries : vocabulaire des sourates courtes
CREATE TABLE IF NOT EXISTS quran_entries (
  id                TEXT PRIMARY KEY,
  surah_number      INTEGER NOT NULL,         -- numéro de sourate (1–114)
  surah_name_ar     TEXT NOT NULL,            -- الفاتحة
  surah_name_fr     TEXT NOT NULL,            -- Al-Fatiha
  ayah_number       INTEGER NOT NULL,         -- numéro du verset
  word_position     INTEGER NOT NULL,         -- position du mot dans le verset
  arabic            TEXT NOT NULL,            -- mot sans harakats
  arabic_vocalized  TEXT NOT NULL,            -- mot avec harakats (tajwid)
  transliteration   TEXT NOT NULL,
  translation_fr    TEXT NOT NULL,            -- traduction du mot isolé
  context_fr        TEXT,                     -- contexte dans le verset
  root_id           TEXT REFERENCES roots(id), -- racine si connue
  tajwid_notes      TEXT,                     -- règle de tajwid applicable (intro seulement)
  sort_order        INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE quran_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quran_entries_public_read" ON quran_entries FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_quran_surah ON quran_entries(surah_number);
CREATE INDEX IF NOT EXISTS idx_quran_root ON quran_entries(root_id);

-- Extension card_type SRS pour les mots coraniques
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'srs_card_type') THEN
    ALTER TYPE srs_card_type ADD VALUE IF NOT EXISTS 'quran_word';
  END IF;
END$$;
```

### 3b — Migration SQLite locale

Dans `schema-local.ts`, ajouter :

```sql
CREATE TABLE IF NOT EXISTS quran_entries (
  id               TEXT PRIMARY KEY,
  surah_number     INTEGER NOT NULL,
  surah_name_ar    TEXT NOT NULL,
  surah_name_fr    TEXT NOT NULL,
  ayah_number      INTEGER NOT NULL,
  word_position    INTEGER NOT NULL,
  arabic           TEXT NOT NULL,
  arabic_vocalized TEXT NOT NULL,
  transliteration  TEXT NOT NULL,
  translation_fr   TEXT NOT NULL,
  context_fr       TEXT,
  root_id          TEXT,
  tajwid_notes     TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  synced_at        INTEGER
);
```

### 3c — Seed : vocabulaire des 10 sourates courtes

Les 10 sourates les plus récitées après Al-Fatiha : Al-Ikhlas (112), Al-Falaq (113), An-Nas (114), Al-Asr (103), Al-Kawthar (108), Al-Kafiroun (109), An-Nasr (110), Al-Masad (111), Al-Fil (105), Adh-Dhariyat partial.

Seed uniquement Al-Fatiha (7 versets, ~30 mots) et Al-Ikhlas (4 versets, ~15 mots) dans ce premier seed. Les autres sourates en seed progressif.

```sql
-- SOURATE 1 : AL-FATIHA — الفاتحة
INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

-- Verset 1 : بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
('qe-1-1-1', 1, 'الفاتحة', 'Al-Fatiha', 1, 1, 'بسم', 'بِسْمِ', 'bismi', 'Au nom de', 'Kasra sur Ba — liaison avec le mot suivant', 1),
('qe-1-1-2', 1, 'الفاتحة', 'Al-Fatiha', 1, 2, 'الله', 'اللَّهِ', 'llāhi', 'Allah (Dieu)', 'Lam mushaddad — Chadda sur le Lam', 2),
('qe-1-1-3', 1, 'الفاتحة', 'Al-Fatiha', 1, 3, 'الرحمن', 'الرَّحْمَٰنِ', 'r-raḥmāni', 'Le Très Miséricordieux', 'Ra est une lettre solaire — assimilation du Lam', 3),
('qe-1-1-4', 1, 'الفاتحة', 'Al-Fatiha', 1, 4, 'الرحيم', 'الرَّحِيمِ', 'r-raḥīmi', 'Le Très Compatissant', 'Idem — Ra solaire', 4),

-- Verset 2 : الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
('qe-1-2-1', 1, 'الفاتحة', 'Al-Fatiha', 2, 1, 'الحمد', 'الْحَمْدُ', 'al-ḥamdu', 'La louange', 'Hamza de l''article — Ha pharyngal', 5),
('qe-1-2-2', 1, 'الفاتحة', 'Al-Fatiha', 2, 2, 'لله', 'لِلَّهِ', 'lillāhi', 'À Allah', NULL, 6),
('qe-1-2-3', 1, 'الفاتحة', 'Al-Fatiha', 2, 3, 'رب', 'رَبِّ', 'rabbi', 'Seigneur de', 'Chadda sur Ba', 7),
('qe-1-2-4', 1, 'الفاتحة', 'Al-Fatiha', 2, 4, 'العالمين', 'الْعَالَمِينَ', 'al-ʕālamīna', 'Les mondes', 'Ayn — son pharyngal', 8),

-- Verset 3 : الرَّحْمَٰنِ الرَّحِيمِ (répétition — renforcement)
('qe-1-3-1', 1, 'الفاتحة', 'Al-Fatiha', 3, 1, 'الرحمن', 'الرَّحْمَٰنِ', 'r-raḥmāni', 'Le Très Miséricordieux', 'Répétition — renforce la mémorisation', 9),
('qe-1-3-2', 1, 'الفاتحة', 'Al-Fatiha', 3, 2, 'الرحيم', 'الرَّحِيمِ', 'r-raḥīmi', 'Le Très Compatissant', NULL, 10),

-- Verset 4 : مَالِكِ يَوْمِ الدِّينِ
('qe-1-4-1', 1, 'الفاتحة', 'Al-Fatiha', 4, 1, 'مالك', 'مَالِكِ', 'māliki', 'Maître de', NULL, 11),
('qe-1-4-2', 1, 'الفاتحة', 'Al-Fatiha', 4, 2, 'يوم', 'يَوْمِ', 'yawmi', 'Jour', NULL, 12),
('qe-1-4-3', 1, 'الفاتحة', 'Al-Fatiha', 4, 3, 'الدين', 'الدِّينِ', 'd-dīni', 'Le Jugement (la religion)', 'Dal lettre solaire — assimilation', 13),

-- Verset 5 : إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ
('qe-1-5-1', 1, 'الفاتحة', 'Al-Fatiha', 5, 1, 'إياك', 'إِيَّاكَ', 'iyyāka', 'C''est Toi seul que', 'Chadda sur Ya', 14),
('qe-1-5-2', 1, 'الفاتحة', 'Al-Fatiha', 5, 2, 'نعبد', 'نَعْبُدُ', 'naʕbudu', 'nous adorons', 'Ayn — son pharyngal', 15),
('qe-1-5-3', 1, 'الفاتحة', 'Al-Fatiha', 5, 3, 'نستعين', 'نَسْتَعِينُ', 'nastaʕīnu', 'nous implorons l''aide', NULL, 16),

-- Verset 6 : اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ
('qe-1-6-1', 1, 'الفاتحة', 'Al-Fatiha', 6, 1, 'اهدنا', 'اهْدِنَا', 'ihdinā', 'Guide-nous vers', NULL, 17),
('qe-1-6-2', 1, 'الفاتحة', 'Al-Fatiha', 6, 2, 'الصراط', 'الصِّرَاطَ', 'ṣ-ṣirāṭa', 'le chemin / la voie', 'Sad lettre solaire + emphatique', 18),
('qe-1-6-3', 1, 'الفاتحة', 'Al-Fatiha', 6, 3, 'المستقيم', 'الْمُسْتَقِيمَ', 'al-mustaqīma', 'droit / direct', NULL, 19),

-- Verset 7 : صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ ...
('qe-1-7-1', 1, 'الفاتحة', 'Al-Fatiha', 7, 1, 'أنعمت', 'أَنْعَمْتَ', 'anʕamta', 'Tu as comblé de bienfaits', NULL, 20),
('qe-1-7-2', 1, 'الفاتحة', 'Al-Fatiha', 7, 2, 'عليهم', 'عَلَيْهِمْ', 'ʕalayhim', 'sur eux', NULL, 21),
('qe-1-7-3', 1, 'الفاتحة', 'Al-Fatiha', 7, 3, 'الضالين', 'الضَّالِّينَ', 'ḍ-ḍāllīna', 'les égarés', 'Dad emphatique + chadda sur Lam', 22)

ON CONFLICT (id) DO NOTHING;

-- SOURATE 112 : AL-IKHLAS — الإخلاص
INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

('qe-112-1-1', 112, 'الإخلاص', 'Al-Ikhlas', 1, 1, 'قل', 'قُلْ', 'qul', 'Dis !', 'Soukoun sur Lam', 30),
('qe-112-1-2', 112, 'الإخلاص', 'Al-Ikhlas', 1, 2, 'هو', 'هُوَ', 'huwa', 'Il est', NULL, 31),
('qe-112-1-3', 112, 'الإخلاص', 'Al-Ikhlas', 1, 3, 'الله', 'اللَّهُ', 'llāhu', 'Allah', NULL, 32),
('qe-112-1-4', 112, 'الإخلاص', 'Al-Ikhlas', 1, 4, 'أحد', 'أَحَدٌ', 'aḥadun', 'l''Unique', 'Tanwin — marque de l''indétermination', 33),

('qe-112-2-1', 112, 'الإخلاص', 'Al-Ikhlas', 2, 1, 'الله', 'اللَّهُ', 'llāhu', 'Allah', NULL, 34),
('qe-112-2-2', 112, 'الإخلاص', 'Al-Ikhlas', 2, 2, 'الصمد', 'الصَّمَدُ', 'ṣ-ṣamadu', 'l''Absolu / le Refuge', 'Sad lettre solaire + emphatique', 35),

('qe-112-3-1', 112, 'الإخلاص', 'Al-Ikhlas', 3, 1, 'لم', 'لَمْ', 'lam', 'Il n''a pas', 'Soukoun — particule de négation', 36),
('qe-112-3-2', 112, 'الإخلاص', 'Al-Ikhlas', 3, 2, 'يلد', 'يَلِدْ', 'yalid', 'engendré', 'Soukoun final', 37),
('qe-112-3-3', 112, 'الإخلاص', 'Al-Ikhlas', 3, 3, 'ولم', 'وَلَمْ', 'wa-lam', 'et Il n''a pas été', NULL, 38),
('qe-112-3-4', 112, 'الإخلاص', 'Al-Ikhlas', 3, 4, 'يولد', 'يُولَدْ', 'yūlad', 'engendré', NULL, 39),

('qe-112-4-1', 112, 'الإخلاص', 'Al-Ikhlas', 4, 1, 'ولم', 'وَلَمْ', 'wa-lam', 'et Il n''a pas', NULL, 40),
('qe-112-4-2', 112, 'الإخلاص', 'Al-Ikhlas', 4, 2, 'يكن', 'يَكُن', 'yakun', 'été', NULL, 41),
('qe-112-4-3', 112, 'الإخلاص', 'Al-Ikhlas', 4, 3, 'له', 'لَهُ', 'lahu', 'pour Lui', NULL, 42),
('qe-112-4-4', 112, 'الإخلاص', 'Al-Ikhlas', 4, 4, 'كفوا', 'كُفُوًا', 'kufuwan', 'd''équivalent', 'Tanwin — indétermination', 43),
('qe-112-4-5', 112, 'الإخلاص', 'Al-Ikhlas', 4, 5, 'أحد', 'أَحَدٌ', 'aḥadun', 'aucun', 'Répétition du mot de clôture', 44)

ON CONFLICT (id) DO NOTHING;
```

### 3d — Module et leçons Coranique dans Supabase

```sql
INSERT INTO modules (id, title_fr, title_ar, description_fr, sort_order, icon)
VALUES (
  'module-quran-1',
  'Arabe Coranique — Les Fondations',
  'العربية القرآنية — الأساسيات',
  'Comprendre mot à mot les sourates que tu récites chaque jour. Commence par Al-Fatiha.',
  12,
  '📖'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES
  ('lesson-quran-101', 'module-quran-1', 'Al-Fatiha mot à mot', 'الفاتحة كلمة بكلمة',
   'Les 7 versets, chaque mot expliqué, chaque son articulé.', 1, 50, 15),
  ('lesson-quran-102', 'module-quran-1', 'Al-Ikhlas et l''Unité', 'الإخلاص والتوحيد',
   '4 versets courts, un vocabulaire fondamental sur le Tawhid.', 2, 40, 10)
ON CONFLICT (id) DO NOTHING;
```

### Checkpoint M3
- [ ] Table `quran_entries` créée dans Supabase avec RLS
- [ ] Table `quran_entries` créée dans SQLite
- [ ] `SELECT COUNT(*) FROM quran_entries` → 44+ lignes dans Supabase
- [ ] Modules `module-quran-1` et ses 2 leçons visibles dans l'app
- [ ] `@arabic-content-validator` sur les seeds coraniques → pas d'erreur
- [ ] `/checkpoint` → tout vert

---

## MISSION 4 — Sync quran_entries + composants coraniques

### 4a — Sync dans `content-sync.ts`

Ajouter `quran_entries` au cycle de sync (même pattern que `grammar_rules`) :

```typescript
async function syncQuranEntries() {
  const { data, error } = await supabase
    .from('quran_entries')
    .select('*')
    .order('surah_number, ayah_number, word_position');

  if (error || !data) return;

  const db = await getLocalDB();
  await db.runAsync('DELETE FROM quran_entries');
  for (const entry of data) {
    await db.runAsync(
      `INSERT INTO quran_entries
         (id, surah_number, surah_name_ar, surah_name_fr, ayah_number,
          word_position, arabic, arabic_vocalized, transliteration,
          translation_fr, context_fr, root_id, tajwid_notes, sort_order, synced_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [entry.id, entry.surah_number, entry.surah_name_ar, entry.surah_name_fr,
       entry.ayah_number, entry.word_position, entry.arabic, entry.arabic_vocalized,
       entry.transliteration, entry.translation_fr, entry.context_fr,
       entry.root_id, entry.tajwid_notes, entry.sort_order, Date.now()]
    );
  }
}
```

Ajouter `quran_entries` dans `sync_metadata` (nouvelle entrée dans la liste des tables à tracker).

### 4b — Composant `QuranWordCard`

Créer `src/components/arabic/QuranWordCard.tsx` :

```typescript
/**
 * QuranWordCard — carte pour un mot coranique.
 *
 * Layout :
 * ┌──────────────────────────────────────────────┐
 * │  [📖 Al-Fatiha • V.2 • Mot 1]               │
 * │                                               │
 * │     الْحَمْدُ          [🔊 lent]             │
 * │     al-ḥamdu                                  │
 * │                                               │
 * │     "La louange"                              │
 * │                                               │
 * │  ┌───────────────────────────────────────┐   │
 * │  │ 📝 Tajwid : Hamza de liaison          │   │
 * │  │    Ha pharyngal — souffle profond     │   │
 * │  └───────────────────────────────────────┘   │
 * └──────────────────────────────────────────────┘
 *
 * La note tajwid est optionnelle et affichée dans une boîte dorée discrète.
 * AudioButton rate=0.5 (très lent pour l'apprentissage coranique).
 */

interface QuranWordCardProps {
  entry: QuranEntry;
  showTajwidNotes?: boolean; // défaut : true
}
```

### 4c — Composant `SurahDisplay`

Créer `src/components/arabic/SurahDisplay.tsx` :

```typescript
/**
 * SurahDisplay — affiche une sourate verset par verset, mot par mot.
 *
 * Pour chaque verset :
 * - Ligne arabe complète avec harakats (cliquable mot par mot)
 * - Translittération sous chaque mot (configurable)
 * - Traduction française du verset en bloc sous la ligne arabe
 * - Tap sur un mot → QuranWordCard en modal/bottom sheet
 *
 * RTL natif : la ligne arabe est alignée à droite.
 */

interface SurahDisplayProps {
  surahNumber: number;
  showTransliteration?: boolean;
  showTranslation?: boolean;
  onWordTap?: (entry: QuranEntry) => void;
}
```

### 4d — Seed SRS cartes coraniques

Ajouter dans `srs-seed.ts` :

```typescript
export async function seedQuranSRSCards(): Promise<number> {
  const db = await getLocalDB();

  const words = await db.getAllAsync<{
    id: string; arabic_vocalized: string; translation_fr: string;
    surah_name_fr: string; ayah_number: number;
  }>(
    `SELECT qe.id, qe.arabic_vocalized, qe.translation_fr, qe.surah_name_fr, qe.ayah_number
     FROM quran_entries qe
     LEFT JOIN srs_cards sc ON sc.content_id = qe.id AND sc.card_type = 'quran_word'
     WHERE sc.id IS NULL`
  );

  let inserted = 0;
  for (const word of words) {
    await db.runAsync(
      `INSERT OR IGNORE INTO srs_cards
         (id, user_id, card_type, content_id, front_text, back_text,
          easiness, interval, repetitions, next_review, created_at)
       VALUES (?, 'local', 'quran_word', ?, ?, ?, 2.5, 1, 0, ?, ?)`,
      [
        `srs-quran-${word.id}`,
        word.id,
        word.arabic_vocalized,
        `${word.translation_fr} (${word.surah_name_fr}, v.${word.ayah_number})`,
        Date.now(),
        Date.now(),
      ]
    );
    inserted++;
  }
  return inserted;
}
```

### Checkpoint M4
- [ ] `quran_entries` synced dans SQLite après `runSync()`
- [ ] `seedQuranSRSCards()` → 44+ cartes insérées
- [ ] `QuranWordCard` : mot arabe + translittération + traduction + note tajwid
- [ ] AudioButton `rate=0.5` sur QuranWordCard → lecture très lente
- [ ] `SurahDisplay` : verset arabe clickable mot par mot
- [ ] Tap sur un mot → QuranWordCard en modal
- [ ] `/checkpoint` → tout vert

---

## MISSION 5 — Réviser tab : filtre Coran + card QuranWord

### 5a — Filtre "Coran" dans le Réviser tab

Ajouter `quran_word` à la liste des filtres SRS dans `ReviserScreen` :

```typescript
type SRSFilter = 'all' | 'letter' | 'word' | 'conjugation' | 'grammar_rule' | 'quran_word';

const FILTER_LABELS: Record<SRSFilter, string> = {
  // ... existants
  quran_word: 'Coran',
};
```

### 5b — Composant `QuranSRSCard` dans le Réviser

Créer `src/components/srs/QuranSRSCard.tsx` :

```typescript
/**
 * QuranSRSCard — carte SRS pour un mot coranique.
 *
 * Recto : mot arabe vocalisé + AudioButton rate=0.5
 * Verso : traduction + contexte sourate + note tajwid si disponible
 *
 * Différence avec WordCard : taille de police plus grande (texte coranique
 * mérite plus de respect visuel), note tajwid affichée au verso.
 */
```

### Checkpoint M5
- [ ] Filtre 'Coran' visible dans Réviser avec badge count
- [ ] `QuranSRSCard` : recto mot arabe + audio, verso traduction + contexte
- [ ] SM-2 rating fonctionne sur cartes `quran_word`
- [ ] Mode avion : révision coraniques entièrement depuis SQLite
- [ ] `/checkpoint` → tout vert

---

## MISSION 6 — Tests end-to-end + régression complète

### 6a — Validation automatique toolkit

Lance `@regression-tester`. Tous les axes doivent être ✅.

### 6b — Validation contenu arabe

Lance `@arabic-content-validator` sur l'ensemble des seeds É17 (word_variants darija, quran_entries, cartes SRS coraniques).

### 6c — Notifications

1. Permissions accordées sur device physique iOS ou Android
2. Modifier l'heure de rappel dans Settings → reschedule automatique
3. Couper les notifications → toggle OFF dans Settings → `cancelNotificationsByType` appelé
4. Deep-link : notification révision → onglet Réviser
5. Deep-link : notification défi → onglet Learn

### 6d — Module Darija

1. Onglet Learn → module "🇲🇦 Darija" visible
2. Leçon 1 → DarijaComparisonCard MSA/Darija s'affiche correctement
3. AudioButton sur mot darija → prononciation arabe
4. `useDarijaVariants` → Map correctement remplie depuis SQLite

### 6e — Module Coranique

1. Onglet Learn → module "📖 Arabe Coranique" visible
2. Leçon Al-Fatiha → SurahDisplay affiche tous les versets en RTL
3. Tap sur "الْحَمْدُ" → QuranWordCard modal avec note tajwid
4. AudioButton rate=0.5 → lecture lente
5. Réviser → filtre "Coran" → 44+ cartes disponibles

### 6f — Régression M1–M10

1. Compléter une leçon M1 → XP + streak OK
2. Réviser → filtres Lettres/Mots/Conjugaisons/Grammaire toujours fonctionnels
3. Audio M1–M10 → AudioButton répond partout
4. Mode avion → toute l'app fonctionne (lettres, révisions, coranique)
5. Profile → stats SRS : 5+ types désormais

### Checkpoint final É17

- [ ] `@regression-tester` → tout vert
- [ ] `@arabic-content-validator` → pas d'erreur
- [ ] `/checkpoint` → tout vert
- [ ] Notifications : permissions gérées + scheduling local révision + défi
- [ ] Notifications : deep-link vers /review et /learn
- [ ] Settings : heure configurable, toggles par type
- [ ] `word_variants` darija : 35+ entrées dans Supabase + SQLite
- [ ] Module Darija : 3 leçons visibles, DarijaComparisonCard fonctionnel
- [ ] DialectBadge rendu correct en RTL
- [ ] `quran_entries` : 44+ mots dans Supabase + SQLite
- [ ] Module Coranique : 2 leçons visibles, SurahDisplay fonctionnel
- [ ] QuranWordCard : mot + audio slow + note tajwid
- [ ] SRS : 44+ cartes `quran_word` créées par `seedQuranSRSCards()`
- [ ] Réviser : filtre "Coran" avec QuranSRSCard
- [ ] Profile : 5+ types SRS dans les stats
- [ ] Mode avion : tout fonctionne (notifications locales incluses)
- [ ] Aucune régression M1–M10

---

## RÉSUMÉ DE L'ÉTAPE 17

| Mission | Livrable | Statut |
|---------|----------|--------|
| 0 | `@codebase-scout` — scan initial du repo | ⬜ |
| 1 | Notifications push locales (révision + défi + deep-link + settings) | ⬜ |
| 2 | `word_variants` darija (40 mots) + DarijaComparisonCard + module 3 leçons | ⬜ |
| 3 | Table `quran_entries` + seed Al-Fatiha + Al-Ikhlas + module 2 leçons | ⬜ |
| 4 | Sync `quran_entries` + QuranWordCard + SurahDisplay + seed SRS | ⬜ |
| 5 | Réviser tab : filtre Coran + QuranSRSCard | ⬜ |
| 6 | `@regression-tester` + `@arabic-content-validator` + tests manuels | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs après É17 :**
- `ETAPE-17-notifications-dialectes-coranique.md` (ce fichier)
- `lisaan-seed-letters.json`

**Fichiers à supprimer de /docs :**
- `ETAPE-16-audio-srs-etendu.md` (terminée)

---

> **Prochaine étape après validation :** Étape 18 — Module Darija étendu (dialecte égyptien intro), arabe coranique sourates 3–10, système de badges étendu, et première session de bêta-test fermée avec métriques de rétention J7/J30.
