# ÉTAPE 18 — Sourates 3–10, Dialecte égyptien, Badges & Infrastructure bêta

> Étapes terminées : 0 → 17.
> Cette étape : sourates courtes 3–10 (~160 mots), dialecte égyptien intro, système de badges gamification, et infrastructure bêta-test (feedback in-app, PostHog).
> Règle : missions séquentielles, checkpoints obligatoires.

> **Philosophie de cette étape** :
> - Les 6 sourates courtes restantes sont les plus récitées après Al-Fatiha et Al-Ikhlas. Les compléter clôt le premier cycle coranique et donne à l'app une valeur perçue immédiate pour la motivation n°1 des utilisateurs.
> - Le dialecte égyptien suit exactement le pattern Darija : variantes dans `word_variants`, pas une seule ligne de code nouvelle. Si le seed passe sans toucher au code, l'architecture multi-dialecte tient sa promesse.
> - Les badges sont le premier mécanisme de rétention *visible* : ils transforment la progression implicite (XP, streak) en célébration explicite. Impact J7/J30 démontré dans toutes les apps d'apprentissage.
> - L'infrastructure bêta est la priorité stratégique : sans métriques, on optimise à l'aveugle. PostHog events + feedback in-app donnent les données nécessaires pour valider ou pivoter avant le lancement public.

---

## Périmètre de É18

| Domaine | Contenu | Nouvelles tables/composants |
|---------|---------|----------------------------|
| Coranique | 6 sourates courtes (Al-Asr, Al-Kawthar, Al-Kafiroun, An-Nasr, Al-Masad, Al-Fil) + 4 leçons | Seed `quran_entries` uniquement |
| Égyptien | 30 variantes `word_variants` 'egyptian' + leçons intro | Seed `word_variants` uniquement |
| Badges | Système d'achievements (streak, modules, SRS, dialecte, coran) | `user_badges` (Supabase + SQLite) |
| Bêta | Feedback in-app, PostHog events, écran bêta-stats | `beta_feedback` (Supabase uniquement) |

**Ce qui est OUT de É18 :**
- Autres dialectes (levantin, khaliji) — après É19
- Tajwid interactif (colorisation des règles) — Phase 3
- Mode examen chronométré — Phase 3
- Conversation IA — Phase 3
- Reconnaissance vocale — Phase 3

---

## MISSION 0 — Scan initial

Lance `@codebase-scout` puis confirme l'état du repo avant de commencer. Vérifie en particulier : la table `quran_entries` (doit exister depuis É17 avec 44+ entrées), la table `word_variants` (darija seedé en É17), la table `srs_cards` (item_types actuels incluant `quran_word`), et le `badge-engine` existant (É9).

---

## MISSION 1 — Seed sourates coraniques 3–10

### Contexte pédagogique

Les 6 sourates cibles sont les plus connues et les plus récitées après Al-Fatiha et Al-Ikhlas :
- **Al-Asr (103)** — 3 versets, ~14 mots. La sourate de la sagesse du temps.
- **Al-Kawthar (108)** — 3 versets, ~10 mots. La plus courte du Coran.
- **Al-Kafiroun (109)** — 6 versets, ~26 mots. La déclaration de liberté de conscience.
- **An-Nasr (110)** — 3 versets, ~19 mots. La victoire divine.
- **Al-Masad (111)** — 5 versets, ~23 mots.
- **Al-Fil (105)** — 5 versets, ~23 mots.

Total visé : ~115 nouvelles entrées `quran_entries`.

### 1a — Seed dans le SQL Editor Supabase

