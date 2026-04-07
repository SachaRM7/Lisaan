# ÉTAPE 19 — Bêta fermée, Dialectes levantin & khaliji, Sourates 93/94/97, Dashboard analytics

> Étapes terminées : 0 → 18.
> Cette étape : lancement de la bêta fermée (EAS Build + 30 testeurs), dialectes levantin et khaliji (intro, 30 variantes chacun), sourates Adh-Duha / Al-Inshirah / Al-Qadr (~97 mots coraniques), et tableau de bord analytics admin (métriques J7/J30).
> Règle : missions séquentielles, checkpoints obligatoires.

> **Philosophie de cette étape** :
> - Le lancement bêta est le moment de vérité : on passe de "ça marche sur mon émulateur" à "30 vrais utilisateurs le tiennent en main". EAS Build + OTA updates sont l'infrastructure qui rend ça possible sans soumettre à l'App Store.
> - Levantin et khaliji suivent exactement le pattern Darija (É17) / Égyptien (É18) : variantes dans `word_variants`, pas une nouvelle ligne de code si l'architecture tient. C'est le test ultime du modèle multi-dialecte.
> - Les trois sourates choisies (Adh-Duha, Al-Inshirah, Al-Qadr) ont une forte résonance émotionnelle et culturelle — elles sont universellement connues. Elles complètent le corpus des sourates "du cœur" avant d'attaquer les sourates plus longues.
> - Le dashboard analytics n'est pas un luxe : sans vision des métriques J7/J30, on ne peut pas prioriser les itérations post-bêta. Un écran simple dans l'app (admin only) suffit pour cette phase.

---

## Périmètre de É19

| Domaine | Contenu | Nouvelles tables/composants |
|---------|---------|----------------------------|
| Build bêta | EAS Build config + OTA + invite link system | `app.config.ts` updates, `eas.json` |
| Coranique | Sourates 93, 94, 97 (~97 entrées) + 3 leçons | Seed `quran_entries` uniquement |
| Levantin | 30 variantes `word_variants` 'levantine' + module 3 leçons | Seed `word_variants` uniquement |
| Khaliji | 30 variantes `word_variants` 'khaliji' + module 3 leçons | Seed `word_variants` uniquement |
| Analytics | Dashboard métriques J7/J30 (admin only) | `AnalyticsDashboardScreen` |

**Ce qui est OUT de É19 :**
- Tajwid interactif — Phase 3
- Mode examen chronométré — Phase 3
- Conversation IA — Phase 3
- Reconnaissance vocale — Phase 3
- Publication App Store / Play Store public — après É20+

---

## MISSION 0 — Scan initial

Lance `@codebase-scout` puis confirme l'état du repo avant de commencer. Vérifie en particulier :
- Table `quran_entries` (doit contenir 177+ entrées depuis É17+É18 — Al-Fatiha, Al-Ikhlas, puis 6 sourates É18)
- Table `word_variants` (darija seedé en É17, egyptian seedé en É18)
- Table `user_badges` (20 badges depuis É18)
- Table `beta_feedback` (créée en É18)
- PostHog EU (initialisé en É18)
- `badge-engine.ts` (checkAndAwardBadges() depuis É18)
- `DialectBadge` composant (créé en É17, étendu en É18 avec 'EG')

---

## MISSION 1 — EAS Build + infrastructure bêta fermée

### Contexte

EAS (Expo Application Services) permet de produire des builds iOS/Android distribuables sans passer par l'App Store public. On cible :
- **iOS** : TestFlight (lien d'invitation direct pour les 30 testeurs)
- **Android** : APK direct (pas Play Console pour la bêta — plus rapide)
- **OTA updates** : via `expo-updates`, les corrections de bugs sont poussées sans rebuild

### 1a — Configurer `eas.json`

Dans le répertoire racine du projet, créer ou mettre à jour `eas.json` :

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "enterpriseProvisioning": "adhoc"
      },
      "android": {
        "buildType": "apk"
      },
      "channel": "preview"
    },
    "production": {
      "distribution": "store",
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "APPLE_ID_PLACEHOLDER",
        "ascAppId": "ASC_APP_ID_PLACEHOLDER",
        "appleTeamId": "TEAM_ID_PLACEHOLDER"
      }
    }
  }
}
```

### 1b — Mettre à jour `app.config.ts` / `app.json`

S'assurer que les champs suivants sont présents et corrects :

```typescript
// app.config.ts
export default {
  expo: {
    name: "Lisaan",
    slug: "lisaan",
    version: "0.19.0",
    runtimeVersion: {
      policy: "sdkVersion"
    },
    updates: {
      url: "https://u.expo.dev/[PROJECT_ID]",
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0
    },
    ios: {
      bundleIdentifier: "com.lisaan.app",
      supportsTablet: false
    },
    android: {
      package: "com.lisaan.app",
      versionCode: 19
    },
    extra: {
      eas: {
        projectId: "[EAS_PROJECT_ID]"
      }
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2D6A4F"
        }
      ]
    ]
  }
}
```

**Note** : remplacer `[PROJECT_ID]` et `[EAS_PROJECT_ID]` par les valeurs réelles du tableau de bord Expo.

### 1c — Service `invite-beta.ts`

Créer `src/services/invite-beta.ts` :

```typescript
// Service pour générer et valider les codes d'invitation bêta
// Un code est un UUID court (8 chars) stocké dans Supabase beta_invites
// L'invité saisit son code à l'onboarding → is_beta_tester = true

export interface BetaInvite {
  code: string;
  used: boolean;
  used_by?: string;
  created_at: string;
}

export async function validateBetaInviteCode(code: string): Promise<boolean> {
  // Vérifie dans Supabase que le code existe et n'est pas utilisé
  // Si valide : marque used = true, met à jour user.is_beta_tester = true
  // Retourne true si valide, false sinon
}

export async function markBetaTester(userId: string): Promise<void> {
  // Met à jour user_profiles.is_beta_tester = true
  // Fire-and-forget vers Supabase
}
```

### 1d — Migration SQL : table `beta_invites`

Dans le SQL Editor Supabase :

```sql
-- Table beta_invites
CREATE TABLE IF NOT EXISTS beta_invites (
  code        TEXT PRIMARY KEY,           -- ex: "LIS-A7F3"
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  used        BOOLEAN DEFAULT FALSE,
  used_by     UUID REFERENCES auth.users(id),
  used_at     TIMESTAMPTZ,
  email_hint  TEXT                        -- optionnel : email de la personne invitée
);

-- RLS : admin only (service role)
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;

-- Seed 35 codes (5 de réserve sur 30 testeurs)
INSERT INTO beta_invites (code) VALUES
  ('LIS-A1B2'), ('LIS-C3D4'), ('LIS-E5F6'), ('LIS-G7H8'), ('LIS-I9J0'),
  ('LIS-K1L2'), ('LIS-M3N4'), ('LIS-O5P6'), ('LIS-Q7R8'), ('LIS-S9T0'),
  ('LIS-U1V2'), ('LIS-W3X4'), ('LIS-Y5Z6'), ('LIS-A7C8'), ('LIS-B9D0'),
  ('LIS-E1G2'), ('LIS-F3H4'), ('LIS-I5K6'), ('LIS-J7L8'), ('LIS-M9N0'),
  ('LIS-O1Q2'), ('LIS-P3R4'), ('LIS-S5T6'), ('LIS-U7V8'), ('LIS-W9X0'),
  ('LIS-Y1Z2'), ('LIS-A3B4'), ('LIS-C5D6'), ('LIS-E7F8'), ('LIS-G9H0'),
  ('LIS-I1J2'), ('LIS-K3L4'), ('LIS-M5N6'), ('LIS-O7P8'), ('LIS-Q9R0');
