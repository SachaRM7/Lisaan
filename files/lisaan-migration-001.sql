-- ============================================================
-- LISAAN — Supabase Migration: Schema + Seed
-- Version: 1.0.0 | Date: 2026-03-16
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

CREATE TYPE variant_type AS ENUM ('msa', 'darija', 'egyptian', 'levantine', 'khaliji', 'quranic');
CREATE TYPE diacritic_category AS ENUM ('vowel_short', 'vowel_long', 'tanwin', 'other');
CREATE TYPE part_of_speech AS ENUM ('noun', 'verb', 'adjective', 'adverb', 'particle', 'pronoun', 'preposition', 'conjunction');
CREATE TYPE gender_type AS ENUM ('masculine', 'feminine', 'na');
CREATE TYPE exercise_type AS ENUM ('mcq', 'match', 'fill_blank', 'trace', 'listen_select', 'reorder', 'translate', 'dialogue');
CREATE TYPE lesson_status AS ENUM ('locked', 'available', 'in_progress', 'completed');
CREATE TYPE srs_item_type AS ENUM ('letter', 'diacritic', 'word', 'sentence');
CREATE TYPE harakats_mode AS ENUM ('always', 'adaptive', 'never', 'tap_reveal');
CREATE TYPE display_mode AS ENUM ('always', 'tap_reveal', 'never');
CREATE TYPE exercise_direction AS ENUM ('ar_to_fr', 'fr_to_ar', 'both');
CREATE TYPE audio_speed AS ENUM ('slow', 'normal', 'native');
CREATE TYPE font_size AS ENUM ('small', 'medium', 'large', 'xlarge');

-- ────────────────────────────────────────────────────────────
-- CONTENT TABLES
-- ────────────────────────────────────────────────────────────

-- Letters
CREATE TABLE letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order INTEGER NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  ipa TEXT NOT NULL,
  form_isolated TEXT NOT NULL,
  form_initial TEXT NOT NULL,
  form_medial TEXT NOT NULL,
  form_final TEXT NOT NULL,
  connects_left BOOLEAN NOT NULL DEFAULT true,
  connects_right BOOLEAN NOT NULL DEFAULT true,
  is_sun_letter BOOLEAN NOT NULL DEFAULT false,
  articulation_group TEXT NOT NULL,
  articulation_fr TEXT NOT NULL,
  pedagogy_notes TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Diacritics
CREATE TABLE diacritics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order INTEGER NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  symbol TEXT NOT NULL,
  sound_effect TEXT NOT NULL,
  category diacritic_category NOT NULL,
  position TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Confusion pairs (for SRS grouping)
CREATE TABLE confusion_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_ids UUID[] NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roots
CREATE TABLE roots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consonants TEXT[] NOT NULL,
  transliteration TEXT NOT NULL,
  core_meaning_fr TEXT NOT NULL,
  core_meaning_ar TEXT,
  frequency_rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Words
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_id UUID REFERENCES roots(id) ON DELETE SET NULL,
  arabic TEXT NOT NULL,
  arabic_vocalized TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  ipa TEXT,
  pattern TEXT,
  pos part_of_speech NOT NULL,
  frequency_rank INTEGER,
  audio_url TEXT,
  plural_id UUID REFERENCES words(id) ON DELETE SET NULL,
  gender gender_type NOT NULL DEFAULT 'na',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Word variants (multi-dialect)
CREATE TABLE word_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  variant variant_type NOT NULL,
  arabic TEXT NOT NULL,
  arabic_vocalized TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  audio_url TEXT,
  notes_fr TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(word_id, variant)
);

-- Sentences
CREATE TABLE sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arabic TEXT NOT NULL,
  arabic_vocalized TEXT NOT NULL,
  translation_fr TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  word_ids UUID[] NOT NULL,
  audio_url TEXT,
  context TEXT,
  variant variant_type NOT NULL DEFAULT 'msa',
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modules
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_fr TEXT NOT NULL,
  title_ar TEXT,
  description_fr TEXT,
  sort_order INTEGER NOT NULL UNIQUE,
  variant variant_type NOT NULL DEFAULT 'msa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title_fr TEXT NOT NULL,
  title_ar TEXT,
  description_fr TEXT,
  sort_order INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  estimated_minutes INTEGER NOT NULL DEFAULT 5,
  prerequisite_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, sort_order)
);

-- Exercises
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type exercise_type NOT NULL,
  config JSONB NOT NULL,
  sort_order INTEGER NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, sort_order)
);