```sql
-- ============================================================
-- ÉTAPE 18 — Seed quran_entries : sourates 103, 108, 109, 110, 111, 105
-- ============================================================

-- SOURATE 103 : AL-ASR — العصر
INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

-- V1 : وَالْعَصْرِ
('qe-103-1-1', 103, 'العصر', 'Al-Asr', 1, 1, 'والعصر', 'وَالْعَصْرِ', 'wal-ʕaṣri', 'Par le temps !', 'Waw de serment — Ayn pharyngal + Sad emphatique', 50),

-- V2 : إِنَّ الْإِنسَانَ لَفِي خُسْرٍ
('qe-103-2-1', 103, 'العصر', 'Al-Asr', 2, 1, 'إن', 'إِنَّ', 'inna', 'Certes', 'Chadda sur Nun — insistance', 51),
('qe-103-2-2', 103, 'العصر', 'Al-Asr', 2, 2, 'الإنسان', 'الْإِنسَانَ', 'al-insāna', 'l''être humain', NULL, 52),
('qe-103-2-3', 103, 'العصر', 'Al-Asr', 2, 3, 'لفي', 'لَفِي', 'lafī', 'est certes en', NULL, 53),
('qe-103-2-4', 103, 'العصر', 'Al-Asr', 2, 4, 'خسر', 'خُسْرٍ', 'ḵusrin', 'perte', 'Tanwin — indétermination', 54),

-- V3 : إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ
('qe-103-3-1', 103, 'العصر', 'Al-Asr', 3, 1, 'إلا', 'إِلَّا', 'illā', 'excepté', 'Chadda sur Lam', 55),
('qe-103-3-2', 103, 'العصر', 'Al-Asr', 3, 2, 'آمنوا', 'آمَنُوا', 'āmanū', 'ceux qui ont cru', NULL, 56),
('qe-103-3-3', 103, 'العصر', 'Al-Asr', 3, 3, 'عملوا', 'وَعَمِلُوا', 'wa-ʕamilū', 'et ont accompli', 'Waw de coordination', 57),
('qe-103-3-4', 103, 'العصر', 'Al-Asr', 3, 4, 'الصالحات', 'الصَّالِحَاتِ', 'ṣ-ṣāliḥāti', 'les bonnes œuvres', 'Sad lettre solaire + emphatique', 58),
('qe-103-3-5', 103, 'العصر', 'Al-Asr', 3, 5, 'تواصوا', 'وَتَوَاصَوْا', 'wa-tawāṣaw', 'et se sont recommandé mutuellement', NULL, 59),
('qe-103-3-6', 103, 'العصر', 'Al-Asr', 3, 6, 'بالحق', 'بِالْحَقِّ', 'bil-ḥaqqi', 'la vérité', 'Ha pharyngal + Chadda sur Qaf', 60),
('qe-103-3-7', 103, 'العصر', 'Al-Asr', 3, 7, 'بالصبر', 'وَبِالصَّبْرِ', 'wa-biṣ-ṣabri', 'et la patience', 'Sad lettre solaire', 61),

-- SOURATE 108 : AL-KAWTHAR — الكوثر
('qe-108-1-1', 108, 'الكوثر', 'Al-Kawthar', 1, 1, 'إنا', 'إِنَّا', 'innā', 'Nous avons certes', 'Chadda sur Nun', 70),
('qe-108-1-2', 108, 'الكوثر', 'Al-Kawthar', 1, 2, 'أعطيناك', 'أَعْطَيْنَاكَ', 'aʕṭaynāka', 'accordé à toi', 'Ayn pharyngal', 71),
('qe-108-1-3', 108, 'الكوثر', 'Al-Kawthar', 1, 3, 'الكوثر', 'الْكَوْثَرَ', 'al-kawtara', 'l''Abondance (Al-Kawthar)', NULL, 72),

('qe-108-2-1', 108, 'الكوثر', 'Al-Kawthar', 2, 1, 'فصل', 'فَصَلِّ', 'faṣalli', 'Accomplis la prière', 'Sad emphatique', 73),
('qe-108-2-2', 108, 'الكوثر', 'Al-Kawthar', 2, 2, 'لربك', 'لِرَبِّكَ', 'li-rabbika', 'pour ton Seigneur', 'Chadda sur Ba', 74),
('qe-108-2-3', 108, 'الكوثر', 'Al-Kawthar', 2, 3, 'وانحر', 'وَانْحَرْ', 'wan-ḥar', 'et sacrifie', 'Ha pharyngal', 75),

('qe-108-3-1', 108, 'الكوثر', 'Al-Kawthar', 3, 1, 'إن', 'إِنَّ', 'inna', 'Certes', 'Chadda sur Nun', 76),
('qe-108-3-2', 108, 'الكوثر', 'Al-Kawthar', 3, 2, 'شانئك', 'شَانِئَكَ', 'šāni''aka', 'celui qui te hait', NULL, 77),
('qe-108-3-3', 108, 'الكوثر', 'Al-Kawthar', 3, 3, 'هو', 'هُوَ', 'huwa', 'c''est lui', NULL, 78),
('qe-108-3-4', 108, 'الكوثر', 'Al-Kawthar', 3, 4, 'الأبتر', 'الْأَبْتَرُ', 'al-abtaru', 'le sans postérité', NULL, 79),

-- SOURATE 109 : AL-KAFIROUN — الكافرون
('qe-109-1-1', 109, 'الكافرون', 'Al-Kafiroun', 1, 1, 'قل', 'قُلْ', 'qul', 'Dis !', 'Soukoun sur Lam', 80),
('qe-109-1-2', 109, 'الكافرون', 'Al-Kafiroun', 1, 2, 'يا', 'يَا', 'yā', 'Ô', NULL, 81),
('qe-109-1-3', 109, 'الكافرون', 'Al-Kafiroun', 1, 3, 'أيها', 'أَيُّهَا', 'ayyuhā', 'vous les', 'Chadda sur Ya', 82),
('qe-109-1-4', 109, 'الكافرون', 'Al-Kafiroun', 1, 4, 'الكافرون', 'الْكَافِرُونَ', 'al-kāfirūna', 'mécréants', NULL, 83),

('qe-109-2-1', 109, 'الكافرون', 'Al-Kafiroun', 2, 1, 'لا', 'لَا', 'lā', 'Je n''adore pas', NULL, 84),
('qe-109-2-2', 109, 'الكافرون', 'Al-Kafiroun', 2, 2, 'أعبد', 'أَعْبُدُ', 'aʕbudu', 'ce que vous adorez', 'Ayn pharyngal', 85),
('qe-109-2-3', 109, 'الكافرون', 'Al-Kafiroun', 2, 3, 'ما', 'مَا', 'mā', 'ce que', NULL, 86),
('qe-109-2-4', 109, 'الكافرون', 'Al-Kafiroun', 2, 4, 'تعبدون', 'تَعْبُدُونَ', 'taʕbudūna', 'vous adorez', NULL, 87),

('qe-109-3-1', 109, 'الكافرون', 'Al-Kafiroun', 3, 1, 'ولا', 'وَلَا', 'wa-lā', 'Et vous n''êtes pas', NULL, 88),
('qe-109-3-2', 109, 'الكافرون', 'Al-Kafiroun', 3, 2, 'أنتم', 'أَنتُمْ', 'antum', 'vous', NULL, 89),
('qe-109-3-3', 109, 'الكافرون', 'Al-Kafiroun', 3, 3, 'عابدون', 'عَابِدُونَ', 'ʕābidūna', 'adorateurs', NULL, 90),
('qe-109-3-4', 109, 'الكافرون', 'Al-Kafiroun', 3, 4, 'ما', 'مَا', 'mā', 'de ce que', NULL, 91),
('qe-109-3-5', 109, 'الكافرون', 'Al-Kafiroun', 3, 5, 'أعبد', 'أَعْبُدُ', 'aʕbudu', 'j''adore', NULL, 92),

-- V4–V6 sont symétriques à V2–V3 (répétition rhétorique)
('qe-109-4-1', 109, 'الكافرون', 'Al-Kafiroun', 4, 1, 'ولا', 'وَلَا', 'wa-lā', 'Ni moi je n''adorerai', NULL, 93),
('qe-109-4-2', 109, 'الكافرون', 'Al-Kafiroun', 4, 2, 'أنا', 'أَنَا۠', 'anā', 'jamais', NULL, 94),
('qe-109-4-3', 109, 'الكافرون', 'Al-Kafiroun', 4, 3, 'عابد', 'عَابِدٌ', 'ʕābidun', 'adorateur', NULL, 95),
('qe-109-4-4', 109, 'الكافرون', 'Al-Kafiroun', 4, 4, 'ما', 'مَّا', 'mā', 'de ce que', NULL, 96),
('qe-109-4-5', 109, 'الكافرون', 'Al-Kafiroun', 4, 5, 'عبدتم', 'عَبَدتُّمْ', 'ʕabadttum', 'vous avez adoré', NULL, 97),

('qe-109-5-1', 109, 'الكافرون', 'Al-Kafiroun', 5, 1, 'ولا', 'وَلَا', 'wa-lā', 'Et vous n''êtes pas', NULL, 98),
('qe-109-5-2', 109, 'الكافرون', 'Al-Kafiroun', 5, 2, 'أنتم', 'أَنتُمْ', 'antum', 'vous', NULL, 99),
('qe-109-5-3', 109, 'الكافرون', 'Al-Kafiroun', 5, 3, 'عابدون', 'عَابِدُونَ', 'ʕābidūna', 'adorateurs', NULL, 100),
('qe-109-5-4', 109, 'الكافرون', 'Al-Kafiroun', 5, 4, 'ما', 'مَا', 'mā', 'de ce que', NULL, 101),
('qe-109-5-5', 109, 'الكافرون', 'Al-Kafiroun', 5, 5, 'أعبد', 'أَعْبُدُ', 'aʕbudu', 'j''adore', NULL, 102),

('qe-109-6-1', 109, 'الكافرون', 'Al-Kafiroun', 6, 1, 'لكم', 'لَكُمْ', 'lakum', 'À vous', NULL, 103),
('qe-109-6-2', 109, 'الكافرون', 'Al-Kafiroun', 6, 2, 'دينكم', 'دِينُكُمْ', 'dīnukum', 'votre religion', NULL, 104),
('qe-109-6-3', 109, 'الكافرون', 'Al-Kafiroun', 6, 3, 'ولي', 'وَلِيَ', 'wa-liya', 'et à moi', NULL, 105),
('qe-109-6-4', 109, 'الكافرون', 'Al-Kafiroun', 6, 4, 'دين', 'دِينِ', 'dīni', 'ma religion', NULL, 106),

-- SOURATE 110 : AN-NASR — النصر
('qe-110-1-1', 110, 'النصر', 'An-Nasr', 1, 1, 'إذا', 'إِذَا', 'idhā', 'Quand', NULL, 110),
('qe-110-1-2', 110, 'النصر', 'An-Nasr', 1, 2, 'جاء', 'جَاءَ', 'jāʼa', 'vient', NULL, 111),
('qe-110-1-3', 110, 'النصر', 'An-Nasr', 1, 3, 'نصر', 'نَصْرُ', 'naṣru', 'le secours', 'Sad emphatique — attention à la prononciation', 112),
('qe-110-1-4', 110, 'النصر', 'An-Nasr', 1, 4, 'الله', 'اللَّهِ', 'llāhi', 'd''Allah', NULL, 113),
('qe-110-1-5', 110, 'النصر', 'An-Nasr', 1, 5, 'والفتح', 'وَالْفَتْحُ', 'wal-fatḥu', 'et la Conquête', NULL, 114),

('qe-110-2-1', 110, 'النصر', 'An-Nasr', 2, 1, 'ورأيت', 'وَرَأَيْتَ', 'wa-raʼayta', 'et que tu vois', NULL, 115),
('qe-110-2-2', 110, 'النصر', 'An-Nasr', 2, 2, 'الناس', 'النَّاسَ', 'n-nāsa', 'les gens', 'Nun lettre solaire', 116),
('qe-110-2-3', 110, 'النصر', 'An-Nasr', 2, 3, 'يدخلون', 'يَدْخُلُونَ', 'yadḵulūna', 'entrer', NULL, 117),
('qe-110-2-4', 110, 'النصر', 'An-Nasr', 2, 4, 'في', 'فِي', 'fī', 'dans', NULL, 118),
('qe-110-2-5', 110, 'النصر', 'An-Nasr', 2, 5, 'دين', 'دِينِ', 'dīni', 'la religion', NULL, 119),
('qe-110-2-6', 110, 'النصر', 'An-Nasr', 2, 6, 'الله', 'اللَّهِ', 'llāhi', 'd''Allah', NULL, 120),
('qe-110-2-7', 110, 'النصر', 'An-Nasr', 2, 7, 'أفواجا', 'أَفْوَاجًا', 'afwājā', 'en foules', 'Tanwin', 121),

('qe-110-3-1', 110, 'النصر', 'An-Nasr', 3, 1, 'فسبح', 'فَسَبِّحْ', 'fasabbiḥ', 'Glorifie donc', 'Chadda sur Ba', 122),
('qe-110-3-2', 110, 'النصر', 'An-Nasr', 3, 2, 'بحمد', 'بِحَمْدِ', 'bi-ḥamdi', 'en louant', 'Ha pharyngal', 123),
('qe-110-3-3', 110, 'النصر', 'An-Nasr', 3, 3, 'ربك', 'رَبِّكَ', 'rabbika', 'ton Seigneur', 'Chadda sur Ba', 124),
('qe-110-3-4', 110, 'النصر', 'An-Nasr', 3, 4, 'واستغفره', 'وَاسْتَغْفِرْهُ', 'was-taġfirhu', 'et implore Son pardon', 'Ghayn — son proche du R grasseyé', 125),
('qe-110-3-5', 110, 'النصر', 'An-Nasr', 3, 5, 'إنه', 'إِنَّهُ', 'innahu', 'certes Il est', 'Chadda sur Nun', 126),
('qe-110-3-6', 110, 'النصر', 'An-Nasr', 3, 6, 'كان', 'كَانَ', 'kāna', 'est', NULL, 127),
('qe-110-3-7', 110, 'النصر', 'An-Nasr', 3, 7, 'توابا', 'تَوَّابًا', 'tawwābā', 'le Très Repentant', 'Chadda sur Waw + Tanwin', 128)

ON CONFLICT (id) DO NOTHING;

-- SOURATE 111 : AL-MASAD — المسد
INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

('qe-111-1-1', 111, 'المسد', 'Al-Masad', 1, 1, 'تبت', 'تَبَّتْ', 'tabbat', 'Que périssent', 'Chadda sur Ba', 130),
('qe-111-1-2', 111, 'المسد', 'Al-Masad', 1, 2, 'يدا', 'يَدَا', 'yadā', 'les deux mains', NULL, 131),
('qe-111-1-3', 111, 'المسد', 'Al-Masad', 1, 3, 'أبي', 'أَبِي', 'abī', 'd''Abu', NULL, 132),
('qe-111-1-4', 111, 'المسد', 'Al-Masad', 1, 4, 'لهب', 'لَهَبٍ', 'lahabin', 'Lahab', NULL, 133),
('qe-111-1-5', 111, 'المسد', 'Al-Masad', 1, 5, 'وتب', 'وَتَبَّ', 'wa-tabb', 'et qu''il périsse !', 'Chadda sur Ba — même racine que début', 134),

('qe-111-2-1', 111, 'المسد', 'Al-Masad', 2, 1, 'ما', 'مَا', 'mā', 'Ses richesses', NULL, 135),
('qe-111-2-2', 111, 'المسد', 'Al-Masad', 2, 2, 'أغنى', 'أَغْنَىٰ', 'aġnā', 'ne lui serviront à rien', NULL, 136),
('qe-111-2-3', 111, 'المسد', 'Al-Masad', 2, 3, 'عنه', 'عَنْهُ', 'ʕanhu', 'contre', NULL, 137),
('qe-111-2-4', 111, 'المسد', 'Al-Masad', 2, 4, 'ماله', 'مَالُهُ', 'māluhu', 'ce qu''il possède', NULL, 138),
('qe-111-2-5', 111, 'المسد', 'Al-Masad', 2, 5, 'وما', 'وَمَا', 'wa-mā', 'et ce que', NULL, 139),
('qe-111-2-6', 111, 'المسد', 'Al-Masad', 2, 6, 'كسب', 'كَسَبَ', 'kasaba', 'il a acquis', NULL, 140),

('qe-111-3-1', 111, 'المسد', 'Al-Masad', 3, 1, 'سيصلى', 'سَيَصْلَىٰ', 'sa-yaṣlā', 'Il sera jeté dans', 'Sad emphatique', 141),
('qe-111-3-2', 111, 'المسد', 'Al-Masad', 3, 2, 'نارا', 'نَارًا', 'nārā', 'un feu', 'Tanwin', 142),
('qe-111-3-3', 111, 'المسد', 'Al-Masad', 3, 3, 'ذات', 'ذَاتَ', 'dhāta', 'ardent', NULL, 143),
('qe-111-3-4', 111, 'المسد', 'Al-Masad', 3, 4, 'لهب', 'لَهَبٍ', 'lahabin', '(aux flammes)', 'Même mot qu''au V1 — retour sémantique', 144),

('qe-111-4-1', 111, 'المسد', 'Al-Masad', 4, 1, 'وامرأته', 'وَامْرَأَتُهُ', 'wam-raʼatuhu', 'Et sa femme aussi', NULL, 145),
('qe-111-4-2', 111, 'المسد', 'Al-Masad', 4, 2, 'حمالة', 'حَمَّالَةَ', 'ḥammālata', 'porteuse', 'Ha pharyngal + Chadda sur Mim', 146),
('qe-111-4-3', 111, 'المسد', 'Al-Masad', 4, 3, 'الحطب', 'الْحَطَبِ', 'al-ḥaṭabi', 'de bois (= de discorde)', NULL, 147),

('qe-111-5-1', 111, 'المسد', 'Al-Masad', 5, 1, 'في', 'فِي', 'fī', 'à son cou', NULL, 148),
('qe-111-5-2', 111, 'المسد', 'Al-Masad', 5, 2, 'جيدها', 'جِيدِهَا', 'jīdihā', 'cou', NULL, 149),
('qe-111-5-3', 111, 'المسد', 'Al-Masad', 5, 3, 'حبل', 'حَبْلٌ', 'ḥablun', 'une corde', 'Tanwin', 150),
('qe-111-5-4', 111, 'المسد', 'Al-Masad', 5, 4, 'من', 'مِّن', 'min', 'de', NULL, 151),
('qe-111-5-5', 111, 'المسد', 'Al-Masad', 5, 5, 'مسد', 'مَّسَدٍ', 'masadin', 'fibre tressée', 'Tanwin — mot qui donne son nom à la sourate', 152)

ON CONFLICT (id) DO NOTHING;

-- SOURATE 105 : AL-FIL — الفيل
INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

('qe-105-1-1', 105, 'الفيل', 'Al-Fil', 1, 1, 'ألم', 'أَلَمْ', 'a-lam', 'N''as-tu pas vu', NULL, 155),
('qe-105-1-2', 105, 'الفيل', 'Al-Fil', 1, 2, 'تر', 'تَرَ', 'tara', 'comment', NULL, 156),
('qe-105-1-3', 105, 'الفيل', 'Al-Fil', 1, 3, 'كيف', 'كَيْفَ', 'kayfa', 'a agi', NULL, 157),
('qe-105-1-4', 105, 'الفيل', 'Al-Fil', 1, 4, 'فعل', 'فَعَلَ', 'faʕala', 'a traité', NULL, 158),
('qe-105-1-5', 105, 'الفيل', 'Al-Fil', 1, 5, 'ربك', 'رَبُّكَ', 'rabbuka', 'ton Seigneur', 'Chadda sur Ba', 159),
('qe-105-1-6', 105, 'الفيل', 'Al-Fil', 1, 6, 'بأصحاب', 'بِأَصْحَابِ', 'bi-aṣḥābi', 'les compagnons de', 'Sad emphatique', 160),
('qe-105-1-7', 105, 'الفيل', 'Al-Fil', 1, 7, 'الفيل', 'الْفِيلِ', 'al-fīli', 'l''Éléphant', NULL, 161),

('qe-105-2-1', 105, 'الفيل', 'Al-Fil', 2, 1, 'ألم', 'أَلَمْ', 'a-lam', 'N''a-t-Il pas', NULL, 162),
('qe-105-2-2', 105, 'الفيل', 'Al-Fil', 2, 2, 'يجعل', 'يَجْعَلْ', 'yajʕal', 'rendu', NULL, 163),
('qe-105-2-3', 105, 'الفيل', 'Al-Fil', 2, 3, 'كيدهم', 'كَيْدَهُمْ', 'kaydahum', 'leur stratagème', NULL, 164),
('qe-105-2-4', 105, 'الفيل', 'Al-Fil', 2, 4, 'في', 'فِي', 'fī', 'en', NULL, 165),
('qe-105-2-5', 105, 'الفيل', 'Al-Fil', 2, 5, 'تضليل', 'تَضْلِيلٍ', 'taḍlīlin', 'pure illusion', 'Dad emphatique', 166),

('qe-105-3-1', 105, 'الفيل', 'Al-Fil', 3, 1, 'وأرسل', 'وَأَرْسَلَ', 'wa-arsala', 'Il a envoyé contre eux', NULL, 167),
('qe-105-3-2', 105, 'الفيل', 'Al-Fil', 3, 2, 'عليهم', 'عَلَيْهِمْ', 'ʕalayhim', 'sur eux', NULL, 168),
('qe-105-3-3', 105, 'الفيل', 'Al-Fil', 3, 3, 'طيرا', 'طَيْرًا', 'ṭayran', 'des oiseaux', 'Taa emphatique + Tanwin', 169),
('qe-105-3-4', 105, 'الفيل', 'Al-Fil', 3, 4, 'أبابيل', 'أَبَابِيلَ', 'abābīla', 'en vols', NULL, 170),

('qe-105-4-1', 105, 'الفيل', 'Al-Fil', 4, 1, 'ترميهم', 'تَرْمِيهِم', 'tarmīhim', 'qui les lapidaient', NULL, 171),
('qe-105-4-2', 105, 'الفيل', 'Al-Fil', 4, 2, 'بحجارة', 'بِحِجَارَةٍ', 'bi-ḥijāratin', 'avec des pierres', 'Tanwin', 172),
('qe-105-4-3', 105, 'الفيل', 'Al-Fil', 4, 3, 'من', 'مِّن', 'min', 'de', NULL, 173),
('qe-105-4-4', 105, 'الفيل', 'Al-Fil', 4, 4, 'سجيل', 'سِجِّيلٍ', 'sijjīlin', 'pierre d''argile cuite', 'Chadda sur Jim + Tanwin', 174),

('qe-105-5-1', 105, 'الفيل', 'Al-Fil', 5, 1, 'فجعلهم', 'فَجَعَلَهُمْ', 'fa-jaʕalahum', 'Les rendant ainsi', NULL, 175),
('qe-105-5-2', 105, 'الفيل', 'Al-Fil', 5, 2, 'كعصف', 'كَعَصْفٍ', 'ka-ʕaṣfin', 'comme des fétus de paille', NULL, 176),
('qe-105-5-3', 105, 'الفيل', 'Al-Fil', 5, 3, 'مأكول', 'مَّأْكُولٍ', 'maʼkūlin', 'dévorés', 'Même racine que أَكَل — rappel Module 2', 177)

ON CONFLICT (id) DO NOTHING;
```

