-- ============================================================
-- MIGRATION : Module 2 — Les harakats démystifiés
-- ============================================================

-- 1. Enrichir la table diacritics avec les colonnes pédagogiques
ALTER TABLE diacritics
  ADD COLUMN IF NOT EXISTS pedagogy_notes TEXT,
  ADD COLUMN IF NOT EXISTS visual_description TEXT,
  ADD COLUMN IF NOT EXISTS example_letters TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS transliteration TEXT,
  ADD COLUMN IF NOT EXISTS ipa TEXT;

-- 2. Mettre à jour les diacritiques existants avec les données pédagogiques
-- Note : dans la DB, l'ordre est Fatha(1), Damma(2), Kasra(3),
--        Fathatan(4), Dammatan(5), Kasratan(6), Soukoun(7), Chadda(8)

-- Fatha (فَتْحَة) — sort_order 1
UPDATE diacritics SET
  pedagogy_notes = 'La fatha est la voyelle courte la plus fréquente en arabe. C''est un petit trait diagonal au-dessus de la lettre. Elle produit le son "a" bref, comme dans "papa". En français, ce son est naturel — c''est la voyelle la plus facile à reconnaître.',
  visual_description = 'Petit trait oblique (/) placé AU-DESSUS de la lettre',
  example_letters = ARRAY['بَ', 'تَ', 'سَ', 'نَ', 'كَ', 'مَ'],
  transliteration = 'a',
  ipa = '/a/'
WHERE name_fr = 'Fatha';

-- Damma (ضَمَّة) — sort_order 2
UPDATE diacritics SET
  pedagogy_notes = 'La damma ressemble à un petit "و" (waw) miniature au-dessus de la lettre. Elle produit le son "ou" bref, comme dans "loup". Moyen mnémotechnique : la damma a une forme arrondie → le son "ou" arrondit les lèvres.',
  visual_description = 'Petit و (waw miniature) placé AU-DESSUS de la lettre',
  example_letters = ARRAY['بُ', 'تُ', 'سُ', 'نُ', 'كُ', 'مُ'],
  transliteration = 'u',
  ipa = '/u/'
WHERE name_fr = 'Damma';

-- Kasra (كَسْرَة) — sort_order 3
UPDATE diacritics SET
  pedagogy_notes = 'La kasra est un petit trait diagonal SOUS la lettre. Elle produit le son "i" bref, comme dans "lit". Astuce : la kasra est en bas → son "i" = bouche étirée (en bas du visage). C''est le miroir inversé de la fatha.',
  visual_description = 'Petit trait oblique (/) placé EN-DESSOUS de la lettre',
  example_letters = ARRAY['بِ', 'تِ', 'سِ', 'نِ', 'كِ', 'مِ'],
  transliteration = 'i',
  ipa = '/i/'
WHERE name_fr = 'Kasra';

-- Fathatan (فَتْحَتَان) — sort_order 4
UPDATE diacritics SET
  pedagogy_notes = 'Le fathatan est un double fatha : deux petits traits au-dessus de la lettre. Il produit le son "-an". On le trouve souvent en fin de mot pour marquer un nom indéfini à l''accusatif. Exemple : كِتَابًا (kitāban = un livre, à l''accusatif).',
  visual_description = 'Deux petits traits obliques (//) placés AU-DESSUS de la lettre',
  example_letters = ARRAY['بًا', 'كِتَابًا', 'عِلْمًا'],
  transliteration = '-an',
  ipa = '/an/'
WHERE name_fr = 'Fathatan';

-- Dammatan (ضَمَّتَان) — sort_order 5
UPDATE diacritics SET
  pedagogy_notes = 'Le dammatan est un double damma au-dessus de la lettre. Il produit le son "-oun" (parfois noté "-un"). Il marque un nom indéfini au nominatif. Exemple : كِتَابٌ (kitābun = un livre).',
  visual_description = 'Deux petits و empilés AU-DESSUS de la lettre',
  example_letters = ARRAY['بٌ', 'كِتَابٌ', 'عِلْمٌ'],
  transliteration = '-un',
  ipa = '/un/'
WHERE name_fr = 'Dammatan';

-- Kasratan (كَسْرَتَان) — sort_order 6
UPDATE diacritics SET
  pedagogy_notes = 'Le kasratan est un double kasra : deux traits sous la lettre. Il produit le son "-in". Il marque souvent un nom indéfini au génitif. Exemple : كِتَابٍ (kitābin = d''un livre).',
  visual_description = 'Deux petits traits obliques (//) placés EN-DESSOUS de la lettre',
  example_letters = ARRAY['بٍ', 'كِتَابٍ', 'عِلْمٍ'],
  transliteration = '-in',
  ipa = '/in/'
