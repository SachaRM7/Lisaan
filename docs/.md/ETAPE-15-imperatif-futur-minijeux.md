# ÉTAPE 15 — Impératif, futur proche & mini-jeux chronométrés

> Étapes terminées : 0 → 14.
> Cette étape : impératif (M9), futur proche (M10), mini-jeux (`speed_round`, `memory_match`), et premier mode "défi quotidien".
> Règle : missions séquentielles, checkpoints obligatoires.

> **Philosophie de cette étape** :
> - L'impératif arabe n'est pas un nouveau paradigme : c'est le مضارع sans son préfixe + des marques de personne. L'apprenant connaît déjà les formes du présent (M7) — l'impératif est présenté comme une dérivation, pas un apprentissage from scratch.
> - Le futur proche n'est pas une conjugaison : c'est une particule (سَوْفَ / سَـ) ajoutée devant le مضارع. On enseigne la règle, puis on pratique avec les 10 verbes déjà connus.
> - Les mini-jeux ne remplacent pas les leçons — ils récapitulent. `speed_round` crée de la pression mémorable. `memory_match` active la mémoire visuelle. Les deux sont des composants génériques réutilisables dans n'importe quel module.
> - Le défi quotidien est la première feature de "rétention long terme" de Lisaan : une raison de revenir chaque jour, avec une récompense suffisamment spéciale pour déclencher le comportement.

---

## Périmètre de É15

| Module | Contenu | Nouveaux types d'exercices |
|--------|---------|---------------------------|
| Module 9 — L'impératif | الأمر : 10 verbes × 3 formes (m/f/pl), impératif négatif | (fill_blank + mcq existants) |
| Module 10 — Futur proche | سَوْفَ / سَـ + مضارع, négation لَنْ, 10 verbes connus | `speed_round`, `memory_match` |
| Défi quotidien | Mode hors-module, 14 défis seedés, récompenses XP + badge | — |

**Ce qui est OUT de É15 :**
- Impératif 1ère personne pluriel cohortative (نَحْنُ / لِنَفْعَلْ) — É16
- Futur antérieur / conditionnel (Phase 3)
- Mode multijoueur / défis entre amis (Phase 3)
- Notifications push pour le défi quotidien (É17)
- Nouveaux verbes (le corpus reste les 10 verbes de M6 + É14)

---

## MISSION 0 — Scan initial

Lance `@codebase-scout` puis confirme l'état du repo avant de commencer. Vérifie en particulier : le `exerciseRegistry` actuel (doit contenir `mcq`, `match`, `reorder`, `dialogue`, `listen_select`, `flashcard`, `write`, `fill_blank`), les tables `conjugation_entries`, `modules`, `lessons`, et le lesson engine.

---

## MISSION 1 — Seed DB : impératif (30 entrées dans `conjugation_entries`)

**Contexte :** La table `conjugation_entries` supporte déjà `tense = 'imperative'`. On ajoute 10 verbes × 3 formes de personne (أنت m, أنتِ f, أنتُمْ pl).

Les 10 verbes : `word-kataba`, `word-qaraa`, `word-dhahaba`, `word-jaaa`, `word-akala`, `word-shariba`, `word-fahima`, `word-aamila`, `word-samiaa`, `word-nadhara`.

> Note : جاء et أكل ont des impératifs irréguliers (تَعَالَ, كُلْ). C'est pédagogiquement précieux : les exceptions mémorables font partie de l'enseignement.

### 1a — Migration SQL dans Supabase Cloud (SQL Editor)

```sql
-- ============================================================
-- CONJUGAISONS IMPÉRATIF (أمر) — 10 verbes × 3 formes
-- tense = 'imperative', form = 1
-- pronoun: 'anta' (m), 'anti' (f), 'antum' (pl)
-- ============================================================

-- ---- كَتَبَ → اُكْتُبْ (écrire) ----
INSERT INTO conjugation_entries VALUES
('conj-kataba-imp-anta',  'word-kataba', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)',  'اكتب',    'اُكْتُبْ',    'uktub',     NULL, 'اُكْتُبِ اسْمَكَ هُنَا',          'اُكْتُبِ اسْمَكَ هُنَا',          'Écris ton nom ici.', NOW()),
('conj-kataba-imp-anti',  'word-kataba', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'اكتبي',   'اُكْتُبِي',   'uktubi',    NULL, 'اُكْتُبِي رِسَالَةً',              'اُكْتُبِي رِسَالَةً',              'Écris une lettre.', NOW()),
('conj-kataba-imp-antum', 'word-kataba', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'اكتبوا',  'اُكْتُبُوا',  'uktubuu',   NULL, 'اُكْتُبُوا الدَّرْسَ',            'اُكْتُبُوا الدَّرْسَ',            'Écrivez la leçon.', NOW());

-- ---- قَرَأَ → اِقْرَأْ (lire) ----
INSERT INTO conjugation_entries VALUES
('conj-qaraa-imp-anta',  'word-qaraa', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)', 'اقرأ',    'اِقْرَأْ',    'iqra',      NULL, 'اِقْرَأِ الْكِتَابَ',              'اِقْرَأِ الْكِتَابَ',              'Lis le livre.', NOW()),
('conj-qaraa-imp-anti',  'word-qaraa', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'اقرئي',   'اِقْرَئِي',   'iqraî',     NULL, 'اِقْرَئِي بِصَوْتٍ عَالٍ',        'اِقْرَئِي بِصَوْتٍ عَالٍ',        'Lis à voix haute.', NOW()),
('conj-qaraa-imp-antum', 'word-qaraa', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'اقرؤوا',  'اِقْرَؤُوا',  'iqrauuu',   NULL, 'اِقْرَؤُوا هَذَا النَّصَّ',       'اِقْرَؤُوا هَذَا النَّصَّ',       'Lisez ce texte.', NOW());

-- ---- ذَهَبَ → اِذْهَبْ (aller) ----
INSERT INTO conjugation_entries VALUES
('conj-dhahaba-imp-anta',  'word-dhahaba', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)', 'اذهب',    'اِذْهَبْ',    'idhhab',    NULL, 'اِذْهَبْ إِلَى الْبَيْتِ',        'اِذْهَبْ إِلَى الْبَيْتِ',        'Va à la maison.', NOW()),
('conj-dhahaba-imp-anti',  'word-dhahaba', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'اذهبي',   'اِذْهَبِي',   'idhhabi',   NULL, 'اِذْهَبِي مَعِي',                 'اِذْهَبِي مَعِي',                 'Viens avec moi.', NOW()),
('conj-dhahaba-imp-antum', 'word-dhahaba', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'اذهبوا',  'اِذْهَبُوا',  'idhhabu',   NULL, 'اِذْهَبُوا بِسَلَامَةٍ',          'اِذْهَبُوا بِسَلَامَةٍ',          'Allez en paix.', NOW());

-- ---- جَاءَ → تَعَالَ (venir) — IRRÉGULIER ----
INSERT INTO conjugation_entries VALUES
('conj-jaaa-imp-anta',  'word-jaaa', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)', 'تعال',    'تَعَالَ',     'taaal',     NULL, 'تَعَالَ هُنَا مِنْ فَضْلِكَ',     'تَعَالَ هُنَا مِنْ فَضْلِكَ',     'Viens ici s''il te plaît.', NOW()),
('conj-jaaa-imp-anti',  'word-jaaa', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'تعالي',   'تَعَالَيْ',   'taalaay',   NULL, 'تَعَالَيْ مَعَنَا',               'تَعَالَيْ مَعَنَا',               'Viens avec nous.', NOW()),
('conj-jaaa-imp-antum', 'word-jaaa', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'تعالوا',  'تَعَالَوْا',  'taalaawu',  NULL, 'تَعَالَوْا سَرِيعًا',             'تَعَالَوْا سَرِيعًا',             'Venez vite.', NOW());

-- ---- أَكَلَ → كُلْ (manger) — IRRÉGULIER ----
INSERT INTO conjugation_entries VALUES
('conj-akala-imp-anta',  'word-akala', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)', 'كل',      'كُلْ',        'kul',       NULL, 'كُلْ مَعِي الْيَوْمَ',            'كُلْ مَعِي الْيَوْمَ',            'Mange avec moi aujourd''hui.', NOW()),
('conj-akala-imp-anti',  'word-akala', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'كلي',     'كُلِي',       'kuli',      NULL, 'كُلِي شَيْئًا',                   'كُلِي شَيْئًا',                   'Mange quelque chose.', NOW()),
('conj-akala-imp-antum', 'word-akala', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'كلوا',    'كُلُوا',      'kuluu',     NULL, 'كُلُوا وَاشْرَبُوا',              'كُلُوا وَاشْرَبُوا',              'Mangez et buvez.', NOW());

-- ---- شَرِبَ → اِشْرَبْ (boire) ----
INSERT INTO conjugation_entries VALUES
('conj-shariba-imp-anta',  'word-shariba', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)', 'اشرب',    'اِشْرَبْ',    'ishrab',    NULL, 'اِشْرَبْ مَاءً',                  'اِشْرَبْ مَاءً',                  'Bois de l''eau.', NOW()),
('conj-shariba-imp-anti',  'word-shariba', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'اشربي',   'اِشْرَبِي',   'ishrabi',   NULL, 'اِشْرَبِي الشَّايَ',              'اِشْرَبِي الشَّايَ',              'Bois le thé.', NOW()),
('conj-shariba-imp-antum', 'word-shariba', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'اشربوا',  'اِشْرَبُوا',  'ishrabu',   NULL, 'اِشْرَبُوا قَهْوَةً',             'اِشْرَبُوا قَهْوَةً',             'Buvez un café.', NOW());

-- ---- فَهِمَ → اِفْهَمْ (comprendre) ----
INSERT INTO conjugation_entries VALUES
('conj-fahima-imp-anta',  'word-fahima', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)', 'افهم',    'اِفْهَمْ',    'ifham',     NULL, 'اِفْهَمْ هَذِهِ الْقَاعِدَةَ',    'اِفْهَمْ هَذِهِ الْقَاعِدَةَ',    'Comprends cette règle.', NOW()),
('conj-fahima-imp-anti',  'word-fahima', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'افهمي',   'اِفْهَمِي',   'ifhami',    NULL, 'اِفْهَمِي السُّؤَالَ أَوَّلًا',   'اِفْهَمِي السُّؤَالَ أَوَّلًا',   'Comprends d''abord la question.', NOW()),
('conj-fahima-imp-antum', 'word-fahima', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'افهموا',  'اِفْهَمُوا',  'ifhamu',    NULL, 'اِفْهَمُوا جَيِّدًا',             'اِفْهَمُوا جَيِّدًا',             'Comprenez bien.', NOW());

-- ---- عَمِلَ → اِعْمَلْ (travailler) ----
INSERT INTO conjugation_entries VALUES
('conj-aamila-imp-anta',  'word-aamila', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)', 'اعمل',    'اِعْمَلْ',    'iaamal',    NULL, 'اِعْمَلْ بِجِدٍّ',                'اِعْمَلْ بِجِدٍّ',                'Travaille sérieusement.', NOW()),
('conj-aamila-imp-anti',  'word-aamila', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'اعملي',   'اِعْمَلِي',   'iaamali',   NULL, 'اِعْمَلِي بِحُبٍّ',               'اِعْمَلِي بِحُبٍّ',               'Travaille avec amour.', NOW()),
('conj-aamila-imp-antum', 'word-aamila', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'اعملوا',  'اِعْمَلُوا',  'iaamalu',   NULL, 'اِعْمَلُوا مَعًا',               'اِعْمَلُوا مَعًا',               'Travaillez ensemble.', NOW());

-- ---- سَمِعَ → اِسْمَعْ (écouter) ----
INSERT INTO conjugation_entries VALUES
('conj-samiaa-imp-anta',  'word-samiaa', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)', 'اسمع',    'اِسْمَعْ',    'ismaa',     NULL, 'اِسْمَعْ جَيِّدًا',               'اِسْمَعْ جَيِّدًا',               'Écoute bien.', NOW()),
('conj-samiaa-imp-anti',  'word-samiaa', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'اسمعي',   'اِسْمَعِي',   'ismaai',    NULL, 'اِسْمَعِي هَذَا',                 'اِسْمَعِي هَذَا',                 'Écoute ça.', NOW()),
('conj-samiaa-imp-antum', 'word-samiaa', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'اسمعوا',  'اِسْمَعُوا',  'ismaau',    NULL, 'اِسْمَعُوا مَعًا',               'اِسْمَعُوا مَعًا',               'Écoutez ensemble.', NOW());

-- ---- نَظَرَ → اُنْظُرْ (regarder) ----
INSERT INTO conjugation_entries VALUES
('conj-nadhara-imp-anta',  'word-nadhara', 'imperative', 1, 'anta',  'أَنْتَ',  'tu (m)', 'انظر',    'اُنْظُرْ',    'undhur',    NULL, 'اُنْظُرْ إِلَى هُنَا',            'اُنْظُرْ إِلَى هُنَا',            'Regarde ici.', NOW()),
('conj-nadhara-imp-anti',  'word-nadhara', 'imperative', 1, 'anti',  'أَنْتِ',  'tu (f)', 'انظري',   'اُنْظُرِي',   'undhuri',   NULL, 'اُنْظُرِي إِلَى السَّمَاءِ',      'اُنْظُرِي إِلَى السَّمَاءِ',      'Regarde le ciel.', NOW()),
('conj-nadhara-imp-antum', 'word-nadhara', 'imperative', 1, 'antum', 'أَنْتُمْ','vous',   'انظروا',  'اُنْظُرُوا',  'undhuruu',  NULL, 'اُنْظُرُوا أَمَامَكُمْ',          'اُنْظُرُوا أَمَامَكُمْ',          'Regardez devant vous.', NOW());
```