```

### 1e — Écran d'entrée du code bêta dans l'onboarding

Dans `src/app/onboarding/` — ajouter un écran optionnel `BetaCodeScreen` entre l'écran 5 (recommandation) et la navigation vers l'app principale :

```typescript
// screens/BetaCodeScreen.tsx
// - Champ texte pour entrer le code "LIS-XXXX"
// - Bouton "Activer" → validateBetaInviteCode()
// - Si valide : toast "Accès bêta activé ✓" → continuer
// - Si invalide : message d'erreur discret
// - Lien "Passer" pour les utilisateurs sans code (accès public limité)
// - Le champ auto-formate : uppercase + tiret automatique
// - useTheme() obligatoire — design system post-É12
```

### Checkpoint Mission 1

```
- [ ] `/checkpoint` → tout vert
- [ ] eas.json créé avec profiles development / preview / production
- [ ] app.config.ts version 0.19.0, versionCode 19, expo-updates configuré
- [ ] Table beta_invites dans Supabase (35 codes seedés)
- [ ] invite-beta.ts : validateBetaInviteCode() et markBetaTester() implémentés
- [ ] BetaCodeScreen dans onboarding (optionnel — bouton "Passer" présent)
- [ ] eas build --profile preview --platform android → build APK déclenché sur EAS (ne pas attendre la fin — continuer les missions)
```

---

## MISSION 2 — Seed sourates coraniques 93, 94, 97

### Contexte pédagogique

- **Adh-Duha (93)** — 11 versets, ~40 mots. "Le matin lumineux." Sourate de réconfort et d'espoir — très connue, forte charge émotionnelle.
- **Al-Inshirah (94)** — 8 versets, ~27 mots. "L'expansion de la poitrine." Complément naturel d'Adh-Duha — souvent récitées ensemble.
- **Al-Qadr (97)** — 5 versets, ~30 mots. "La nuit du Destin (Laylat al-Qadr)." Parmi les 10 dernières nuits du Ramadan — résonance spirituelle maximale.

Total visé : ~97 nouvelles entrées `quran_entries`.

> ### ⛔ ÉTAPE BLOQUANTE — Vérification sort_order avant seed
>
> Avant d'exécuter les INSERT, vérifier la dernière valeur sort_order en base :
> ```sql
> SELECT MAX(sort_order) FROM quran_entries;
> ```
> Le résultat attendu est ~177 (fin É18). Les sort_order ci-dessous commencent à 200.
> Si le MAX est différent, ajuster la plage en conséquence.

### 2a — Seed Supabase : Adh-Duha (93)

```sql
-- ============================================================
-- ÉTAPE 19 — Seed quran_entries : sourate 93 (Adh-Duha)
-- ============================================================

INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

-- V1 : وَالضُّحَىٰ
('qe-93-1-1', 93, 'الضحى', 'Adh-Duha', 1, 1, 'والضحى', 'وَالضُّحَىٰ', 'waḍ-ḍuḥā', 'Par le matin lumineux !', 'Waw serment + Dhad emphatique + Chadda', 200),

-- V2 : وَاللَّيْلِ إِذَا سَجَىٰ
('qe-93-2-1', 93, 'الضحى', 'Adh-Duha', 2, 1, 'والليل', 'وَاللَّيْلِ', 'wal-layli', 'Et par la nuit', 'Lam solaire + Chadda', 201),
('qe-93-2-2', 93, 'الضحى', 'Adh-Duha', 2, 2, 'إذا', 'إِذَا', 'idhā', 'quand', NULL, 202),
('qe-93-2-3', 93, 'الضحى', 'Adh-Duha', 2, 3, 'سجى', 'سَجَىٰ', 'sajā', 'elle s''étend (couvre tout)', 'Alif maqsura — prononciation tendue', 203),

-- V3 : مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ
('qe-93-3-1', 93, 'الضحى', 'Adh-Duha', 3, 1, 'ما', 'مَا', 'mā', 'Ton Seigneur ne t''a pas', NULL, 204),
('qe-93-3-2', 93, 'الضحى', 'Adh-Duha', 3, 2, 'ودعك', 'وَدَّعَكَ', 'waddaʕaka', 'abandonné', 'Chadda sur Dal — intensité', 205),
('qe-93-3-3', 93, 'الضحى', 'Adh-Duha', 3, 3, 'ربك', 'رَبُّكَ', 'rabbuka', 'ton Seigneur', 'Chadda sur Ba', 206),
('qe-93-3-4', 93, 'الضحى', 'Adh-Duha', 3, 4, 'وما', 'وَمَا', 'wa-mā', 'et ne t''a pas', NULL, 207),
('qe-93-3-5', 93, 'الضحى', 'Adh-Duha', 3, 5, 'قلى', 'قَلَىٰ', 'qalā', 'haï', 'Alif maqsura', 208),

-- V4 : وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ
('qe-93-4-1', 93, 'الضحى', 'Adh-Duha', 4, 1, 'وللآخرة', 'وَلَلْآخِرَةُ', 'wa-lal-āḵiratu', 'Et certes la vie future', 'Deux Lam — insistance + Hamza de jonction', 209),
('qe-93-4-2', 93, 'الضحى', 'Adh-Duha', 4, 2, 'خير', 'خَيْرٌ', 'ḵayrun', 'est meilleure', 'Tanwin — indétermination', 210),
('qe-93-4-3', 93, 'الضحى', 'Adh-Duha', 4, 3, 'لك', 'لَّكَ', 'laka', 'pour toi', 'Chadda sur Lam — fusion', 211),
('qe-93-4-4', 93, 'الضحى', 'Adh-Duha', 4, 4, 'من', 'مِنَ', 'mina', 'que', NULL, 212),
('qe-93-4-5', 93, 'الضحى', 'Adh-Duha', 4, 5, 'الأولى', 'الْأُولَىٰ', 'al-ūlā', 'la première (vie)', 'Alif maqsura', 213),

-- V5 : وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ
('qe-93-5-1', 93, 'الضحى', 'Adh-Duha', 5, 1, 'ولسوف', 'وَلَسَوْفَ', 'wa-la-sawfa', 'Et ton Seigneur te donnera', 'Lam d''insistance + Sawfa futur lointain', 214),
('qe-93-5-2', 93, 'الضحى', 'Adh-Duha', 5, 2, 'يعطيك', 'يُعْطِيكَ', 'yuʕṭīka', 'Il te donnera', NULL, 215),
('qe-93-5-3', 93, 'الضحى', 'Adh-Duha', 5, 3, 'ربك', 'رَبُّكَ', 'rabbuka', 'ton Seigneur', NULL, 216),
('qe-93-5-4', 93, 'الضحى', 'Adh-Duha', 5, 4, 'فترضى', 'فَتَرْضَىٰ', 'fa-tarḍā', 'et tu seras satisfait', 'Alif maqsura + Sad emphatique', 217),

-- V6 : أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ
('qe-93-6-1', 93, 'الضحى', 'Adh-Duha', 6, 1, 'ألم', 'أَلَمْ', 'alam', 'Ne t''a-t-Il pas trouvé', 'Hamza interrogatif + Lam de négation', 218),
('qe-93-6-2', 93, 'الضحى', 'Adh-Duha', 6, 2, 'يجدك', 'يَجِدْكَ', 'yajidka', 'Il t''a trouvé', NULL, 219),
('qe-93-6-3', 93, 'الضحى', 'Adh-Duha', 6, 3, 'يتيما', 'يَتِيمًا', 'yatīman', 'orphelin', 'Tanwin + Ya = longueur', 220),
('qe-93-6-4', 93, 'الضحى', 'Adh-Duha', 6, 4, 'فآوى', 'فَآوَىٰ', 'fa-āwā', 'et Il t''a recueilli', 'Alif maqsura + Hamza + Madd', 221),

