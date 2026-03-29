# ÉTAPE 12 — Présent, formes dérivées & situations de vie

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe pour francophones.
> Étapes terminées : 0 → 11. É11 = Grammaire essentielle (M5) + Premiers verbes passé (M6), exercices `reorder` et `dialogue`, dialogue engine générique.
> Cette étape continue la Phase 2 : conjugaison présent/inaccompli, introduction douce aux formes dérivées II-III, et trois situations de vie qui nourrissent le dialogue engine.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (offline-first — CRITIQUE)** :
> - Tous les hooks lisent depuis **SQLite local**. JAMAIS d'import `src/db/remote` dans hooks/stores/components/engines.
> - `content-sync.ts` et `sync-manager.ts` sont les seuls à parler à Supabase.
> - Après chaque écriture locale, appeler `runSync()` en fire-and-forget.
> - **Pas de CLI Supabase** : migrations SQL dans le Dashboard Cloud (SQL Editor).

> **Philosophie de cette étape** :
> - Le présent arabe fait peur à cause des préfixes et suffixes. Le Module 7 les présente d'abord avec les mêmes verbes déjà connus (M6) : la forme est nouvelle, le verbe est familier.
> - Les formes II et III sont introduites comme "familles de sens", pas comme paradigme à mémoriser. 2-3 verbes par forme suffisent.
> - Les situations (marché, famille, voyage) donnent un contexte émotionnel et mémoriel au vocabulaire — c'est la promesse de Lisaan depuis le début.
> - Le type `fill_blank` est l'exercice naturel de la conjugaison : produire, pas seulement reconnaître.

---

## Périmètre de É12

| Module | Contenu | Nouveaux types d'exercices |
|--------|---------|---------------------------|
| Module 7 — Au présent | Conjugaison مضارع, 6 verbes M6 + 4 nouveaux, négation (لا + مضارع) | `fill_blank` |
| Module 8 — Situations de vie | 3 dialogues situés (marché, famille, voyage), formes II-III (3+3 verbes) | (dialogue enrichi) |

**Ce qui est OUT de É12 :**
- Conjugaison impératif / futur proche (É13)
- Formes IV → X (Phase 3)
- Vocabulaire thématique exhaustif (É14+)
- Mode quiz chronométré (É13)
- Révision spaced-repetition pour grammaire (É14)

---

## MISSION 1 — Seed DB : conjugaison présent pour les 6 verbes de M6

**Contexte :** Les 6 verbes de M6 (`kataba`, `qaraa`, `dhahaba`, `jaaa`, `akala`, `shariba`) ont déjà leurs entrées passé dans `conjugation_entries`. On ajoute le présent (8 pronoms × 6 verbes = 48 nouvelles lignes). La table `conjugation_entries` et le champ `tense` sont déjà en place.

### 1a — Conjugaisons présent dans Supabase Cloud (SQL Editor)

```sql
-- ============================================================
-- CONJUGAISONS PRÉSENT (مضارع) — 6 verbes × 8 pronoms
-- tense = 'present', form = 1
-- ============================================================

-- ---- كَتَبَ / يَكْتُبُ (écrire) ----
INSERT INTO conjugation_entries VALUES
('conj-kataba-present-ana',   'word-kataba', 'present', 1, 'ana',   'أَنَا',   'je',        'أكتب',   'أَكْتُبُ',   'aktubu',        NULL, 'أَنَا أَكْتُبُ رِسَالَةً',        'أَنَا أَكْتُبُ رِسَالَةً',        'J''écris une lettre.', NOW()),
('conj-kataba-present-anta',  'word-kataba', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تكتب',   'تَكْتُبُ',   'taktubu',       NULL, 'أَنْتَ تَكْتُبُ كَثِيرًا',       'أَنْتَ تَكْتُبُ كَثِيرًا',       'Tu écris beaucoup.', NOW()),
('conj-kataba-present-anti',  'word-kataba', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تكتبين', 'تَكْتُبِينَ','taktubina',     NULL, 'أَنْتِ تَكْتُبِينَ جَيِّدًا',    'أَنْتِ تَكْتُبِينَ جَيِّدًا',    'Tu écris bien.', NOW()),
('conj-kataba-present-huwa',  'word-kataba', 'present', 1, 'huwa',  'هُوَ',    'il',        'يكتب',   'يَكْتُبُ',   'yaktubu',       NULL, 'هُوَ يَكْتُبُ قِصَّةً',          'هُوَ يَكْتُبُ قِصَّةً',          'Il écrit une histoire.', NOW()),
('conj-kataba-present-hiya',  'word-kataba', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تكتب',   'تَكْتُبُ',   'taktubu',       NULL, 'هِيَ تَكْتُبُ يَوْمِيًّا',       'هِيَ تَكْتُبُ يَوْمِيًّا',       'Elle écrit chaque jour.', NOW()),
('conj-kataba-present-nahnu', 'word-kataba', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نكتب',   'نَكْتُبُ',   'naktubu',       NULL, 'نَحْنُ نَكْتُبُ مَعًا',          'نَحْنُ نَكْتُبُ مَعًا',          'Nous écrivons ensemble.', NOW()),
('conj-kataba-present-antum', 'word-kataba', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تكتبون', 'تَكْتُبُونَ','taktubuna',     NULL, 'أَنْتُمْ تَكْتُبُونَ الدَّرْسَ','أَنْتُمْ تَكْتُبُونَ الدَّرْسَ','Vous écrivez la leçon.', NOW()),
('conj-kataba-present-hum',   'word-kataba', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يكتبون', 'يَكْتُبُونَ','yaktubuna',     NULL, 'هُمْ يَكْتُبُونَ الأَخْبَارَ',  'هُمْ يَكْتُبُونَ الأَخْبَارَ',  'Ils écrivent les nouvelles.', NOW());

-- ---- قَرَأَ / يَقْرَأُ (lire) ----
INSERT INTO conjugation_entries VALUES
('conj-qaraa-present-ana',   'word-qaraa', 'present', 1, 'ana',   'أَنَا',   'je',        'أقرأ',   'أَقْرَأُ',   'aqrau',         NULL, 'أَنَا أَقْرَأُ كِتَابًا',         'أَنَا أَقْرَأُ كِتَابًا',         'Je lis un livre.', NOW()),
('conj-qaraa-present-anta',  'word-qaraa', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تقرأ',   'تَقْرَأُ',   'taqrau',        NULL, 'أَنْتَ تَقْرَأُ الصَّحِيفَةَ',   'أَنْتَ تَقْرَأُ الصَّحِيفَةَ',   'Tu lis le journal.', NOW()),
('conj-qaraa-present-anti',  'word-qaraa', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تقرئين', 'تَقْرَئِينَ','taqraîna',      NULL, 'أَنْتِ تَقْرَئِينَ كَثِيرًا',    'أَنْتِ تَقْرَئِينَ كَثِيرًا',    'Tu lis beaucoup.', NOW()),
('conj-qaraa-present-huwa',  'word-qaraa', 'present', 1, 'huwa',  'هُوَ',    'il',        'يقرأ',   'يَقْرَأُ',   'yaqrau',        NULL, 'هُوَ يَقْرَأُ كُلَّ يَوْمٍ',     'هُوَ يَقْرَأُ كُلَّ يَوْمٍ',     'Il lit chaque jour.', NOW()),
('conj-qaraa-present-hiya',  'word-qaraa', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تقرأ',   'تَقْرَأُ',   'taqrau',        NULL, 'هِيَ تَقْرَأُ الرِّوَايَةَ',     'هِيَ تَقْرَأُ الرِّوَايَةَ',     'Elle lit le roman.', NOW()),
('conj-qaraa-present-nahnu', 'word-qaraa', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نقرأ',   'نَقْرَأُ',   'naqrau',        NULL, 'نَحْنُ نَقْرَأُ سَوِيًّا',       'نَحْنُ نَقْرَأُ سَوِيًّا',       'Nous lisons ensemble.', NOW()),
('conj-qaraa-present-antum', 'word-qaraa', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تقرؤون', 'تَقْرَؤُونَ','taqrauuna',     NULL, 'أَنْتُمْ تَقْرَؤُونَ جَيِّدًا', 'أَنْتُمْ تَقْرَؤُونَ جَيِّدًا', 'Vous lisez bien.', NOW()),
('conj-qaraa-present-hum',   'word-qaraa', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يقرؤون', 'يَقْرَؤُونَ','yaqrauuna',     NULL, 'هُمْ يَقْرَؤُونَ الكُتُبَ',     'هُمْ يَقْرَؤُونَ الكُتُبَ',     'Ils lisent des livres.', NOW());

-- ---- ذَهَبَ / يَذْهَبُ (aller) ----
INSERT INTO conjugation_entries VALUES
('conj-dhahaba-present-ana',   'word-dhahaba', 'present', 1, 'ana',   'أَنَا',   'je',        'أذهب',   'أَذْهَبُ',   'adhhabu',       NULL, 'أَنَا أَذْهَبُ إِلَى الْمَدْرَسَةِ','أَنَا أَذْهَبُ إِلَى الْمَدْرَسَةِ','Je vais à l''école.', NOW()),
('conj-dhahaba-present-anta',  'word-dhahaba', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تذهب',   'تَذْهَبُ',   'tadhhabu',      NULL, 'أَيْنَ تَذْهَبُ؟',               'أَيْنَ تَذْهَبُ؟',               'Où vas-tu ?', NOW()),
('conj-dhahaba-present-anti',  'word-dhahaba', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تذهبين', 'تَذْهَبِينَ','tadhhabina',    NULL, 'أَيْنَ تَذْهَبِينَ؟',            'أَيْنَ تَذْهَبِينَ؟',            'Où vas-tu ?', NOW()),
('conj-dhahaba-present-huwa',  'word-dhahaba', 'present', 1, 'huwa',  'هُوَ',    'il',        'يذهب',   'يَذْهَبُ',   'yadhhabu',      NULL, 'هُوَ يَذْهَبُ إِلَى الْعَمَلِ', 'هُوَ يَذْهَبُ إِلَى الْعَمَلِ', 'Il va au travail.', NOW()),
('conj-dhahaba-present-hiya',  'word-dhahaba', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تذهب',   'تَذْهَبُ',   'tadhhabu',      NULL, 'هِيَ تَذْهَبُ إِلَى السُّوقِ',  'هِيَ تَذْهَبُ إِلَى السُّوقِ',  'Elle va au marché.', NOW()),
('conj-dhahaba-present-nahnu', 'word-dhahaba', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نذهب',   'نَذْهَبُ',   'nadhhabu',      NULL, 'نَحْنُ نَذْهَبُ مَعًا',          'نَحْنُ نَذْهَبُ مَعًا',          'Nous y allons ensemble.', NOW()),
('conj-dhahaba-present-antum', 'word-dhahaba', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تذهبون', 'تَذْهَبُونَ','tadhhabbuna',   NULL, 'مَتَى تَذْهَبُونَ؟',            'مَتَى تَذْهَبُونَ؟',            'Quand y allez-vous ?', NOW()),
('conj-dhahaba-present-hum',   'word-dhahaba', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يذهبون', 'يَذْهَبُونَ','yadhhabuna',    NULL, 'هُمْ يَذْهَبُونَ كُلَّ يَوْمٍ', 'هُمْ يَذْهَبُونَ كُلَّ يَوْمٍ', 'Ils y vont chaque jour.', NOW());

-- ---- جَاءَ / يَجِيءُ (venir) ----
INSERT INTO conjugation_entries VALUES
('conj-jaaa-present-ana',   'word-jaaa', 'present', 1, 'ana',   'أَنَا',   'je',        'أجيء',   'أَجِيءُ',   'ajîu',          NULL, 'أَنَا أَجِيءُ مِنْ بَارِيسَ',    'أَنَا أَجِيءُ مِنْ بَارِيسَ',    'Je viens de Paris.', NOW()),
('conj-jaaa-present-anta',  'word-jaaa', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تجيء',   'تَجِيءُ',   'tajîu',         NULL, 'مِنْ أَيْنَ تَجِيءُ؟',           'مِنْ أَيْنَ تَجِيءُ؟',           'D''où viens-tu ?', NOW()),
('conj-jaaa-present-anti',  'word-jaaa', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تجيئين', 'تَجِيئِينَ','tajîîna',       NULL, 'مِنْ أَيْنَ تَجِيئِينَ؟',        'مِنْ أَيْنَ تَجِيئِينَ؟',        'D''où viens-tu ?', NOW()),
('conj-jaaa-present-huwa',  'word-jaaa', 'present', 1, 'huwa',  'هُوَ',    'il',        'يجيء',   'يَجِيءُ',   'yajîu',         NULL, 'هُوَ يَجِيءُ غَدًا',             'هُوَ يَجِيءُ غَدًا',             'Il vient demain.', NOW()),
('conj-jaaa-present-hiya',  'word-jaaa', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تجيء',   'تَجِيءُ',   'tajîu',         NULL, 'هِيَ تَجِيءُ مَعِي',             'هِيَ تَجِيءُ مَعِي',             'Elle vient avec moi.', NOW()),
('conj-jaaa-present-nahnu', 'word-jaaa', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نجيء',   'نَجِيءُ',   'najîu',         NULL, 'نَحْنُ نَجِيءُ مُتَأَخِّرِينَ', 'نَحْنُ نَجِيءُ مُتَأَخِّرِينَ', 'Nous arrivons en retard.', NOW()),
('conj-jaaa-present-antum', 'word-jaaa', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تجيئون', 'تَجِيئُونَ','tajîûna',       NULL, 'هَلْ تَجِيئُونَ مَعَنَا؟',       'هَلْ تَجِيئُونَ مَعَنَا؟',       'Venez-vous avec nous ?', NOW()),
('conj-jaaa-present-hum',   'word-jaaa', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يجيئون', 'يَجِيئُونَ','yajîûna',       NULL, 'هُمْ يَجِيئُونَ غَدًا',          'هُمْ يَجِيئُونَ غَدًا',          'Ils viennent demain.', NOW());

-- ---- أَكَلَ / يَأْكُلُ (manger) ----
INSERT INTO conjugation_entries VALUES
('conj-akala-present-ana',   'word-akala', 'present', 1, 'ana',   'أَنَا',   'je',        'آكل',    'آكُلُ',     'âkulu',         NULL, 'أَنَا آكُلُ الآنَ',               'أَنَا آكُلُ الآنَ',               'Je mange maintenant.', NOW()),
('conj-akala-present-anta',  'word-akala', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تأكل',   'تَأْكُلُ',  'takulu',        NULL, 'مَاذَا تَأْكُلُ؟',               'مَاذَا تَأْكُلُ؟',               'Que manges-tu ?', NOW()),
('conj-akala-present-anti',  'word-akala', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تأكلين', 'تَأْكُلِينَ','takulina',      NULL, 'هَلْ تَأْكُلِينَ هُنَا؟',        'هَلْ تَأْكُلِينَ هُنَا؟',        'Tu manges ici ?', NOW()),
('conj-akala-present-huwa',  'word-akala', 'present', 1, 'huwa',  'هُوَ',    'il',        'يأكل',   'يَأْكُلُ',  'yakulu',        NULL, 'هُوَ يَأْكُلُ الفَاكِهَةَ',     'هُوَ يَأْكُلُ الفَاكِهَةَ',     'Il mange le fruit.', NOW()),
('conj-akala-present-hiya',  'word-akala', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تأكل',   'تَأْكُلُ',  'takulu',        NULL, 'هِيَ لَا تَأْكُلُ اللَّحْمَ',  'هِيَ لَا تَأْكُلُ اللَّحْمَ',  'Elle ne mange pas la viande.', NOW()),
('conj-akala-present-nahnu', 'word-akala', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نأكل',   'نَأْكُلُ',  'nakulu',        NULL, 'نَحْنُ نَأْكُلُ مَعًا',          'نَحْنُ نَأْكُلُ مَعًا',          'Nous mangeons ensemble.', NOW()),
('conj-akala-present-antum', 'word-akala', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تأكلون', 'تَأْكُلُونَ','takuluna',      NULL, 'مَاذَا تَأْكُلُونَ؟',           'مَاذَا تَأْكُلُونَ؟',           'Qu''est-ce que vous mangez ?', NOW()),
('conj-akala-present-hum',   'word-akala', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يأكلون', 'يَأْكُلُونَ','yakuluna',      NULL, 'هُمْ يَأْكُلُونَ الخُبْزَ',     'هُمْ يَأْكُلُونَ الخُبْزَ',     'Ils mangent du pain.', NOW());

-- ---- شَرِبَ / يَشْرَبُ (boire) ----
INSERT INTO conjugation_entries VALUES
('conj-shariba-present-ana',   'word-shariba', 'present', 1, 'ana',   'أَنَا',   'je',        'أشرب',   'أَشْرَبُ',  'ashrabu',       NULL, 'أَنَا أَشْرَبُ الْقَهْوَةَ',     'أَنَا أَشْرَبُ الْقَهْوَةَ',     'Je bois du café.', NOW()),
('conj-shariba-present-anta',  'word-shariba', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تشرب',   'تَشْرَبُ',  'tashrabu',      NULL, 'مَاذَا تَشْرَبُ؟',               'مَاذَا تَشْرَبُ؟',               'Que bois-tu ?', NOW()),
('conj-shariba-present-anti',  'word-shariba', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تشربين', 'تَشْرَبِينَ','tashrabina',    NULL, 'هَلْ تَشْرَبِينَ شَايًا؟',       'هَلْ تَشْرَبِينَ شَايًا؟',       'Bois-tu du thé ?', NOW()),
('conj-shariba-present-huwa',  'word-shariba', 'present', 1, 'huwa',  'هُوَ',    'il',        'يشرب',   'يَشْرَبُ',  'yashrabu',      NULL, 'هُوَ يَشْرَبُ الْمَاءَ',        'هُوَ يَشْرَبُ الْمَاءَ',        'Il boit de l''eau.', NOW()),
('conj-shariba-present-hiya',  'word-shariba', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تشرب',   'تَشْرَبُ',  'tashrabu',      NULL, 'هِيَ تَشْرَبُ الْعَصِيرَ',      'هِيَ تَشْرَبُ الْعَصِيرَ',      'Elle boit du jus.', NOW()),
('conj-shariba-present-nahnu', 'word-shariba', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نشرب',   'نَشْرَبُ',  'nashrabu',      NULL, 'نَحْنُ نَشْرَبُ الشَّايَ',      'نَحْنُ نَشْرَبُ الشَّايَ',      'Nous buvons le thé.', NOW()),
('conj-shariba-present-antum', 'word-shariba', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تشربون', 'تَشْرَبُونَ','tashrabuna',    NULL, 'مَاذَا تَشْرَبُونَ؟',           'مَاذَا تَشْرَبُونَ؟',           'Que buvez-vous ?', NOW()),
('conj-shariba-present-hum',   'word-shariba', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يشربون', 'يَشْرَبُونَ','yashrabuna',    NULL, 'هُمْ يَشْرَبُونَ الْقَهْوَةَ', 'هُمْ يَشْرَبُونَ الْقَهْوَةَ', 'Ils boivent du café.', NOW());
```