**Checkpoint Mission 1 :**
- [ ] 30 lignes insérées dans `conjugation_entries` sans erreur de contrainte
- [ ] `SELECT COUNT(*) FROM conjugation_entries WHERE tense = 'imperative'` → 30
- [ ] Les entrées irrégulières de جاء (تَعَالَ) et أكل (كُلْ) sont présentes
- [ ] `@arabic-content-validator` sur les 30 entrées → pas d'erreur

---

## MISSION 2 — Seed DB : modules 9 & 10 et leçons dans Supabase

### 2a — Module 9 (Impératif) et Module 10 (Futur proche)

```sql
-- ============================================================
-- MODULES 9 & 10
-- ============================================================
INSERT INTO modules (id, sort_order, name_fr, name_ar, description_fr, prerequisite_module_id, xp_reward, created_at) VALUES
('module-9',  9,  'L''impératif',    'الأمر',           'Donner des ordres et des conseils avec les 10 verbes déjà appris', 'module-8', 200, NOW()),
('module-10', 10, 'Le futur proche', 'المستقبل القريب', 'Exprimer ce qu''on va faire avec سَوْفَ et سَـ',                   'module-9', 200, NOW());

-- ============================================================
-- LEÇONS MODULE 9 — L'impératif (5 leçons)
-- ============================================================
INSERT INTO lessons (id, module_id, sort_order, title_fr, title_ar, description_fr, xp_reward, estimated_minutes, created_at) VALUES
('lesson-901', 'module-9', 1, 'L''impératif masculin',          'الأمر للمذكر',             'اُكْتُبْ, اِذْهَبْ, اِشْرَبْ — donner un ordre à un homme', 30, 8,  NOW()),
('lesson-902', 'module-9', 2, 'L''impératif féminin et pluriel', 'الأمر للمؤنث والجمع',      'اُكْتُبِي / اُكْتُبُوا — adapter selon la personne',         30, 8,  NOW()),
('lesson-903', 'module-9', 3, 'Les irréguliers : تَعَالَ / كُلْ', 'الأوامر الشاذة',          'Deux irréguliers courants qui ne se déduisent pas',           30, 8,  NOW()),
('lesson-904', 'module-9', 4, 'L''impératif négatif',            'النهي',                    'لَا + مضارع مجزوم pour interdire — لَا تَكْتُبْ',           30, 8,  NOW()),
('lesson-905', 'module-9', 5, 'Impératif en situation',          'الأمر في الحياة اليومية', 'Exercices mixtes : ordres du quotidien (cuisine, classe, rue)', 40, 10, NOW());

-- ============================================================
-- LEÇONS MODULE 10 — Futur proche (6 leçons)
-- ============================================================
INSERT INTO lessons (id, module_id, sort_order, title_fr, title_ar, description_fr, xp_reward, estimated_minutes, created_at) VALUES
('lesson-1001', 'module-10', 1, 'سَوْفَ + مضارع',              'سوف والمضارع',         'La particule longue du futur — سَوْفَ أَكْتُبُ',             30, 8,  NOW()),
('lesson-1002', 'module-10', 2, 'La particule courte سَـ',      'السين المستقبلية',      'سَـ préfixe direct au مضارع — سَأَكْتُبُ',                  30, 8,  NOW()),
('lesson-1003', 'module-10', 3, 'Futur négatif : لَنْ',         'لن والمضارع المنصوب',   'لَنْ + مضارع منصوب — لَنْ أَكْتُبَ',                       30, 10, NOW()),
('lesson-1004', 'module-10', 4, 'Mes projets de demain',        'مشاريع الغد',           'Dialogues au futur : voyage, famille, travail',               30, 8,  NOW()),
('lesson-1005', 'module-10', 5, 'Speed Round — verbes connus',  'جولة السرعة',           'Mini-jeu chronométré : 10 questions, 30 secondes',            40, 5,  NOW()),
('lesson-1006', 'module-10', 6, 'Memory Match — vocabulaire',   'لعبة الذاكرة',          'Associer les cartes en moins d''un minute',                   40, 5,  NOW());
```

### 2b — Seed exercices par leçon (exercices_config JSON)

Les exercices sont définis en JSON dans la colonne `exercises_config` de chaque leçon. Voici le seed complet leçon par leçon.