-- V7 : وَوَجَدَكَ ضَالًّا فَهَدَىٰ
('qe-93-7-1', 93, 'الضحى', 'Adh-Duha', 7, 1, 'ووجدك', 'وَوَجَدَكَ', 'wa-wajadaka', 'et Il t''a trouvé', NULL, 222),
('qe-93-7-2', 93, 'الضحى', 'Adh-Duha', 7, 2, 'ضالا', 'ضَالًّا', 'ḍāllan', 'égaré', 'Dhad emphatique + Chadda + Tanwin', 223),
('qe-93-7-3', 93, 'الضحى', 'Adh-Duha', 7, 3, 'فهدى', 'فَهَدَىٰ', 'fa-hadā', 'et Il t''a guidé', 'Alif maqsura', 224),

-- V8 : وَوَجَدَكَ عَائِلًا فَأَغْنَىٰ
('qe-93-8-1', 93, 'الضحى', 'Adh-Duha', 8, 1, 'ووجدك', 'وَوَجَدَكَ', 'wa-wajadaka', 'Et Il t''a trouvé', NULL, 225),
('qe-93-8-2', 93, 'الضحى', 'Adh-Duha', 8, 2, 'عائلا', 'عَائِلًا', 'ʕāilan', 'pauvre', 'Ayn pharyngal + Tanwin', 226),
('qe-93-8-3', 93, 'الضحى', 'Adh-Duha', 8, 3, 'فأغنى', 'فَأَغْنَىٰ', 'fa-aghnā', 'et Il t''a enrichi', 'Hamza + Alif maqsura', 227),

-- V9 : فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ
('qe-93-9-1', 93, 'الضحى', 'Adh-Duha', 9, 1, 'فأما', 'فَأَمَّا', 'fa-ammā', 'Quant à l''orphelin', 'Chadda sur Mim', 228),
('qe-93-9-2', 93, 'الضحى', 'Adh-Duha', 9, 2, 'اليتيم', 'الْيَتِيمَ', 'al-yatīma', 'l''orphelin', NULL, 229),
('qe-93-9-3', 93, 'الضحى', 'Adh-Duha', 9, 3, 'فلا', 'فَلَا', 'fa-lā', 'ne', NULL, 230),
('qe-93-9-4', 93, 'الضحى', 'Adh-Duha', 9, 4, 'تقهر', 'تَقْهَرْ', 'taqhar', 'l''opprime pas', NULL, 231),

-- V10 : وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ
('qe-93-10-1', 93, 'الضحى', 'Adh-Duha', 10, 1, 'وأما', 'وَأَمَّا', 'wa-ammā', 'Et quant au mendiant', NULL, 232),
('qe-93-10-2', 93, 'الضحى', 'Adh-Duha', 10, 2, 'السائل', 'السَّائِلَ', 's-sāʼila', 'celui qui demande', 'Sin lettre solaire', 233),
('qe-93-10-3', 93, 'الضحى', 'Adh-Duha', 10, 3, 'فلا', 'فَلَا', 'fa-lā', 'ne', NULL, 234),
('qe-93-10-4', 93, 'الضحى', 'Adh-Duha', 10, 4, 'تنهر', 'تَنْهَرْ', 'tanhar', 'le rabroue pas', NULL, 235),

-- V11 : وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ
('qe-93-11-1', 93, 'الضحى', 'Adh-Duha', 11, 1, 'وأما', 'وَأَمَّا', 'wa-ammā', 'Et quant aux bienfaits', NULL, 236),
('qe-93-11-2', 93, 'الضحى', 'Adh-Duha', 11, 2, 'بنعمة', 'بِنِعْمَةِ', 'bi-niʕmati', 'aux bienfaits de', 'Ayn pharyngal', 237),
('qe-93-11-3', 93, 'الضحى', 'Adh-Duha', 11, 3, 'ربك', 'رَبِّكَ', 'rabbika', 'ton Seigneur', NULL, 238),
('qe-93-11-4', 93, 'الضحى', 'Adh-Duha', 11, 4, 'فحدث', 'فَحَدِّثْ', 'fa-ḥaddith', 'proclame-les !', 'Chadda sur Dal — insistance', 239);
```

### 2b — Seed Supabase : Al-Inshirah (94)

```sql
-- ============================================================
-- ÉTAPE 19 — Seed quran_entries : sourate 94 (Al-Inshirah)
-- ============================================================

INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

-- V1 : أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ
('qe-94-1-1', 94, 'الشرح', 'Al-Inshirah', 1, 1, 'ألم', 'أَلَمْ', 'alam', 'N''avons-Nous pas', NULL, 250),
('qe-94-1-2', 94, 'الشرح', 'Al-Inshirah', 1, 2, 'نشرح', 'نَشْرَحْ', 'nashraḥ', 'ouvert / dilaté', NULL, 251),
('qe-94-1-3', 94, 'الشرح', 'Al-Inshirah', 1, 3, 'لك', 'لَكَ', 'laka', 'pour toi', NULL, 252),
('qe-94-1-4', 94, 'الشرح', 'Al-Inshirah', 1, 4, 'صدرك', 'صَدْرَكَ', 'ṣadraka', 'ta poitrine', 'Sad emphatique', 253),

-- V2 : وَوَضَعْنَا عَنكَ وِزْرَكَ
('qe-94-2-1', 94, 'الشرح', 'Al-Inshirah', 2, 1, 'ووضعنا', 'وَوَضَعْنَا', 'wa-waḍaʕnā', 'Et Nous avons déposé de toi', NULL, 254),
('qe-94-2-2', 94, 'الشرح', 'Al-Inshirah', 2, 2, 'عنك', 'عَنكَ', 'ʕanka', 'loin de toi', 'Ayn pharyngal', 255),
('qe-94-2-3', 94, 'الشرح', 'Al-Inshirah', 2, 3, 'وزرك', 'وِزْرَكَ', 'wizraka', 'ton fardeau', NULL, 256),

-- V3 : الَّذِي أَنقَضَ ظَهْرَكَ
('qe-94-3-1', 94, 'الشرح', 'Al-Inshirah', 3, 1, 'الذي', 'الَّذِي', 'alladhī', 'qui', NULL, 257),
('qe-94-3-2', 94, 'الشرح', 'Al-Inshirah', 3, 2, 'أنقض', 'أَنقَضَ', 'anqaḍa', 'a brisé / accablé', NULL, 258),
('qe-94-3-3', 94, 'الشرح', 'Al-Inshirah', 3, 3, 'ظهرك', 'ظَهْرَكَ', 'ẓahraka', 'ton dos', 'Dha emphatique', 259),

-- V4 : وَرَفَعْنَا لَكَ ذِكْرَكَ
('qe-94-4-1', 94, 'الشرح', 'Al-Inshirah', 4, 1, 'ورفعنا', 'وَرَفَعْنَا', 'wa-rafaʕnā', 'Et Nous avons élevé', 'Ayn pharyngal', 260),
('qe-94-4-2', 94, 'الشرح', 'Al-Inshirah', 4, 2, 'لك', 'لَكَ', 'laka', 'pour toi', NULL, 261),
('qe-94-4-3', 94, 'الشرح', 'Al-Inshirah', 4, 3, 'ذكرك', 'ذِكْرَكَ', 'dhikraka', 'ta renommée', NULL, 262),

