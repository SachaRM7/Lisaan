-- ============================================================
-- LISAAN — Fix Security & Performance Issues
-- ============================================================

-- ── 1. Enable RLS on confusion_pairs ────────────────────────
-- Table was public without RLS — accessible sans restriction

ALTER TABLE confusion_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content readable by authenticated" ON confusion_pairs
  FOR SELECT TO authenticated USING (true);

-- ── 2. Fix update_updated_at function (mutable search_path) ─
-- La fonction doit avoir un search_path fixe pour éviter
-- une injection via search_path modifiable.

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ── 3. Optimiser les politiques RLS (performance) ───────────
-- Remplacer auth.uid() par (select auth.uid()) pour que
-- la valeur soit calculée une seule fois par requête
-- (index scan au lieu de re-évaluation ligne par ligne).

-- users
DROP POLICY IF EXISTS "Users own data" ON users;
CREATE POLICY "Users own data" ON users
  FOR ALL TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- user_settings
DROP POLICY IF EXISTS "Users own settings" ON user_settings;
CREATE POLICY "Users own settings" ON user_settings
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- user_progress
DROP POLICY IF EXISTS "Users own progress" ON user_progress;
CREATE POLICY "Users own progress" ON user_progress
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- srs_cards
DROP POLICY IF EXISTS "Users own SRS" ON srs_cards;
CREATE POLICY "Users own SRS" ON srs_cards
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