```sql
-- ---- L901 : Impératif masculin ----
UPDATE lessons SET exercises_config = '[
  {
    "type": "mcq",
    "id": "ex-901-1",
    "prompt_fr": "Comment dit-on « Lis ! » à un homme ?",
    "options": ["اِقْرَأْ","تَقْرَأُ","يَقْرَأُ","قَرَأَ"],
    "correct_index": 0
  },
  {
    "type": "mcq",
    "id": "ex-901-2",
    "prompt_fr": "Forme impérative de اِذْهَبْ — de quel verbe vient-elle ?",
    "options": ["ذَهَبَ","جَاءَ","عَمِلَ","نَظَرَ"],
    "correct_index": 0
  },
  {
    "type": "fill_blank",
    "id": "ex-901-3",
    "sentence_ar": "___ مَاءً مِنْ فَضْلِكَ",
    "sentence_fr": "___ de l''eau s''il te plaît.",
    "choices": ["اِشْرَبْ","يَشْرَبُ","شَرِبَ","اِشْرَبِي"],
    "correct": "اِشْرَبْ",
    "explanation_fr": "Impératif masculin de شَرِبَ → اِشْرَبْ"
  },
  {
    "type": "fill_blank",
    "id": "ex-901-4",
    "sentence_ar": "___ إِلَى الْبَيْتِ الآنَ",
    "sentence_fr": "___ à la maison maintenant.",
    "choices": ["اِذْهَبْ","يَذْهَبُ","ذَهَبَ","اِذْهَبِي"],
    "correct": "اِذْهَبْ",
    "explanation_fr": "Impératif masculin de ذَهَبَ → اِذْهَبْ"
  },
  {
    "type": "mcq",
    "id": "ex-901-5",
    "prompt_fr": "Quelle est la règle générale pour former l''impératif masculin ?",
    "options": [
      "On enlève le préfixe تَـ du مضارع et on ajoute une hamza de liaison",
      "On ajoute يَـ devant le مضارع",
      "On utilise le passé avec َ final",
      "C''est identique au مضارع"
    ],
    "correct_index": 0
  }
]' WHERE id = 'lesson-901';

-- ---- L902 : Impératif féminin et pluriel ----
UPDATE lessons SET exercises_config = '[
  {
    "type": "mcq",
    "id": "ex-902-1",
    "prompt_fr": "Impératif féminin de كَتَبَ ?",
    "options": ["اُكْتُبِي","اُكْتُبْ","اُكْتُبُوا","تَكْتُبِينَ"],
    "correct_index": 0
  },
  {
    "type": "mcq",
    "id": "ex-902-2",
    "prompt_fr": "Vous (pluriel) devez écouter. Quelle forme choisissez-vous ?",
    "options": ["اِسْمَعُوا","اِسْمَعْ","اِسْمَعِي","يَسْمَعُونَ"],
    "correct_index": 0
  },
  {
    "type": "fill_blank",
    "id": "ex-902-3",
    "sentence_ar": "___ جَيِّدًا يَا بَنَاتُ",
    "sentence_fr": "___ bien, les filles.",
    "choices": ["اِسْمَعُوا","اِسْمَعِي","اِسْمَعْ","سَمِعْتُمْ"],
    "correct": "اِسْمَعُوا",
    "explanation_fr": "On s''adresse à un groupe mixte/pluriel → اِسْمَعُوا"
  },
  {
    "type": "fill_blank",
    "id": "ex-902-4",
    "sentence_ar": "___ إِلَى هُنَا يَا أُمِّي",
    "sentence_fr": "___ ici, maman.",
    "choices": ["اُنْظُرِي","اُنْظُرْ","اُنْظُرُوا","نَظَرْتِ"],
    "correct": "اُنْظُرِي",
    "explanation_fr": "Adressé à une femme → اُنْظُرِي"
  }
]' WHERE id = 'lesson-902';

-- ---- L903 : Irréguliers تَعَالَ / كُلْ ----
UPDATE lessons SET exercises_config = '[
  {
    "type": "mcq",
    "id": "ex-903-1",
    "prompt_fr": "Comment dit-on « Viens ! » à un homme en arabe courant ?",
    "options": ["تَعَالَ","اِجِئْ","جَاءَ","يَجِيءُ"],
    "correct_index": 0
  },
  {
    "type": "mcq",
    "id": "ex-903-2",
    "prompt_fr": "Comment dit-on « Mange ! » à une femme ?",
    "options": ["كُلِي","كُلْ","كُلُوا","تَأْكُلِينَ"],
    "correct_index": 0
  },
  {
    "type": "fill_blank",
    "id": "ex-903-3",
    "sentence_ar": "___ وَاجْلِسْ مَعَنَا",
    "sentence_fr": "___ et assieds-toi avec nous.",
    "choices": ["تَعَالَ","اِجِئْ","يَجِيءُ","تَجِيءُ"],
    "correct": "تَعَالَ",
    "explanation_fr": "Impératif irrégulier de جَاءَ → تَعَالَ (masculin)"
  },
  {
    "type": "fill_blank",
    "id": "ex-903-4",
    "sentence_ar": "___ وَاشْرَبُوا مَعَنَا يَا أَصْدِقَاءُ",
    "sentence_fr": "___ et buvez avec nous, les amis.",
    "choices": ["كُلُوا","كُلْ","كُلِي","أَكَلُوا"],
    "correct": "كُلُوا",
    "explanation_fr": "Impératif pluriel de أَكَلَ → كُلُوا"
  }
]' WHERE id = 'lesson-903';

-- ---- L904 : Impératif négatif ----
UPDATE lessons SET exercises_config = '[
  {
    "type": "mcq",
    "id": "ex-904-1",
    "prompt_fr": "Pour interdire, on utilise :",
    "options": ["لَا + مضارع مجزوم","لَا + ماضي","لَنْ + مضارع","لَيْسَ + مضارع"],
    "correct_index": 0
  },
  {
    "type": "fill_blank",
    "id": "ex-904-2",
    "sentence_ar": "لَا ___ هُنَا",
    "sentence_fr": "N''écris pas ici.",
    "choices": ["تَكْتُبْ","تَكْتُبُ","كَتَبْتَ","اُكْتُبْ"],
    "correct": "تَكْتُبْ",
    "explanation_fr": "لَا النهي + مضارع مجزوم : تَكْتُبُ → تَكْتُبْ (suppression de la ضمة finale)"
  },
  {
    "type": "fill_blank",
    "id": "ex-904-3",
    "sentence_ar": "لَا ___ هُنَاكَ — خَطَرٌ!",
    "sentence_fr": "Ne va pas là-bas — danger !",
    "choices": ["تَذْهَبْ","تَذْهَبُ","اِذْهَبْ","ذَهَبَ"],
    "correct": "تَذْهَبْ",
    "explanation_fr": "لَا النهي + يَذْهَبُ → لَا تَذْهَبْ"
  },
  {
    "type": "mcq",
    "id": "ex-904-4",
    "prompt_fr": "Quelle phrase signifie « Ne mange pas maintenant » ?",
    "options": ["لَا تَأْكُلْ الآنَ","لَنْ تَأْكُلَ الآنَ","كُلْ الآنَ","لَا كَلَ"],
    "correct_index": 0
  }
]' WHERE id = 'lesson-904';

-- ---- L905 : Exercices mixtes impératif ----
UPDATE lessons SET exercises_config = '[
  {
    "type": "fill_blank",
    "id": "ex-905-1",
    "sentence_ar": "___ الدَّرْسَ يَا أَوْلَادُ",
    "sentence_fr": "___ la leçon, les enfants.",
    "choices": ["اِقْرَؤُوا","يَقْرَؤُونَ","قَرَأُوا","اِقْرَأْ"],
    "correct": "اِقْرَؤُوا",
    "explanation_fr": "Impératif pluriel de قَرَأَ → اِقْرَؤُوا"
  },
  {
    "type": "fill_blank",
    "id": "ex-905-2",
    "sentence_ar": "___ بِجِدٍّ وَسَتَنْجَحِينَ",
    "sentence_fr": "___ sérieusement et tu réussiras.",
    "choices": ["اِعْمَلِي","اِعْمَلْ","اِعْمَلُوا","عَمِلَتْ"],
    "correct": "اِعْمَلِي",
    "explanation_fr": "Adressé à une femme → اِعْمَلِي"
  },
  {
    "type": "mcq",
    "id": "ex-905-3",
    "prompt_fr": "Traduction de : اُنْظُرُوا إِلَى السَّبُّورَةِ",
    "options": [
      "Regardez le tableau.",
      "Ils regardent le tableau.",
      "Regarde le tableau.",
      "Vous avez regardé le tableau."
    ],
    "correct_index": 0
  },
  {
    "type": "fill_blank",
    "id": "ex-905-4",
    "sentence_ar": "لَا ___ الْهَاتِفَ فِي الْفَصْلِ",
    "sentence_fr": "N''utilise pas le téléphone en classe.",
    "choices": ["تَفْهَمْ","تَكْتُبْ","تُشَاهِدْ","تَشْرَبْ"],
    "correct": "تَكْتُبْ",
    "explanation_fr": "Exercice de culture : لَا + مضارع مجزوم pour l''interdiction"
  }
]' WHERE id = 'lesson-905';

-- ---- L1001 : سَوْفَ + مضارع ----
UPDATE lessons SET exercises_config = '[
  {
    "type": "mcq",
    "id": "ex-1001-1",
    "prompt_fr": "سَوْفَ أَكْتُبُ signifie :",
    "options": ["Je vais écrire","J''écris","J''ai écrit","Écris !"],
    "correct_index": 0
  },
  {
    "type": "fill_blank",
    "id": "ex-1001-2",
    "sentence_ar": "سَوْفَ ___ إِلَى الْمَدْرَسَةِ غَدًا",
    "sentence_fr": "Je vais aller à l''école demain.",
    "choices": ["أَذْهَبُ","أَذْهَبْ","ذَهَبْتُ","اِذْهَبْ"],
    "correct": "أَذْهَبُ",
    "explanation_fr": "سَوْفَ + مضارع مرفوع (ضمة finale conservée)"
  },
  {
    "type": "fill_blank",
    "id": "ex-1001-3",
    "sentence_ar": "سَوْفَ ___ هَذَا الْكِتَابَ",
    "sentence_fr": "Il va lire ce livre.",
    "choices": ["يَقْرَأُ","تَقْرَأُ","أَقْرَأُ","نَقْرَأُ"],
    "correct": "يَقْرَأُ",
    "explanation_fr": "Sujet هُوَ → مضارع يَقْرَأُ"
  },
  {
    "type": "mcq",
    "id": "ex-1001-4",
    "prompt_fr": "سَوْفَ نَأْكُلُ مَعًا significa :",
    "options": ["Nous allons manger ensemble","Mangeons ensemble !","Nous avons mangé ensemble","Ils vont manger ensemble"],
    "correct_index": 0
  }
]' WHERE id = 'lesson-1001';

-- ---- L1002 : La particule courte سَـ ----
UPDATE lessons SET exercises_config = '[
  {
    "type": "mcq",
    "id": "ex-1002-1",
    "prompt_fr": "سَأَكْتُبُ est la forme courte de :",
    "options": ["سَوْفَ أَكْتُبُ","لَنْ أَكْتُبَ","اُكْتُبْ","كَتَبْتُ"],
    "correct_index": 0
  },
  {
    "type": "fill_blank",
    "id": "ex-1002-2",
    "sentence_ar": "سَ___ إِلَى السُّوقِ بَعْدَ الظُّهْرِ",
    "sentence_fr": "Elle ira au marché cet après-midi.",
    "choices": ["تَذْهَبُ","يَذْهَبُ","أَذْهَبُ","نَذْهَبُ"],
    "correct": "تَذْهَبُ",
    "explanation_fr": "Sujet هِيَ → سَتَذْهَبُ"
  },
  {
    "type": "fill_blank",
    "id": "ex-1002-3",
    "sentence_ar": "سَ___ الدَّرْسَ غَدًا",
    "sentence_fr": "Nous allons comprendre la leçon demain.",
    "choices": ["نَفْهَمُ","يَفْهَمُ","تَفْهَمُ","أَفْهَمُ"],
    "correct": "نَفْهَمُ",
    "explanation_fr": "Sujet نَحْنُ → سَنَفْهَمُ"
  }
]' WHERE id = 'lesson-1002';

-- ---- L1003 : Futur négatif لَنْ ----
UPDATE lessons SET exercises_config = '[
  {
    "type": "mcq",
    "id": "ex-1003-1",
    "prompt_fr": "لَنْ أَذْهَبَ signifie :",
    "options": ["Je n''irai pas","Je ne vais pas","N''y va pas !","Il n''ira pas"],
    "correct_index": 0
  },
  {
    "type": "mcq",
    "id": "ex-1003-2",
    "prompt_fr": "Avec لَنْ, le مضارع est au cas :",
    "options": ["منصوب (فتحة)","مرفوع (ضمة)","مجزوم (سكون)","inchangé"],
    "correct_index": 0
  },
  {
    "type": "fill_blank",
    "id": "ex-1003-3",
    "sentence_ar": "لَنْ ___ هَذَا الطَّعَامَ",
    "sentence_fr": "Elle ne mangera pas cette nourriture.",
    "choices": ["تَأْكُلَ","تَأْكُلُ","تَأْكُلْ","أَكَلَتْ"],
    "correct": "تَأْكُلَ",
    "explanation_fr": "لَنْ + مضارع منصوب → تَأْكُلَ (fatha finale)"
  }
]' WHERE id = 'lesson-1003';

-- ---- L1004 : Mes projets de demain ----
UPDATE lessons SET exercises_config = '[
  {
    "type": "dialogue",
    "id": "ex-1004-dialogue",
    "scenario_id": "scenario-future-plans"
  }
]' WHERE id = 'lesson-1004';

-- ---- L1005 & L1006 : speed_round et memory_match (config simple) ----
UPDATE lessons SET exercises_config = '[
  {"type": "speed_round", "id": "ex-1005-speed", "source_modules": ["module-7","module-8","module-9","module-10"], "question_count": 10, "duration_seconds": 30}
]' WHERE id = 'lesson-1005';

UPDATE lessons SET exercises_config = '[
  {"type": "memory_match", "id": "ex-1006-memory", "source_modules": ["module-6","module-7","module-8","module-9"], "pair_count": 8}
]' WHERE id = 'lesson-1006';
```

