-- Seed 7 leçons du Module 1 : L'alphabet vivant

INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Alif, Ba, Ta, Tha — les fondations',
  'أ ب ت ث',
  'Tes 4 premières lettres. Ba, Ta et Tha partagent la même forme — seuls les points changent.',
  1, 20, 8
);

INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Jim, Ha, Kha — la coupe',
  'ج ح خ',
  'Trois lettres en forme de coupe. Le point change de position à chaque fois.',
  2, 20, 8
);

INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Dal, Dhal, Ra, Zay — celles qui ne s''attachent pas',
  'د ذ ر ز',
  'Ces 4 lettres ne se connectent jamais à la lettre suivante. Deux paires de jumeaux à distinguer.',
  3, 20, 8
);

INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Sin, Shin, Sad, Dad — dents et sons profonds',
  'س ش ص ض',
  'Sin et Shin ont des dents. Sad et Dad sont tes premières emphatiques — des sons uniques à l''arabe.',
  4, 25, 10
);

INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Taa, Dhaa, Ayn, Ghayn — les puissantes',
  'ط ظ ع غ',
  'Deux emphatiques de plus, puis Ayn — le son le plus emblématique de l''arabe.',
  5, 25, 10
);

INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Fa, Qaf, Kaf, Lam — vers la fluidité',
  'ف ق ك ل',
  'Fa et Qaf se ressemblent — attention aux points. Lam forme une ligature spéciale avec Alif (لا).',
  6, 20, 8
);

INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM modules WHERE title_fr = 'L''alphabet vivant' LIMIT 1),
  'Mim, Nun, Ha'', Waw, Ya — la ligne d''arrivée',
  'م ن ه و ي',
  'Les 5 dernières lettres. Après cette leçon, tu connais tout l''alphabet arabe.',
  7, 30, 12
);