-- V5 : فَإِنَّ مَعَ الْعُسْرِ يُسْرًا
('qe-94-5-1', 94, 'الشرح', 'Al-Inshirah', 5, 1, 'فإن', 'فَإِنَّ', 'fa-inna', 'Certes', 'Chadda sur Nun', 263),
('qe-94-5-2', 94, 'الشرح', 'Al-Inshirah', 5, 2, 'مع', 'مَعَ', 'maʕa', 'avec', NULL, 264),
('qe-94-5-3', 94, 'الشرح', 'Al-Inshirah', 5, 3, 'العسر', 'الْعُسْرِ', 'al-ʕusri', 'la difficulté', 'Ayn pharyngal', 265),
('qe-94-5-4', 94, 'الشرح', 'Al-Inshirah', 5, 4, 'يسرا', 'يُسْرًا', 'yusran', 'une facilité', 'Tanwin + Ya', 266),

-- V6 : إِنَّ مَعَ الْعُسْرِ يُسْرًا (répétition rhétorique)
('qe-94-6-1', 94, 'الشرح', 'Al-Inshirah', 6, 1, 'إن', 'إِنَّ', 'inna', 'Certes', NULL, 267),
('qe-94-6-2', 94, 'الشرح', 'Al-Inshirah', 6, 2, 'مع', 'مَعَ', 'maʕa', 'avec', NULL, 268),
('qe-94-6-3', 94, 'الشرح', 'Al-Inshirah', 6, 3, 'العسر', 'الْعُسْرِ', 'al-ʕusri', 'la difficulté (même)', 'Répétition : insistance coranique', 269),
('qe-94-6-4', 94, 'الشرح', 'Al-Inshirah', 6, 4, 'يسرا', 'يُسْرًا', 'yusran', 'une (autre) facilité', 'Tanwin : indéfini — facilité différente', 270),

-- V7 : فَإِذَا فَرَغْتَ فَانصَبْ
('qe-94-7-1', 94, 'الشرح', 'Al-Inshirah', 7, 1, 'فإذا', 'فَإِذَا', 'fa-idhā', 'Donc lorsque', NULL, 271),
('qe-94-7-2', 94, 'الشرح', 'Al-Inshirah', 7, 2, 'فرغت', 'فَرَغْتَ', 'faraghta', 'tu as terminé', NULL, 272),
('qe-94-7-3', 94, 'الشرح', 'Al-Inshirah', 7, 3, 'فانصب', 'فَانصَبْ', 'fanṣab', 'continue à te consacrer !', 'Sad emphatique + Soukoun', 273),

-- V8 : وَإِلَىٰ رَبِّكَ فَارْغَبْ
('qe-94-8-1', 94, 'الشرح', 'Al-Inshirah', 8, 1, 'وإلى', 'وَإِلَىٰ', 'wa-ilā', 'Et vers', NULL, 274),
('qe-94-8-2', 94, 'الشرح', 'Al-Inshirah', 8, 2, 'ربك', 'رَبِّكَ', 'rabbika', 'ton Seigneur', NULL, 275),
('qe-94-8-3', 94, 'الشرح', 'Al-Inshirah', 8, 3, 'فارغب', 'فَارْغَبْ', 'farghab', 'aspire ardemment !', 'Ra emphatique + Ghayn', 276);
```

### 2c — Seed Supabase : Al-Qadr (97)

```sql
-- ============================================================
-- ÉTAPE 19 — Seed quran_entries : sourate 97 (Al-Qadr)
-- ============================================================

INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

-- V1 : إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ
('qe-97-1-1', 97, 'القدر', 'Al-Qadr', 1, 1, 'إنا', 'إِنَّا', 'innā', 'Nous avons certes', 'Chadda sur Nun', 290),
('qe-97-1-2', 97, 'القدر', 'Al-Qadr', 1, 2, 'أنزلناه', 'أَنزَلْنَاهُ', 'anzalnāhu', 'fait descendre (le Coran)', NULL, 291),
('qe-97-1-3', 97, 'القدر', 'Al-Qadr', 1, 3, 'في', 'فِي', 'fī', 'durant', NULL, 292),
('qe-97-1-4', 97, 'القدر', 'Al-Qadr', 1, 4, 'ليلة', 'لَيْلَةِ', 'laylati', 'la nuit de', NULL, 293),
('qe-97-1-5', 97, 'القدر', 'Al-Qadr', 1, 5, 'القدر', 'الْقَدْرِ', 'al-qadri', 'la Destinée (Al-Qadr)', 'Qaf + Dhad emphatique', 294),

-- V2 : وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ
('qe-97-2-1', 97, 'القدر', 'Al-Qadr', 2, 1, 'وما', 'وَمَا', 'wa-mā', 'Et qui te dira', NULL, 295),
('qe-97-2-2', 97, 'القدر', 'Al-Qadr', 2, 2, 'أدراك', 'أَدْرَاكَ', 'adrāka', 'ce qu''est', NULL, 296),
('qe-97-2-3', 97, 'القدر', 'Al-Qadr', 2, 3, 'ما', 'مَا', 'mā', 'qu''est donc', NULL, 297),
('qe-97-2-4', 97, 'القدر', 'Al-Qadr', 2, 4, 'ليلة', 'لَيْلَةُ', 'laylatu', 'la nuit de', NULL, 298),
('qe-97-2-5', 97, 'القدر', 'Al-Qadr', 2, 5, 'القدر', 'الْقَدْرِ', 'al-qadri', 'la Destinée', NULL, 299),

-- V3 : لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ
('qe-97-3-1', 97, 'القدر', 'Al-Qadr', 3, 1, 'ليلة', 'لَيْلَةُ', 'laylatu', 'La nuit de la Destinée', NULL, 300),
('qe-97-3-2', 97, 'القدر', 'Al-Qadr', 3, 2, 'القدر', 'الْقَدْرِ', 'al-qadri', '(Al-Qadr)', NULL, 301),
('qe-97-3-3', 97, 'القدر', 'Al-Qadr', 3, 3, 'خير', 'خَيْرٌ', 'ḵayrun', 'est meilleure', NULL, 302),
('qe-97-3-4', 97, 'القدر', 'Al-Qadr', 3, 4, 'من', 'مِّنْ', 'min', 'que', 'Chadda sur Mim — fusion nasale', 303),
('qe-97-3-5', 97, 'القدر', 'Al-Qadr', 3, 5, 'ألف', 'أَلْفِ', 'alfi', 'mille', NULL, 304),
('qe-97-3-6', 97, 'القدر', 'Al-Qadr', 3, 6, 'شهر', 'شَهْرٍ', 'shahrin', 'mois', 'Tanwin', 305),