**Checkpoint Mission 1 :**
- [ ] 48 lignes insérées dans `conjugation_entries` (tense = 'present')
- [ ] Vérifier dans Table Editor : filtrer `tense = 'present'` → 48 résultats
- [ ] Aucune violation de clé étrangère (`word_id` valides)

---

## MISSION 2 — Seed DB : 4 nouveaux verbes de situation

**Contexte :** Pour les situations (marché, famille, voyage), 4 nouveaux verbes indispensables. Ils suivent le même pattern que M6 : entrée dans `words` + conjugaisons passé + présent.

### 2a — Nouveaux verbes dans `words` (Supabase Cloud)

```sql
-- 4 nouveaux verbes de situation
INSERT INTO words (id, arabic, arabic_vocalized, transliteration, translation_fr, word_type, lesson_id, sort_order, difficulty, created_at) VALUES
('word-arafa',  'عرف',  'عَرَفَ',  'ʿarafa',  'savoir, connaître',  'verb', 'lesson-701', 1, 2, NOW()),
('word-aradu',  'أراد', 'أَرَادَ', 'arāda',   'vouloir',            'verb', 'lesson-701', 2, 2, NOW()),
('word-safara', 'سافر', 'سَافَرَ', 'sāfara',  'voyager',            'verb', 'lesson-702', 3, 2, NOW()),
('word-ishtara','اشترى','اِشْتَرَى','ishtarā', 'acheter',            'verb', 'lesson-703', 4, 2, NOW());
```

### 2b — Conjugaisons passé pour les 4 nouveaux verbes (Supabase Cloud)