### 2c — Seed dialogue scénario "Projets de demain"

```sql
INSERT INTO dialogue_scenarios (id, lesson_id, title_fr, title_ar, context_fr, turns, created_at) VALUES
('scenario-future-plans', 'lesson-1004', 'Mes projets de demain', 'مشاريع الغد',
'Karim parle à sa collègue Sarah de leurs projets pour le lendemain.',
'[
  {"turn": 1, "speaker": "karim", "text_ar": "مَاذَا سَتَفْعَلِينَ غَدًا يَا سَارَة؟", "text_fr": "Que vas-tu faire demain, Sarah ?", "learner": false},
  {"turn": 2, "speaker": "sarah", "text_ar": "__CHOICE__", "text_fr": "Je vais aller au marché.", "learner": true,
   "choices": [
     {"text_ar": "سَأَذْهَبُ إِلَى السُّوقِ", "text_fr": "Je vais aller au marché", "correct": true},
     {"text_ar": "ذَهَبْتُ إِلَى السُّوقِ", "text_fr": "Je suis allée au marché", "correct": false},
     {"text_ar": "اِذْهَبِي إِلَى السُّوقِ", "text_fr": "Va au marché", "correct": false}
   ]},
  {"turn": 3, "speaker": "karim", "text_ar": "وَبَعْدَ ذَلِكَ؟", "text_fr": "Et après ?", "learner": false},
  {"turn": 4, "speaker": "sarah", "text_ar": "__CHOICE__", "text_fr": "Je vais travailler de chez moi.", "learner": true,
   "choices": [
     {"text_ar": "سَأَعْمَلُ مِنَ الْبَيْتِ", "text_fr": "Je vais travailler de chez moi", "correct": true},
     {"text_ar": "لَنْ أَعْمَلَ الْيَوْمَ", "text_fr": "Je ne travaillerai pas aujourd''hui", "correct": false},
     {"text_ar": "عَمِلْتُ أَمْسِ", "text_fr": "J''ai travaillé hier", "correct": false}
   ]},
  {"turn": 5, "speaker": "karim", "text_ar": "وَأَنَا سَأَقْرَأُ كِتَابًا جَدِيدًا", "text_fr": "Et moi, je vais lire un nouveau livre.", "learner": false},
  {"turn": 6, "speaker": "sarah", "text_ar": "__CHOICE__", "text_fr": "Bonne idée ! Moi je n''irai pas loin.", "learner": true,
   "choices": [
     {"text_ar": "فِكْرَةٌ جَيِّدَةٌ! لَنْ أَذْهَبَ بَعِيدًا", "text_fr": "Bonne idée ! Moi je n''irai pas loin", "correct": true},
     {"text_ar": "لَا تَقْرَأْ كَثِيرًا", "text_fr": "Ne lis pas trop", "correct": false},
     {"text_ar": "سَوْفَ تَقْرَأُ كَثِيرًا", "text_fr": "Tu vas lire beaucoup", "correct": false}
   ]}
]',
NOW());
```

**Checkpoint Mission 2 :**
- [ ] `SELECT COUNT(*) FROM modules WHERE id IN ('module-9','module-10')` → 2
- [ ] `SELECT COUNT(*) FROM lessons WHERE module_id IN ('module-9','module-10')` → 11
- [ ] Toutes les leçons ont `exercises_config IS NOT NULL`
- [ ] `SELECT COUNT(*) FROM dialogue_scenarios WHERE id = 'scenario-future-plans'` → 1

---

## MISSION 3 — Table `daily_challenges` : migration Supabase + SQLite

### 3a — Migration SQL dans Supabase Cloud (SQL Editor)