-- V4 : تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ
('qe-97-4-1', 97, 'القدر', 'Al-Qadr', 4, 1, 'تنزل', 'تَنَزَّلُ', 'tanazzalu', 'Descendent', 'Chadda sur Zay — intensité du mouvement', 306),
('qe-97-4-2', 97, 'القدر', 'Al-Qadr', 4, 2, 'الملائكة', 'الْمَلَائِكَةُ', 'al-malāʼikatu', 'les Anges', NULL, 307),
('qe-97-4-3', 97, 'القدر', 'Al-Qadr', 4, 3, 'والروح', 'وَالرُّوحُ', 'war-rūḥu', 'et l''Esprit (Jibril)', 'Ra + Chadda + Waw de madd', 308),
('qe-97-4-4', 97, 'القدر', 'Al-Qadr', 4, 4, 'فيها', 'فِيهَا', 'fīhā', 'durant cette nuit', NULL, 309),
('qe-97-4-5', 97, 'القدر', 'Al-Qadr', 4, 5, 'بإذن', 'بِإِذْنِ', 'bi-idhni', 'avec la permission de', NULL, 310),
('qe-97-4-6', 97, 'القدر', 'Al-Qadr', 4, 6, 'ربهم', 'رَبِّهِم', 'rabbihim', 'leur Seigneur', NULL, 311),
('qe-97-4-7', 97, 'القدر', 'Al-Qadr', 4, 7, 'من', 'مِّن', 'min', 'pour', NULL, 312),
('qe-97-4-8', 97, 'القدر', 'Al-Qadr', 4, 8, 'كل', 'كُلِّ', 'kulli', 'tout', NULL, 313),
('qe-97-4-9', 97, 'القدر', 'Al-Qadr', 4, 9, 'أمر', 'أَمْرٍ', 'amrin', 'décret / ordre', 'Tanwin', 314),

-- V5 : سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ
('qe-97-5-1', 97, 'القدر', 'Al-Qadr', 5, 1, 'سلام', 'سَلَامٌ', 'salāmun', 'Paix !', 'Tanwin + Madd Alif — beauté de la prolongation', 315),
('qe-97-5-2', 97, 'القدر', 'Al-Qadr', 5, 2, 'هي', 'هِيَ', 'hiya', 'elle est', NULL, 316),
('qe-97-5-3', 97, 'القدر', 'Al-Qadr', 5, 3, 'حتى', 'حَتَّىٰ', 'ḥattā', 'jusqu''à', 'Ha pharyngal + Chadda', 317),
('qe-97-5-4', 97, 'القدر', 'Al-Qadr', 5, 4, 'مطلع', 'مَطْلَعِ', 'maṭlaʕi', 'l''apparition de', 'Ta emphatique', 318),
('qe-97-5-5', 97, 'القدر', 'Al-Qadr', 5, 5, 'الفجر', 'الْفَجْرِ', 'al-fajri', 'l''aube', NULL, 319);
```

### 2d — Leçons dans le module coranique

Créer dans `src/data/lessons/quran/` (ou le chemin équivalent dans le projet) :
- `lesson-adh-duha.ts` — surah 93, 11 versets, groupés en 2 parties (V1–V5 : réconfort divin / V6–V11 : gratitude en action)
- `lesson-al-inshirah.ts` — surah 94, 8 versets, groupe unique (la facilité après la difficulté)
- `lesson-al-qadr.ts` — surah 97, 5 versets, groupe unique (la nuit du Destin)

Structure identique aux leçons É17/É18 : `SurahDisplay` + `QuranWordCard` + seed SRS via `seedQuranSRSCards()`.

### Checkpoint Mission 2

```
- [ ] `/checkpoint` → tout vert
- [ ] `@arabic-content-validator` sur les seeds coraniques → pas d'erreur
- [ ] 40 entrées Adh-Duha seedées (sort_order 200–239) + 27 Al-Inshirah (250–276) + 30 Al-Qadr (290–319)
- [ ] Total quran_entries Supabase : 270+ lignes (É17 + É18 + É19)
- [ ] 3 leçons quraniques créées dans /data/lessons/quran/
- [ ] Module coranique → leçons visibles (2 É17 + 5 É18 + 3 É19)
- [ ] seedQuranSRSCards() idempotent sur les nouvelles sourates
```

---

## MISSION 3 — Dialecte levantin (الشامي)

### Contexte pédagogique

Le levantin (Shami / شامي) est parlé en Syrie, Liban, Jordanie, Palestine. C'est le dialecte le plus compréhensible entre dialectophones arabes. Il diffère du MSA par :
- Suppression du Tanwin en pratique quotidienne
- "بدّي" (baddī) au lieu de "أريد" (urīdu) pour "je veux"
- "شو" (šū) au lieu de "ماذا" (mādhā) pour "quoi"
- Emphase sur les voyelles longues

Le seed suit exactement le pattern Darija (É17) / Égyptien (É18) : variantes dans `word_variants`, pas une ligne de code.

### 3a — Seed Supabase : word_variants 'levantine'

> ### ⛔ ÉTAPE BLOQUANTE — Vérification schéma word_variants
>
> Avant d'exécuter, vérifier les colonnes réelles :
> ```sql
> SELECT column_name FROM information_schema.columns WHERE table_name = 'word_variants';
> ```
> Le schéma attendu (identique à É17/É18) : `id, word_id, variant, arabic, arabic_vocalized, transliteration, notes_fr`.
> Les INSERT ci-dessous utilisent ce schéma. Si les colonnes diffèrent, adapter.
>
> De même, vérifier que les `word_id` référencés existent dans la table source :
> ```sql
> SELECT id, arabic FROM words WHERE id IN ('word-ana', 'word-inta', ...);
> ```
> Si un `word_id` n'existe pas, l'insérer d'abord dans `words`.

```sql
-- ============================================================
-- ÉTAPE 19 — Seed word_variants : dialecte levantin (شامي)
-- ============================================================

-- Schéma identique à É17 (darija) et É18 (egyptian)

INSERT INTO word_variants (id, word_id, variant, arabic, arabic_vocalized, transliteration, notes_fr) VALUES

-- Pronoms & formules de base
('wv-lev-001', '<word_id_ana>',      'levantine', 'أنا',    'أَنَا',     'ana',         'Identique MSA — accent différent'),
('wv-lev-002', '<word_id_inta>',     'levantine', 'إنتَ',   'إِنْتَ',    'inta',        'Masc. 2e pers. — MSA : أنتَ'),
('wv-lev-003', '<word_id_inti>',     'levantine', 'إنتِ',   'إِنْتِ',    'inti',        'Fém. 2e pers. — MSA : أنتِ'),
('wv-lev-004', '<word_id_huwa>',     'levantine', 'هوّه',   'هُوِّهْ',   'huwwe',       'MSA : هو (huwa)'),
('wv-lev-005', '<word_id_hiya>',     'levantine', 'هيّه',   'هِيِّهْ',   'hiyye',       'MSA : هي (hiya)'),
('wv-lev-006', '<word_id_nahnu>',    'levantine', 'نحنا',   'نِحْنَا',   'niḥna',       'MSA : نحن (naḥnu)'),

-- Verbes courants
('wv-lev-007', '<word_id_urid>',     'levantine', 'بدّي',   'بَدِّي',    'baddī',       'Je veux — MSA : أريد (urīdu)'),
('wv-lev-008', '<word_id_dhahaba>',  'levantine', 'راح',    'رَاحْ',     'rāḥ',         'Il est parti / Il va (futur) — MSA : ذهب / سيذهب'),
('wv-lev-009', '<word_id_qadim>',    'levantine', 'جاي',    'جَايْ',     'jāy',         'Qui vient / venant — MSA : قادم (qādim)'),
('wv-lev-010', '<word_id_akala>',    'levantine', 'آكل',    'آكُلْ',     'ākul',        'Je mange — MSA : آكل (āakulu)'),
('wv-lev-011', '<word_id_uhibb>',    'levantine', 'بحبّ',   'بْحَبّْ',   'bḥabb',       'J''aime — MSA : أحب (uḥibbu)'),
('wv-lev-012', '<word_id_tarif>',    'levantine', 'بتعرّف', 'بْتْعَرَّفْ', 'btʕarraf',    'Tu connais — MSA : تعرف (taʕrifu)'),
('wv-lev-013', '<word_id_amal>',     'levantine', 'عمبشتغل', 'عَمْبِشْتَغِلْ', 'ʕm-bištaghl', 'En train de travailler — MSA : أعمل'),