```sql
-- عَرَفَ (savoir/connaître) — passé, 8 pronoms
INSERT INTO conjugation_entries VALUES
('conj-arafa-past-ana',   'word-arafa', 'past', 1, 'ana',   'أَنَا',   'je',        'عرفت',   'عَرَفْتُ',   'ʿaraftu',   NULL, 'أَنَا عَرَفْتُ الحَقِيقَةَ',   'أَنَا عَرَفْتُ الحَقِيقَةَ',   'J''ai su la vérité.', NOW()),
('conj-arafa-past-anta',  'word-arafa', 'past', 1, 'anta',  'أَنْتَ',  'tu (m)',    'عرفت',   'عَرَفْتَ',   'ʿarafta',   NULL, 'عَرَفْتَ الجَوَابَ',           'عَرَفْتَ الجَوَابَ',           'Tu as su la réponse.', NOW()),
('conj-arafa-past-anti',  'word-arafa', 'past', 1, 'anti',  'أَنْتِ',  'tu (f)',    'عرفت',   'عَرَفْتِ',   'ʿarafti',   NULL, 'عَرَفْتِ الطَّرِيقَ',          'عَرَفْتِ الطَّرِيقَ',          'Tu as connu le chemin.', NOW()),
('conj-arafa-past-huwa',  'word-arafa', 'past', 1, 'huwa',  'هُوَ',    'il',        'عرف',    'عَرَفَ',     'ʿarafa',    NULL, 'هُوَ عَرَفَ الحَلَّ',          'هُوَ عَرَفَ الحَلَّ',          'Il a connu la solution.', NOW()),
('conj-arafa-past-hiya',  'word-arafa', 'past', 1, 'hiya',  'هِيَ',    'elle',      'عرفت',   'عَرَفَتْ',   'ʿarafat',   NULL, 'هِيَ عَرَفَتِ الحَقِيقَةَ',   'هِيَ عَرَفَتِ الحَقِيقَةَ',   'Elle a su la vérité.', NOW()),
('conj-arafa-past-nahnu', 'word-arafa', 'past', 1, 'nahnu', 'نَحْنُ',  'nous',      'عرفنا',  'عَرَفْنَا',  'ʿarafnā',   NULL, 'عَرَفْنَا الطَّرِيقَ',         'عَرَفْنَا الطَّرِيقَ',         'Nous avons connu le chemin.', NOW()),
('conj-arafa-past-antum', 'word-arafa', 'past', 1, 'antum', 'أَنْتُمْ','vous',      'عرفتم',  'عَرَفْتُمْ', 'ʿaraftum',  NULL, 'عَرَفْتُمْ الإِجَابَةَ',       'عَرَفْتُمْ الإِجَابَةَ',       'Vous avez su la réponse.', NOW()),
('conj-arafa-past-hum',   'word-arafa', 'past', 1, 'hum',   'هُمْ',    'ils/elles', 'عرفوا',  'عَرَفُوا',   'ʿarafū',    NULL, 'عَرَفُوا المَكَانَ',           'عَرَفُوا المَكَانَ',           'Ils ont connu l''endroit.', NOW());

-- أَرَادَ (vouloir) — passé
INSERT INTO conjugation_entries VALUES
('conj-aradu-past-ana',   'word-aradu', 'past', 1, 'ana',   'أَنَا',   'je',        'أردت',   'أَرَدْتُ',   'aradtu',    NULL, 'أَرَدْتُ القَهْوَةَ',          'أَرَدْتُ القَهْوَةَ',          'J''ai voulu du café.', NOW()),
('conj-aradu-past-anta',  'word-aradu', 'past', 1, 'anta',  'أَنْتَ',  'tu (m)',    'أردت',   'أَرَدْتَ',   'aradta',    NULL, 'أَرَدْتَ المُسَاعَدَةَ',       'أَرَدْتَ المُسَاعَدَةَ',       'Tu as voulu de l''aide.', NOW()),
('conj-aradu-past-anti',  'word-aradu', 'past', 1, 'anti',  'أَنْتِ',  'tu (f)',    'أردت',   'أَرَدْتِ',   'aradti',    NULL, 'أَرَدْتِ الذَّهَابَ',          'أَرَدْتِ الذَّهَابَ',          'Tu as voulu partir.', NOW()),
('conj-aradu-past-huwa',  'word-aradu', 'past', 1, 'huwa',  'هُوَ',    'il',        'أراد',   'أَرَادَ',    'arāda',     NULL, 'هُوَ أَرَادَ الرُّجُوعَ',      'هُوَ أَرَادَ الرُّجُوعَ',      'Il a voulu rentrer.', NOW()),
('conj-aradu-past-hiya',  'word-aradu', 'past', 1, 'hiya',  'هِيَ',    'elle',      'أرادت',  'أَرَادَتْ',  'arādat',    NULL, 'هِيَ أَرَادَتِ الشَّرَابَ',    'هِيَ أَرَادَتِ الشَّرَابَ',    'Elle a voulu à boire.', NOW()),
('conj-aradu-past-nahnu', 'word-aradu', 'past', 1, 'nahnu', 'نَحْنُ',  'nous',      'أردنا',  'أَرَدْنَا',  'aradnā',    NULL, 'أَرَدْنَا المُغَادَرَةَ',      'أَرَدْنَا المُغَادَرَةَ',      'Nous avons voulu partir.', NOW()),
('conj-aradu-past-antum', 'word-aradu', 'past', 1, 'antum', 'أَنْتُمْ','vous',      'أردتم',  'أَرَدْتُمْ', 'aradtum',   NULL, 'مَاذَا أَرَدْتُمْ؟',           'مَاذَا أَرَدْتُمْ؟',           'Qu''avez-vous voulu ?', NOW()),
('conj-aradu-past-hum',   'word-aradu', 'past', 1, 'hum',   'هُمْ',    'ils/elles', 'أرادوا', 'أَرَادُوا',  'arādū',     NULL, 'أَرَادُوا البَقَاءَ',           'أَرَادُوا البَقَاءَ',           'Ils ont voulu rester.', NOW());

-- سَافَرَ (voyager) — passé
INSERT INTO conjugation_entries VALUES
('conj-safara-past-ana',   'word-safara', 'past', 1, 'ana',   'أَنَا',   'je',        'سافرت',  'سَافَرْتُ',  'sāfartu',   NULL, 'سَافَرْتُ إِلَى مَصْرَ',       'سَافَرْتُ إِلَى مَصْرَ',       'J''ai voyagé en Égypte.', NOW()),
('conj-safara-past-anta',  'word-safara', 'past', 1, 'anta',  'أَنْتَ',  'tu (m)',    'سافرت',  'سَافَرْتَ',  'sāfarta',   NULL, 'أَيْنَ سَافَرْتَ؟',            'أَيْنَ سَافَرْتَ؟',            'Où as-tu voyagé ?', NOW()),
('conj-safara-past-anti',  'word-safara', 'past', 1, 'anti',  'أَنْتِ',  'tu (f)',    'سافرت',  'سَافَرْتِ',  'sāfarti',   NULL, 'سَافَرْتِ وَحْدَكِ؟',          'سَافَرْتِ وَحْدَكِ؟',          'Tu as voyagé seule ?', NOW()),
('conj-safara-past-huwa',  'word-safara', 'past', 1, 'huwa',  'هُوَ',    'il',        'سافر',   'سَافَرَ',    'sāfara',    NULL, 'هُوَ سَافَرَ أَمْسِ',          'هُوَ سَافَرَ أَمْسِ',          'Il a voyagé hier.', NOW()),
('conj-safara-past-hiya',  'word-safara', 'past', 1, 'hiya',  'هِيَ',    'elle',      'سافرت',  'سَافَرَتْ',  'sāfarat',   NULL, 'هِيَ سَافَرَتْ بَعِيدًا',      'هِيَ سَافَرَتْ بَعِيدًا',      'Elle a voyagé loin.', NOW()),
('conj-safara-past-nahnu', 'word-safara', 'past', 1, 'nahnu', 'نَحْنُ',  'nous',      'سافرنا', 'سَافَرْنَا', 'sāfarnā',   NULL, 'سَافَرْنَا كَثِيرًا',          'سَافَرْنَا كَثِيرًا',          'Nous avons beaucoup voyagé.', NOW()),
('conj-safara-past-antum', 'word-safara', 'past', 1, 'antum', 'أَنْتُمْ','vous',      'سافرتم', 'سَافَرْتُمْ','sāfartum',  NULL, 'سَافَرْتُمْ مَعًا؟',           'سَافَرْتُمْ مَعًا؟',           'Vous avez voyagé ensemble ?', NOW()),
('conj-safara-past-hum',   'word-safara', 'past', 1, 'hum',   'هُمْ',    'ils/elles', 'سافروا', 'سَافَرُوا',  'sāfarū',    NULL, 'سَافَرُوا إِلَى فَرَنْسَا',    'سَافَرُوا إِلَى فَرَنْسَا',    'Ils ont voyagé en France.', NOW());

-- اِشْتَرَى (acheter) — passé
INSERT INTO conjugation_entries VALUES
('conj-ishtara-past-ana',   'word-ishtara', 'past', 1, 'ana',   'أَنَا',   'je',        'اشتريت',  'اِشْتَرَيْتُ','ishtaraytu',  NULL, 'اِشْتَرَيْتُ خُبْزًا',         'اِشْتَرَيْتُ خُبْزًا',         'J''ai acheté du pain.', NOW()),
('conj-ishtara-past-anta',  'word-ishtara', 'past', 1, 'anta',  'أَنْتَ',  'tu (m)',    'اشتريت',  'اِشْتَرَيْتَ','ishtarayta',  NULL, 'اِشْتَرَيْتَ شَيْئًا؟',        'اِشْتَرَيْتَ شَيْئًا؟',        'As-tu acheté quelque chose ?', NOW()),
('conj-ishtara-past-anti',  'word-ishtara', 'past', 1, 'anti',  'أَنْتِ',  'tu (f)',    'اشتريت',  'اِشْتَرَيْتِ','ishtarayti',  NULL, 'مَا الَّذِي اِشْتَرَيْتِ؟',    'مَا الَّذِي اِشْتَرَيْتِ؟',    'Qu''as-tu acheté ?', NOW()),
('conj-ishtara-past-huwa',  'word-ishtara', 'past', 1, 'huwa',  'هُوَ',    'il',        'اشترى',   'اِشْتَرَى',  'ishtarā',     NULL, 'هُوَ اِشْتَرَى سَيَّارَةً',    'هُوَ اِشْتَرَى سَيَّارَةً',    'Il a acheté une voiture.', NOW()),
('conj-ishtara-past-hiya',  'word-ishtara', 'past', 1, 'hiya',  'هِيَ',    'elle',      'اشترت',   'اِشْتَرَتْ', 'ishtarat',    NULL, 'هِيَ اِشْتَرَتِ الفَاكِهَةَ',  'هِيَ اِشْتَرَتِ الفَاكِهَةَ',  'Elle a acheté les fruits.', NOW()),
('conj-ishtara-past-nahnu', 'word-ishtara', 'past', 1, 'nahnu', 'نَحْنُ',  'nous',      'اشترينا', 'اِشْتَرَيْنَا','ishtaraynā', NULL, 'اِشْتَرَيْنَا هَذَا البَيْتَ', 'اِشْتَرَيْنَا هَذَا البَيْتَ', 'Nous avons acheté cette maison.', NOW()),
('conj-ishtara-past-antum', 'word-ishtara', 'past', 1, 'antum', 'أَنْتُمْ','vous',      'اشتريتم', 'اِشْتَرَيْتُمْ','ishtaraytum',NULL, 'مَاذَا اِشْتَرَيْتُمْ؟',       'مَاذَا اِشْتَرَيْتُمْ؟',       'Qu''avez-vous acheté ?', NOW()),
('conj-ishtara-past-hum',   'word-ishtara', 'past', 1, 'hum',   'هُمْ',    'ils/elles', 'اشتروا',  'اِشْتَرَوْا','ishtarawū',   NULL, 'اِشْتَرَوْا الخُضَارَ',        'اِشْتَرَوْا الخُضَارَ',        'Ils ont acheté les légumes.', NOW());
```

### 2c — Conjugaisons présent pour les 4 nouveaux verbes (Supabase Cloud)

