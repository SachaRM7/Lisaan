-- Ouvrir la lecture du contenu pédagogique aux utilisateurs anonymes
-- (lettres, modules, leçons sont du contenu public — pas besoin d'auth pour lire)

CREATE POLICY "Content readable by anon" ON letters FOR SELECT TO anon USING (true);
CREATE POLICY "Content readable by anon" ON modules FOR SELECT TO anon USING (true);
CREATE POLICY "Content readable by anon" ON lessons FOR SELECT TO anon USING (true);