-- Questions
('wv-lev-014', '<word_id_madha>',    'levantine', 'شو',     'شُو',       'šū',          'Quoi — MSA : ماذا (mādhā)'),
('wv-lev-015', '<word_id_kayfa>',    'levantine', 'كيف',    'كِيفْ',     'kīf',         'Comment — MSA : كيف (accent différent)'),
('wv-lev-016', '<word_id_ayna>',     'levantine', 'وين',    'وِينْ',     'wēn',         'Où — MSA : أين (ayna)'),
('wv-lev-017', '<word_id_limadha>',  'levantine', 'ليش',    'لِيشْ',     'lēš',         'Pourquoi — MSA : لماذا (limādhā)'),
('wv-lev-018', '<word_id_ma_ismak>', 'levantine', 'شو اسمك', 'شُو إِسْمَكْ', 'šū ismak',   'Comment tu t''appelles — MSA : ما اسمك'),
('wv-lev-019', '<word_id_kam>',      'levantine', 'أدّيش',  'أَدِّيشْ',  'addēš',       'Combien — MSA : كم (kam)'),

-- Vie quotidienne
('wv-lev-020', '<word_id_jayyid>',   'levantine', 'منيح',   'مْنِيحْ',   'mníḥ',        'Bien / bon — MSA : جيد (jayyid)'),
('wv-lev-021', '<word_id_kathir>',   'levantine', 'كتير',   'كْتِيرْ',   'ktīr',        'Beaucoup — MSA : كثير (kathīr)'),
('wv-lev-022', '<word_id_qalil>',    'levantine', 'شوي',    'شْوَيّ',    'šwayy',       'Un peu — MSA : قليل (qalīl)'),
('wv-lev-023', '<word_id_alan>',     'levantine', 'هلق',    'هَلَّقْ',   'halla''',      'Maintenant — MSA : الآن (al-ān)'),
('wv-lev-024', '<word_id_lakin>',    'levantine', 'بس',     'بَسْ',      'bas',         'Mais / seulement — MSA : لكن / فقط'),
('wv-lev-025', '<word_id_hayya>',    'levantine', 'يلا',    'يَلَّا',    'yalla',       'Allez ! On y va ! — MSA : هيا (hayā)'),
('wv-lev-026', '<word_id_tafaddal>', 'levantine', 'تفضّل',  'تْفَضَّلْ',  'tfaḍḍal',     'Je vous en prie / Entrez — MSA : تفضّل'),
('wv-lev-027', '<word_id_laysa>',    'levantine', 'ما في',  'مَا فِي',   'mā fī',       'Il n''y a pas — MSA : ليس هناك'),
('wv-lev-028', '<word_id_indi>',     'levantine', 'عندي',   'عِنْدِي',   'ʕandī',       'J''ai (possession) — MSA : عندي'),
('wv-lev-029', '<word_id_taal>',     'levantine', 'تعا',    'تَعَا',     'taʕa',        'Viens ! — MSA : تعال (taʕāl)'),
('wv-lev-030', '<word_id_shukran>',  'levantine', 'يسلمو',  'يِسْلَمُو', 'yislamu',     'Merci (levantin typique) — MSA : شكراً')

ON CONFLICT (id) DO NOTHING;
```

### 3b — Leçons du module levantin

Créer 3 leçons dans `src/data/lessons/dialect-levantine/` :
- `lesson-lev-01-intro.ts` — "Bonjour en levantin : مرحبا et كيفك"
- `lesson-lev-02-questions.ts` — "Poser des questions : شو, وين, كيف"
- `lesson-lev-03-daily.ts` — "Vie quotidienne : بدّي, يلا, منيح"

**Structure** : `DarijaComparisonCard` (MSA ↔ Levantin), `DialectBadge` code `'LEV'` couleur vert olive (`#6B7C4A`).

### 3c — Badge levantin

Dans `badge-engine.ts`, ajouter dans `BADGE_CATALOG` :
- `'dialect_levantine'` — gagné à la première leçon levantine
- `'dialect_explorer_2'` — gagné si 3 dialectes (Darija + Égyptien + Levantin) tous entamés

### Checkpoint Mission 3

```
- [ ] `/checkpoint` → tout vert
- [ ] `@arabic-content-validator` sur les seeds levantins → pas d'erreur
- [ ] 30 variantes word_variants 'levantine' dans Supabase + SQLite
- [ ] Module "🇸🇾 Levantin" visible dans Learn (3 leçons)
- [ ] DialectBadge 'LEV' rendu en vert olive
- [ ] Badge 'dialect_levantine' gagné après première leçon
- [ ] Badge 'dialect_explorer_2' gagné si 3 dialectes entamés
```

---

## MISSION 4 — Dialecte khaliji (الخليجي)

### Contexte pédagogique

Le khaliji (خليجي) est parlé dans les pays du Golfe : Arabie saoudite, Émirats, Qatar, Koweït, Bahreïn, Oman. C'est le dialecte le plus proche du MSA classique phonétiquement, mais avec des particularités :
- Conservation du Qaf comme "g" en dialecte gulf (ex : قال → gāl)
- Utilisation de "چ" (ch) pour "tu" (masc. sauf en saoudien)
- Vocabulaire persan et anglais intégré
- Intonation descendante caractéristique

### 4a — Seed Supabase : word_variants 'khaliji'

> Même ⛔ ÉTAPE BLOQUANTE que Mission 3 : vérifier word_ids et schéma avant exécution.