```sql
-- يَعْرِفُ (savoir) — présent
INSERT INTO conjugation_entries VALUES
('conj-arafa-present-ana',   'word-arafa', 'present', 1, 'ana',   'أَنَا',   'je',        'أعرف',   'أَعْرِفُ',  'aʿrifu',    NULL, 'أَنَا أَعْرِفُ الطَّرِيقَ',    'أَنَا أَعْرِفُ الطَّرِيقَ',    'Je connais le chemin.', NOW()),
('conj-arafa-present-anta',  'word-arafa', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تعرف',   'تَعْرِفُ',  'taʿrifu',   NULL, 'هَلْ تَعْرِفُ هَذَا الرَّجُلَ؟','هَلْ تَعْرِفُ هَذَا الرَّجُلَ؟','Connais-tu cet homme ?', NOW()),
('conj-arafa-present-anti',  'word-arafa', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تعرفين', 'تَعْرِفِينَ','taʿrifina',  NULL, 'هَلْ تَعْرِفِينَ السَّبَبَ؟',  'هَلْ تَعْرِفِينَ السَّبَبَ؟',  'Connais-tu la raison ?', NOW()),
('conj-arafa-present-huwa',  'word-arafa', 'present', 1, 'huwa',  'هُوَ',    'il',        'يعرف',   'يَعْرِفُ',  'yaʿrifu',   NULL, 'هُوَ يَعْرِفُ الجَوَابَ',      'هُوَ يَعْرِفُ الجَوَابَ',      'Il connaît la réponse.', NOW()),
('conj-arafa-present-hiya',  'word-arafa', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تعرف',   'تَعْرِفُ',  'taʿrifu',   NULL, 'هِيَ تَعْرِفُ الحَقِيقَةَ',   'هِيَ تَعْرِفُ الحَقِيقَةَ',   'Elle connaît la vérité.', NOW()),
('conj-arafa-present-nahnu', 'word-arafa', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نعرف',   'نَعْرِفُ',  'naʿrifu',   NULL, 'نَحْنُ لَا نَعْرِفُ',          'نَحْنُ لَا نَعْرِفُ',          'Nous ne savons pas.', NOW()),
('conj-arafa-present-antum', 'word-arafa', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تعرفون', 'تَعْرِفُونَ','taʿrifuna',  NULL, 'هَلْ تَعْرِفُونَ هَذَا؟',     'هَلْ تَعْرِفُونَ هَذَا؟',     'Savez-vous ceci ?', NOW()),
('conj-arafa-present-hum',   'word-arafa', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يعرفون', 'يَعْرِفُونَ','yaʿrifuna',  NULL, 'هُمْ يَعْرِفُونَ المَكَانَ',   'هُمْ يَعْرِفُونَ المَكَانَ',   'Ils connaissent l''endroit.', NOW());

-- يُرِيدُ (vouloir) — présent
INSERT INTO conjugation_entries VALUES
('conj-aradu-present-ana',   'word-aradu', 'present', 1, 'ana',   'أَنَا',   'je',        'أريد',   'أُرِيدُ',   'urîdu',     NULL, 'أُرِيدُ أَنْ أَتَعَلَّمَ',     'أُرِيدُ أَنْ أَتَعَلَّمَ',     'Je veux apprendre.', NOW()),
('conj-aradu-present-anta',  'word-aradu', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تريد',   'تُرِيدُ',   'turîdu',    NULL, 'مَاذَا تُرِيدُ؟',              'مَاذَا تُرِيدُ؟',              'Que veux-tu ?', NOW()),
('conj-aradu-present-anti',  'word-aradu', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تريدين', 'تُرِيدِينَ','turîdina',   NULL, 'مَاذَا تُرِيدِينَ؟',           'مَاذَا تُرِيدِينَ؟',           'Que veux-tu ?', NOW()),
('conj-aradu-present-huwa',  'word-aradu', 'present', 1, 'huwa',  'هُوَ',    'il',        'يريد',   'يُرِيدُ',   'yurîdu',    NULL, 'هُوَ يُرِيدُ المُسَاعَدَةَ',   'هُوَ يُرِيدُ المُسَاعَدَةَ',   'Il veut de l''aide.', NOW()),
('conj-aradu-present-hiya',  'word-aradu', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تريد',   'تُرِيدُ',   'turîdu',    NULL, 'هِيَ تُرِيدُ الذَّهَابَ',      'هِيَ تُرِيدُ الذَّهَابَ',      'Elle veut partir.', NOW()),
('conj-aradu-present-nahnu', 'word-aradu', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نريد',   'نُرِيدُ',   'nurîdu',    NULL, 'نُرِيدُ أَنْ نَبْقَى',         'نُرِيدُ أَنْ نَبْقَى',         'Nous voulons rester.', NOW()),
('conj-aradu-present-antum', 'word-aradu', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تريدون', 'تُرِيدُونَ','turîduna',   NULL, 'مَاذَا تُرِيدُونَ؟',           'مَاذَا تُرِيدُونَ؟',           'Que voulez-vous ?', NOW()),
('conj-aradu-present-hum',   'word-aradu', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يريدون', 'يُرِيدُونَ','yurîduna',   NULL, 'هُمْ يُرِيدُونَ المَزِيدَ',    'هُمْ يُرِيدُونَ المَزِيدَ',    'Ils veulent davantage.', NOW());

-- يُسَافِرُ (voyager) — présent
INSERT INTO conjugation_entries VALUES
('conj-safara-present-ana',   'word-safara', 'present', 1, 'ana',   'أَنَا',   'je',        'أسافر',  'أُسَافِرُ', 'usāfiru',   NULL, 'أُسَافِرُ غَدًا',              'أُسَافِرُ غَدًا',              'Je voyage demain.', NOW()),
('conj-safara-present-anta',  'word-safara', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تسافر',  'تُسَافِرُ', 'tusāfiru',  NULL, 'هَلْ تُسَافِرُ كَثِيرًا؟',     'هَلْ تُسَافِرُ كَثِيرًا؟',     'Voyages-tu souvent ?', NOW()),
('conj-safara-present-anti',  'word-safara', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تسافرين','تُسَافِرِينَ','tusāfirina', NULL, 'مَتَى تُسَافِرِينَ؟',          'مَتَى تُسَافِرِينَ؟',          'Quand voyages-tu ?', NOW()),
('conj-safara-present-huwa',  'word-safara', 'present', 1, 'huwa',  'هُوَ',    'il',        'يسافر',  'يُسَافِرُ', 'yusāfiru',  NULL, 'هُوَ يُسَافِرُ كَثِيرًا',      'هُوَ يُسَافِرُ كَثِيرًا',      'Il voyage souvent.', NOW()),
('conj-safara-present-hiya',  'word-safara', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تسافر',  'تُسَافِرُ', 'tusāfiru',  NULL, 'هِيَ تُسَافِرُ وَحْدَهَا',     'هِيَ تُسَافِرُ وَحْدَهَا',     'Elle voyage seule.', NOW()),
('conj-safara-present-nahnu', 'word-safara', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نسافر',  'نُسَافِرُ', 'nusāfiru',  NULL, 'نُسَافِرُ مَعًا',              'نُسَافِرُ مَعًا',              'Nous voyageons ensemble.', NOW()),
('conj-safara-present-antum', 'word-safara', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تسافرون','تُسَافِرُونَ','tusāfiruna', NULL, 'أَيْنَ تُسَافِرُونَ؟',         'أَيْنَ تُسَافِرُونَ؟',         'Où voyagez-vous ?', NOW()),
('conj-safara-present-hum',   'word-safara', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يسافرون','يُسَافِرُونَ','yusāfiruna', NULL, 'هُمْ يُسَافِرُونَ كُلَّ صَيْفٍ','هُمْ يُسَافِرُونَ كُلَّ صَيْفٍ','Ils voyagent chaque été.', NOW());

-- يَشْتَرِي (acheter) — présent
INSERT INTO conjugation_entries VALUES
('conj-ishtara-present-ana',   'word-ishtara', 'present', 1, 'ana',   'أَنَا',   'je',        'أشتري',  'أَشْتَرِي', 'ashtarî',   NULL, 'أَشْتَرِي الخُضَارَ',           'أَشْتَرِي الخُضَارَ',           'J''achète des légumes.', NOW()),
('conj-ishtara-present-anta',  'word-ishtara', 'present', 1, 'anta',  'أَنْتَ',  'tu (m)',    'تشتري',  'تَشْتَرِي', 'tashtarî',  NULL, 'مَاذَا تَشْتَرِي؟',             'مَاذَا تَشْتَرِي؟',             'Qu''achètes-tu ?', NOW()),
('conj-ishtara-present-anti',  'word-ishtara', 'present', 1, 'anti',  'أَنْتِ',  'tu (f)',    'تشترين', 'تَشْتَرِينَ','tashtarina', NULL, 'أَيْنَ تَشْتَرِينَ؟',          'أَيْنَ تَشْتَرِينَ؟',          'Où achètes-tu ?', NOW()),
('conj-ishtara-present-huwa',  'word-ishtara', 'present', 1, 'huwa',  'هُوَ',    'il',        'يشتري',  'يَشْتَرِي', 'yashtarî',  NULL, 'هُوَ يَشْتَرِي كُلَّ يَوْمٍ',  'هُوَ يَشْتَرِي كُلَّ يَوْمٍ',  'Il achète chaque jour.', NOW()),
('conj-ishtara-present-hiya',  'word-ishtara', 'present', 1, 'hiya',  'هِيَ',    'elle',      'تشتري',  'تَشْتَرِي', 'tashtarî',  NULL, 'هِيَ تَشْتَرِي الفَاكِهَةَ',   'هِيَ تَشْتَرِي الفَاكِهَةَ',   'Elle achète les fruits.', NOW()),
('conj-ishtara-present-nahnu', 'word-ishtara', 'present', 1, 'nahnu', 'نَحْنُ',  'nous',      'نشتري',  'نَشْتَرِي', 'nashtarî',  NULL, 'نَشْتَرِي مِنَ السُّوقِ',      'نَشْتَرِي مِنَ السُّوقِ',      'Nous achetons au marché.', NOW()),
('conj-ishtara-present-antum', 'word-ishtara', 'present', 1, 'antum', 'أَنْتُمْ','vous',      'تشترون', 'تَشْتَرُونَ','tashtaruna', NULL, 'مِنْ أَيْنَ تَشْتَرُونَ؟',     'مِنْ أَيْنَ تَشْتَرُونَ؟',     'Où achetez-vous ?', NOW()),
('conj-ishtara-present-hum',   'word-ishtara', 'present', 1, 'hum',   'هُمْ',    'ils/elles', 'يشترون', 'يَشْتَرُونَ','yashtaruna', NULL, 'هُمْ يَشْتَرُونَ بِالجُمْلَةِ','هُمْ يَشْتَرُونَ بِالجُمْلَةِ','Ils achètent en gros.', NOW());
```

**Checkpoint Mission 2 :**
- [ ] 4 nouveaux mots dans la table `words` (word-arafa, word-aradu, word-safara, word-ishtara)
- [ ] 32 lignes passé + 32 lignes présent = 64 nouvelles lignes dans `conjugation_entries`
- [ ] Total `conjugation_entries` : 48 (M6 passé) + 48 (M6 présent M1) + 64 (M2) = 160 lignes
- [ ] Aucune violation de clé étrangère (les `lesson_id` dans `words` pointent sur des leçons existantes ou à créer en Mission 3)

> **Note :** Les `lesson_id` 'lesson-701', 'lesson-702', 'lesson-703' dans la table `words` seront créés en Mission 3. Si Supabase refuse les foreign keys avant la création des leçons, utiliser `NULL` pour `lesson_id` et mettre à jour après la Mission 3.

---

## MISSION 3 — Seed DB : Module 7 (Au présent) et Module 8 (Situations de vie)

### 3a — Modules 7 et 8 dans `modules` (Supabase Cloud)

```sql
INSERT INTO modules (id, title_fr, title_ar, description_fr, sort_order, difficulty, is_available, prerequisite_module_id, created_at) VALUES
('module-007-present',
 'Au présent',
 'في الحاضر',
 'Conjuguez les verbes au présent (مضارع) et construisez des phrases de la vie quotidienne.',
 7, 2, false, 'module-006-verbs', NOW()),

('module-008-situations',
 'Situations de vie',
 'مواقف الحياة',
 'Trois situations réelles : au marché, en famille, en voyage. Dialogues, vocabulaire situé et formes verbales enrichies.',
 8, 3, false, 'module-007-present', NOW());
```

### 3b — Leçons du Module 7 dans `lessons` (Supabase Cloud)

```sql
INSERT INTO lessons (id, module_id, title_fr, title_ar, sort_order, difficulty, content_refs, created_at) VALUES
-- Module 7 : Au présent
('lesson-701', 'module-007-present',
 'Le présent : premiers pas',
 'المضارع : الخطوات الأولى',
 1, 2,
 ARRAY['word-kataba','word-qaraa','word-dhahaba'],
 NOW()),

('lesson-702', 'module-007-present',
 'Verbes de mouvement au présent',
 'أفعال الحركة في المضارع',
 2, 2,
 ARRAY['word-jaaa','word-dhahaba','word-safara'],
 NOW()),

('lesson-703', 'module-007-present',
 'Manger, boire, acheter',
 'الأكل والشرب والشراء',
 3, 2,
 ARRAY['word-akala','word-shariba','word-ishtara'],
 NOW()),

('lesson-704', 'module-007-present',
 'Vouloir et savoir',
 'الإرادة والمعرفة',
 4, 2,
 ARRAY['word-aradu','word-arafa'],
 NOW()),

('lesson-705', 'module-007-present',
 'Négation au présent (لا)',
 'النفي بـ لا',
 5, 2,
 ARRAY['word-kataba','word-qaraa','word-dhahaba','word-jaaa','word-akala','word-shariba','word-aradu','word-arafa','word-safara','word-ishtara'],
 NOW()),

('lesson-706', 'module-007-present',
 'Révision : Je parle au présent',
 'مراجعة : أتكلم في المضارع',
 6, 3,
 ARRAY['word-kataba','word-qaraa','word-dhahaba','word-jaaa','word-akala','word-shariba','word-aradu','word-arafa','word-safara','word-ishtara'],
 NOW());
```

### 3c — Leçons du Module 8 dans `lessons` (Supabase Cloud)

