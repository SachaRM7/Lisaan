-- ============================================================
-- ÉTAPE 19 — Migration SQL : beta_invites + beta_feedback
-- À exécuter dans le SQL Editor Supabase Cloud
-- ============================================================

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
  ('LIS-I1J2'), ('LIS-K3L4'), ('LIS-M5N6'), ('LIS-O7P8'), ('LIS-Q9R0')
ON CONFLICT (code) DO NOTHING;

-- Table beta_feedback (si pas encore créée)
CREATE TABLE IF NOT EXISTS beta_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  rating      INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Table user_profiles (si pas encore créée)
-- Cette table étend auth.users avec les données métier de l'app
CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_beta_tester   BOOLEAN DEFAULT FALSE,
  last_active_at   TIMESTAMPTZ DEFAULT NOW(),
  current_streak   INTEGER DEFAULT 0,
  total_xp        INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- last_active_at dans user_profiles (si absent — coexist with above if table existed before)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- is_beta_tester dans user_profiles (si absent)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT FALSE;

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
  COUNT(*)                                                            AS total_testers,
  COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '7 days')  AS active_j7,
  COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '30 days') AS active_j30,
  AVG(current_streak)                                                 AS avg_streak,
  MAX(current_streak)                                                 AS max_streak
FROM user_profiles
WHERE is_beta_tester = TRUE;