```sql
-- ============================================================
-- ÉTAPE 19 — Seed word_variants : dialecte khaliji (خليجي)
-- ============================================================

INSERT INTO word_variants (id, word_id, variant, arabic, arabic_vocalized, transliteration, notes_fr) VALUES

-- Pronoms
('wv-kh-001', '<word_id_ana>',      'khaliji', 'أنا',    'أَنَا',     'ana',      'Identique MSA'),
('wv-kh-002', '<word_id_inta>',     'khaliji', 'إنتَ',   'إِنْتَ',    'inta',     'Masc. — MSA : أنت'),
('wv-kh-003', '<word_id_inti>',     'khaliji', 'إنتِ',   'إِنْتِ',    'inti',     'Fém. — aussi "چِ" (chi) dans certains pays du Golfe'),
('wv-kh-004', '<word_id_huwa>',     'khaliji', 'هو',     'هُوْ',      'hū',       'Identique MSA, prononciation tendue'),
('wv-kh-005', '<word_id_nahnu>',    'khaliji', 'إحنا',   'إِحْنَا',   'iḥna',     'Nous — MSA : نحن (naḥnu)'),

-- Verbes caractéristiques
('wv-kh-006', '<word_id_qala>',     'khaliji', 'قال',    'قَالْ',     'gāl',      'Il a dit — Qaf → G (trait khaliji majeur)'),
('wv-kh-007', '<word_id_astatia>',  'khaliji', 'أقدر',   'أَقْدَرْ',  'agdar',    'Je peux — MSA : أستطيع (astaṭīʕu)'),
('wv-kh-008', '<word_id_urid>',     'khaliji', 'أبي',    'أَبِي',     'abī',      'Je veux — MSA : أريد (urīdu)'),
('wv-kh-009', '<word_id_qama>',     'khaliji', 'قام',    'قَامْ',     'gām',      'Il s''est levé / il a commencé à — MSA : قام'),
('wv-kh-010', '<word_id_raa>',      'khaliji', 'شايف',   'شَايِفْ',   'šāyif',    'Voyant / je vois — MSA : رأى (raʼā)'),
('wv-kh-011', '<word_id_yurid>',    'khaliji', 'يبي',    'يِبِي',     'yibī',     'Il veut — MSA : يريد (yurīdu)'),

-- Questions
('wv-kh-012', '<word_id_madha>',    'khaliji', 'إيش',    'إِيشْ',     'ēš',       'Quoi — MSA : ماذا (mādhā) — variante Golfe'),
('wv-kh-013', '<word_id_ayna>',     'khaliji', 'وين',    'وِينْ',     'wēn',      'Où — MSA : أين — commun Golfe et Levantin'),
('wv-kh-014', '<word_id_limadha>',  'khaliji', 'ليش',    'لِيشْ',     'lēš',      'Pourquoi — MSA : لماذا'),
('wv-kh-015', '<word_id_kam>',      'khaliji', 'قدّيش',  'قِدِّيشْ',  'giddēš',   'Combien — MSA : كم (kam)'),
('wv-kh-016', '<word_id_min_ayna>', 'khaliji', 'من وين', 'مِنْ وِينْ', 'min wēn',  'D''où — MSA : من أين (min ayna)'),

-- Formules sociales
('wv-kh-017', '<word_id_ahlan>',    'khaliji', 'هالا',   'هَالَا',    'hālā',     'Bienvenue (affectueux) — MSA : أهلاً'),
('wv-kh-018', '<word_id_idhan>',    'khaliji', 'عيال',   'عَيَالْ',   'ʕayāl',    'Enfants / alors / donc — MSA : إذن'),
('wv-kh-019', '<word_id_jayyid>',   'khaliji', 'زين',    'زِينْ',     'zēn',      'Bien / bon — MSA : جيد (jayyid)'),
('wv-kh-020', '<word_id_la_yujad>', 'khaliji', 'ماكو',   'مَاكُو',    'māku',     'Il n''y a pas (Golfe) — MSA : لا يوجد'),
('wv-kh-021', '<word_id_yujad>',    'khaliji', 'آكو',    'آكُو',      'āku',      'Il y a (Golfe/Irak) — MSA : يوجد'),
('wv-kh-022', '<word_id_hayya>',    'khaliji', 'يلا',    'يَلَّا',    'yallah',   'Allez ! — commun à tous les dialectes'),
('wv-kh-023', '<word_id_marhaba>',  'khaliji', 'حيّاك',  'حَيَّاكْ',  'ḥayyāk',   'Bienvenue / Dieu vous salue — Golfe'),
('wv-kh-024', '<word_id_hasanan>',  'khaliji', 'ماشي',   'مَاشِي',    'māšī',     'D''accord / OK — MSA : حسناً'),

-- Vie quotidienne
('wv-kh-025', '<word_id_undhur>',   'khaliji', 'چوب',    'چُوبْ',     'čūb',      'Regarde / attention (Émiratis) — argotique'),
('wv-kh-026', '<word_id_firash>',   'khaliji', 'دوشك',   'دُوشَكْ',   'dūšak',    'Matelas (persan intégré) — MSA : فراش'),
('wv-kh-027', '<word_id_shay>',     'khaliji', 'شاي',    'شَايْ',     'šāy',      'Thé — identique MSA, boisson sociale centrale'),
('wv-kh-028', '<word_id_qahwa>',    'khaliji', 'قهوة',   'قَهْوَة',   'gahwa',    'Café (khaliji : café arabe cardamome) — Qaf → G'),
('wv-kh-029', '<word_id_amsi>',     'khaliji', 'البارحة', 'الْبَارِحَة', 'al-bārḥa', 'Hier — MSA : أمس (amsi)'),
('wv-kh-030', '<word_id_ghadan>',   'khaliji', 'باكر',   'بَاكِرْ',   'bākir',    'Demain (Golfe) — MSA : غداً (ghadan)')

ON CONFLICT (id) DO NOTHING;
```

### 4b — Leçons du module khaliji

Créer 3 leçons dans `src/data/lessons/dialect-khaliji/` :
- `lesson-khal-01-intro.ts` — "Le Golfe en arabe : زين et قهوة"
- `lesson-khal-02-questions.ts` — "Questions au Golfe : إيش, وين, قدّيش"
- `lesson-khal-03-qaf.ts` — "Le phénomène du Qaf → G : قال → گال"

**Structure** : `DarijaComparisonCard` (MSA ↔ Khaliji), `DialectBadge` code `'KH'` couleur or du désert (`#C5A028`).

### 4c — Badge khaliji + badge global

Dans `badge-engine.ts`, ajouter dans `BADGE_CATALOG` :
- `'dialect_khaliji'` — gagné à la première leçon khaliji
- `'polyglot_dialects'` — gagné si 4 dialectes entamés (Darija + Égyptien + Levantin + Khaliji)

### Checkpoint Mission 4

```
- [ ] `/checkpoint` → tout vert
- [ ] `@arabic-content-validator` sur les seeds khaliji → pas d'erreur
- [ ] 30 variantes word_variants 'khaliji' dans Supabase + SQLite
- [ ] Module "🇸🇦 Khaliji" visible dans Learn (3 leçons)
- [ ] DialectBadge 'KH' rendu en or du désert (#C5A028)
- [ ] Badge 'dialect_khaliji' gagné après première leçon
- [ ] Badge 'polyglot_dialects' gagné si 4 dialectes entamés
```

---

## MISSION 5 — Dashboard analytics (métriques J7/J30)

### Contexte

L'infrastructure PostHog est en place depuis É18. Il faut maintenant un écran **dans l'app** (admin only, masqué aux testeurs lambda) qui affiche les métriques clés de rétention sans avoir à ouvrir le dashboard PostHog en permanence.

Cet écran est accessible uniquement si `user.is_beta_tester = true` ET `user.email` est dans une liste admin hardcodée.

### 5a — Composant `AnalyticsDashboardScreen`

Créer `src/app/(tabs)/analytics.tsx` :

```typescript
// Visible uniquement aux admins (email hardcodé)
// Données récupérées depuis Supabase (tables beta_feedback + user_profiles)
// EXCEPTION documentée : cet écran seul est autorisé à lire Supabase directement
// car c'est un outil d'administration, pas un flow utilisateur
// useTheme() obligatoire

// Métriques affichées :
// 1. Total testeurs actifs (is_beta_tester = true)
// 2. Testeurs actifs J7 (streak > 0 dans les 7 derniers jours)
// 3. Testeurs actifs J30 (au moins 1 leçon dans les 30 derniers jours)
// 4. Note moyenne bêta (moyenne beta_feedback.rating)
// 5. Total feedbacks reçus
// 6. Top 3 leçons complétées (depuis données Supabase user_lesson_progress si disponible)
// 7. Modules les plus utilisés (distribution pie simple)

// Note sur PostHog : les données PostHog ne sont PAS requêtables depuis l'app.
// Pour J7/J30, utiliser user_profiles.last_active_at et user_profiles.streak.
// Pour les leçons, utiliser les données de Supabase user_lesson_progress si disponible.
```

**UI** :
- Header : "📊 Dashboard Bêta" — visible admin only
- 4 cartes KPI en grille 2×2 (Total testeurs / Actifs J7 / Note moyenne / Feedbacks)
- Section "Rétention" : barre J7 et J30 en vert
- Section "Feedbacks récents" : liste des 5 derniers commentaires
- Bouton "Exporter CSV" → génère un fichier texte partageable (share sheet)

### 5b — Protection accès admin

```typescript
// src/utils/admin-check.ts
const ADMIN_EMAILS = [
  'sacha@lisaan.app',   // remplacer par l'email réel
  // Ajouter d'autres admins si nécessaire
];

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
```