### 1b — Leçons coraniques É18 dans Supabase

```sql
-- 4 nouvelles leçons dans module-quran-1
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES
  ('lesson-quran-103', 'module-quran-1', 'Al-Asr — Le Temps', 'العصر — الوقت',
   '3 versets sur la sagesse du temps et les conditions du salut.', 3, 40, 8),
  ('lesson-quran-108', 'module-quran-1', 'Al-Kawthar — L''Abondance', 'الكوثر — النعمة',
   'La sourate la plus courte. 10 mots, un message complet.', 4, 30, 5),
  ('lesson-quran-109', 'module-quran-1', 'Al-Kafiroun — La Liberté', 'الكافرون — الحرية',
   '6 versets, le vocabulaire de l''adoration et de la conscience.', 5, 45, 12),
  ('lesson-quran-110', 'module-quran-1', 'An-Nasr & Al-Masad', 'النصر والمسد',
   'La victoire et l''avertissement. Deux sourates courtes en une leçon.', 6, 50, 15),
  ('lesson-quran-105', 'module-quran-1', 'Al-Fil — L''Éléphant', 'الفيل — قصة',
   'Une sourate narrative. Vocabulaire riche, histoire frappante.', 7, 45, 12)
ON CONFLICT (id) DO NOTHING;
```