```sql
INSERT INTO lessons (id, module_id, title_fr, title_ar, sort_order, difficulty, content_refs, created_at) VALUES
-- Module 8 : Situations de vie
('lesson-801', 'module-008-situations',
 'Au marché',
 'في السوق',
 1, 3,
 ARRAY['dlg-market-001'],
 NOW()),

('lesson-802', 'module-008-situations',
 'En famille',
 'في العائلة',
 2, 3,
 ARRAY['dlg-family-001'],
 NOW()),

('lesson-803', 'module-008-situations',
 'En voyage',
 'في السفر',
 3, 3,
 ARRAY['dlg-travel-001'],
 NOW()),

('lesson-804', 'module-008-situations',
 'Formes dérivées : intensité et réciprocité',
 'الأوزان المشتقة : التكثير والمشاركة',
 4, 4,
 ARRAY['word-darrasa','word-kallama','word-safara-III','word-kaataba'],
 NOW()),

('lesson-805', 'module-008-situations',
 'Révision générale Phase 2',
 'مراجعة شاملة للمرحلة الثانية',
 5, 4,
 ARRAY['dlg-market-001','dlg-family-001','dlg-travel-001'],
 NOW());
```

**Checkpoint Mission 3 :**
- [ ] Modules 7 et 8 dans `modules` — visibles dans Table Editor
- [ ] 6 leçons M7 + 5 leçons M8 dans `lessons`
- [ ] Les `lesson_id` dans `words` (word-arafa, etc.) peuvent être mis à jour maintenant que les leçons existent
- [ ] Modules 7 et 8 apparaissent dans l'onglet Learn (verrouillés)

---

## MISSION 4 — Nouvelle table `dialogue_scenarios` + seed des 3 situations

**Contexte :** Le dialogue engine de É11 lit des scripts de dialogue depuis la base. Il faut une table dédiée pour les scénarios structurés, plus riche que les simples exercices dialogue actuels.

### 4a — Table `dialogue_scenarios` (Supabase Cloud — SQL Editor)

```sql
CREATE TABLE IF NOT EXISTS dialogue_scenarios (
  id               TEXT PRIMARY KEY,
  lesson_id        TEXT NOT NULL REFERENCES lessons(id),
  title_fr         TEXT NOT NULL,
  title_ar         TEXT NOT NULL,
  context_fr       TEXT NOT NULL,       -- Description de la situation en français
  setting_ar       TEXT NOT NULL,       -- Phrase d'introduction en arabe vocalisé
  setting_transliteration TEXT NOT NULL,
  difficulty       INTEGER NOT NULL DEFAULT 3,
  turns            JSONB NOT NULL,      -- Array de tours de dialogue (voir structure ci-dessous)
  vocabulary_ids   TEXT[] DEFAULT '{}', -- word_id des mots clés du scénario
  grammar_rule_ids TEXT[] DEFAULT '{}', -- grammar_rule_id mobilisées
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Structure d'un tour (turns JSONB) :
-- [
--   {
--     "id": "turn-1",
--     "speaker": "A" | "B",
--     "speaker_role_fr": "Le vendeur",
--     "speaker_role_ar": "البائع",
--     "text_ar": "...",
--     "text_ar_vocalized": "...",
--     "transliteration": "...",
--     "translation_fr": "...",
--     "is_learner_turn": true | false,
--     "choices": [           -- null si is_learner_turn = false
--       { "id": "c1", "text_ar": "...", "text_ar_vocalized": "...", "translation_fr": "...", "is_correct": true },
--       { "id": "c2", "text_ar": "...", "text_ar_vocalized": "...", "translation_fr": "...", "is_correct": false },
--       { "id": "c3", "text_ar": "...", "text_ar_vocalized": "...", "translation_fr": "...", "is_correct": false }
--     ]
--   }
-- ]

ALTER TABLE dialogue_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dialogue_scenarios_public_read" ON dialogue_scenarios
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_dlg_lesson ON dialogue_scenarios(lesson_id);
```

### 4b — Ajouter `dialogue_scenarios` dans le schéma SQLite local

Dans `src/db/schema-local.ts`, dans `initLocalSchema()` :

```typescript
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS dialogue_scenarios (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    title_fr TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    context_fr TEXT NOT NULL,
    setting_ar TEXT NOT NULL,
    setting_transliteration TEXT NOT NULL,
    difficulty INTEGER NOT NULL DEFAULT 3,
    turns TEXT NOT NULL DEFAULT '[]',
    vocabulary_ids TEXT NOT NULL DEFAULT '[]',
    grammar_rule_ids TEXT NOT NULL DEFAULT '[]',
    synced_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_dlg_lesson ON dialogue_scenarios(lesson_id);
`);
```

### 4c — Seed : 3 scénarios de dialogue (Supabase Cloud)

```sql
-- ============================================================
-- SCÉNARIO 1 : Au marché (في السوق)
-- ============================================================
INSERT INTO dialogue_scenarios (id, lesson_id, title_fr, title_ar, context_fr, setting_ar, setting_transliteration, difficulty, turns, vocabulary_ids) VALUES
('dlg-market-001', 'lesson-801',
 'Au marché de fruits', 'في سوق الفاكهة',
 'Tu es au marché. Tu veux acheter des pommes. Le vendeur t''accueille.',
 'أَنْتَ فِي السُّوقِ. تُرِيدُ أَنْ تَشْتَرِيَ تُفَّاحًا.',
 'Anta fî l-sûq. Turîdu an tashtariya tuffāḥan.',
 3,
 '[
  {"id":"t1","speaker":"B","speaker_role_fr":"Le vendeur","speaker_role_ar":"البائع","text_ar":"أَهْلًا! مَاذَا تُرِيدُ؟","text_ar_vocalized":"أَهْلًا! مَاذَا تُرِيدُ؟","transliteration":"Ahlan! Mādhā turîdu?","translation_fr":"Bonjour ! Que voulez-vous ?","is_learner_turn":false,"choices":null},
  {"id":"t2","speaker":"A","speaker_role_fr":"Toi","speaker_role_ar":"أَنْتَ","text_ar":"أُرِيدُ تُفَّاحًا","text_ar_vocalized":"أُرِيدُ تُفَّاحًا","transliteration":"Urîdu tuffāḥan.","translation_fr":"Je veux des pommes.","is_learner_turn":true,"choices":[{"id":"c1","text_ar":"أُرِيدُ تُفَّاحًا","text_ar_vocalized":"أُرِيدُ تُفَّاحًا","translation_fr":"Je veux des pommes.","is_correct":true},{"id":"c2","text_ar":"أُرِيدُ مَاءً","text_ar_vocalized":"أُرِيدُ مَاءً","translation_fr":"Je veux de l''eau.","is_correct":false},{"id":"c3","text_ar":"لَا أُرِيدُ شَيْئًا","text_ar_vocalized":"لَا أُرِيدُ شَيْئًا","translation_fr":"Je ne veux rien.","is_correct":false}]},
  {"id":"t3","speaker":"B","speaker_role_fr":"Le vendeur","speaker_role_ar":"البائع","text_ar":"كَمْ كِيلُو تُرِيدُ؟","text_ar_vocalized":"كَمْ كِيلُو تُرِيدُ؟","transliteration":"Kam kîlû turîdu?","translation_fr":"Combien de kilos voulez-vous ?","is_learner_turn":false,"choices":null},
  {"id":"t4","speaker":"A","speaker_role_fr":"Toi","speaker_role_ar":"أَنْتَ","text_ar":"أُرِيدُ كِيلُوَيْنِ مِنْ فَضْلِكَ","text_ar_vocalized":"أُرِيدُ كِيلُوَيْنِ مِنْ فَضْلِكَ","transliteration":"Urîdu kîlûwayni min faḍlik.","translation_fr":"Je voudrais deux kilos, s''il vous plaît.","is_learner_turn":true,"choices":[{"id":"c1","text_ar":"أُرِيدُ كِيلُوَيْنِ مِنْ فَضْلِكَ","text_ar_vocalized":"أُرِيدُ كِيلُوَيْنِ مِنْ فَضْلِكَ","translation_fr":"Je voudrais deux kilos, s''il vous plaît.","is_correct":true},{"id":"c2","text_ar":"لَا أَعْرِفُ","text_ar_vocalized":"لَا أَعْرِفُ","translation_fr":"Je ne sais pas.","is_correct":false},{"id":"c3","text_ar":"كَثِيرًا جِدًّا","text_ar_vocalized":"كَثِيرًا جِدًّا","translation_fr":"Beaucoup trop.","is_correct":false}]},
  {"id":"t5","speaker":"B","speaker_role_fr":"Le vendeur","speaker_role_ar":"البائع","text_ar":"بِعَشَرَةِ دَرَاهِمَ. شُكْرًا!","text_ar_vocalized":"بِعَشَرَةِ دَرَاهِمَ. شُكْرًا!","transliteration":"Bi-ʿashara darāhima. Shukran!","translation_fr":"Pour dix dirhams. Merci !","is_learner_turn":false,"choices":null},
  {"id":"t6","speaker":"A","speaker_role_fr":"Toi","speaker_role_ar":"أَنْتَ","text_ar":"شُكْرًا لَكَ","text_ar_vocalized":"شُكْرًا لَكَ","transliteration":"Shukran lak.","translation_fr":"Merci à vous.","is_learner_turn":true,"choices":[{"id":"c1","text_ar":"شُكْرًا لَكَ","text_ar_vocalized":"شُكْرًا لَكَ","translation_fr":"Merci à vous.","is_correct":true},{"id":"c2","text_ar":"مَا شَاءَ اللَّهُ","text_ar_vocalized":"مَا شَاءَ اللَّهُ","translation_fr":"Quelle merveille !","is_correct":false},{"id":"c3","text_ar":"إِلَى اللِّقَاءِ","text_ar_vocalized":"إِلَى اللِّقَاءِ","translation_fr":"Au revoir.","is_correct":false}]}
 ]'::jsonb,
 ARRAY['word-aradu','word-ishtara']);