-- ────────────────────────────────────────────────────────────
-- USER TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  onboarding_answers JSONB,
  recommended_variant variant_type DEFAULT 'msa',
  active_variant variant_type DEFAULT 'msa',
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_longest INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 10,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  harakats_mode harakats_mode NOT NULL DEFAULT 'always',
  transliteration_mode display_mode NOT NULL DEFAULT 'always',
  translation_mode display_mode NOT NULL DEFAULT 'always',
  exercise_direction exercise_direction NOT NULL DEFAULT 'both',
  audio_autoplay BOOLEAN NOT NULL DEFAULT true,
  audio_speed audio_speed NOT NULL DEFAULT 'slow',
  font_size font_size NOT NULL DEFAULT 'medium',
  haptic_feedback BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status lesson_status NOT NULL DEFAULT 'locked',
  score INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE srs_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type srs_item_type NOT NULL,
  item_id UUID NOT NULL,
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  interval_days FLOAT NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_review_at TIMESTAMPTZ,
  last_quality INTEGER CHECK (last_quality BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX idx_words_root ON words(root_id);
CREATE INDEX idx_words_pos ON words(pos);
CREATE INDEX idx_words_frequency ON words(frequency_rank);
CREATE INDEX idx_word_variants_word ON word_variants(word_id);
CREATE INDEX idx_word_variants_variant ON word_variants(variant);
CREATE INDEX idx_sentences_variant ON sentences(variant);
CREATE INDEX idx_sentences_difficulty ON sentences(difficulty);
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_exercises_lesson ON exercises(lesson_id);
CREATE INDEX idx_exercises_type ON exercises(type);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson ON user_progress(lesson_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_srs_cards_user ON srs_cards(user_id);
CREATE INDEX idx_srs_cards_next_review ON srs_cards(next_review_at);
CREATE INDEX idx_srs_cards_user_next ON srs_cards(user_id, next_review_at);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

-- Content tables: readable by all authenticated users
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE diacritics ENABLE ROW LEVEL SECURITY;
ALTER TABLE roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content readable by authenticated" ON letters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content readable by authenticated" ON diacritics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content readable by authenticated" ON roots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content readable by authenticated" ON words FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content readable by authenticated" ON word_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content readable by authenticated" ON sentences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content readable by authenticated" ON modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content readable by authenticated" ON lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content readable by authenticated" ON exercises FOR SELECT TO authenticated USING (true);

-- User tables: users can only access their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own data" ON users FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users own settings" ON user_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users own progress" ON user_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users own SRS" ON srs_cards FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_letters_updated BEFORE UPDATE ON letters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_diacritics_updated BEFORE UPDATE ON diacritics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_roots_updated BEFORE UPDATE ON roots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_words_updated BEFORE UPDATE ON words FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_word_variants_updated BEFORE UPDATE ON word_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sentences_updated BEFORE UPDATE ON sentences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_exercises_updated BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_settings_updated BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_progress_updated BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_srs_cards_updated BEFORE UPDATE ON srs_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ════════════════════════════════════════════════════════════
-- SEED DATA
-- ════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- LETTERS (28)
-- ────────────────────────────────────────────────────────────

INSERT INTO letters (sort_order, name_ar, name_fr, transliteration, ipa, form_isolated, form_initial, form_medial, form_final, connects_left, connects_right, is_sun_letter, articulation_group, articulation_fr, pedagogy_notes) VALUES
(1,  'أَلِف',  'Alif',   'ā / a',  '/ʔ/, /aː/',  'ا', 'ا',  'ـا', 'ـا', false, true,  false, 'glottal',    'Glottale — coup de glotte ou voyelle longue', 'Première lettre. Support de la hamza et voyelle longue. Ne se connecte jamais à la lettre suivante.'),
(2,  'بَاء',   'Ba',     'b',      '/b/',         'ب', 'بـ', 'ـبـ', 'ـب', true,  true,  false, 'labial',     'Labiale — comme le B français', 'Identique au B français. Un point sous la ligne de base. Première lettre à enseigner après Alif.'),
(3,  'تَاء',   'Ta',     't',      '/t/',         'ت', 'تـ', 'ـتـ', 'ـت', true,  true,  true,  'dental',     'Dentale — comme le T français', 'Même forme que Ba mais avec deux points au-dessus. Trio ba/ta/tha : 1 point dessous, 2 dessus, 3 dessus.'),
(4,  'ثَاء',   'Tha',    'th',     '/θ/',         'ث', 'ثـ', 'ـثـ', 'ـث', true,  true,  true,  'dental',     'Interdentale — comme le TH anglais de think', 'Son inexistant en français. Pointer vers le TH anglais. 3 points au-dessus.'),
(5,  'جِيم',   'Jim',    'j',      '/d͡ʒ/',       'ج', 'جـ', 'ـجـ', 'ـج', true,  true,  false, 'palatal',    'Palatale — comme le J français ou DJ', 'Prononciation variable selon les dialectes : J en MSA/Maghreb, G dur en Égypte, DJ au Moyen-Orient.'),
(6,  'حَاء',   'Ha',     'ḥ',      '/ħ/',         'ح', 'حـ', 'ـحـ', 'ـح', true,  true,  false, 'pharyngeal', 'Pharyngale — souffle profond de la gorge', 'Son difficile pour les francophones. Même forme que Jim/Kha mais sans point.'),
(7,  'خَاء',   'Kha',    'kh',     '/x/',         'خ', 'خـ', 'ـخـ', 'ـخ', true,  true,  false, 'velar',      'Vélo-uvulaire — comme la jota espagnole', 'Son grattant du fond de la gorge. Point au-dessus de la coupe.'),
(8,  'دَال',   'Dal',    'd',      '/d/',         'د', 'د',  'ـد', 'ـد', false, true,  true,  'dental',     'Dentale — comme le D français', 'Ne se connecte pas à gauche. Son identique au D français.'),
(9,  'ذَال',   'Dhal',   'dh',     '/ð/',         'ذ', 'ذ',  'ـذ', 'ـذ', false, true,  true,  'dental',     'Interdentale — comme le TH anglais de the', 'Même forme que Dal avec un point. TH voisé. Ne se connecte pas à gauche.'),
(10, 'رَاء',   'Ra',     'r',      '/r/',         'ر', 'ر',  'ـر', 'ـر', false, true,  true,  'alveolar',   'Alvéolaire — R roulé, jamais le R français', 'R roulé. Ne se connecte pas à gauche. Similaire à Zay visuellement.'),
(11, 'زَايِ',  'Zay',    'z',      '/z/',         'ز', 'ز',  'ـز', 'ـز', false, true,  true,  'alveolar',   'Alvéolaire — comme le Z français', 'Même forme que Ra avec un point au-dessus. Ne se connecte pas à gauche.'),
(12, 'سِين',   'Sin',    's',      '/s/',         'س', 'سـ', 'ـسـ', 'ـس', true,  true,  true,  'alveolar',   'Alvéolaire — comme le S français', 'Trois dents en ligne. Distinction cruciale avec Sad (emphatique). Piège classique : صيام vs سيام.'),
(13, 'شِين',   'Shin',   'sh',     '/ʃ/',         'ش', 'شـ', 'ـشـ', 'ـش', true,  true,  true,  'palatal',    'Palato-alvéolaire — comme le CH français', 'Même forme que Sin avec trois points au-dessus. Son familier (CH).'),
(14, 'صَاد',   'Sad',    'ṣ',      '/sˤ/',        'ص', 'صـ', 'ـصـ', 'ـص', true,  true,  true,  'emphatic',   'Emphatique — S lourd, langue épaissie', 'Première emphatique. Exercice audio comparatif avec Sin indispensable.'),
(15, 'ضَاد',   'Dad',    'ḍ',      '/dˤ/',        'ض', 'ضـ', 'ـضـ', 'ـض', true,  true,  true,  'emphatic',   'Emphatique — D lourd, unique à l''arabe', 'Lettre emblématique (لغة الضاد). Même forme que Sad avec un point.'),
(16, 'طَاء',   'Taa',    'ṭ',      '/tˤ/',        'ط', 'طـ', 'ـطـ', 'ـط', true,  true,  true,  'emphatic',   'Emphatique — T lourd, langue épaissie', 'Forme de boucle verticale. Distinction avec Ta standard fondamentale.'),
(17, 'ظَاء',   'Dhaa',   'ẓ',      '/ðˤ/',        'ظ', 'ظـ', 'ـظـ', 'ـظ', true,  true,  true,  'emphatic',   'Emphatique — version emphatique de Dhal', 'Même forme que Taa avec un point. Dernière des quatre emphatiques.'),
(18, 'عَيْن',  'Ayn',    'ʿ',      '/ʕ/',         'ع', 'عـ', 'ـعـ', 'ـع', true,  true,  false, 'pharyngeal', 'Pharyngale — contraction de la gorge', 'Un des sons les plus difficiles. Aucun équivalent en français. Forme en « 3 inversé ».'),
(19, 'غَيْن',  'Ghayn',  'gh',     '/ɣ/',         'غ', 'غـ', 'ـغـ', 'ـغ', true,  true,  false, 'velar',      'Vélo-uvulaire — proche du R grasseyé parisien', 'Même forme que Ayn avec un point. Accessible aux francophones via le R grasseyé.'),
(20, 'فَاء',   'Fa',     'f',      '/f/',         'ف', 'فـ', 'ـفـ', 'ـف', true,  true,  false, 'labial',     'Labio-dentale — comme le F français', 'Son identique au F français. Un point au-dessus. Similaire à Qaf (deux points).'),
(21, 'قَاف',   'Qaf',    'q',      '/q/',         'ق', 'قـ', 'ـقـ', 'ـق', true,  true,  false, 'uvular',     'Uvulaire — K prononcé très en arrière', 'Deux points au-dessus. Distinction Qaf/Kaf importante (uvulaire vs vélaire).'),
(22, 'كَاف',   'Kaf',    'k',      '/k/',         'ك', 'كـ', 'ـكـ', 'ـك', true,  true,  false, 'velar',      'Vélaire — comme le K français', 'Son identique au K français. Petit trait intérieur distinctif.'),
(23, 'لَام',   'Lam',    'l',      '/l/',         'ل', 'لـ', 'ـلـ', 'ـل', true,  true,  true,  'alveolar',   'Alvéolaire — comme le L français', 'Son identique au L français. Ligature spéciale avec Alif : لا.'),
(24, 'مِيم',   'Mim',    'm',      '/m/',         'م', 'مـ', 'ـمـ', 'ـم', true,  true,  false, 'labial',     'Labiale — comme le M français', 'Son identique au M français. Forme de boucle fermée avec queue.'),
(25, 'نُون',   'Nun',    'n',      '/n/',         'ن', 'نـ', 'ـنـ', 'ـن', true,  true,  true,  'alveolar',   'Alvéolaire — comme le N français', 'Son identique au N français. Un point au-dessus. En médiane, ressemble à Ba/Ta/Tha.'),
(26, 'هَاء',   'Ha''',   'h',      '/h/',         'ه', 'هـ', 'ـهـ', 'ـه', true,  true,  false, 'glottal',    'Glottale — comme le H anglais aspiré', 'H léger et aspiré, très différent de Ha (ح). La forme change beaucoup selon la position.'),
(27, 'وَاو',   'Waw',    'w / ū',  '/w/, /uː/',  'و', 'و',  'ـو', 'ـو', false, true,  false, 'labial',     'Labio-vélaire — W anglais ou voyelle longue /uː/', 'Double rôle : consonne (w) ou voyelle longue (ou). Ne se connecte pas à gauche.'),
(28, 'يَاء',   'Ya',     'y / ī',  '/j/, /iː/',  'ي', 'يـ', 'ـيـ', 'ـي', true,  true,  false, 'palatal',    'Palatale — Y français ou voyelle longue /iː/', 'Double rôle : consonne (y) ou voyelle longue (ii). Deux points sous la ligne.');

-- ────────────────────────────────────────────────────────────
-- DIACRITICS (8)
-- ────────────────────────────────────────────────────────────

INSERT INTO diacritics (sort_order, name_ar, name_fr, symbol, sound_effect, category, position) VALUES
(1, 'فَتْحَة',     'Fatha',     'َ', 'Voyelle courte /a/ — comme le a de chat',                              'vowel_short', 'au-dessus de la lettre'),
(2, 'ضَمَّة',      'Damma',     'ُ', 'Voyelle courte /u/ — comme le ou de cou',                              'vowel_short', 'au-dessus de la lettre'),
(3, 'كَسْرَة',     'Kasra',     'ِ', 'Voyelle courte /i/ — comme le i de lit',                               'vowel_short', 'en-dessous de la lettre'),
(4, 'فَتْحَتَان',  'Fathatan',  'ً', 'Tanwin en /an/ — marque l''indétermination au cas accusatif',          'tanwin',      'au-dessus de la lettre'),
(5, 'ضَمَّتَان',   'Dammatan',  'ٌ', 'Tanwin en /un/ — marque l''indétermination au cas nominatif',          'tanwin',      'au-dessus de la lettre'),
(6, 'كَسْرَتَان',  'Kasratan',  'ٍ', 'Tanwin en /in/ — marque l''indétermination au cas génitif',            'tanwin',      'en-dessous de la lettre'),
(7, 'سُكُون',      'Soukoun',   'ْ', 'Absence de voyelle — la lettre est muette (consonne seule)',           'other',       'au-dessus de la lettre'),
(8, 'شَدَّة',      'Chadda',    'ّ', 'Gémination — la lettre est doublée / insistée',                        'other',       'au-dessus de la lettre');

-- ────────────────────────────────────────────────────────────
-- MODULES (MVP: 4 modules)
-- ────────────────────────────────────────────────────────────

INSERT INTO modules (id, title_fr, title_ar, description_fr, sort_order, variant) VALUES
('a1000000-0000-0000-0000-000000000001', 'L''alphabet vivant',          'الأبجدية الحية',       'Découvre les 28 lettres arabes, leurs formes et leurs sons.',      1, 'msa'),
('a1000000-0000-0000-0000-000000000002', 'Les harakats démystifiés',    'الحركات بلا غموض',     'Maîtrise les voyelles courtes, le tanwin, le soukoun et la chadda.', 2, 'msa'),
('a1000000-0000-0000-0000-000000000003', 'Lire ses premiers mots',      'إقرأ كلماتك الأولى',  'Décode tes premiers mots arabes et découvre le système de racines.', 3, 'msa'),
('a1000000-0000-0000-0000-000000000004', 'Construire du sens',          'بناء المعنى',          'Forme tes premières phrases et commence à communiquer.',            4, 'msa');

-- ────────────────────────────────────────────────────────────
-- SAMPLE ROOTS (first 6 for MVP Module 3)
-- ────────────────────────────────────────────────────────────

INSERT INTO roots (id, consonants, transliteration, core_meaning_fr, core_meaning_ar, frequency_rank) VALUES
('b1000000-0000-0000-0000-000000000001', '{ك,ت,ب}', 'k-t-b', 'écrire',     'كَتَبَ',  1),
('b1000000-0000-0000-0000-000000000002', '{ع,ل,م}', 'ʿ-l-m', 'savoir',     'عَلِمَ',  2),
('b1000000-0000-0000-0000-000000000003', '{ق,ر,أ}', 'q-r-ʾ', 'lire',       'قَرَأَ',  3),
('b1000000-0000-0000-0000-000000000004', '{د,ر,س}', 'd-r-s', 'étudier',    'دَرَسَ',  4),
('b1000000-0000-0000-0000-000000000005', '{ف,ت,ح}', 'f-t-ḥ', 'ouvrir',     'فَتَحَ',  5),
('b1000000-0000-0000-0000-000000000006', '{ج,ل,س}', 'j-l-s', 's''asseoir', 'جَلَسَ',  6);

-- ────────────────────────────────────────────────────────────
-- SAMPLE WORDS (from root k-t-b)
-- ────────────────────────────────────────────────────────────

INSERT INTO words (id, root_id, arabic, arabic_vocalized, transliteration, ipa, pattern, pos, frequency_rank, gender) VALUES
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'كتاب',  'كِتَاب',   'kitāb',     '/ki.taːb/',   'fiʿāl',   'noun', 1, 'masculine'),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'كاتب',  'كَاتِب',   'kātib',     '/kaː.tib/',   'fāʿil',   'noun', 2, 'masculine'),
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'مكتبة', 'مَكْتَبَة', 'maktaba',   '/mak.ta.ba/', 'mafʿala', 'noun', 3, 'feminine'),
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'مكتوب', 'مَكْتُوب', 'maktūb',    '/mak.tuːb/',  'mafʿūl',  'noun', 4, 'masculine'),
('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'كتب',   'كَتَبَ',   'kataba',    '/ka.ta.ba/',  'faʿala',  'verb', 5, 'na'),
('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'يكتب',  'يَكْتُبُ', 'yaktub(u)', '/jak.tu.bu/', 'yafʿul',  'verb', 6, 'na');

-- MSA variants for sample words
INSERT INTO word_variants (word_id, variant, arabic, arabic_vocalized, transliteration, notes_fr) VALUES
('c1000000-0000-0000-0000-000000000001', 'msa', 'كتاب',  'كِتَاب',   'kitāb',     'Forme MSA standard'),
('c1000000-0000-0000-0000-000000000002', 'msa', 'كاتب',  'كَاتِب',   'kātib',     'Forme MSA standard'),
('c1000000-0000-0000-0000-000000000003', 'msa', 'مكتبة', 'مَكْتَبَة', 'maktaba',   'Forme MSA standard'),
('c1000000-0000-0000-0000-000000000004', 'msa', 'مكتوب', 'مَكْتُوب', 'maktūb',    'Forme MSA standard — aussi utilisé pour « destin »'),
('c1000000-0000-0000-0000-000000000005', 'msa', 'كتب',   'كَتَبَ',   'kataba',    'Passé, 3ème personne masculin singulier'),
('c1000000-0000-0000-0000-000000000006', 'msa', 'يكتب',  'يَكْتُبُ', 'yaktub(u)', 'Présent, 3ème personne masculin singulier');


-- ════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════