### 1c — Hook `useQuranEntries`

Créer `src/hooks/useQuranEntries.ts` :

```typescript
/**
 * useQuranEntries — charge les entrées coraniques d'une sourate depuis SQLite.
 *
 * Retourne les entrées groupées par verset :
 * Map<ayah_number, QuranEntry[]>
 *
 * Query :
 *   SELECT * FROM quran_entries
 *   WHERE surah_number = ?
 *   ORDER BY ayah_number, word_position
 */
export function useQuranEntries(surahNumber: number): {
  entries: Map<number, QuranEntry[]>;
  isLoading: boolean;
  surahMeta: { name_ar: string; name_fr: string } | null;
}
```

### 1d — Mise à jour `content-sync.ts`

Vérifier que `quran_entries` est bien dans la liste des tables syncées. Si le volume a augmenté (115+ entrées maintenant), pas de changement de stratégie (SELECT * reste performant).

### Checkpoint M1
- [ ] `SELECT COUNT(*) FROM quran_entries` → 159+ lignes dans Supabase
- [ ] 5 nouvelles leçons dans `module-quran-1` visibles dans l'app
- [ ] `useQuranEntries(103)` → Map avec 3 versets (Al-Asr)
- [ ] SurahDisplay fonctionne avec les nouvelles sourates
- [ ] `seedQuranSRSCards()` relancé → nouvelles cartes insérées
- [ ] `@arabic-content-validator` sur les seeds coraniques → pas d'erreur
- [ ] `/checkpoint` → tout vert

---

## MISSION 2 — Seed dialecte égyptien dans `word_variants`

### Contexte pédagogique