-- ============================================================
-- SCÉNARIO 2 : En famille (في العائلة)
-- ============================================================
INSERT INTO dialogue_scenarios (id, lesson_id, title_fr, title_ar, context_fr, setting_ar, setting_transliteration, difficulty, turns, vocabulary_ids) VALUES
('dlg-family-001', 'lesson-802',
 'Le dîner en famille', 'العشاء في العائلة',
 'Tu dînes en famille. Ta mère te pose des questions sur ta journée.',
 'أَنْتَ تَأْكُلُ مَعَ عَائِلَتِكَ. أُمُّكَ تَسْأَلُكَ عَنْ يَوْمِكَ.',
 'Anta ta''kulu maʿa ʿā''ilatik. Ummuka tas''aluka ʿan yawmik.',
 3,
 '[
  {"id":"t1","speaker":"B","speaker_role_fr":"Ta mère","speaker_role_ar":"أُمُّكَ","text_ar":"كَيْفَ كَانَ يَوْمُكَ؟","text_ar_vocalized":"كَيْفَ كَانَ يَوْمُكَ؟","transliteration":"Kayfa kāna yawmuk?","translation_fr":"Comment s''est passée ta journée ?","is_learner_turn":false,"choices":null},
  {"id":"t2","speaker":"A","speaker_role_fr":"Toi","speaker_role_ar":"أَنْتَ","text_ar":"كَانَ جَيِّدًا. ذَهَبْتُ إِلَى الْمَدْرَسَةِ","text_ar_vocalized":"كَانَ جَيِّدًا. ذَهَبْتُ إِلَى الْمَدْرَسَةِ","transliteration":"Kāna jayyidan. Dhahabtu ilā l-madrasa.","translation_fr":"C''était bien. Je suis allé à l''école.","is_learner_turn":true,"choices":[{"id":"c1","text_ar":"كَانَ جَيِّدًا. ذَهَبْتُ إِلَى الْمَدْرَسَةِ","text_ar_vocalized":"كَانَ جَيِّدًا. ذَهَبْتُ إِلَى الْمَدْرَسَةِ","translation_fr":"C''était bien. Je suis allé à l''école.","is_correct":true},{"id":"c2","text_ar":"لَا أَعْرِفُ","text_ar_vocalized":"لَا أَعْرِفُ","translation_fr":"Je ne sais pas.","is_correct":false},{"id":"c3","text_ar":"كَانَ سَيِّئًا","text_ar_vocalized":"كَانَ سَيِّئًا","translation_fr":"C''était mauvais.","is_correct":false}]},
  {"id":"t3","speaker":"B","speaker_role_fr":"Ta mère","speaker_role_ar":"أُمُّكَ","text_ar":"مَاذَا أَكَلْتَ هُنَاكَ؟","text_ar_vocalized":"مَاذَا أَكَلْتَ هُنَاكَ؟","transliteration":"Mādhā akalta hunāk?","translation_fr":"Qu''as-tu mangé là-bas ?","is_learner_turn":false,"choices":null},
  {"id":"t4","speaker":"A","speaker_role_fr":"Toi","speaker_role_ar":"أَنْتَ","text_ar":"أَكَلْتُ خُبْزًا وَجُبْنًا","text_ar_vocalized":"أَكَلْتُ خُبْزًا وَجُبْنًا","transliteration":"Akaltu khubzan wa-jubnan.","translation_fr":"J''ai mangé du pain et du fromage.","is_learner_turn":true,"choices":[{"id":"c1","text_ar":"أَكَلْتُ خُبْزًا وَجُبْنًا","text_ar_vocalized":"أَكَلْتُ خُبْزًا وَجُبْنًا","translation_fr":"J''ai mangé du pain et du fromage.","is_correct":true},{"id":"c2","text_ar":"مَا أَكَلْتُ شَيْئًا","text_ar_vocalized":"مَا أَكَلْتُ شَيْئًا","translation_fr":"Je n''ai rien mangé.","is_correct":false},{"id":"c3","text_ar":"شَرِبْتُ مَاءً فَقَطْ","text_ar_vocalized":"شَرِبْتُ مَاءً فَقَطْ","translation_fr":"J''ai seulement bu de l''eau.","is_correct":false}]},
  {"id":"t5","speaker":"B","speaker_role_fr":"Ta mère","speaker_role_ar":"أُمُّكَ","text_ar":"الآنَ كُلْ مَعَنَا! الأَكْلُ جَاهِزٌ","text_ar_vocalized":"الآنَ كُلْ مَعَنَا! الأَكْلُ جَاهِزٌ","transliteration":"Al-ān kul maʿanā! Al-aklu jāhiz.","translation_fr":"Mange maintenant avec nous ! Le repas est prêt.","is_learner_turn":false,"choices":null},
  {"id":"t6","speaker":"A","speaker_role_fr":"Toi","speaker_role_ar":"أَنْتَ","text_ar":"شُكْرًا يَا أُمِّي. يَبْدُو لَذِيذًا","text_ar_vocalized":"شُكْرًا يَا أُمِّي. يَبْدُو لَذِيذًا","transliteration":"Shukran yā ummî. Yabdû ladhîdhan.","translation_fr":"Merci maman. Ça a l''air délicieux.","is_learner_turn":true,"choices":[{"id":"c1","text_ar":"شُكْرًا يَا أُمِّي. يَبْدُو لَذِيذًا","text_ar_vocalized":"شُكْرًا يَا أُمِّي. يَبْدُو لَذِيذًا","translation_fr":"Merci maman. Ça a l''air délicieux.","is_correct":true},{"id":"c2","text_ar":"لَا أُرِيدُ الأَكْلَ","text_ar_vocalized":"لَا أُرِيدُ الأَكْلَ","translation_fr":"Je ne veux pas manger.","is_correct":false},{"id":"c3","text_ar":"أَنَا مَشْغُولٌ","text_ar_vocalized":"أَنَا مَشْغُولٌ","translation_fr":"Je suis occupé.","is_correct":false}]}
 ]'::jsonb,
 ARRAY['word-akala','word-dhahaba','word-aradu']);

-- ============================================================
-- SCÉNARIO 3 : En voyage (في السفر)
-- ============================================================
INSERT INTO dialogue_scenarios (id, lesson_id, title_fr, title_ar, context_fr, setting_ar, setting_transliteration, difficulty, turns, vocabulary_ids) VALUES
('dlg-travel-001', 'lesson-803',
 'À l''aéroport', 'في المطار',
 'Tu arrives à l''aéroport du Caire. Un agent te demande des informations sur ton voyage.',
 'أَنْتَ فِي مَطَارِ الْقَاهِرَةِ. مُوَظَّفٌ يَسْأَلُكَ عَنْ رِحْلَتِكَ.',
 'Anta fî maṭār al-Qāhira. Muwadhdhaun yas''aluka ʿan riḥlatik.',
 3,
 '[
  {"id":"t1","speaker":"B","speaker_role_fr":"L''agent","speaker_role_ar":"الْمُوَظَّفُ","text_ar":"مَرْحَبًا. مِنْ أَيْنَ جِئْتَ؟","text_ar_vocalized":"مَرْحَبًا. مِنْ أَيْنَ جِئْتَ؟","transliteration":"Marḥaban. Min ayna ji''ta?","translation_fr":"Bienvenue. D''où venez-vous ?","is_learner_turn":false,"choices":null},
  {"id":"t2","speaker":"A","speaker_role_fr":"Toi","speaker_role_ar":"أَنْتَ","text_ar":"جِئْتُ مِنْ فَرَنْسَا","text_ar_vocalized":"جِئْتُ مِنْ فَرَنْسَا","transliteration":"Ji''tu min Faransa.","translation_fr":"Je viens de France.","is_learner_turn":true,"choices":[{"id":"c1","text_ar":"جِئْتُ مِنْ فَرَنْسَا","text_ar_vocalized":"جِئْتُ مِنْ فَرَنْسَا","translation_fr":"Je viens de France.","is_correct":true},{"id":"c2","text_ar":"أُرِيدُ أَنْ أُسَافِرَ","text_ar_vocalized":"أُرِيدُ أَنْ أُسَافِرَ","translation_fr":"Je veux voyager.","is_correct":false},{"id":"c3","text_ar":"لَا أَعْرِفُ","text_ar_vocalized":"لَا أَعْرِفُ","translation_fr":"Je ne sais pas.","is_correct":false}]},
  {"id":"t3","speaker":"B","speaker_role_fr":"L''agent","speaker_role_ar":"الْمُوَظَّفُ","text_ar":"مَا سَبَبُ زِيَارَتِكَ لِمِصْرَ؟","text_ar_vocalized":"مَا سَبَبُ زِيَارَتِكَ لِمِصْرَ؟","transliteration":"Mā sabab ziyāratik li-Miṣr?","translation_fr":"Quelle est la raison de votre visite en Égypte ?","is_learner_turn":false,"choices":null},
  {"id":"t4","speaker":"A","speaker_role_fr":"Toi","speaker_role_ar":"أَنْتَ","text_ar":"أُسَافِرُ لِلسِّيَاحَةِ","text_ar_vocalized":"أُسَافِرُ لِلسِّيَاحَةِ","transliteration":"Usāfiru lil-siyāḥa.","translation_fr":"Je voyage pour le tourisme.","is_learner_turn":true,"choices":[{"id":"c1","text_ar":"أُسَافِرُ لِلسِّيَاحَةِ","text_ar_vocalized":"أُسَافِرُ لِلسِّيَاحَةِ","translation_fr":"Je voyage pour le tourisme.","is_correct":true},{"id":"c2","text_ar":"أَنَا مَشْغُولٌ","text_ar_vocalized":"أَنَا مَشْغُولٌ","translation_fr":"Je suis occupé.","is_correct":false},{"id":"c3","text_ar":"أُرِيدُ الرُّجُوعَ","text_ar_vocalized":"أُرِيدُ الرُّجُوعَ","translation_fr":"Je veux rentrer.","is_correct":false}]},
  {"id":"t5","speaker":"B","speaker_role_fr":"L''agent","speaker_role_ar":"الْمُوَظَّفُ","text_ar":"كَمْ يَوْمًا سَتَبْقَى؟","text_ar_vocalized":"كَمْ يَوْمًا سَتَبْقَى؟","transliteration":"Kam yawman sataqā?","translation_fr":"Combien de jours resterez-vous ?","is_learner_turn":false,"choices":null},
  {"id":"t6","speaker":"A","speaker_role_fr":"Toi","speaker_role_ar":"أَنْتَ","text_ar":"سَأَبْقَى أُسْبُوعًا","text_ar_vocalized":"سَأَبْقَى أُسْبُوعًا","transliteration":"Sa-abqā usbûʿan.","translation_fr":"Je resterai une semaine.","is_learner_turn":true,"choices":[{"id":"c1","text_ar":"سَأَبْقَى أُسْبُوعًا","text_ar_vocalized":"سَأَبْقَى أُسْبُوعًا","translation_fr":"Je resterai une semaine.","is_correct":true},{"id":"c2","text_ar":"لَا أَعْرِفُ بَعْدُ","text_ar_vocalized":"لَا أَعْرِفُ بَعْدُ","translation_fr":"Je ne sais pas encore.","is_correct":false},{"id":"c3","text_ar":"أُرِيدُ الذَّهَابَ الآنَ","text_ar_vocalized":"أُرِيدُ الذَّهَابَ الآنَ","translation_fr":"Je veux partir maintenant.","is_correct":false}]}
 ]'::jsonb,
 ARRAY['word-jaaa','word-safara','word-aradu','word-arafa']);
```

**Checkpoint Mission 4 :**
- [ ] Table `dialogue_scenarios` créée dans Supabase Cloud avec RLS
- [ ] Table `dialogue_scenarios` créée dans SQLite local (`schema-local.ts`)
- [ ] 3 scénarios insérés (dlg-market-001, dlg-family-001, dlg-travel-001)
- [ ] Vérifier dans Table Editor : champ `turns` en JSONB avec 6 tours chacun
- [ ] Aucune régression sur les tables existantes

---

## MISSION 5 — content-sync : synchronisation des nouvelles tables

**Contexte :** `content-sync.ts` (ou `sync-manager.ts`) doit apprendre à syncer `dialogue_scenarios`. Les `conjugation_entries` pour le présent et les nouveaux verbes suivent la même logique que le passé (même table, même sync).

### 5a — Ajouter `dialogue_scenarios` dans `content-sync.ts`

```typescript
// Dans src/db/content-sync.ts (ou l'équivalent)
// Ajouter après la sync de conjugation_entries :

