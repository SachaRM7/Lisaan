-- ============================================================
-- VÉRIFICATION ÉTAPE 18 — Ce qui doit exister après execution
-- ============================================================

-- 1. Sourates coraniques É18 : 103, 105, 108, 109, 110, 111 (doit être 115+ entrées)
SELECT '1. Quran E18' AS check,
  CASE WHEN COUNT(*) >= 115 THEN 'OK — ' || COUNT(*) || ' entries coraniques E18'
       ELSE 'MANQUE — ' || COUNT(*) || ' entries (attendu 115+)'
  END AS result
FROM quran_entries
WHERE surah_number IN (103, 105, 108, 109, 110, 111);

-- 2. TOTAL quran_entries (E17 + E18 combinés — doit être 159+)
SELECT '2. Quran total' AS check,
  CASE WHEN COUNT(*) >= 159 THEN 'OK — ' || COUNT(*) || ' total (E17+E18)'
       ELSE 'MANQUE — ' || COUNT(*) || ' total (attendu 159+)'
  END AS result
FROM quran_entries;

-- 3. Module Egyptian
SELECT '3. Module Egyptian' AS check,
  CASE WHEN COUNT(*) = 1 THEN 'OK — mod-egyptian trouve'
       ELSE 'MANQUE — ' || COUNT(*) || ' module(s)'
  END AS result
FROM modules
WHERE id = 'mod-egyptian';

-- 4. 3 lecons Egyptian
SELECT '4. Lessons Egyptian' AS check,
  CASE WHEN COUNT(*) = 3 THEN 'OK — 3 lecons Egyptian'
       ELSE 'MANQUE — ' || COUNT(*) || ' lecon(s)'
  END AS result
FROM lessons
WHERE module_id = 'mod-egyptian';

-- 5. Lessons Quran E18 (5 lecons dans mod-quran, identifiees par titre)
SELECT '5. Lessons Quran E18' AS check,
  CASE WHEN COUNT(*) >= 5 THEN 'OK — ' || COUNT(*) || ' lecons Quran E18'
       ELSE 'MANQUE — ' || COUNT(*) || ' lecon(s)'
  END AS result
FROM lessons
WHERE module_id = 'mod-quran'
  AND title_fr IN ('Al-Asr — Le Temps', 'Al-Kawthar — L''Abondance', 'Al-Kafiroun — La Liberté', 'An-Nasr & Al-Masad', 'Al-Fil — L''Elephant');

-- 6. word_variants Egyptian (doit etre ~25)
SELECT '6. Word variants Egyptian' AS check,
  CASE WHEN COUNT(*) >= 23 THEN 'OK — ' || COUNT(*) || ' variants Egyptian'
       ELSE 'MANQUE — ' || COUNT(*) || ' variant(s)'
  END AS result
FROM word_variants
WHERE variant = 'egyptian';

-- 7. TOTAL word_variants (dialectes : darija + egyptian + levantine + khaliji)
SELECT '7. Word variants total' AS check,
  CASE WHEN COUNT(*) >= 110 THEN 'OK — ' || COUNT(*) || ' total (tous dialectes)'
       ELSE 'MANQUE — ' || COUNT(*) || ' total'
  END AS result
FROM word_variants
WHERE variant IN ('darija', 'egyptian', 'levantine', 'khaliji');

-- 8. Badges total (doit etre 20+)
SELECT '8. Badges' AS check,
  CASE WHEN COUNT(*) >= 20 THEN 'OK — ' || COUNT(*) || ' badges dans la table'
       ELSE 'PARTIEL — ' || COUNT(*) || ' badges (attendu 20+)'
  END AS result
FROM badges;

-- 9. Badges streak
SELECT '9. Badges streak' AS check,
  CASE WHEN COUNT(*) = 4 THEN 'OK — streak_3/7/30/100'
       ELSE 'PARTIEL — ' || COUNT(*) || ' badge(s) streak'
  END AS result
FROM badges
WHERE condition_type = 'streak_days';

-- 10. Badges coran
SELECT '10. Badges quran' AS check,
  CASE WHEN COUNT(*) >= 6 THEN 'OK — ' || COUNT(*) || ' badges quran/dialectes'
       ELSE 'PARTIEL — ' || COUNT(*) || ' badge(s)'
  END AS result
FROM badges
WHERE category IN ('quran', 'dialect');