L'égyptien est le dialecte le plus compris dans le monde arabe grâce au cinéma et à la télévision. Ses particularités distinctives par rapport au MSA :
- **ج (Jim) → G dur** (جَيِّد → gāyid)
- **ث (Tha) → S ou T** selon les mots
- **ق (Qaf) → hamza (ء) ou disparaît** dans le parler cairote courant
- **Préfixe بـ (b-)** au présent indicatif (بيكتب = il écrit, en train d'écrire)
- Beaucoup d'emprunts du copte, du turc et du français

### 2a — Étape bloquante : récupérer les word_ids existants

> ### ⛔ MÊME RÈGLE QU'É17 — OBLIGATOIRE AVANT TOUT INSERT
>
> Exécuter ce SELECT pour obtenir les vrais UUIDs :
>
> ```sql
> SELECT id, arabic FROM words
> WHERE arabic IN (
>   'بيت', 'شكراً', 'أهلاً', 'ماء', 'طعام', 'أكل',
>   'ذهب', 'جاء', 'نعم', 'لا', 'كتاب', 'يوم',
>   'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة',
>   'كيف', 'ما', 'أين', 'متى', 'من', 'جيد', 'كبير', 'صغير'
> );
> ```
> Remplacer tous les placeholders `'<word_id_...>'` avant d'exécuter.

### 2b — Seed word_variants égyptien

```sql
-- ============================================================
-- ÉTAPE 18 — Seed word_variants 'egyptian'
-- Dialecte cairote (المصري القاهري)
-- ============================================================

INSERT INTO word_variants (id, word_id, variant, arabic, arabic_vocalized, transliteration, notes_fr) VALUES

-- Formules de politesse
('wv-eg-001', '<word_id_shukran>', 'egyptian', 'شكراً', 'شُكْرَاً', 'šukran', 'Identique au MSA'),
('wv-eg-002', '<word_id_ahlan>', 'egyptian', 'أهلاً', 'أَهْلَاً', 'ahlan', 'Très courant, ou simplement أهل ahla'),
('wv-eg-003', '<word_id_kayfa>', 'egyptian', 'إزيك', 'إِزَيَّكْ', 'izzayyak', 'Comment vas-tu ? (masc.) — كيف حالك en MSA'),

-- Vie quotidienne
('wv-eg-010', '<word_id_bayt>', 'egyptian', 'بيت', 'بَيْت', 'bēt', 'Maison — proche du MSA, prononciation différente'),
('wv-eg-011', '<word_id_maa>', 'egyptian', 'مية', 'مِيَّة', 'miyya', 'De l''eau — مَاء en MSA, mais مِيَّة en égyptien courant'),
('wv-eg-012', '<word_id_akl>', 'egyptian', 'أكل', 'أَكْل', 'akl', 'Nourriture — proche du MSA, accent différent'),

-- Verbes
('wv-eg-020', '<word_id_dhahaba>', 'egyptian', 'راح', 'رَاح', 'rāḥ', 'Aller — ذَهَبَ en MSA, راح en égyptien'),
('wv-eg-021', '<word_id_jaaa>', 'egyptian', 'جه / إجى', 'جِه / إِجِى', 'gih / igi', 'Venir — ج devient G en égyptien !'),
('wv-eg-022', '<word_id_akala>', 'egyptian', 'أكل', 'أَكَل', 'akal', 'Manger — proche, mais A initial sans Hamza fort'),

-- Nombres
('wv-eg-030', '<word_id_wahid>', 'egyptian', 'واحد', 'وَاحِد', 'wāḥed', 'Un — identique'),
('wv-eg-031', '<word_id_ithnan>', 'egyptian', 'اتنين', 'اِتْنِين', 'itnēn', 'Deux — اثنان → اتنين, Tha devient T'),
('wv-eg-032', '<word_id_thalatha>', 'egyptian', 'تلاتة', 'تَلَاتَة', 'talāta', 'Trois — ثلاثة → تلاتة, Tha devient T deux fois'),
('wv-eg-033', '<word_id_arbaa>', 'egyptian', 'أربعة', 'أَرْبَعَة', 'arbaʕa', 'Quatre — proche du MSA'),
('wv-eg-034', '<word_id_khamsa>', 'egyptian', 'خمسة', 'خَمْسَة', 'ḵamsa', 'Cinq — identique'),

-- Adjectifs courants
('wv-eg-040', '<word_id_jayyid>', 'egyptian', 'كويس', 'كُوَيِّس', 'kuwayyes', 'Bien / bon — جيد en MSA, كويس en égyptien'),
('wv-eg-041', '<word_id_kabir>', 'egyptian', 'كبير', 'كِبِير', 'kibīr', 'Grand — proche, accent différent'),
('wv-eg-042', '<word_id_saghir>', 'egyptian', 'صغير', 'صُغَيَّر', 'ṣuġayyar', 'Petit — même racine, forme diminutive courante'),

-- Mots interrogatifs
('wv-eg-050', '<word_id_kayfa>', 'egyptian', 'إزاي', 'إِزَاي', 'izzāy', 'Comment — كيف en MSA'),
('wv-eg-051', '<word_id_maa>', 'egyptian', 'إيه', 'إِيه', 'ēh', 'Quoi — ما en MSA, إيه en égyptien'),
('wv-eg-052', '<word_id_ayna>', 'egyptian', 'فين', 'فِين', 'fēn', 'Où — أين en MSA, فين en égyptien'),
('wv-eg-053', '<word_id_mata>', 'egyptian', 'إمتى', 'إِمْتَى', 'emtā', 'Quand — متى en MSA, إمتى en égyptien'),
('wv-eg-054', '<word_id_naam>', 'egyptian', 'أيوه', 'أَيْوَه', 'aywa', 'Oui — نعم en MSA, أيوه en égyptien courant'),

-- Famille (mots du quotidien)
('wv-eg-060', '<word_id_kitab>', 'egyptian', 'كتاب', 'كِتَاب', 'kitāb', 'Livre — identique, Qaf se prononce hamza : إتاب (très courant à Cairo)'),
('wv-eg-061', '<word_id_yawm>', 'egyptian', 'نهارده', 'نَهَارْدَه', 'nahārda', 'Aujourd''hui — اليوم en MSA, نهارده en égyptien')

ON CONFLICT (id) DO NOTHING;
```

### 2c — Module égyptien dans Supabase

```sql
INSERT INTO modules (id, title_fr, title_ar, description_fr, sort_order, icon)
VALUES (
  'module-egyptian-1',
  'Égyptien — L''arabe du cinéma',
  'العامية المصرية',
  'Le dialecte le plus compris du monde arabe. 30 mots du quotidien cairote.',
  13,
  '🇪🇬'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES
  ('lesson-eg-101', 'module-egyptian-1', 'Le Jim qui devient G', 'الجيم والقاف',
   'La transformation la plus reconnaissable de l''égyptien. Ça va vous surprendre.', 1, 35, 8),
  ('lesson-eg-102', 'module-egyptian-1', 'Les nombres à l''égyptienne', 'الأرقام بالعامية',
   'اتنين، تلاتة... Les chiffres avec leurs surprises phonétiques.', 2, 30, 8),
  ('lesson-eg-103', 'module-egyptian-1', 'Conversation de rue au Caire', 'محادثة في الشارع',
   'إزيك ؟ كويس ! — Les formules incontournables.', 3, 40, 10)
ON CONFLICT (id) DO NOTHING;
```

### 2d — Mise à jour `DialectBadge`

Dans `src/components/arabic/DialectBadge.tsx`, vérifier que la config 'egyptian' existe déjà (elle avait été déclarée en É17 même si non utilisée). Si ce n'est pas le cas, l'ajouter :

```typescript
egyptian: { label: 'Égyptien', short: 'EG', color: '#1565C0', bg: '#E3F2FD' },
```

### Checkpoint M2

- [ ] `SELECT COUNT(*) FROM word_variants WHERE variant = 'egyptian'` → 28+ lignes
- [ ] Module `module-egyptian-1` et 3 leçons visibles dans l'app
- [ ] DarijaComparisonCard réutilisée pour l'égyptien (même composant, props variant)
- [ ] DialectBadge 'egyptian' rendu avec la bonne couleur bleue
- [ ] `@arabic-content-validator` sur les seeds égyptiens → pas d'erreur
- [ ] `/checkpoint` → tout vert

---

## MISSION 3 — Système de badges

### Philosophie des badges

Les badges Lisaan sont des **célébrations de progression**, pas des mécaniques de jeu. Ils doivent :
- Être rares et significatifs (pas un badge pour chaque action banale)
- Être accompagnés d'un moment de célébration visuel (animation discrète)
- Être visibles dans le profil (trophée de parcours)
- Ne jamais bloquer la progression (uniquement cosmétiques)

### 3a — Migration Supabase : table `user_badges`

```sql
CREATE TABLE IF NOT EXISTS user_badges (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id        TEXT NOT NULL,           -- identifiant du badge (ex: 'streak_7')
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)               -- un badge unique par utilisateur
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_badges" ON user_badges
  FOR ALL USING (auth.uid() = user_id);
```

### 3b — Migration SQLite locale

Dans `schema-local.ts` :

```sql
CREATE TABLE IF NOT EXISTS user_badges (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  badge_id    TEXT NOT NULL,
  earned_at   TEXT NOT NULL,
  synced_at   INTEGER,
  UNIQUE(user_id, badge_id)
);
```

### 3c — Catalogue des badges `src/constants/badges.ts`

```typescript
/**
 * Catalogue des 20 badges Lisaan MVP.
 *
 * Catégories :
 *   streak    — assiduité quotidienne
 *   module    — complétion de module
 *   srs       — maîtrise via révision espacée
 *   dialect   — exploration des dialectes
 *   quran     — progression coranique
 */

export interface BadgeDefinition {
  id: string;
  category: 'streak' | 'module' | 'srs' | 'dialect' | 'quran';
  title_fr: string;
  description_fr: string;
  icon: string;              // emoji
  rarity: 'common' | 'rare' | 'epic';
  condition: BadgeCondition; // utilisé par le moteur de déclenchement
}

export type BadgeCondition =
  | { type: 'streak_days'; days: number }
  | { type: 'module_completed'; module_id: string }
  | { type: 'srs_mastered'; count: number }
  | { type: 'dialect_lesson'; variant: string }
  | { type: 'quran_surah'; surah_number: number };

export const BADGE_CATALOG: BadgeDefinition[] = [
  // STREAK
  { id: 'streak_3',   category: 'streak',  title_fr: 'Trois jours',      description_fr: '3 jours consécutifs d''apprentissage',  icon: '🔥', rarity: 'common', condition: { type: 'streak_days', days: 3 } },
  { id: 'streak_7',   category: 'streak',  title_fr: 'Une semaine',       description_fr: '7 jours sans interruption',             icon: '⚡', rarity: 'common', condition: { type: 'streak_days', days: 7 } },
  { id: 'streak_30',  category: 'streak',  title_fr: 'Un mois de feu',    description_fr: '30 jours consécutifs. Respect.',        icon: '🌟', rarity: 'rare',   condition: { type: 'streak_days', days: 30 } },
  { id: 'streak_100', category: 'streak',  title_fr: 'Centurion',         description_fr: '100 jours. Tu es sérieux.',             icon: '💎', rarity: 'epic',   condition: { type: 'streak_days', days: 100 } },

  // MODULES
  { id: 'module_1_done', category: 'module', title_fr: 'L''alphabet maîtrisé', description_fr: 'Module 1 complété. Les 28 lettres n''ont plus de secrets.', icon: '🔤', rarity: 'common', condition: { type: 'module_completed', module_id: 'module-001-alphabet' } },
  { id: 'module_2_done', category: 'module', title_fr: 'Les harakats dévoilés', description_fr: 'Module 2 complété. Tu entends les voyelles courtes.', icon: '🎵', rarity: 'common', condition: { type: 'module_completed', module_id: 'module-002-harakats' } },
  { id: 'module_3_done', category: 'module', title_fr: 'Premier lecteur',      description_fr: 'Module 3 complété. Tu lis tes premiers mots.', icon: '📖', rarity: 'rare',   condition: { type: 'module_completed', module_id: 'module-003-words' } },
  { id: 'module_4_done', category: 'module', title_fr: 'Constructeur de sens', description_fr: 'Module 4 complété. Tu formes tes premières phrases.', icon: '🏗️', rarity: 'rare', condition: { type: 'module_completed', module_id: 'module-004-sentences' } },

  // SRS
  { id: 'srs_10',   category: 'srs', title_fr: 'Premiers acquis',  description_fr: '10 cartes maîtrisées via la révision espacée', icon: '🧠', rarity: 'common', condition: { type: 'srs_mastered', count: 10 } },
  { id: 'srs_50',   category: 'srs', title_fr: 'Bonne mémoire',    description_fr: '50 cartes maîtrisées',                         icon: '💪', rarity: 'common', condition: { type: 'srs_mastered', count: 50 } },
  { id: 'srs_100',  category: 'srs', title_fr: 'Tête bien faite',  description_fr: '100 cartes maîtrisées',                        icon: '🏆', rarity: 'rare',   condition: { type: 'srs_mastered', count: 100 } },
  { id: 'srs_500',  category: 'srs', title_fr: 'Encyclopédie',     description_fr: '500 cartes maîtrisées. Chapeau.',              icon: '📚', rarity: 'epic',   condition: { type: 'srs_mastered', count: 500 } },

  // DIALECTES
  { id: 'dialect_darija',    category: 'dialect', title_fr: 'Bienvenue au Maroc',   description_fr: 'Première leçon Darija complétée',    icon: '🇲🇦', rarity: 'common', condition: { type: 'dialect_lesson', variant: 'darija' } },
  { id: 'dialect_egyptian',  category: 'dialect', title_fr: 'Marhaba min Masr',     description_fr: 'Première leçon égyptienne complétée', icon: '🇪🇬', rarity: 'common', condition: { type: 'dialect_lesson', variant: 'egyptian' } },
  { id: 'dialect_explorer',  category: 'dialect', title_fr: 'Explorateur de langues', description_fr: 'Deux dialectes différents entamés', icon: '🌍', rarity: 'rare',  condition: { type: 'dialect_lesson', variant: 'both' } },

  // CORAN
  { id: 'quran_fatiha',   category: 'quran', title_fr: 'Al-Fatiha comprise', description_fr: 'Tu comprends chaque mot de la sourate Al-Fatiha', icon: '📿', rarity: 'rare',   condition: { type: 'quran_surah', surah_number: 1 } },
  { id: 'quran_ikhlas',   category: 'quran', title_fr: 'Tawhid en lumière',  description_fr: 'Al-Ikhlas comprise mot à mot', icon: '☀️', rarity: 'common', condition: { type: 'quran_surah', surah_number: 112 } },
  { id: 'quran_10',       category: 'quran', title_fr: '10 sourates',        description_fr: 'Les 10 sourates courtes complétées',          icon: '🌙', rarity: 'epic',   condition: { type: 'quran_surah', surah_number: 0 } }, // 0 = all 10
];
```

### 3d — Moteur de badges `src/engines/badge-engine.ts`

```typescript
/**
 * badge-engine.ts — vérifie et décerne les badges.
 *
 * checkAndAwardBadges() est appelé :
 *   - Après chaque complétion de leçon (checkModuleBadges)
 *   - Après chaque session SRS (checkSRSBadges)
 *   - Au démarrage de l'app (checkStreakBadges)
 *   - Après une leçon dialecte ou coran (checkSpecialBadges)
 *
 * Retourne la liste des nouveaux badges gagnés (pour afficher la célébration).
 */

export async function checkAndAwardBadges(
  userId: string,
  context: {
    type: 'lesson_completed' | 'srs_session' | 'app_start';
    lesson_id?: string;
    module_id?: string;
    variant?: string;
    surah_number?: number;
  }
): Promise<BadgeDefinition[]> {
  const db = await getLocalDB();
  const newBadges: BadgeDefinition[] = [];

  for (const badge of BADGE_CATALOG) {
    // Vérifier si le badge est déjà gagné
    const existing = await db.getFirstAsync(
      'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badge.id]
    );
    if (existing) continue;

    // Vérifier si la condition est remplie
    const earned = await evaluateBadgeCondition(badge, userId, context);
    if (!earned) continue;

    // Insérer le badge (SQLite local + sync fire-and-forget)
    const badgeRecord = {
      id: `ub-${userId}-${badge.id}`,
      user_id: userId,
      badge_id: badge.id,
      earned_at: new Date().toISOString(),
    };

    await db.runAsync(
      'INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, earned_at) VALUES (?, ?, ?, ?)',
      [badgeRecord.id, userId, badge.id, badgeRecord.earned_at]
    );

    newBadges.push(badge);
    runSync(); // fire-and-forget
  }

  return newBadges;
}

async function evaluateBadgeCondition(
  badge: BadgeDefinition,
  userId: string,
  context: object
): Promise<boolean> {
  const db = await getLocalDB();
  const { condition } = badge;

  switch (condition.type) {
    case 'streak_days': {
      const user = await db.getFirstAsync<{ streak_current: number }>(
        'SELECT streak_current FROM users WHERE id = ?', [userId]
      );
      return (user?.streak_current ?? 0) >= condition.days;
    }
    case 'module_completed': {
      // Toutes les leçons du module sont completed
      const total = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM lessons WHERE module_id = ?', [condition.module_id]
      );
      const completed = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM user_progress up
         JOIN lessons l ON l.id = up.lesson_id
         WHERE l.module_id = ? AND up.status = 'completed' AND up.user_id = ?`,
        [condition.module_id, userId]
      );
      return total?.count > 0 && completed?.count === total?.count;
    }
    case 'srs_mastered': {
      const mastered = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM srs_cards
         WHERE user_id = ? AND repetitions >= 3 AND interval_days >= 7`,
        [userId]
      );
      return (mastered?.count ?? 0) >= condition.count;
    }
    case 'dialect_lesson': {
      // Vérifier si une leçon du module dialecte concerné est complétée
      const moduleId = condition.variant === 'darija' ? 'module-darija-1' :
                       condition.variant === 'egyptian' ? 'module-egyptian-1' : null;
      if (!moduleId) return false;
      const done = await db.getFirstAsync(
        `SELECT up.id FROM user_progress up
         JOIN lessons l ON l.id = up.lesson_id
         WHERE l.module_id = ? AND up.status = 'completed' AND up.user_id = ?
         LIMIT 1`,
        [moduleId, userId]
      );
      return !!done;
    }
    case 'quran_surah': {
      // lesson quran correspondante complétée
      const lessonId = `lesson-quran-${condition.surah_number}`;
      const done = await db.getFirstAsync(
        `SELECT id FROM user_progress WHERE lesson_id LIKE ? AND status = 'completed' AND user_id = ?`,
        [`lesson-quran-${condition.surah_number === 0 ? '1%' : condition.surah_number}%`, userId]
      );
      return !!done;
    }
    default:
      return false;
  }
}
```

### 3e — Composant `BadgeCelebration`

Créer `src/components/ui/BadgeCelebration.tsx` :

```typescript
/**
 * BadgeCelebration — modal de célébration quand un badge est gagné.
 *
 * S'affiche automatiquement après une leçon/session si checkAndAwardBadges()
 * retourne des nouveaux badges.
 *
 * Layout :
 * ┌─────────────────────────────────────────┐
 * │           🏆 NOUVEAU BADGE !            │
 * │                                         │
 * │         [Icône grand format]            │
 * │         Titre du badge                  │
 * │         Description courte             │
 * │         Rareté (Commun / Rare / Épique) │
 * │                                         │
 * │    [  Continuer  ]                      │
 * └─────────────────────────────────────────┘
 *
 * Animation : fade in + légère bounce sur l'icône.
 * Si plusieurs badges simultanés : les afficher en séquence.
 * Pas de confettis agressifs — sobre et élégant (charte Lisaan).
 */
```

### 3f — Section Badges dans le profil

Dans `app/(tabs)/profile.tsx`, ajouter une section "Trophées" :

```typescript
/**
 * Section Trophées dans le profil :
 *
 * Afficher les badges en grille (3 colonnes) :
 * - Badges gagnés : couleur pleine + icône
 * - Badges non gagnés : grille grisée + icône en opacité 30%
 *   (pas de description visible → mystère/motivation)
 *
 * Filtre par catégorie : Tous | Assiduité | Modules | Révision | Dialectes | Coran
 */
```

### Checkpoint M3

- [ ] Table `user_badges` créée dans Supabase avec RLS + UNIQUE(user_id, badge_id)
- [ ] Table `user_badges` créée dans SQLite
- [ ] `badge-engine.ts` : `checkAndAwardBadges()` décerne le badge 'streak_3' si streak >= 3
- [ ] `badge-engine.ts` : badge 'module_1_done' décerné après complétion module 1
- [ ] BadgeCelebration : modal s'affiche après leçon si nouveau badge
- [ ] Section Trophées dans le profil : grille badges (gagnés + mystères)
- [ ] Sync fire-and-forget vers `user_badges` Supabase
- [ ] `/checkpoint` → tout vert

---

## MISSION 4 — Infrastructure bêta-test

### Philosophie

L'infrastructure bêta sert deux objectifs :
1. **Mesurer** : collecter les métriques de rétention (J7/J30) sans friction
2. **Écouter** : recueillir du feedback qualitatif structuré en contexte (après chaque leçon)

Tout doit être **non-intrusif** (jamais bloquer le flux) et **RGPD-compliant** (opt-in explicite).

### 4a — Initialisation PostHog

```bash
npx expo install posthog-react-native
```

Créer `src/services/analytics.ts` :

```typescript
/**
 * analytics.ts — wrapper PostHog pour Lisaan.
 *
 * RGPD : le tracking est opt-in. Si l'utilisateur n'a pas consenti,
 * toutes les fonctions sont des no-ops silencieux.
 *
 * Events trackés :
 *   app_opened
 *   onboarding_completed          { variant_recommended, variant_chosen }
 *   lesson_started                { lesson_id, module_id }
 *   lesson_completed              { lesson_id, module_id, score, time_seconds }
 *   lesson_abandoned              { lesson_id, step_index }
 *   srs_session_completed         { cards_reviewed, correct_rate }
 *   badge_earned                  { badge_id, badge_category }
 *   notification_tapped           { notification_type }
 *   settings_changed              { setting_key, new_value }
 *   feedback_submitted            { lesson_id, rating, has_comment }
 */

import PostHog from 'posthog-react-native';

let _ph: PostHog | null = null;
let _analyticsEnabled = false;

export async function initAnalytics(userId: string, analyticsEnabled: boolean) {
  _analyticsEnabled = analyticsEnabled;
  if (!analyticsEnabled) return;

  _ph = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY!, {
    host: 'https://eu.posthog.com', // EU pour RGPD
    flushAt: 20,
    flushInterval: 30000,
  });

  _ph.identify(userId, {
    app: 'lisaan',
    platform: Platform.OS,
  });
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!_analyticsEnabled || !_ph) return;
  _ph.capture(event, properties);
}

export function screen(screenName: string, properties?: Record<string, unknown>) {
  if (!_analyticsEnabled || !_ph) return;
  _ph.screen(screenName, properties);
}
```

Ajouter dans `.env` :
```
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxxx
```

> **Note** : Créer un projet PostHog EU (app.eu.posthog.com) gratuitement. Récupérer la clé API et la mettre dans `.env`.

### 4b — Consentement analytics dans l'onboarding

Dans le dernier écran d'onboarding (ou dans Settings), ajouter :

```typescript
// Dans useSettingsStore :
analytics_enabled: boolean; // défaut : true (opt-in au premier lancement avec UI explicite)

// Toggle dans Settings → section "Confidentialité" :
// "Partager des données anonymes pour améliorer Lisaan"
// Description : "Aucune donnée personnelle. Uniquement vos actions dans l'app."
// [ON/OFF]
```

### 4c — Migration Supabase : table `beta_feedback`

```sql
CREATE TABLE IF NOT EXISTS beta_feedback (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL, -- nullable (feedback anonyme possible)
  lesson_id       TEXT,
  feedback_type   TEXT NOT NULL CHECK (feedback_type IN ('lesson_rating', 'bug_report', 'general')),
  rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  app_version     TEXT,
  platform        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pas de RLS restrictive — feedback peut être envoyé même déconnecté
-- La table est en lecture seule pour les utilisateurs (INSERT only)
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beta_feedback_insert" ON beta_feedback
  FOR INSERT WITH CHECK (true);
CREATE POLICY "beta_feedback_read_own" ON beta_feedback
  FOR SELECT USING (auth.uid() = user_id);
```

> **Note SQLite** : `beta_feedback` n'est PAS répliquée localement. Elle est envoyée directement vers Supabase (exception à la règle offline-first, justifiée car le feedback sans connexion est moins critique).

### 4d — Service `src/services/feedback-service.ts`

```typescript
/**
 * feedback-service.ts — collecte de feedback bêta.
 *
 * sendFeedback() envoie directement vers Supabase (fire-and-forget).
 * Si offline, le feedback est perdu (acceptable pour le bêta).
 *
 * Le feedback est déclenché :
 *   - Après chaque 3ème leçon complétée (pop-up non-bloquant)
 *   - Via le bouton "Feedback" permanent dans le profil
 *   - Via le bouton flottant "Signaler un bug" accessible partout
 */

interface FeedbackPayload {
  lesson_id?: string;
  feedback_type: 'lesson_rating' | 'bug_report' | 'general';
  rating?: number;     // 1–5
  comment?: string;
}

export async function sendFeedback(payload: FeedbackPayload): Promise<boolean> {
  // Import direct remote.ts — AUTORISÉ car feedback ne respecte pas offline-first
  // (exception documentée)
  const { supabase } = await import('@/db/remote');

  const { error } = await supabase
    .from('beta_feedback')
    .insert({
      ...payload,
      app_version: Constants.expoConfig?.version,
      platform: Platform.OS,
    });

  return !error;
}
```

### 4e — Composant `FeedbackWidget`

Créer `src/components/ui/FeedbackWidget.tsx` :

```typescript
/**
 * FeedbackWidget — collecteur de feedback non-bloquant.
 *
 * Deux modes :
 *
 * MODE INLINE (après leçon) :
 * ┌────────────────────────────────────────┐
 * │  Cette leçon était... ?               │
 * │  😕  😐  🙂  😊  🤩                  │
 * │       [Ajouter un commentaire]        │  ← optionnel, expandable
 * │  [Passer]        [Envoyer]            │
 * └────────────────────────────────────────┘
 *
 * MODE FLOTTANT (bouton permanent profil) :
 * → Ouvre une modal avec les 3 types : leçon | bug | général
 *
 * Design : compact, warm, jamais intrusif.
 * Apparaît max 1x toutes les 3 leçons (cooldown géré via AsyncStorage).
 */
```

### 4f — Écran bêta-stats (profil)

Dans le profil, ajouter une section "Bêta-testeur" visible seulement si `is_beta_tester = true` dans `user_settings` :

```typescript
/**
 * Section "Bêta-testeur" dans le profil :
 *
 * Statistiques personnelles :
 *   - Leçons complétées : XX
 *   - Temps total passé : X h XX min
 *   - Cartes SRS maîtrisées : XX
 *   - Feedback envoyés : XX
 *   - Badges gagnés : XX / 20
 *
 * Bouton "Envoyer un feedback général"
 * Mention : "Merci de faire partie des premiers testeurs de Lisaan 🙏"
 */
```

Ajouter `is_beta_tester BOOLEAN DEFAULT false` dans `user_settings` (migration Supabase + SQLite).

### 4g — Intégration des events PostHog dans les flows existants

Ajouter les appels `track()` dans :

- `app/_layout.tsx` → `track('app_opened')`
- Fin d'onboarding → `track('onboarding_completed', { variant_recommended, variant_chosen })`
- Démarrage leçon → `track('lesson_started', { lesson_id, module_id })`
- Fin de leçon → `track('lesson_completed', { lesson_id, module_id, score, time_seconds })`
- Abandon leçon (retour arrière en cours) → `track('lesson_abandoned', { lesson_id })`
- Fin session SRS → `track('srs_session_completed', { cards_reviewed, correct_rate })`
- Badge gagné → `track('badge_earned', { badge_id, badge_category })`

### Checkpoint M4

- [ ] PostHog initialisé, events `app_opened` et `lesson_completed` visibles dans le dashboard
- [ ] Toggle analytics dans Settings → opt-out coupe le tracking
- [ ] Table `beta_feedback` créée dans Supabase
- [ ] FeedbackWidget affiché après la 3ème leçon (cooldown respecté)
- [ ] Feedback soumis → visible dans Supabase `beta_feedback`
- [ ] Section bêta-stats visible dans profil si `is_beta_tester = true`
- [ ] `/checkpoint` → tout vert

---

## MISSION 5 — Tests end-to-end + régression complète

### 5a — Validation automatique toolkit

Lance `@regression-tester`. Tous les axes doivent être ✅.

### 5b — Validation contenu arabe

Lance `@arabic-content-validator` sur l'ensemble des seeds É18 (quran_entries sourates 3–10, word_variants egyptian).

### 5c — Sourates coraniques

1. Onglet Learn → module Coranique → 7 leçons disponibles (2 de É17 + 5 de É18)
2. Leçon Al-Asr → SurahDisplay affiche 3 versets en RTL
3. Tap sur "خُسْرٍ" → QuranWordCard avec note tajwid
4. Leçon Al-Kawthar → 3 versets, 10 mots, AudioButton fonctionne
5. Réviser → filtre Coran → 159+ cartes disponibles
6. `seedQuranSRSCards()` idempotent : re-run ne crée pas de doublons

### 5d — Module égyptien

1. Onglet Learn → module "🇪🇬 Égyptien" visible
2. Leçon 1 → DarijaComparisonCard avec MSA vs Égyptien
3. DialectBadge 'EG' rendu en bleu
4. Badge 'dialect_egyptian' gagné après première leçon égyptienne
5. Badge 'dialect_explorer' gagné si darija ET égyptien tous les deux entamés

### 5e — Badges

1. Compléter 3 jours de streak → badge 'streak_3' + BadgeCelebration
2. Compléter module 1 entier → badge 'module_1_done' + célébration
3. Trophées dans profil : badges gagnés colorés, non-gagnés grisés
4. Badge non-gagné : pas de description visible (mystère)
5. SQLite `user_badges` → sync vers Supabase (vérifier dans Dashboard)

### 5f — Bêta-test infrastructure

1. Analytics opt-in : events visibles dans PostHog EU dashboard
2. Analytics opt-out : aucun event envoyé après toggle OFF
3. Feedback inline après 3ème leçon → modal non-bloquant
4. Étoiles 1–5 + commentaire optionnel → visible dans Supabase `beta_feedback`
5. Cooldown : FeedbackWidget ne réapparaît pas avant 3 leçons supplémentaires
6. Mode avion : feedback non envoyé (silencieux, pas de crash)

### 5g — Régression É0–É17

1. Onboarding : 5 écrans → recommandation → parcours standard
2. Module 1 alphabet : leçons, MCQ
3. SRS : révision lettres + mots + conjugaisons + grammaire + quran
4. Streak et XP après chaque leçon
5. Notifications : planning inchangé après É18
6. Module Darija : DarijaComparisonCard, 3 leçons
7. Mode avion : tout fonctionne (leçons, SRS, coran, badges)
8. Profile : streaks, XP, trophées, stats bêta
9. Settings : 8 settings + notifications + analytics

### Checkpoint final É18

- [ ] `@regression-tester` → tout vert
- [ ] `@arabic-content-validator` → pas d'erreur
- [ ] `/checkpoint` → tout vert
- [ ] Sourates 103, 108, 109, 110, 111, 105 : seed + leçons + SurahDisplay
- [ ] Total `quran_entries` : 159+ lignes dans Supabase + SQLite
- [ ] `word_variants` 'egyptian' : 28+ entrées dans Supabase + SQLite
- [ ] Module égyptien : 3 leçons visibles
- [ ] DialectBadge 'EG' rendu correct
- [ ] Table `user_badges` : Supabase (RLS) + SQLite
- [ ] BADGE_CATALOG : 20 badges définis
- [ ] `badge-engine` : `checkAndAwardBadges()` fonctionnel
- [ ] BadgeCelebration : modal discrète après gain de badge
- [ ] Trophées dans profil : grille badges gagnés/mystères
- [ ] PostHog EU initialisé + events `lesson_completed` visibles
- [ ] Toggle analytics dans Settings fonctionnel
- [ ] Table `beta_feedback` dans Supabase
- [ ] FeedbackWidget : apparaît après 3ème leçon, cooldown respecté
- [ ] Section bêta-stats dans profil (visible si `is_beta_tester`)
- [ ] Mode avion : tout fonctionne
- [ ] Aucun import db/remote hors sync (sauf feedback-service — exception documentée)
- [ ] Aucune régression É0–É17

---

## RÉSUMÉ DE L'ÉTAPE 18

| Mission | Livrable | Statut |
|---------|----------|--------|
| 0 | `@codebase-scout` — scan initial du repo | ⬜ |
| 1 | Sourates 103, 108, 109, 110, 111, 105 (115+ mots coraniques) + 5 leçons | ⬜ |
| 2 | `word_variants` 'egyptian' (28 entrées) + module 3 leçons + DialectBadge | ⬜ |
| 3 | Système de badges (20 badges, badge-engine, BadgeCelebration, trophées profil) | ⬜ |
| 4 | PostHog EU + consentement + `beta_feedback` + FeedbackWidget + bêta-stats | ⬜ |
| 5 | `@regression-tester` + `@arabic-content-validator` + tests manuels | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs après É18 :**
- `ETAPE-18-sourates-egyptien-badges-beta.md` (ce fichier)
- `lisaan-seed-letters.json`

**Fichiers à supprimer de /docs :**
- `ETAPE-17-notifications-dialectes-coranique.md` (terminée)

---

> **Prochaine étape après validation :** Étape 19 — Lancement bêta fermée (30 testeurs), dialectes levantin + khaliji intro, sourates Adh-Duha / Al-Inshirah / Al-Qadr, premier tableau de bord analytics (métriques J7/J30), et retours bêta → itérations UX prioritaires.