async function syncDialogueScenarios(db: SQLiteDatabase): Promise<void> {
  const meta = await getSyncMeta(db, 'dialogue_scenarios');
  const since = meta?.last_synced_at ?? '1970-01-01T00:00:00Z';

  const { data, error } = await supabase
    .from('dialogue_scenarios')
    .select('*')
    .gt('created_at', since)
    .order('created_at', { ascending: true });

  if (error || !data?.length) return;

  for (const row of data) {
    await db.runAsync(`
      INSERT OR REPLACE INTO dialogue_scenarios
        (id, lesson_id, title_fr, title_ar, context_fr,
         setting_ar, setting_transliteration, difficulty,
         turns, vocabulary_ids, grammar_rule_ids, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      row.id,
      row.lesson_id,
      row.title_fr,
      row.title_ar,
      row.context_fr,
      row.setting_ar,
      row.setting_transliteration,
      row.difficulty,
      JSON.stringify(row.turns),         // JSONB → TEXT dans SQLite
      JSON.stringify(row.vocabulary_ids),
      JSON.stringify(row.grammar_rule_ids),
      new Date().toISOString(),
    ]);
  }

  await updateSyncMeta(db, 'dialogue_scenarios', data[data.length - 1].created_at);
}

// Appeler dans la fonction de sync principale :
// await syncDialogueScenarios(db);
```

### 5b — Hook `useDialogueScenario`

Dans `src/hooks/` :

```typescript
// src/hooks/useDialogueScenario.ts

import { useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';

export interface DialogueTurnChoice {
  id: string;
  text_ar: string;
  text_ar_vocalized: string;
  translation_fr: string;
  is_correct: boolean;
}

export interface DialogueTurn {
  id: string;
  speaker: 'A' | 'B';
  speaker_role_fr: string;
  speaker_role_ar: string;
  text_ar: string;
  text_ar_vocalized: string;
  transliteration: string;
  translation_fr: string;
  is_learner_turn: boolean;
  choices: DialogueTurnChoice[] | null;
}

export interface DialogueScenario {
  id: string;
  lesson_id: string;
  title_fr: string;
  title_ar: string;
  context_fr: string;
  setting_ar: string;
  setting_transliteration: string;
  difficulty: number;
  turns: DialogueTurn[];
  vocabulary_ids: string[];
  grammar_rule_ids: string[];
}

export function useDialogueScenario(scenarioId: string) {
  const db = useDatabase();
  const [scenario, setScenario] = useState<DialogueScenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !scenarioId) return;
    db.getFirstAsync<{ id: string; turns: string; vocabulary_ids: string; grammar_rule_ids: string } & Omit<DialogueScenario, 'turns' | 'vocabulary_ids' | 'grammar_rule_ids'>>(
      'SELECT * FROM dialogue_scenarios WHERE id = ?',
      [scenarioId]
    ).then((row) => {
      if (row) {
        setScenario({
          ...row,
          turns: JSON.parse(row.turns),
          vocabulary_ids: JSON.parse(row.vocabulary_ids),
          grammar_rule_ids: JSON.parse(row.grammar_rule_ids),
        });
      }
      setLoading(false);
    });
  }, [db, scenarioId]);

  return { scenario, loading };
}

// Hook pour récupérer les scénarios par lesson_id :
export function useDialogueScenariosForLesson(lessonId: string) {
  const db = useDatabase();
  const [scenarios, setScenarios] = useState<DialogueScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !lessonId) return;
    db.getAllAsync<any>(
      'SELECT * FROM dialogue_scenarios WHERE lesson_id = ? ORDER BY difficulty ASC',
      [lessonId]
    ).then((rows) => {
      setScenarios(rows.map(r => ({
        ...r,
        turns: JSON.parse(r.turns),
        vocabulary_ids: JSON.parse(r.vocabulary_ids),
        grammar_rule_ids: JSON.parse(r.grammar_rule_ids),
      })));
      setLoading(false);
    });
  }, [db, lessonId]);

  return { scenarios, loading };
}
```

**Checkpoint Mission 5 :**
- [ ] `syncDialogueScenarios()` ajouté dans `content-sync.ts` et appelé dans le sync principal
- [ ] Hook `useDialogueScenario` + `useDialogueScenariosForLesson` créés et typés
- [ ] Après sync : `dialogue_scenarios` dans SQLite contient 3 lignes
- [ ] Les `turns` sont bien parsés depuis JSON (pas de string brute)
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 6 — Nouveau type d'exercice : `fill_blank`

**Contexte :** Le fill-in-the-blank est l'exercice naturel de la conjugaison — l'apprenant doit produire la bonne forme verbale dans un contexte de phrase. Il complète les types existants `mcq`, `reorder`, `dialogue`.

### 6a — Types TypeScript

Dans `src/types/exercise.ts`, ajouter :

```typescript
// Type fill_blank
export interface FillBlankExercise extends BaseExercise {
  type: 'fill_blank';
  sentence_ar: string;           // La phrase complète avec BLANK_PLACEHOLDER
  sentence_ar_vocalized: string; // Idem vocalisé
  sentence_translation_fr: string;
  blank_placeholder: '___';       // Constante visuelle
  blank_position: 'verb' | 'noun' | 'adjective';
  correct_answer_ar: string;
  correct_answer_ar_vocalized: string;
  correct_answer_transliteration: string;
  choices: Array<{
    id: string;
    text_ar: string;
    text_ar_vocalized: string;
    transliteration: string;
    is_correct: boolean;
  }>;
  hint_fr?: string;              // ex: "Utilisez يَكْتُبُ pour 'il' au présent"
}

// Mettre à jour le discriminated union :
// export type Exercise = MCQExercise | ReorderExercise | DialogueExercise | FillBlankExercise;
```

### 6b — Composant `FillBlankExercise`

Créer `src/components/exercises/FillBlankExercise.tsx` :

```typescript
// src/components/exercises/FillBlankExercise.tsx
// Ce composant affiche :
// 1. La phrase avec un espace vide mis en valeur (___) — texte RTL
// 2. 3 ou 4 chips de choix en arabe sous la phrase
// 3. Sur sélection d'un chip : le ___ se remplace par le mot choisi (animation fade)
// 4. Validation : vert si correct, rouge si incorrect, puis bouton Continuer

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { ArabicText } from '../ArabicText';
import { colors, spacing, typography } from '../../design-tokens';
import type { FillBlankExercise as FillBlankExerciseType } from '../../types/exercise';

interface Props {
  exercise: FillBlankExerciseType;
  showHarakats: boolean;
  showTransliteration: boolean;
  onAnswer: (isCorrect: boolean) => void;
}

export function FillBlankExercise({ exercise, showHarakats, showTransliteration, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  const sentenceText = showHarakats
    ? exercise.sentence_ar_vocalized
    : exercise.sentence_ar;

  // Séparer la phrase au niveau du placeholder '___'
  const parts = sentenceText.split('___');

  const handleSelect = (choiceId: string) => {
    if (validated) return;
    setSelected(choiceId);
  };

  const handleValidate = () => {
    if (!selected) return;
    const choice = exercise.choices.find(c => c.id === selected);
    setValidated(true);
    onAnswer(choice?.is_correct ?? false);
  };

  const selectedChoice = exercise.choices.find(c => c.id === selected);
  const isCorrect = selectedChoice?.is_correct ?? false;

  return (
    <View style={styles.container}>
      {/* Contexte de traduction */}
      <Text style={styles.translationContext}>{exercise.sentence_translation_fr}</Text>

      {/* Phrase avec blank */}
      <View style={styles.sentenceContainer}>
        <ArabicText style={styles.sentenceText} textAlign="center">
          {parts[0]}
          {selected && validated ? (
            <ArabicText
              style={[
                styles.filledBlank,
                isCorrect ? styles.correct : styles.incorrect
              ]}
            >
              {showHarakats
                ? selectedChoice?.text_ar_vocalized
                : selectedChoice?.text_ar}
            </ArabicText>
          ) : (
            <Text style={[
              styles.blank,
              selected ? styles.blankFilled : undefined,
            ]}>
              {selected
                ? (showHarakats ? selectedChoice?.text_ar_vocalized : selectedChoice?.text_ar)
                : ' ___ '
              }
            </Text>
          )}
          {parts[1]}
        </ArabicText>
      </View>

      {/* Translittération optionnelle */}
      {showTransliteration && validated && (
        <Text style={styles.transliteration}>
          {exercise.sentence_ar.replace('___', selectedChoice?.transliteration ?? '...')}
        </Text>
      )}

      {/* Hint */}
      {exercise.hint_fr && !validated && (
        <Text style={styles.hint}>💡 {exercise.hint_fr}</Text>
      )}

      {/* Choices */}
      <View style={styles.choicesGrid}>
        {exercise.choices.map(choice => {
          const isSelected = selected === choice.id;
          const showResult = validated && isSelected;
          return (
            <TouchableOpacity
              key={choice.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                showResult && (choice.is_correct ? styles.chipCorrect : styles.chipIncorrect),
              ]}
              onPress={() => handleSelect(choice.id)}
              disabled={validated}
              accessibilityLabel={`${choice.text_ar_vocalized} — ${choice.transliteration}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <ArabicText style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}>
                {showHarakats ? choice.text_ar_vocalized : choice.text_ar}
              </ArabicText>
              {showTransliteration && (
                <Text style={styles.chipTranslit}>{choice.transliteration}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bouton valider */}
      {!validated && (
        <TouchableOpacity
          style={[styles.validateBtn, !selected && styles.validateBtnDisabled]}
          onPress={handleValidate}
          disabled={!selected}
        >
          <Text style={styles.validateBtnText}>Valider</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  translationContext: { fontSize: 14, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  sentenceContainer: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, minHeight: 80, justifyContent: 'center' },
  sentenceText: { fontSize: 24, lineHeight: 40, textAlign: 'center' },
  blank: { color: colors.primary, fontWeight: 'bold', letterSpacing: 2 },
  blankFilled: { color: colors.primary, fontWeight: 'bold' },
  filledBlank: { fontWeight: 'bold' },
  correct: { color: colors.success },
  incorrect: { color: colors.error },
  transliteration: { fontSize: 13, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  choicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipCorrect: { borderColor: colors.success, backgroundColor: colors.successLight },
  chipIncorrect: { borderColor: colors.error, backgroundColor: colors.errorLight },
  chipText: { fontSize: 20, lineHeight: 32 },
  chipTextSelected: { color: colors.primary },
  chipTranslit: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  validateBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  validateBtnDisabled: { backgroundColor: colors.border },
  validateBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
```

### 6c — Enregistrer `fill_blank` dans le registry d'exercices

Dans `src/engines/exercise-registry.ts` (ou l'équivalent) :

```typescript
import { FillBlankExercise } from '../components/exercises/FillBlankExercise';

// Dans l'objet registry :
fill_blank: FillBlankExercise,
```

**Checkpoint Mission 6 :**
- [ ] Type `FillBlankExercise` ajouté dans `exercise.ts` et union discriminante mise à jour
- [ ] Composant `FillBlankExercise.tsx` créé — affiche phrase + blank + chips + validation
- [ ] `fill_blank` enregistré dans le registry d'exercices
- [ ] Rendu manuel (story ou écran de test) : la phrase s'affiche RTL, le blank se remplace au clic, vert/rouge à la validation
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 7 — Générateur d'exercices présent et formes dérivées

**Contexte :** Deux nouveaux générateurs viendront s'ajouter à ceux de É11 (`grammar-exercise-generator`, `conjugation-exercise-generator`). Le générateur présent réutilise `conjugation-exercise-generator` en filtrant `tense = 'present'`. Le générateur formes-dérivées est nouveau et minimal.

### 7a — Mise à jour de `conjugation-exercise-generator.ts`

Le générateur existant génère des MCQ et Dialogue pour le passé. Étendre pour supporter le présent et le `fill_blank` :

```typescript
// Dans src/engines/conjugation-exercise-generator.ts

// Ajouter le type 'fill_blank' dans generateConjugationExercises() :
export function generatePresentTenseFillBlanks(
  entries: ConjugationEntry[],
  showHarakats: boolean,
  showTransliteration: boolean,
): FillBlankExercise[] {
  // Pour chaque entrée présent, générer un exercice fill_blank
  // Sentence pattern : "___  كُلَّ يَوْمٍ" où le blank est la forme conjuguée
  // 3 distracteurs : autres pronoms du même verbe

  return entries
    .filter(e => e.tense === 'present')
    .slice(0, 6) // Max 6 par leçon
    .map((entry, idx) => {
      // Distracteurs : autres entrées du même verbe, tense présent
      const distractors = entries
        .filter(e => e.tense === 'present' && e.word_id === entry.word_id && e.pronoun_code !== entry.pronoun_code)
        .slice(0, 3);

      const allChoices = [
        { id: 'correct', text_ar: entry.conjugated_ar, text_ar_vocalized: entry.conjugated_ar_vocalized, transliteration: entry.conjugated_transliteration, is_correct: true },
        ...distractors.map((d, i) => ({ id: `dist-${i}`, text_ar: d.conjugated_ar, text_ar_vocalized: d.conjugated_ar_vocalized, transliteration: d.conjugated_transliteration, is_correct: false })),
      ].sort(() => Math.random() - 0.5);

      // Construire la phrase avec blank
      const sentenceWithBlank = entry.example_sentence_ar
        ? entry.example_sentence_ar.replace(entry.conjugated_ar, '___')
        : `${entry.pronoun_ar} ___ `;

      return {
        id: `fill-present-${entry.id}`,
        type: 'fill_blank' as const,
        sentence_ar: sentenceWithBlank,
        sentence_ar_vocalized: (entry.example_sentence_ar_vocalized ?? sentenceWithBlank)
          .replace(entry.conjugated_ar_vocalized, '___'),
        sentence_translation_fr: entry.example_sentence_translation_fr ?? '',
        blank_placeholder: '___',
        blank_position: 'verb',
        correct_answer_ar: entry.conjugated_ar,
        correct_answer_ar_vocalized: entry.conjugated_ar_vocalized,
        correct_answer_transliteration: entry.conjugated_transliteration,
        choices: allChoices,
        hint_fr: `Utilisez la forme de "${entry.pronoun_fr}" au présent`,
      } satisfies FillBlankExercise;
    });
}
```

### 7b — Seed : formes dérivées II et III dans `grammar_rules`

```sql
-- Forme II (فَعَّلَ) — intensité/causatif
INSERT INTO grammar_rules VALUES
('gr-010-form-II', 'module-008-situations', 10,
 'Forme II : intensifier ou enseigner',
 'الوزن الثاني : التكثير',
 'La forme II (فَعَّلَ) intensifie l''action du verbe de base ou exprime que quelqu''un la fait faire à d''autres. On reconnaît la forme II à la lettre double du milieu.',
 'فَعَّلَ',
 'دَرَّسَ', 'دَرَّسَ', 'darrasa', 'enseigner (faire étudier)', NULL,
 'كَتَبَ = écrire → كَتَّبَ = faire écrire. دَرَسَ = étudier → دَرَّسَ = enseigner.',
 3, NOW()),

-- Forme III (فَاعَلَ) — réciprocité
('gr-011-form-III', 'module-008-situations', 11,
 'Forme III : l''action partagée',
 'الوزن الثالث : المشاركة',
 'La forme III (فَاعَلَ) indique une action entre deux personnes, une réciprocité ou une tentative. On reconnaît la forme III à la longue voyelle "aa" après la première lettre.',
 'فَاعَلَ',
 'كَاتَبَ', 'كَاتَبَ', 'kātaba', 'correspondre avec (s''écrire)', NULL,
 'كَتَبَ = écrire → كَاتَبَ = s''écrire mutuellement. سَافَرَ = voyager → سَافَرَ est déjà forme III.',
 4, NOW());
```

```sql
-- Verbes exemples pour les formes dérivées dans words
INSERT INTO words (id, arabic, arabic_vocalized, transliteration, translation_fr, word_type, lesson_id, sort_order, difficulty, created_at) VALUES
('word-darrasa',    'درّس',  'دَرَّسَ', 'darrasa', 'enseigner (forme II)', 'verb', 'lesson-804', 1, 3, NOW()),
('word-kallama',    'كلّم',  'كَلَّمَ', 'kallama', 'parler à (forme II)',  'verb', 'lesson-804', 2, 3, NOW()),
('word-kaataba',    'كاتب',  'كَاتَبَ', 'kātaba',  's''écrire (forme III)','verb', 'lesson-804', 3, 3, NOW()),
('word-saafara-III','سافر',  'سَافَرَ', 'sāfara',  'voyager (forme III)',  'verb', 'lesson-804', 4, 3, NOW());
```

**Checkpoint Mission 7 :**
- [ ] `generatePresentTenseFillBlanks()` implémentée et exportée
- [ ] Les exercices fill_blank utilisent des phrases d'exemple de la table (pas hardcodées)
- [ ] 2 nouvelles lignes dans `grammar_rules` (gr-010, gr-011)
- [ ] 4 nouveaux verbes dans `words` pour M8-L804
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 8 — Intégration lesson engine : M7 et M8

**Contexte :** Le lesson engine doit router les leçons de M7 vers `generatePresentTenseFillBlanks` + MCQ conjugaison, et les leçons de M8 vers le dialogue engine enrichi.

### 8a — Routing dans le lesson engine

Dans le fichier lesson engine (ex: `src/engines/lesson-engine.ts`) :

```typescript
// Ajouter les cas M7 et M8 :

const MODULE_7_ID = 'module-007-present';
const MODULE_8_ID = 'module-008-situations';

function buildExercisesForLesson(
  lesson: Lesson,
  conjugations: ConjugationEntry[],
  scenarios: DialogueScenario[],
  settings: UserSettings,
): Exercise[] {
  const exercises: Exercise[] = [];
  const showHarakats = settings.harakats_mode !== 'never';
  const showTranslit = settings.transliteration_mode !== 'never';

  // --- Module 7 : présent ---
  if (lesson.module_id === MODULE_7_ID) {
    const lessonConj = conjugations.filter(c =>
      lesson.content_refs.includes(c.word_id) && c.tense === 'present'
    );

    // MCQ : identifier le bon pronom
    const mcqPronouns = generatePronounMCQ(lessonConj, showHarakats);
    // FillBlank : compléter la forme conjuguée
    const fillBlanks = generatePresentTenseFillBlanks(lessonConj, showHarakats, showTranslit);

    exercises.push(...mcqPronouns.slice(0, 3), ...fillBlanks.slice(0, 3));
  }

  // --- Module 8 : situations ---
  else if (lesson.module_id === MODULE_8_ID) {
    // Leçons 801-803 : dialogue situé
    if (scenarios.length > 0) {
      const dialogueExercises = scenarios.map(s => buildDialogueExercise(s, showHarakats, showTranslit));
      exercises.push(...dialogueExercises);
    }
    // Leçon 804 : présentation formes II-III + MCQ reconnaissance
    if (lesson.id === 'lesson-804') {
      const formRules = rules.filter(r => ['gr-010-form-II','gr-011-form-III'].includes(r.id));
      exercises.push(...generateGrammarExercises(formRules, [], showHarakats, showTranslit));
    }
  }

  return exercises;
}
```

### 8b — Adaptateur dialogue scenarios → DialogueExercise

```typescript
// Dans src/engines/lesson-engine.ts ou dialogue-exercise-generator.ts

function buildDialogueExercise(scenario: DialogueScenario, showHarakats: boolean, showTranslit: boolean): DialogueExercise {
  return {
    id: `dlg-exercise-${scenario.id}`,
    type: 'dialogue',
    scenario_id: scenario.id,
    title_fr: scenario.title_fr,
    context_fr: scenario.context_fr,
    setting_ar: scenario.setting_ar,
    setting_transliteration: scenario.setting_transliteration,
    turns: scenario.turns,
    show_harakats: showHarakats,
    show_transliteration: showTranslit,
  };
}
```

**Checkpoint Mission 8 :**
- [ ] Leçon 701 → exercices MCQ pronoms + FillBlank présent s''affichent
- [ ] Leçon 801 → exercice dialogue (scénario marché) s''affiche
- [ ] Leçon 802 → dialogue famille
- [ ] Leçon 803 → dialogue voyage
- [ ] Leçon 804 → exercices MCQ reconnaissance formes II-III
- [ ] Aucun crash sur les leçons M5 et M6 (régression)

---

## MISSION 9 — Déverrouillage M7/M8 + analytics

### 9a — Déverrouillage progressif

Vérifier que la logique de déverrouillage (déjà en place) couvre M7 et M8 via `prerequisite_module_id` :

```sql
-- Si la colonne prerequisite_module_id n''existe pas encore :
ALTER TABLE modules ADD COLUMN IF NOT EXISTS prerequisite_module_id TEXT REFERENCES modules(id);

-- M7 débloqué après M6, M8 après M7 :
UPDATE modules SET prerequisite_module_id = 'module-006-verbs'    WHERE id = 'module-007-present';
UPDATE modules SET prerequisite_module_id = 'module-007-present'  WHERE id = 'module-008-situations';
```

```typescript
// Dans schema-local.ts si la colonne n''est pas encore là :
await db.execAsync(`
  ALTER TABLE modules ADD COLUMN IF NOT EXISTS prerequisite_module_id TEXT;
`);
```

### 9b — Analytics

```typescript
import { track } from '../analytics/posthog';

// Dans generatePresentTenseFillBlanks() :
track('present_exercises_generated', {
  lesson_id: lesson.id,
  module_id: MODULE_7_ID,
  fill_blank_count: fillBlanks.length,
});

// Dans buildDialogueExercise() :
track('dialogue_scenario_loaded', {
  scenario_id: scenario.id,
  lesson_id: scenario.lesson_id,
});
```

**Checkpoint Mission 9 :**
- [ ] M7 verrouillé jusqu''à complétion de M6 (test en app)
- [ ] M8 verrouillé jusqu''à complétion de M7
- [ ] Events `present_exercises_generated` et `dialogue_scenario_loaded` visibles dans PostHog

---

## MISSION 10 — Tests et régression complète

### Scénarios de test É12

**1. Sync des données :**
- Vider `sync_metadata` → relancer → `conjugation_entries` (tense=present) + `dialogue_scenarios` (3) dans SQLite

**2. Module 7 — Leçon 701 :**
- Débloquer artificiellement → ouvrir L701
- → MCQ pronoms + FillBlank présent s''affichent
- → Le ___ se remplace visuellement au clic
- → Vert/rouge correct à la validation

**3. Module 7 — Leçon 705 (Négation) :**
- → Phrases négatives avec لا + مضارع dans les FillBlank

**4. Module 8 — Leçon 801 (Marché) :**
- → Dialogue marché (6 tours), 3 tours learner avec choix
- → La progression dans le dialogue fonctionne (turn par turn)
- → Score final affiché

**5. Module 8 — Leçon 804 (Formes II-III) :**
- → Présentation des 2 règles grammaticales
- → MCQ reconnaissance forme II vs III

**6. RTL & accessibilité :**
- Composant FillBlank : texte arabe RTL dans la phrase
- Chips : `accessibilityLabel` lisible par VoiceOver/TalkBack

**7. Offline :**
- Mode avion → M7 et M8 fonctionnent depuis SQLite

**8. Architecture :**
```bash
grep -rn "from.*db/remote\|from.*supabase" \
  src/hooks/ src/stores/ src/components/ src/engines/
# → AUCUN résultat attendu
```

**9. Régression M1–M6 :**
- Compléter une leçon de chaque module → XP, streak, badges OK
- Aucune régression audio, gamification, SRS

**Checkpoint final É12 :**
- [ ] Sync : conjugations présent + dialogue_scenarios dans SQLite
- [ ] M7 : MCQ pronoms + FillBlank présent fonctionnels
- [ ] M8 : 3 dialogues situés fonctionnels (marché, famille, voyage)
- [ ] M8-L804 : formes II-III présentées avec MCQ
- [ ] `fill_blank` dans le registry, aucun crash
- [ ] Déverrouillage M7 → M8 fonctionnel
- [ ] RTL correct dans FillBlank
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] Architecture : aucun import db/remote dans hooks/engines
- [ ] Analytics : events PostHog visibles
- [ ] Aucune régression M1–M6

---

## RÉSUMÉ DE L'ÉTAPE 12

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | 48 conjugaisons présent pour les 6 verbes de M6 | ⬜ |
| 2 | 4 nouveaux verbes + 64 conjugaisons (passé + présent) | ⬜ |
| 3 | Modules 7 & 8 + 11 leçons dans Supabase | ⬜ |
| 4 | Table `dialogue_scenarios` + 3 scénarios situés | ⬜ |
| 5 | Sync `dialogue_scenarios` + hooks `useDialogueScenario` | ⬜ |
| 6 | Exercice `fill_blank` : types + composant + registry | ⬜ |
| 7 | `generatePresentTenseFillBlanks` + seed formes II-III | ⬜ |
| 8 | Lesson engine routage M7/M8 + adaptateur dialogue | ⬜ |
| 9 | Déverrouillage M7/M8 + analytics PostHog | ⬜ |
| 10 | Tests end-to-end + régression complète | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs après É12 :**
- `ETAPE-12-present-situations.md` (ce fichier)
- `lisaan-seed-letters.json`

**Fichiers à supprimer de /docs :**
- `ETAPE-11-phase2.md` (terminée)

---

> **Prochaine étape après validation :** Étape 13 — Impératif, futur proche (سَوْفَ / سَـ), mini-jeux chronométrés (speed round, memory match), et premier mode "défi quotidien" avec récompenses spéciales.