### 5c — Onglet conditionnel dans la navigation

Dans `src/app/(tabs)/_layout.tsx` :

```typescript
// Ajouter l'onglet Analytics uniquement si isAdmin(user.email)
// Si non-admin : l'onglet n'apparaît pas dans la tab bar
// L'URL /(tabs)/analytics redirige vers /(tabs)/profile pour les non-admins
```

### 5d — Migration SQL : vue agrégée + last_active_at

Dans le SQL Editor Supabase :

```sql
-- last_active_at dans user_profiles (si absent)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger pour mettre à jour last_active_at à chaque sync
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_last_active ON user_profiles;
CREATE TRIGGER trg_last_active
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- Vue pour le dashboard analytics (lecture admin seule via service role)
CREATE OR REPLACE VIEW beta_analytics AS
SELECT
  COUNT(*)                                                          AS total_testers,
  COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '7 days')  AS active_j7,
  COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '30 days') AS active_j30,
  AVG(current_streak)                                               AS avg_streak,
  MAX(current_streak)                                               AS max_streak
FROM user_profiles
WHERE is_beta_tester = TRUE;
```

### Checkpoint Mission 5

```
- [ ] `/checkpoint` → tout vert
- [ ] AnalyticsDashboardScreen créé et accessible depuis Profile (admin only)
- [ ] isAdmin() protège l'accès (emails hardcodés)
- [ ] 4 KPI affichés : total testeurs / actifs J7 / note moyenne / nb feedbacks
- [ ] 5 derniers feedbacks textuels visibles
- [ ] Onglet Analytics absent de la tab bar pour les non-admins
- [ ] last_active_at dans user_profiles + trigger Supabase
- [ ] Vue beta_analytics créée dans Supabase
```

---

## MISSION 6 — Tests end-to-end + régression complète

### 6a — Validation par subagents

Lance `@regression-tester`. Si tout vert, continue. Sinon, corriger avant de passer aux tests manuels.

Lance `@arabic-content-validator` sur l'ensemble des seeds É19 (sourates 93/94/97 + variantes levantine + variantes khaliji).

### 6b — Infrastructure bêta (tests manuels)

```
1. BetaCodeScreen apparaît à la fin de l'onboarding (écran 6)
2. Code valide "LIS-A1B2" → is_beta_tester = true dans Supabase
3. Code invalide → message d'erreur, pas de crash
4. Bouton "Passer" → onboarding complété normalement
5. EAS Build preview déclenché (APK Android généré ou en cours)
```

### 6c — Sourates É19 (tests manuels)

```
1. Module coranique → toutes les leçons visibles (É17 + É18 + É19)
2. Leçon Adh-Duha → 11 versets RTL, notes tajwid sur "والضحى"
3. Leçon Al-Inshirah → V5 et V6 affichent la répétition avec note pédagogique
4. Leçon Al-Qadr → V3 "خير من ألف شهر" avec note tajwid
5. Réviser → filtre Coran → 270+ cartes disponibles
```

### 6d — Dialectes levantin et khaliji (tests manuels)

```
1. Learn → module "🇸🇾 Levantin" visible
2. Learn → module "🇸🇦 Khaliji" visible
3. DialectBadge 'LEV' en vert olive, 'KH' en or
4. Badge 'dialect_levantine' gagné après leçon 1 levantin
5. Badge 'dialect_khaliji' gagné après leçon 1 khaliji
6. Badge 'polyglot_dialects' gagné après 4e dialecte
7. word_variants SQLite : 'levantine' 30 entrées, 'khaliji' 30 entrées
```

### 6e — Dashboard analytics (tests manuels)

```
1. Connexion avec email admin → onglet Analytics visible dans tab bar
2. Connexion avec email non-admin → onglet Analytics absent
3. KPI affichés sans crash (même si 0 testeurs)
4. Feedbacks récents : liste vide si aucun feedback
5. Mode avion → dashboard affiche les données en cache (pas de crash)
```

### 6f — Régression É0–É18

```
1. Onboarding 5+1 écrans → BetaCodeScreen optionnel
2. Module 1 alphabet : 7 leçons, MCQ, tracé
3. Harakats, SRS, streak, XP : inchangés
4. Badges É18 (streak_3, module_1_done) : toujours fonctionnels
5. PostHog events : lesson_completed toujours envoyé si opt-in
6. Module Darija 3 leçons + Égyptien 3 leçons : inchangés
7. Notifications : planning inchangé
8. Mode avion : tout fonctionne
```

### Checkpoint final É19

- [ ] `@regression-tester` → tout vert
- [ ] `@arabic-content-validator` → tout vert
- [ ] EAS Build preview configuré (eas.json + app.config.ts)
- [ ] Table beta_invites dans Supabase (35 codes seedés)
- [ ] BetaCodeScreen dans onboarding (optionnel, bouton Passer)
- [ ] invite-beta.ts : validateBetaInviteCode() fonctionnel
- [ ] 40 entrées quran_entries Adh-Duha (93) dans Supabase + SQLite
- [ ] 27 entrées quran_entries Al-Inshirah (94) dans Supabase + SQLite
- [ ] 30 entrées quran_entries Al-Qadr (97) dans Supabase + SQLite
- [ ] Total quran_entries : 270+ lignes
- [ ] 3 leçons coraniques É19 dans module Coranique
- [ ] 30 variantes 'levantine' dans word_variants
- [ ] Module "🇸🇾 Levantin" : 3 leçons fonctionnelles
- [ ] DialectBadge 'LEV' vert olive
- [ ] Badge 'dialect_levantine' fonctionnel
- [ ] 30 variantes 'khaliji' dans word_variants
- [ ] Module "🇸🇦 Khaliji" : 3 leçons fonctionnelles
- [ ] DialectBadge 'KH' or du désert (#C5A028)
- [ ] Badge 'dialect_khaliji' + 'polyglot_dialects' fonctionnels
- [ ] AnalyticsDashboardScreen créé (admin only)
- [ ] isAdmin() protège l'accès
- [ ] last_active_at + trigger Supabase
- [ ] Vue beta_analytics créée
- [ ] Mode avion : tout fonctionne
- [ ] Aucun import db/remote hors sync (sauf analytics.tsx + feedback-service — exceptions documentées)
- [ ] Aucune régression É0–É18

---

## RÉSUMÉ DE L'ÉTAPE 19

| Mission | Livrable | Statut |
|---------|----------|--------|
| 0 | `@codebase-scout` — scan initial du repo | ⬜ |
| 1 | EAS Build + OTA + beta_invites (35 codes) + BetaCodeScreen | ⬜ |
| 2 | Sourates 93 + 94 + 97 (~97 mots coraniques) + 3 leçons | ⬜ |
| 3 | word_variants 'levantine' (30) + module + badges | ⬜ |
| 4 | word_variants 'khaliji' (30) + module + badges | ⬜ |
| 5 | Dashboard analytics (admin) + last_active_at + vue beta_analytics | ⬜ |
| 6 | `@regression-tester` + `@arabic-content-validator` + tests manuels | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs après É19 :**
- `ETAPE-19-beta-levantine-khaliji-sourates-analytics.md` (ce fichier)
- `lisaan-seed-letters.json`

**Fichiers à supprimer de /docs :**
- `ETAPE-18-sourates-egyptien-badges-beta.md` (terminée)

---

> **Prochaine étape après validation :** Étape 20 — Retours bêta → itérations UX prioritaires, sourates Al-Mulk (intro 10 premiers versets), module grammaire avancé (duel, pluriel brisé), et préparation soumission App Store / Play Store (screenshots, metadata, review guidelines).