```sql
-- ============================================================
-- TABLE daily_challenges
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_challenges (
  id              TEXT PRIMARY KEY,
  challenge_date  DATE NOT NULL UNIQUE,
  title_fr        TEXT NOT NULL,
  title_ar        TEXT,
  theme           TEXT NOT NULL CHECK (theme IN ('conjugaison','vocabulaire','alphabet','situations','mixte')),
  exercise_refs   JSONB NOT NULL,
  xp_reward       INTEGER NOT NULL DEFAULT 100,
  badge_reward    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_challenges read-only for all" ON daily_challenges FOR SELECT USING (true);

-- Index
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);

-- ============================================================
-- SEED : 14 jours de défis (J+0 à J+13 depuis lancement)
-- Utiliser des dates relatives : NOW()::DATE + N
-- ============================================================
INSERT INTO daily_challenges (id, challenge_date, title_fr, title_ar, theme, exercise_refs, xp_reward, badge_reward) VALUES

('dc-2026-001', (NOW()::DATE + 0),  'Lettres et sons',       'الحروف والأصوات',  'alphabet',     '{"modules":["module-1","module-2"],"exercise_types":["mcq"],"count":10}',                  100, 'badge-daily-1'),
('dc-2026-002', (NOW()::DATE + 1),  'Mots du quotidien',     'كلمات يومية',      'vocabulaire',  '{"modules":["module-3","module-4"],"exercise_types":["mcq","fill_blank"],"count":10}',     100, NULL),
('dc-2026-003', (NOW()::DATE + 2),  'Verbes au passé',       'أفعال الماضي',     'conjugaison',  '{"modules":["module-6"],"exercise_types":["mcq","fill_blank"],"count":10}',                100, NULL),
('dc-2026-004', (NOW()::DATE + 3),  'Verbes au présent',     'أفعال المضارع',    'conjugaison',  '{"modules":["module-7"],"exercise_types":["fill_blank"],"count":10}',                     100, NULL),
('dc-2026-005', (NOW()::DATE + 4),  'Au marché',             'في السوق',         'situations',   '{"modules":["module-8"],"exercise_types":["dialogue","mcq"],"count":8}',                  100, 'badge-daily-5'),
('dc-2026-006', (NOW()::DATE + 5),  'Donner des ordres',     'إعطاء الأوامر',    'conjugaison',  '{"modules":["module-9"],"exercise_types":["mcq","fill_blank"],"count":10}',                100, NULL),
('dc-2026-007', (NOW()::DATE + 6),  'Défi de la semaine',    'تحدي الأسبوع',     'mixte',        '{"modules":["module-1","module-3","module-6","module-7","module-9"],"exercise_types":["mcq","fill_blank"],"count":15}', 200, 'badge-week-champion'),
('dc-2026-008', (NOW()::DATE + 7),  'Le futur proche',       'المستقبل القريب',  'conjugaison',  '{"modules":["module-10"],"exercise_types":["mcq","fill_blank"],"count":10}',               100, NULL),
('dc-2026-009', (NOW()::DATE + 8),  'Grammaire essentielle', 'قواعد أساسية',     'conjugaison',  '{"modules":["module-5"],"exercise_types":["mcq"],"count":10}',                            100, NULL),
('dc-2026-010', (NOW()::DATE + 9),  'Vie en famille',        'الحياة الأسرية',   'situations',   '{"modules":["module-8"],"exercise_types":["dialogue"],"count":6}',                        100, NULL),
('dc-2026-011', (NOW()::DATE + 10), 'Rappel alphabet',       'مراجعة الأبجدية',  'alphabet',     '{"modules":["module-1"],"exercise_types":["mcq"],"count":10}',                            100, NULL),
('dc-2026-012', (NOW()::DATE + 11), 'Tous les verbes',       'كل الأفعال',       'conjugaison',  '{"modules":["module-6","module-7","module-9","module-10"],"exercise_types":["fill_blank"],"count":12}', 100, 'badge-daily-12'),
('dc-2026-013', (NOW()::DATE + 12), 'En voyage',             'في السفر',         'situations',   '{"modules":["module-8"],"exercise_types":["dialogue","mcq"],"count":8}',                  100, NULL),
('dc-2026-014', (NOW()::DATE + 13), 'Grand défi 2 semaines', 'التحدي الكبير',    'mixte',        '{"modules":["module-1","module-3","module-5","module-7","module-8","module-9","module-10"],"exercise_types":["mcq","fill_blank","dialogue"],"count":20}', 300, 'badge-two-weeks');
```

### 3b — Migration SQLite dans `initLocalSchema()`

Dans le fichier `src/db/local-schema.ts` (ou équivalent), ajouter la création de la table `daily_challenges` et la table de progression journalière :

```typescript
// Dans initLocalSchema(), après les tables existantes :

await db.execAsync(`
  CREATE TABLE IF NOT EXISTS daily_challenges (
    id              TEXT PRIMARY KEY,
    challenge_date  TEXT NOT NULL UNIQUE,
    title_fr        TEXT NOT NULL,
    title_ar        TEXT,
    theme           TEXT NOT NULL,
    exercise_refs   TEXT NOT NULL,   -- JSON stringifié
    xp_reward       INTEGER NOT NULL DEFAULT 100,
    badge_reward    TEXT,
    created_at      TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_dc_date ON daily_challenges(challenge_date);

  CREATE TABLE IF NOT EXISTS daily_challenge_progress (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    challenge_id    TEXT NOT NULL REFERENCES daily_challenges(id),
    user_id         TEXT NOT NULL,
    completed_at    TEXT,
    score           INTEGER DEFAULT 0,
    xp_earned       INTEGER DEFAULT 0,
    synced_at       TEXT,
    UNIQUE(challenge_id, user_id)
  );
`);
```

### 3c — Mise à jour de `content-sync.ts`

Ajouter `daily_challenges` dans la liste des tables à synchroniser depuis Supabase :

```typescript
// Dans syncContentFromCloud(), ajouter après la sync de dialogue_scenarios :

const { data: challenges, error: challengesError } = await supabase
  .from('daily_challenges')
  .select('*')
  .order('challenge_date');

if (challengesError) throw challengesError;

await db.runAsync('DELETE FROM daily_challenges');
for (const challenge of challenges ?? []) {
  await db.runAsync(
    `INSERT OR REPLACE INTO daily_challenges
     (id, challenge_date, title_fr, title_ar, theme, exercise_refs, xp_reward, badge_reward, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge.id,
      challenge.challenge_date,
      challenge.title_fr,
      challenge.title_ar ?? null,
      challenge.theme,
      JSON.stringify(challenge.exercise_refs),
      challenge.xp_reward,
      challenge.badge_reward ?? null,
      challenge.created_at,
    ]
  );
}
```

**Checkpoint Mission 3 :**
- [ ] `SELECT COUNT(*) FROM daily_challenges` dans Supabase → 14
- [ ] Après sync, `SELECT COUNT(*) FROM daily_challenges` dans SQLite → 14
- [ ] Les dates sont correctes (J+0 à J+13)
- [ ] `SELECT * FROM daily_challenges WHERE challenge_date = DATE('now')` → 1 résultat

---

## MISSION 4 — Composant `SpeedRoundExercise`

**Contexte :** Le speed round est un MCQ chronométré. 10 questions, 30 secondes max. Un `TimerBar` visuel se vide progressivement. Score = questions correctes × multiplicateur de vitesse. C'est un composant générique qui reçoit ses questions depuis le `ExerciseEngine` existant.

### 4a — Types TypeScript

Dans `src/types/exercises.ts`, ajouter `'speed_round'` à l'union `ExerciseType` si ce n'est pas déjà fait (le registry contient actuellement : `mcq`, `match`, `reorder`, `dialogue`, `listen_select`, `flashcard`, `write`, `fill_blank`). Puis ajouter les interfaces :

```typescript
export interface SpeedRoundConfig {
  type: 'speed_round';
  id: string;
  source_modules: string[];        // IDs des modules à piocher
  question_count: number;          // 10 par défaut
  duration_seconds: number;        // 30 par défaut
}

export interface SpeedRoundQuestion {
  prompt_ar?: string;
  prompt_fr?: string;
  options: string[];
  correct_index: number;
}

export interface SpeedRoundResult extends ExerciseResult {
  type: 'speed_round';
  questions_answered: number;
  questions_correct: number;
  time_used_seconds: number;
  speed_multiplier: number;        // 1.0 → 2.0 selon vitesse
  final_score: number;
}
```

### 4b — Composant `SpeedRoundExercise.tsx`

Créer `src/components/exercises/SpeedRoundExercise.tsx` :

> **IMPORTANT (post-É12 reskin)** : Ce composant DOIT utiliser `useTheme()` pour toutes les couleurs — PAS d'import `design-tokens` ni de hex en dur. Respecter `ExerciseComponentProps`. Le code ci-dessous est un guide fonctionnel — adapter les styles au design system `useTheme()` actuel.

```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing } from '@/design-tokens';
import { ArabicText } from '@/components/ArabicText';
import type { SpeedRoundQuestion, SpeedRoundResult } from '@/types/exercises';

interface Props {
  questions: SpeedRoundQuestion[];
  durationSeconds?: number;
  onComplete: (result: SpeedRoundResult) => void;
}

