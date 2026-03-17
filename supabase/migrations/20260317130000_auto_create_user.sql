-- ============================================================
-- LISAAN — Auto-create public.users on auth sign-up
-- ============================================================
-- Quand un utilisateur (y compris anonyme) se connecte,
-- Supabase crée une ligne dans auth.users mais PAS dans
-- public.users. Ce trigger corrige ça automatiquement.

-- ── Trigger function ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ── Trigger on auth.users ─────────────────────────────────────

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Backfill des utilisateurs existants ───────────────────────
-- Les utilisateurs anonymes déjà connectés n'ont pas encore
-- de ligne dans public.users — on les insère maintenant.

INSERT INTO public.users (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;
