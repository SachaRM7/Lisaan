-- ============================================================
-- ÉTAPE 19 — Badges + Modules + Lessons pour levantin, khaliji et coranique É19
-- À exécuter dans le SQL Editor Supabase Cloud APRÈS les seeds word_variants et quran_entries
--
-- IMPORTANT — Vérifier d'abord les IDs des modules darija et egyptian (É17/É18) :
--   SELECT id, title_fr FROM modules WHERE title_fr ILIKE '%dar%' OR title_fr ILIKE '%égy%';
-- Puis mettre à jour les IDs dans la requête dialect_count de src/engines/badge-engine.ts
-- si les IDs différent de 'mod-darija' et 'mod-egyptian'.
--
-- De même pour le module coranique (É17/É18), vérifier l'ID :
--   SELECT id, title_fr FROM modules WHERE title_fr ILIKE '%cor%' OR title_fr ILIKE '%quran%';
-- Remplacer 'mod-quran' ci-dessous si nécessaire.
-- ============================================================

-- ── MODULE : Levantin (🇸🇾) ──────────────────────────────────
INSERT INTO modules (id, title_fr, title_ar, description_fr, sort_order, icon, synced_at) VALUES
  ('mod-levantine', 'Levantin', 'الشامي', 'Dialecte parlé au Liban, Syrie, Jordanie et Palestine. Le plus compréhensible entre arabophones.', 11, '🇸🇾', NULL)
ON CONFLICT (id) DO NOTHING;

-- 3 leçons levantin
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes, synced_at) VALUES
  ('lesson-lev-01', 'mod-levantine', 'Bienvenue en levantin', 'مرحبا كيفك', 'مرحبا et كيفك — les formules de politesse quotidiennes', 1, 15, 5, NULL),
  ('lesson-lev-02', 'mod-levantine', 'Poser des questions', 'شو وين كيف', 'شو, وين, كيف — les bases pour questionner', 2, 15, 5, NULL),
  ('lesson-lev-03', 'mod-levantine', 'Vie quotidienne', 'بدّي يلا منيح', 'بدّي, يلا, منيح — expressions du quotidien', 3, 15, 5, NULL)
ON CONFLICT (id) DO NOTHING;

-- ── MODULE : Khaliji (🇸🇦) ──────────────────────────────────
INSERT INTO modules (id, title_fr, title_ar, description_fr, sort_order, icon, synced_at) VALUES
  ('mod-khaliji', 'Khaliji', 'الخليجي', 'Dialecte du Golfe : Arabie saoudite, Émirats, Qatar, Koweït, Bahreïn, Oman.', 12, '🇸🇦', NULL)
ON CONFLICT (id) DO NOTHING;

-- 3 leçons khaliji
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes, synced_at) VALUES
  ('lesson-khal-01', 'mod-khaliji', 'Le Golfe en arabe', 'زين وقهوة', 'زين et قهوة — les expressions gulf typiques', 1, 15, 5, NULL),
  ('lesson-khal-02', 'mod-khaliji', 'Questions au Golfe', 'إيش وين قدّيش', 'إيش, وين, قدّيش — questionner en khaliji', 2, 15, 5, NULL),
  ('lesson-khal-03', 'mod-khaliji', 'Le Qaf du Golfe', 'قال گال', 'Le phénomène قَالْ → گَال — le G du Golfe', 3, 15, 5, NULL)
ON CONFLICT (id) DO NOTHING;

-- ── 3 LEÇONS CORANIQUES É19 (à ajouter au module coranique existant) ────
-- Vérifier d'abord l'ID du module coranique :
-- SELECT id, title_fr FROM modules WHERE title_fr ILIKE '%cor%' OR title_fr ILIKE '%quran%';
-- Remplacer 'mod-quran' par l'ID réel si différent.
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes, synced_at) VALUES
  ('lesson-quran-adh-duha', 'mod-quran', 'Adh-Duha (93)', 'الضحى', 'Sourate du réconfort divin — 11 versets', 8, 20, 10, NULL),
  ('lesson-quran-al-inshirah', 'mod-quran', 'Al-Inshirah (94)', 'الشرح', 'Sourate de l''expansion — 8 versets', 9, 20, 8, NULL),
  ('lesson-quran-al-qadr', 'mod-quran', 'Al-Qadr (97)', 'القدر', 'La Nuit du Destin — 5 versets', 10, 25, 8, NULL)
ON CONFLICT (id) DO NOTHING;

-- Mettre à jour content_refs pour les 3 leçons coraniques (surah number)
UPDATE lessons SET content_refs = '["93"]' WHERE id = 'lesson-quran-adh-duha';
UPDATE lessons SET content_refs = '["94"]' WHERE id = 'lesson-quran-al-inshirah';
UPDATE lessons SET content_refs = '["97"]' WHERE id = 'lesson-quran-al-qadr';

-- ── BADGES É19 ──────────────────────────────────────────────
INSERT INTO badges (id, title_fr, description_fr, icon, category, condition_type, condition_value, condition_target, xp_reward, synced_at) VALUES

-- Badges dialecte levantin
('badge_dialect_levantine', 'شامي', 'Complété ta première leçon de levantin', '🇸🇾', 'dialect', 'lesson_complete', 1, 'mod-levantine', 20, NULL),

-- Badges dialecte khaliji
('badge_dialect_khaliji', 'خليجي', 'Complété ta première leçon de khaliji', '🇸🇦', 'dialect', 'lesson_complete', 1, 'mod-khaliji', 20, NULL),

-- Badges explorateur des dialectes
('badge_dialect_explorer_2', 'مُطلِعُ اللهجات', 'Explorateur des dialectes II — 3 dialectes entamés', '🌍', 'dialect', 'dialect_count', 3, NULL, 50, NULL),

-- Badge polyglotte des dialectes (4 dialectes : darija + egyptian + levantine + khaliji)
('badge_polyglot_dialects', 'متعدد اللهجات', 'Polyglotte des dialectes — 4 dialectes entamés', '🗣️', 'dialect', 'dialect_count', 4, NULL, 100, NULL)

ON CONFLICT (id) DO NOTHING;