export function SpeedRoundExercise({
  questions,
  durationSeconds = 30,
  onComplete,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const startTime = useRef(Date.now());
  const timerAnim = useRef(new Animated.Value(1)).current;

  // Démarre l'animation de la barre de temps
  useEffect(() => {
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: durationSeconds * 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  // Décompte
  useEffect(() => {
    if (isFinished) return;
    if (timeLeft <= 0) {
      handleFinish(correctCount, answeredCount);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleFinish = useCallback((correct: number, answered: number) => {
    if (isFinished) return;
    setIsFinished(true);
    const timeUsed = (Date.now() - startTime.current) / 1000;
    const speedMultiplier = Math.max(1.0, 2.0 - timeUsed / durationSeconds);
    onComplete({
      type: 'speed_round',
      passed: correct >= Math.ceil(questions.length * 0.6),
      score: Math.round(correct * speedMultiplier * 10),
      questions_answered: answered,
      questions_correct: correct,
      time_used_seconds: Math.round(timeUsed),
      speed_multiplier: parseFloat(speedMultiplier.toFixed(2)),
      final_score: Math.round(correct * speedMultiplier * 10),
    });
  }, [isFinished, questions.length, durationSeconds, onComplete]);

  const handleAnswer = useCallback((index: number) => {
    if (selectedIndex !== null || isFinished) return;
    setSelectedIndex(index);
    const isCorrect = index === questions[currentIndex].correct_index;
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    const newAnswered = answeredCount + 1;
    setCorrectCount(newCorrect);
    setAnsweredCount(newAnswered);

    // Avancer après 400ms
    setTimeout(() => {
      setSelectedIndex(null);
      if (currentIndex + 1 >= questions.length) {
        handleFinish(newCorrect, newAnswered);
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 400);
  }, [selectedIndex, isFinished, currentIndex, correctCount, answeredCount, questions, handleFinish]);

  const q = questions[currentIndex];
  if (!q) return null;

  const timerColor = timerAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [colors.error, colors.warning, colors.success],
  });
  const timerWidth = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Timer bar */}
      <View style={styles.timerTrack}>
        <Animated.View style={[styles.timerBar, { width: timerWidth, backgroundColor: timerColor }]} />
      </View>

      {/* Score live */}
      <View style={styles.scoreRow}>
        <Text style={styles.scoreText}>{correctCount}/{questions.length}</Text>
        <Text style={styles.timeText}>{timeLeft}s</Text>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        {q.prompt_ar && <ArabicText style={styles.questionAr}>{q.prompt_ar}</ArabicText>}
        {q.prompt_fr && <Text style={styles.questionFr}>{q.prompt_fr}</Text>}
      </View>

      {/* Options */}
      <View style={styles.optionsGrid}>
        {q.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === q.correct_index;
          let bgColor = colors.surface;
          if (isSelected) bgColor = isCorrect ? colors.success : colors.error;

          return (
            <TouchableOpacity
              key={idx}
              style={[styles.optionBtn, { backgroundColor: bgColor }]}
              onPress={() => handleAnswer(idx)}
              activeOpacity={0.7}
            >
              <ArabicText style={styles.optionText}>{option}</ArabicText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {questions.map((_, i) => (
          <View key={i} style={[styles.dot, i < currentIndex && styles.dotDone, i === currentIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  timerTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.sm },
  timerBar: { height: 6, borderRadius: 3 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  scoreText: { ...typography.bodyLarge, color: colors.text },
  timeText: { ...typography.bodyLarge, color: colors.primary, fontWeight: 'bold' },
  questionCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  questionAr: { fontSize: 28, marginBottom: spacing.xs },
  questionFr: { ...typography.body, color: colors.textSecondary },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  optionBtn: { width: '47%', padding: spacing.md, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  optionText: { fontSize: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotDone: { backgroundColor: colors.success },
  dotActive: { backgroundColor: colors.primary, width: 16 },
});
```

### 4c — Générateur de questions pour speed_round

Dans `src/engines/exercise-generators.ts`, ajouter `generateSpeedRoundQuestions()` :

```typescript
export async function generateSpeedRoundQuestions(
  db: SQLiteDatabase,
  sourceModules: string[],
  count: number
): Promise<SpeedRoundQuestion[]> {
  // Pioche des MCQ existants dans les leçons des modules sources
  const placeholders = sourceModules.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ exercises_config: string }>(
    `SELECT exercises_config FROM lessons
     WHERE module_id IN (${placeholders}) AND exercises_config IS NOT NULL`,
    sourceModules
  );

  const allMcq: SpeedRoundQuestion[] = [];
  for (const row of rows) {
    const exercises = JSON.parse(row.exercises_config) as any[];
    for (const ex of exercises) {
      if (ex.type === 'mcq' && ex.options?.length >= 2) {
        allMcq.push({
          prompt_ar: ex.prompt_ar,
          prompt_fr: ex.prompt_fr,
          options: ex.options,
          correct_index: ex.correct_index,
        });
      }
    }
  }

  // Mélanger et limiter
  const shuffled = allMcq.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

### 4d — Enregistrement dans l'Exercise Registry

Dans `src/engines/exercise-registry.ts`, ajouter :

```typescript
import { SpeedRoundExercise } from '@/components/exercises/SpeedRoundExercise';
// ...
registry.register('speed_round', SpeedRoundExercise);
```

**Checkpoint Mission 4 :**
- [ ] `SpeedRoundExercise.tsx` créé — `useTheme()` partout, aucun hex en dur
- [ ] `generateSpeedRoundQuestions()` retourne des questions depuis les modules
- [ ] Registrée dans l'Exercise Registry
- [ ] La TimerBar s'anime correctement (test visuel)
- [ ] `/checkpoint` → tout vert

---

## MISSION 5 — Composant `MemoryMatchExercise`

**Contexte :** Memory match = 8 paires de cartes (arabe ↔ français). L'apprenant retourne 2 cartes à la fois. Si elles correspondent, elles restent visibles. Objectif : tout matcher avant la fin du timer (60s). Composant générique, réutilisable.

### 5a — Types TypeScript

Dans `src/types/exercises.ts`, ajouter `'memory_match'` à l'union `ExerciseType`. Puis ajouter les interfaces :

```typescript
export interface MemoryMatchConfig {
  type: 'memory_match';
  id: string;
  source_modules: string[];
  pair_count: number;      // 8 par défaut
}

export interface MemoryMatchPair {
  id: string;
  card_a: string;    // texte arabe
  card_b: string;    // traduction française
}

export interface MemoryMatchResult extends ExerciseResult {
  type: 'memory_match';
  pairs_found: number;
  total_pairs: number;
  flip_count: number;
  time_seconds: number;
}
```

### 5b — Composant `MemoryMatchExercise.tsx`

Créer `src/components/exercises/MemoryMatchExercise.tsx` :

> **IMPORTANT (post-É12 reskin)** : Ce composant DOIT utiliser `useTheme()` pour toutes les couleurs — PAS d'import `design-tokens` ni de hex en dur. Respecter `ExerciseComponentProps`. Le code ci-dessous est un guide fonctionnel — adapter les styles au design system `useTheme()` actuel.

```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing } from '@/design-tokens';
import { ArabicText } from '@/components/ArabicText';
import type { MemoryMatchPair, MemoryMatchResult } from '@/types/exercises';

interface MemoryCard {
  id: string;
  pairId: string;
  content: string;
  isArabic: boolean;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Props {
  pairs: MemoryMatchPair[];
  durationSeconds?: number;
  onComplete: (result: MemoryMatchResult) => void;
}

export function MemoryMatchExercise({ pairs, durationSeconds = 60, onComplete }: Props) {
  const [cards, setCards] = useState<MemoryCard[]>(() => {
    const all: MemoryCard[] = [];
    pairs.forEach(p => {
      all.push({ id: `${p.id}-a`, pairId: p.id, content: p.card_a, isArabic: true,  isFlipped: false, isMatched: false });
      all.push({ id: `${p.id}-b`, pairId: p.id, content: p.card_b, isArabic: false, isFlipped: false, isMatched: false });
    });
    return all.sort(() => Math.random() - 0.5);
  });

  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [flipCount, setFlipCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isLocked, setIsLocked] = useState(false);
  const startTime = useRef(Date.now());
  const matchedCount = cards.filter(c => c.isMatched).length / 2;

  useEffect(() => {
    if (timeLeft <= 0 || matchedCount === pairs.length) {
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      onComplete({
        type: 'memory_match',
        passed: matchedCount === pairs.length,
        score: Math.round((matchedCount / pairs.length) * 100),
        pairs_found: matchedCount,
        total_pairs: pairs.length,
        flip_count: flipCount,
        time_seconds: elapsed,
      });
      return;
    }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, matchedCount]);

  const handleFlip = useCallback((cardId: string) => {
    if (isLocked) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlipped = [...flippedIds, cardId];
    setFlipCount(f => f + 1);
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      const [idA, idB] = newFlipped;
      const cardA = cards.find(c => c.id === idA)!;
      const cardB = cards.find(c => c.id === idB)!;
      const isMatch = cardA.pairId === cardB.pairId && cardA.id !== cardB.id;

      setTimeout(() => {
        setCards(prev => prev.map(c => {
          if (c.id === idA || c.id === idB) {
            return isMatch ? { ...c, isMatched: true } : { ...c, isFlipped: false };
          }
          return c;
        }));
        setFlippedIds([]);
        setIsLocked(false);
      }, isMatch ? 600 : 900);
    }
  }, [isLocked, flippedIds, cards]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.score}>{matchedCount}/{pairs.length} paires</Text>
        <Text style={[styles.timer, timeLeft <= 10 && styles.timerUrgent]}>{timeLeft}s</Text>
      </View>
      <View style={styles.grid}>
        {cards.map(card => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.card,
              card.isFlipped && styles.cardFlipped,
              card.isMatched && styles.cardMatched,
            ]}
            onPress={() => handleFlip(card.id)}
            activeOpacity={0.8}
          >
            {(card.isFlipped || card.isMatched) ? (
              card.isArabic
                ? <ArabicText style={styles.cardTextAr}>{card.content}</ArabicText>
                : <Text style={styles.cardTextFr}>{card.content}</Text>
            ) : (
              <Text style={styles.cardBack}>؟</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  score: { ...typography.bodyLarge, color: colors.text },
  timer: { ...typography.bodyLarge, color: colors.primary, fontWeight: 'bold' },
  timerUrgent: { color: colors.error },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  card: {
    width: '22%', aspectRatio: 0.75,
    backgroundColor: colors.primary,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cardFlipped: { backgroundColor: colors.surface },
  cardMatched: { backgroundColor: colors.success + '33', borderColor: colors.success },
  cardBack: { fontSize: 24, color: colors.white },
  cardTextAr: { fontSize: 18, textAlign: 'center' },
  cardTextFr: { ...typography.caption, textAlign: 'center', padding: 4 },
});
```

### 5c — Générateur de paires pour memory_match

Dans `src/engines/exercise-generators.ts`, ajouter `generateMemoryMatchPairs()` :

```typescript
export async function generateMemoryMatchPairs(
  db: SQLiteDatabase,
  sourceModules: string[],
  pairCount: number
): Promise<MemoryMatchPair[]> {
  const placeholders = sourceModules.map(() => '?').join(',');
  const words = await db.getAllAsync<{ id: string; arabic_voweled: string; translation_fr: string }>(
    `SELECT w.id, w.arabic_voweled, w.translation_fr
     FROM words w
     JOIN lessons l ON l.module_id IN (${placeholders})
     WHERE w.arabic_voweled IS NOT NULL AND w.translation_fr IS NOT NULL
     GROUP BY w.id`,
    sourceModules
  );

  // Fallback : si pas assez de mots, utiliser les conjugations impératives
  const shuffled = words.sort(() => Math.random() - 0.5).slice(0, pairCount);

  return shuffled.map(w => ({
    id: w.id,
    card_a: w.arabic_voweled,
    card_b: w.translation_fr,
  }));
}
```

### 5d — Enregistrement dans l'Exercise Registry

```typescript
import { MemoryMatchExercise } from '@/components/exercises/MemoryMatchExercise';
registry.register('memory_match', MemoryMatchExercise);
```

**Checkpoint Mission 5 :**
- [ ] `MemoryMatchExercise.tsx` créé — `useTheme()` partout, aucun hex en dur
- [ ] `generateMemoryMatchPairs()` retourne 8 paires depuis les modules sources
- [ ] Enregistrée dans l'Exercise Registry
- [ ] Le jeu : flip 2 cartes, match → restent visibles, non-match → se retournent
- [ ] `/checkpoint` → tout vert

---

## MISSION 6 — Hook `useDailyChallenge` + service

### 6a — Hook `useDailyChallenge.ts`

Créer `src/hooks/useDailyChallenge.ts` :

```typescript
import { useState, useEffect } from 'react';
import { useLocalDB } from './useLocalDB';
import { useUserStore } from '@/stores/user-store';

export interface DailyChallenge {
  id: string;
  challengeDate: string;
  titleFr: string;
  titleAr: string | null;
  theme: string;
  exerciseRefs: {
    modules: string[];
    exercise_types: string[];
    count: number;
  };
  xpReward: number;
  badgeReward: string | null;
  isCompleted: boolean;
  score: number;
}

export function useDailyChallenge() {
  const db = useLocalDB();
  const userId = useUserStore(s => s.effectiveUserId());
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  useEffect(() => {
    if (!db || !userId) return;
    loadTodayChallenge();
  }, [db, userId]);

  async function loadTodayChallenge() {
    if (!db) return;
    try {
      const row = await db.getFirstAsync<{
        id: string; challenge_date: string; title_fr: string; title_ar: string | null;
        theme: string; exercise_refs: string; xp_reward: number; badge_reward: string | null;
      }>(
        'SELECT * FROM daily_challenges WHERE challenge_date = ?',
        [today]
      );

      if (!row) { setChallenge(null); setLoading(false); return; }

      const progress = userId ? await db.getFirstAsync<{ score: number; completed_at: string | null }>(
        'SELECT score, completed_at FROM daily_challenge_progress WHERE challenge_id = ? AND user_id = ?',
        [row.id, userId]
      ) : null;

      setChallenge({
        id: row.id,
        challengeDate: row.challenge_date,
        titleFr: row.title_fr,
        titleAr: row.title_ar,
        theme: row.theme,
        exerciseRefs: JSON.parse(row.exercise_refs),
        xpReward: row.xp_reward,
        badgeReward: row.badge_reward,
        isCompleted: !!progress?.completed_at,
        score: progress?.score ?? 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function markCompleted(score: number, xpEarned: number) {
    if (!db || !userId || !challenge) return;
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_challenge_progress
       (challenge_id, user_id, completed_at, score, xp_earned, synced_at)
       VALUES (?, ?, datetime('now'), ?, ?, NULL)`,
      [challenge.id, userId, score, xpEarned]
    );
    setChallenge(prev => prev ? { ...prev, isCompleted: true, score } : null);
    // fire-and-forget sync
    import('@/db/sync-manager').then(({ runSync }) => runSync());
  }

  return { challenge, loading, markCompleted, reload: loadTodayChallenge };
}
```

**Checkpoint Mission 6 :**
- [ ] `useDailyChallenge()` retourne le défi du jour depuis SQLite
- [ ] `isCompleted` est `true` si `daily_challenge_progress` contient une entrée pour aujourd'hui
- [ ] `markCompleted()` écrit dans `daily_challenge_progress` + lance `runSync()`
- [ ] Utilise `effectiveUserId()` (pas `useAuthStore`)
- [ ] `/checkpoint` → tout vert

---

## MISSION 7 — Écran `DailyChallengeScreen`

### 7a — Composant `DailyChallengeScreen.tsx`

Créer `src/screens/DailyChallengeScreen.tsx` :

> **IMPORTANT (post-É12 reskin)** : Ce composant DOIT utiliser `useTheme()` pour toutes les couleurs. Utiliser `router` d'Expo Router (pas `useNavigation` de React Navigation). Le code ci-dessous est un guide fonctionnel — adapter styles et navigation au projet actuel.

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@/design-tokens';
import { ArabicText } from '@/components/ArabicText';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { useNavigation } from '@react-navigation/native';

const THEME_ICONS: Record<string, string> = {
  conjugaison: '🔄',
  vocabulaire: '📚',
  alphabet: 'أ',
  situations: '💬',
  mixte: '⭐',
};

export function DailyChallengeScreen() {
  const { challenge, loading } = useDailyChallenge();
  const navigation = useNavigation();

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Chargement du défi...</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Pas de défi aujourd'hui.</Text>
        <Text style={styles.emptySubText}>Reviens demain ! 🌙</Text>
      </View>
    );
  }

  const icon = THEME_ICONS[challenge.theme] ?? '🎯';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header flamme */}
      <View style={styles.header}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.title}>Défi du jour</Text>
        <Text style={styles.date}>{new Date(challenge.challengeDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      {/* Carte défi */}
      <View style={[styles.card, challenge.isCompleted && styles.cardCompleted]}>
        <Text style={styles.themeIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{challenge.titleFr}</Text>
        {challenge.titleAr && <ArabicText style={styles.cardTitleAr}>{challenge.titleAr}</ArabicText>}
        <Text style={styles.themeLabel}>{challenge.theme.charAt(0).toUpperCase() + challenge.theme.slice(1)}</Text>

        <View style={styles.rewardRow}>
          <Text style={styles.rewardText}>🏆 {challenge.xpReward} XP</Text>
          {challenge.badgeReward && <Text style={styles.rewardText}>🥇 Badge spécial</Text>}
        </View>
      </View>

      {/* CTA */}
      {challenge.isCompleted ? (
        <View style={styles.completedBox}>
          <Text style={styles.completedEmoji}>✅</Text>
          <Text style={styles.completedText}>Défi complété aujourd'hui !</Text>
          <Text style={styles.completedScore}>Score : {challenge.score} pts</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('DailyChallengeSession', { challengeId: challenge.id })}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Commencer le défi →</Text>
        </TouchableOpacity>
      )}

      {/* Règles */}
      <View style={styles.rulesBox}>
        <Text style={styles.rulesTitle}>Comment ça marche ?</Text>
        <Text style={styles.rulesText}>• Un nouveau défi chaque jour</Text>
        <Text style={styles.rulesText}>• Questions tirées de tes modules appris</Text>
        <Text style={styles.rulesText}>• {challenge.xpReward} XP en récompense (vs ~30 XP par leçon)</Text>
        {challenge.badgeReward && <Text style={styles.rulesText}>• Badge exclusif aujourd'hui 🏅</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary },
  emptyText: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  emptySubText: { ...typography.body, color: colors.textSecondary },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  flame: { fontSize: 48 },
  title: { ...typography.h2, color: colors.text, marginTop: spacing.sm },
  date: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, textTransform: 'capitalize' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.lg,
    borderWidth: 2, borderColor: colors.primary + '44',
    shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  cardCompleted: { borderColor: colors.success, opacity: 0.8 },
  themeIcon: { fontSize: 40, marginBottom: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  cardTitleAr: { fontSize: 22, color: colors.textSecondary, marginBottom: spacing.sm },
  themeLabel: { ...typography.caption, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  rewardRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  rewardText: { ...typography.body, color: colors.text, fontWeight: '600' },
  completedBox: { alignItems: 'center', backgroundColor: colors.success + '1A', borderRadius: 12, padding: spacing.lg, marginBottom: spacing.lg },
  completedEmoji: { fontSize: 36, marginBottom: spacing.xs },
  completedText: { ...typography.bodyLarge, color: colors.success, fontWeight: '600' },
  completedScore: { ...typography.body, color: colors.textSecondary },
  startBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    alignItems: 'center', marginBottom: spacing.lg,
  },
  startBtnText: { ...typography.bodyLarge, color: colors.white, fontWeight: '700' },
  rulesBox: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg },
  rulesTitle: { ...typography.bodyLarge, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  rulesText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
});
```

### 7b — Ajout de l'entrée dans la navigation tabs

Dans `src/navigation/tabs.tsx` (ou équivalent), ajouter un onglet "Défi" visible uniquement si un défi est disponible aujourd'hui (ou toujours visible, avec badge si incomplet) :

```typescript
// Dans le TabBar, ajouter un icône flamme avec badge si challenge non complété
// L'onglet pointe vers DailyChallengeScreen

// Optionnel : badge rouge sur l'onglet si challenge disponible et non complété
// Utiliser useDailyChallenge() dans le composant TabBar pour lire isCompleted
```

> **Note Claude Code** : Ne refactor pas toute la navigation. Ajouter l'onglet en conservant les 4 onglets existants. Si la navigation est une stack, ajouter `DailyChallengeScreen` comme écran accessible depuis la home tab.

**Checkpoint Mission 7 :**
- [ ] `DailyChallengeScreen` s'affiche avec les données du défi du jour
- [ ] Si complété, affiche "Défi complété" + score
- [ ] Si non complété, le bouton "Commencer" est cliquable
- [ ] La date est correctement formatée en français
- [ ] `/checkpoint` → tout vert

---

## MISSION 8 — Lesson Engine : routage M9/M10 + déverrouillage

### 8a — Routage des nouveaux types dans le Lesson Engine

Dans `src/engines/lesson-engine.ts` (ou équivalent), s'assurer que le `dispatch` vers `SpeedRoundExercise` et `MemoryMatchExercise` est en place :

```typescript
// Dans la fonction de dispatch d'exercices (switch ou registry lookup) :

case 'speed_round': {
  const questions = await generateSpeedRoundQuestions(
    db,
    exerciseConfig.source_modules,
    exerciseConfig.question_count ?? 10
  );
  return {
    component: 'speed_round',
    props: { questions, durationSeconds: exerciseConfig.duration_seconds ?? 30 },
  };
}

case 'memory_match': {
  const pairs = await generateMemoryMatchPairs(
    db,
    exerciseConfig.source_modules,
    exerciseConfig.pair_count ?? 8
  );
  return {
    component: 'memory_match',
    props: { pairs, durationSeconds: 60 },
  };
}
```

### 8b — Déverrouillage séquentiel M9 → M10

Dans `src/hooks/useModuleProgression.ts` (ou équivalent), ajouter les prédicats :

```typescript
// M9 débloqué quand M8 complété (≥ 80% des leçons)
// M10 débloqué quand M9 complété (≥ 80% des leçons)
// Ces prédicats sont déjà génériques si prerequisite_module_id est lu depuis la DB.
// Vérifier que la colonne prerequisite_module_id est bien lue et utilisée.
```

> **Note Claude Code** : Si le déverrouillage est déjà générique (basé sur `prerequisite_module_id`), aucune modification n'est nécessaire — M9 et M10 ont leur `prerequisite_module_id` correctement seedé en Mission 2.

### 8c — Analytics PostHog

Dans les résultats de `SpeedRoundExercise` et `MemoryMatchExercise`, émettre des events :

```typescript
// SpeedRoundExercise — dans onComplete :
track('speed_round_completed', {
  lesson_id: lessonId,
  questions_correct: result.questions_correct,
  questions_total: result.questions_answered,
  time_used: result.time_used_seconds,
  score: result.final_score,
});

// MemoryMatchExercise — dans onComplete :
track('memory_match_completed', {
  lesson_id: lessonId,
  pairs_found: result.pairs_found,
  total_pairs: result.total_pairs,
  flip_count: result.flip_count,
  passed: result.passed,
});

// DailyChallengeScreen — au markCompleted :
track('daily_challenge_completed', {
  challenge_id: challenge.id,
  theme: challenge.theme,
  score: score,
  xp_earned: xpEarned,
});
```

**Checkpoint Mission 8 :**
- [ ] M9 verrouillé jusqu'à complétion de M8 (test en app)
- [ ] M10 verrouillé jusqu'à complétion de M9
- [ ] `SpeedRoundExercise` se lance depuis la leçon 1005
- [ ] `MemoryMatchExercise` se lance depuis la leçon 1006
- [ ] Events PostHog `speed_round_completed`, `memory_match_completed`, `daily_challenge_completed` visibles
- [ ] `/checkpoint` → tout vert

---

## MISSION 9 — Tests et régression complète

### 9a — Validation automatique toolkit

Lance `@regression-tester`. Tous les axes doivent être ✅.

### 9b — Validation contenu arabe

Lance `@arabic-content-validator` sur l'ensemble des seeds É15 (conjugaisons impératif, dialogue futur, exercices seedés).

### 9c — Scénarios de test É15 (manuels)

**1. Sync des données :**
- Vider `sync_metadata` → relancer → `conjugation_entries` (tense=imperative, 30 lignes) + `daily_challenges` (14) dans SQLite
- `SELECT COUNT(*) FROM conjugation_entries WHERE tense = 'imperative'` → 30
- `SELECT COUNT(*) FROM daily_challenges` → 14

**2. Module 9 — Leçon 901 (Impératif masculin) :**
- Débloquer artificiellement → ouvrir L901
- MCQ : "Comment dit-on Lis ! à un homme ?" → اِقْرَأْ
- FillBlank : اُكْتُبِ اسْمَكَ هُنَا → blank correctement remplacé

**3. Module 9 — Leçon 903 (Irréguliers) :**
- تَعَالَ affiché comme impératif de جاء — vérifier la pédagogie note
- كُلْ affiché comme impératif de أكل

**4. Module 9 — Leçon 904 (Impératif négatif) :**
- Phrases لَا + مضارع مجزوم : la forme مجزومة est bien sélectionnée

**5. Module 10 — Leçon 1001 (سَوْفَ) :**
- FillBlank : سَوْفَ ___ إِلَى الْمَدْرَسَةِ → أَذْهَبُ (avec ضمة finale, pas de سكون)

**6. Module 10 — Leçon 1005 (Speed Round) :**
- La TimerBar démarre à 100% et se vide en 30s
- Les 4 options s'affichent en grille 2×2
- Sélectionner une réponse → vert/rouge immédiat → question suivante en 400ms
- À la fin (10 questions ou 30s) → résultat avec score multiplié par vitesse

**7. Module 10 — Leçon 1006 (Memory Match) :**
- 16 cartes affichées en grille 4×4 (8 paires)
- Flip 2 cartes → si match, restent visibles (vert) → si non-match, se retournent après 900ms
- Toutes les paires trouvées → écran de victoire

**8. Défi quotidien :**
- `useDailyChallenge()` retourne le défi avec `challenge_date = today`
- Si premier lancement : `isCompleted = false`
- Après `markCompleted()` : `isCompleted = true`, score sauvé en SQLite
- Re-lancement : défi toujours marqué complété

**9. RTL & accessibilité :**
- `SpeedRoundExercise` : les options en arabe sont RTL
- `MemoryMatchExercise` : les cartes arabe sont RTL, les cartes français sont LTR
- Tous les boutons ont `accessibilityLabel`

**10. Offline :**
- Mode avion → M9, M10, et défi du jour fonctionnent depuis SQLite

**11. Régression M1–M8 :**
- Compléter une leçon de chaque module → XP, streak, badges OK
- Aucune régression audio, gamification, SRS, fill_blank, dialogue engine

**Checkpoint final É15 :**
- [ ] `@regression-tester` → tout vert
- [ ] `@arabic-content-validator` → pas d'erreur
- [ ] `/checkpoint` → tout vert
- [ ] Sync : 30 conjugations impératif + 14 daily_challenges dans SQLite
- [ ] M9 : MCQ + FillBlank impératif (m/f/pl + négatif) fonctionnels
- [ ] M10 : FillBlank futur proche (سَوْفَ / سَـ / لَنْ) fonctionnels
- [ ] M10 : Dialogue "Projets de demain" (6 tours, 3 choix learner)
- [ ] `SpeedRoundExercise` : timer 30s, 10 questions, score × vitesse
- [ ] `MemoryMatchExercise` : 8 paires, flip logic, timer 60s
- [ ] `DailyChallengeScreen` : défi du jour affiché, completion sauvée
- [ ] Déverrouillage M9 → M10 fonctionnel
- [ ] Analytics : 3 nouveaux events PostHog visibles
- [ ] Aucune régression M1–M8

---

## RÉSUMÉ DE L'ÉTAPE 15

| Mission | Livrable | Statut |
|---------|----------|--------|
| 0 | `@codebase-scout` — scan initial du repo | ⬜ |
| 1 | 30 conjugaisons impératif (10 verbes × 3 formes) | ⬜ |
| 2 | Modules 9 & 10 + 11 leçons + exercices seedés + dialogue futur | ⬜ |
| 3 | Table `daily_challenges` (Supabase + SQLite) + 14 défis seedés + sync | ⬜ |
| 4 | `SpeedRoundExercise` + types + générateur + registry | ⬜ |
| 5 | `MemoryMatchExercise` + types + générateur + registry | ⬜ |
| 6 | `useDailyChallenge` hook + `daily_challenge_progress` table | ⬜ |
| 7 | `DailyChallengeScreen` UI + navigation | ⬜ |
| 8 | Lesson engine routage + déverrouillage M9/M10 + analytics | ⬜ |
| 9 | `@regression-tester` + `@arabic-content-validator` + tests manuels | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs après É15 :**
- `ETAPE-15-imperatif-futur-minijeux.md` (ce fichier)
- `lisaan-seed-letters.json`

**Fichiers à supprimer de /docs :**
- `ETAPE-14-present-situations.md` (terminée)

---

> **Prochaine étape après validation :** Étape 16 — Audio natif (lettres, syllabes, mots), intégration du lecteur audio dans toutes les leçons existantes, et SRS étendu à la grammaire et aux conjugaisons (cartes SRS pour les formes verbales).