WHERE name_fr = 'Kasratan';

-- Soukoun (سُكُون) — sort_order 7
UPDATE diacritics SET
  pedagogy_notes = 'Le soukoun est un petit cercle au-dessus de la lettre. Il signifie : PAS de voyelle après cette consonne. C''est le "silence" vocalique. Il crée des groupes de consonnes : مَكْتَب (mak-tab). Sans le soukoun, chaque consonne aurait une voyelle.',
  visual_description = 'Petit cercle (°) placé AU-DESSUS de la lettre',
  example_letters = ARRAY['بْ', 'تْ', 'مَكْتَب', 'بَابْ'],
  transliteration = '(aucun son)',
  ipa = '∅'
WHERE name_fr = 'Soukoun';

-- Chadda (شَدَّة) — sort_order 8
UPDATE diacritics SET
  pedagogy_notes = 'La chadda (ou shadda) est un petit "w" au-dessus de la lettre. Elle signifie : cette consonne est DOUBLÉE (prononcée deux fois). Exemple : مُحَمَّد (Mu-ham-mad). La chadda se combine avec les autres harakats : بَّ (ba doublé avec fatha), بِّ (bi doublé avec kasra), بُّ (bu doublé avec damma).',
  visual_description = 'Petit w (شكل حرف w) placé AU-DESSUS de la lettre',
  example_letters = ARRAY['بّ', 'مُحَمَّد', 'شَدَّة', 'أُمَّة'],
  transliteration = '(double la consonne)',
  ipa = 'Cː (géminée)'
WHERE name_fr = 'Chadda';

-- 3. Créer la table diacritic_confusion_pairs
CREATE TABLE IF NOT EXISTS diacritic_confusion_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diacritic_ids TEXT[] NOT NULL,
  description_fr TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO diacritic_confusion_pairs (diacritic_ids, description_fr) VALUES
  (
    (SELECT ARRAY_AGG(id::text ORDER BY sort_order)
     FROM diacritics WHERE name_fr IN ('Fatha', 'Kasra', 'Damma')),
    'Les trois voyelles courtes — confusion fréquente chez les débutants'
  ),
  (
    (SELECT ARRAY_AGG(id::text ORDER BY sort_order)
     FROM diacritics WHERE name_fr IN ('Fatha', 'Fathatan')),
    'Fatha simple vs double (tanwin)'
  ),
  (
    (SELECT ARRAY_AGG(id::text ORDER BY sort_order)
     FROM diacritics WHERE name_fr IN ('Kasra', 'Kasratan')),
    'Kasra simple vs double (tanwin)'
  ),
  (
    (SELECT ARRAY_AGG(id::text ORDER BY sort_order)
     FROM diacritics WHERE name_fr IN ('Damma', 'Dammatan')),
    'Damma simple vs double (tanwin)'
  );

-- 4. Seeder les 6 leçons du Module 2
-- Ordre des leçons : Fatha(1) → Kasra(2) → Damma(3) → Tanwin(4) → Soukoun(5) → Chadda(6)
INSERT INTO lessons (module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
SELECT
  m.id,
  v.title_fr,
  v.title_ar,
  v.description_fr,
  v.sort_order,
  v.xp_reward,
  v.estimated_minutes
FROM modules m,
(VALUES
  ('La Fatha — le son "a"',           'الفَتْحَة',    'Découvre la fatha : un petit trait qui transforme toute consonne en syllabe avec le son "a".',                         1, 15, 5),
  ('La Kasra — le son "i"',           'الكَسْرَة',    'La kasra se glisse sous la lettre et produit le son "i". Compare-la avec la fatha.',                                   2, 15, 5),
  ('La Damma — le son "ou"',          'الضَّمَّة',    'La damma, petit waw miniature, donne le son "ou". Tu maîtrises maintenant les 3 voyelles courtes !',                   3, 15, 5),
  ('Le Tanwin — les terminaisons nasales', 'التَّنْوِين', 'Quand les voyelles se dédoublent, elles ajoutent un "n" nasal. Fathatan, kasratan, dammatan.',                    4, 20, 6),
  ('Le Soukoun — le silence',         'السُّكُون',    'Un petit cercle qui dit "stop" : pas de voyelle ici. Essentiel pour lire les vrais mots arabes.',                      5, 20, 6),
  ('La Chadda — la consonne doublée', 'الشَّدَّة',    'La chadda double une consonne. Elle se combine avec les voyelles. Dernier diacritique, et non des moindres !',         6, 25, 7)
) AS v(title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
WHERE m.sort_order = 2;

-- DONE
