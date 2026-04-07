-- ============================================================
-- ÉTAPE 19 — Seed quran_entries : sourate 94 (Al-Inshirah)
-- ============================================================

INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

-- V1 : أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ
('qe-94-1-1', 94, 'الشرح', 'Al-Inshirah', 1, 1, 'ألم', 'أَلَمْ', 'alam', 'N''avons-Nous pas', NULL, 250),
('qe-94-1-2', 94, 'الشرح', 'Al-Inshirah', 1, 2, 'نشرح', 'نَشْرَحْ', 'nashraḥ', 'ouvert / dilaté', NULL, 251),
('qe-94-1-3', 94, 'الشرح', 'Al-Inshirah', 1, 3, 'لك', 'لَكَ', 'laka', 'pour toi', NULL, 252),
('qe-94-1-4', 94, 'الشرح', 'Al-Inshirah', 1, 4, 'صدرك', 'صَدْرَكَ', 'ṣadraka', 'ta poitrine', 'Sad emphatique', 253),

-- V2 : وَوَضَعْنَا عَنكَ وِزْرَكَ
('qe-94-2-1', 94, 'الشرح', 'Al-Inshirah', 2, 1, 'وضعنا', 'وَوَضَعْنَا', 'wa-waḍaʕnā', 'Et Nous avons déposé de toi', NULL, 254),
('qe-94-2-2', 94, 'الشرح', 'Al-Inshirah', 2, 2, 'عنك', 'عَنكَ', 'ʕanka', 'loin de toi', 'Ayn pharyngal', 255),
('qe-94-2-3', 94, 'الشرح', 'Al-Inshirah', 2, 3, 'وزرك', 'وِزْرَكَ', 'wizraka', 'ton fardeau', NULL, 256),

-- V3 : الَّذِي أَنقَضَ ظَهْرَكَ
('qe-94-3-1', 94, 'الشرح', 'Al-Inshirah', 3, 1, 'الذي', 'الَّذِي', 'alladhī', 'qui', NULL, 257),
('qe-94-3-2', 94, 'الشرح', 'Al-Inshirah', 3, 2, 'أنقض', 'أَنقَضَ', 'anqaḍa', 'a brisé / accablé', NULL, 258),
('qe-94-3-3', 94, 'الشرح', 'Al-Inshirah', 3, 3, 'ظهرك', 'ظَهْرَكَ', 'ẓahraka', 'ton dos', 'Dha emphatique', 259),

-- V4 : وَرَفَعْنَا لَكَ ذِكْرَكَ
('qe-94-4-1', 94, 'الشرح', 'Al-Inshirah', 4, 1, 'ورفعنا', 'وَرَفَعْنَا', 'wa-rafaʕnā', 'Et Nous avons élevé', 'Ayn pharyngal', 260),
('qe-94-4-2', 94, 'الشرح', 'Al-Inshirah', 4, 2, 'لك', 'لَكَ', 'laka', 'pour toi', NULL, 261),
('qe-94-4-3', 94, 'الشرح', 'Al-Inshirah', 4, 3, 'ذكرك', 'ذِكْرَكَ', 'dhikraka', 'ta renommée', NULL, 262),

-- V5 : فَإِنَّ مَعَ الْعُسْرِ يُسْرًا
('qe-94-5-1', 94, 'الشرح', 'Al-Inshirah', 5, 1, 'فإن', 'فَإِنَّ', 'fa-inna', 'Certes', 'Chadda sur Nun', 263),
('qe-94-5-2', 94, 'الشرح', 'Al-Inshirah', 5, 2, 'مع', 'مَعَ', 'maʕa', 'avec', NULL, 264),
('qe-94-5-3', 94, 'الشرح', 'Al-Inshirah', 5, 3, 'العسر', 'الْعُسْرِ', 'al-ʕusri', 'la difficulté', 'Ayn pharyngal', 265),
('qe-94-5-4', 94, 'الشرح', 'Al-Inshirah', 5, 4, 'يسرا', 'يُسْرًا', 'yusran', 'une facilité', 'Tanwin + Ya', 266),

-- V6 : إِنَّ مَعَ الْعُسْرِ يُسْرًا (répétition rhétorique)
('qe-94-6-1', 94, 'الشرح', 'Al-Inshirah', 6, 1, 'إن', 'إِنَّ', 'inna', 'Certes', NULL, 267),
('qe-94-6-2', 94, 'الشرح', 'Al-Inshirah', 6, 2, 'مع', 'مَعَ', 'maʕa', 'avec', NULL, 268),
('qe-94-6-3', 94, 'الشرح', 'Al-Inshirah', 6, 3, 'العسر', 'الْعُسْرِ', 'al-ʕusri', 'la difficulté (même)', 'Répétition : insistance coranique', 269),
('qe-94-6-4', 94, 'الشرح', 'Al-Inshirah', 6, 4, 'يسرا', 'يُسْرًا', 'yusran', 'une (autre) facilité', 'Tanwin : indéfini — facilité différente', 270),

-- V7 : فَإِذَا فَرَغْتَ فَانصَبْ
('qe-94-7-1', 94, 'الشرح', 'Al-Inshirah', 7, 1, 'فإذا', 'فَإِذَا', 'fa-idhā', 'Donc lorsque', NULL, 271),
('qe-94-7-2', 94, 'الشرح', 'Al-Inshirah', 7, 2, 'فرغت', 'فَرَغْتَ', 'faraghta', 'tu as terminé', NULL, 272),
('qe-94-7-3', 94, 'الشرح', 'Al-Inshirah', 7, 3, 'فانصب', 'فَانصَبْ', 'fanṣab', 'continue à te consacrer !', 'Sad emphatique + Soukoun', 273),

-- V8 : وَإِلَىٰ رَبِّكَ فَارْغَبْ
('qe-94-8-1', 94, 'الشرح', 'Al-Inshirah', 8, 1, 'وإلى', 'وَإِلَىٰ', 'wa-ilā', 'Et vers', NULL, 274),
('qe-94-8-2', 94, 'الشرح', 'Al-Inshirah', 8, 2, 'ربك', 'رَبِّكَ', 'rabbika', 'ton Seigneur', NULL, 275),
('qe-94-8-3', 94, 'الشرح', 'Al-Inshirah', 8, 3, 'فارغب', 'فَارْغَبْ', 'farghab', 'aspire ardemment !', 'Ra emphatique + Ghayn', 276)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÉTAPE 19 — Seed quran_entries : sourate 97 (Al-Qadr)
-- ============================================================

INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

-- V1 : إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ
('qe-97-1-1', 97, 'القدر', 'Al-Qadr', 1, 1, 'إنا', 'إِنَّا', 'innā', 'Nous avons certes', 'Chadda sur Nun', 290),
('qe-97-1-2', 97, 'القدر', 'Al-Qadr', 1, 2, 'أنزلناه', 'أَنزَلْنَاهُ', 'anzalnāhu', 'fait descendre (le Coran)', NULL, 291),
('qe-97-1-3', 97, 'القدر', 'Al-Qadr', 1, 3, 'في', 'فِي', 'fī', 'durant', NULL, 292),
('qe-97-1-4', 97, 'القدر', 'Al-Qadr', 1, 4, 'ليلة', 'لَيْلَةِ', 'laylati', 'la nuit de', NULL, 293),
('qe-97-1-5', 97, 'القدر', 'Al-Qadr', 1, 5, 'القدر', 'الْقَدْرِ', 'al-qadri', 'la Destinée (Al-Qadr)', 'Qaf + Dhad emphatique', 294),

-- V2 : وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ
('qe-97-2-1', 97, 'القدر', 'Al-Qadr', 2, 1, 'وما', 'وَمَا', 'wa-mā', 'Et qui te dira', NULL, 295),
('qe-97-2-2', 97, 'القدر', 'Al-Qadr', 2, 2, 'أدراك', 'أَدْرَاكَ', 'adrāka', 'ce qu''est', NULL, 296),
('qe-97-2-3', 97, 'القدر', 'Al-Qadr', 2, 3, 'ما', 'مَا', 'mā', 'qu''est donc', NULL, 297),
('qe-97-2-4', 97, 'القدر', 'Al-Qadr', 2, 4, 'ليلة', 'لَيْلَةُ', 'laylatu', 'la nuit de', NULL, 298),
('qe-97-2-5', 97, 'القدر', 'Al-Qadr', 2, 5, 'القدر', 'الْقَدْرِ', 'al-qadri', 'la Destinée', NULL, 299),

-- V3 : لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ
('qe-97-3-1', 97, 'القدر', 'Al-Qadr', 3, 1, 'ليلة', 'لَيْلَةُ', 'laylatu', 'La nuit de la Destinée', NULL, 300),
('qe-97-3-2', 97, 'القدر', 'Al-Qadr', 3, 2, 'القدر', 'الْقَدْرِ', 'al-qadri', '(Al-Qadr)', NULL, 301),
('qe-97-3-3', 97, 'القدر', 'Al-Qadr', 3, 3, 'خير', 'خَيْرٌ', 'ḵayrun', 'est meilleure', NULL, 302),
('qe-97-3-4', 97, 'القدر', 'Al-Qadr', 3, 4, 'من', 'مِّنْ', 'min', 'que', 'Chadda sur Mim — fusion nasale', 303),
('qe-97-3-5', 97, 'القدر', 'Al-Qadr', 3, 5, 'ألف', 'أَلْفِ', 'alfi', 'mille', NULL, 304),
('qe-97-3-6', 97, 'القدر', 'Al-Qadr', 3, 6, 'شهر', 'شَهْرٍ', 'shahrin', 'mois', 'Tanwin', 305),

-- V4 : تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ
('qe-97-4-1', 97, 'القدر', 'Al-Qadr', 4, 1, 'تنزل', 'تَنَزَّلُ', 'tanazzalu', 'Descendent', 'Chadda sur Zay — intensité du mouvement', 306),
('qe-97-4-2', 97, 'القدر', 'Al-Qadr', 4, 2, 'الملائكة', 'الْمَلَائِكَةُ', 'al-malāʼikatu', 'les Anges', NULL, 307),
('qe-97-4-3', 97, 'القدر', 'Al-Qadr', 4, 3, 'والروح', 'وَالرُّوحُ', 'war-rūḥu', 'et l''Esprit (Jibril)', 'Ra + Chadda + Waw de madd', 308),
('qe-97-4-4', 97, 'القدر', 'Al-Qadr', 4, 4, 'فيها', 'فِيهَا', 'fīhā', 'durant cette nuit', NULL, 309),
('qe-97-4-5', 97, 'القدر', 'Al-Qadr', 4, 5, 'بإذن', 'بِإِذْنِ', 'bi-idhni', 'avec la permission de', NULL, 310),
('qe-97-4-6', 97, 'القدر', 'Al-Qadr', 4, 6, 'ربهم', 'رَبِّهِم', 'rabbihim', 'leur Seigneur', NULL, 311),
('qe-97-4-7', 97, 'القدر', 'Al-Qadr', 4, 7, 'من', 'مِّن', 'min', 'pour', NULL, 312),
('qe-97-4-8', 97, 'القدر', 'Al-Qadr', 4, 8, 'كل', 'كُلِّ', 'kulli', 'tout', NULL, 313),
('qe-97-4-9', 97, 'القدر', 'Al-Qadr', 4, 9, 'أمر', 'أَمْرٍ', 'amrin', 'décret / ordre', 'Tanwin', 314),

-- V5 : سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ
('qe-97-5-1', 97, 'القدر', 'Al-Qadr', 5, 1, 'سلام', 'سَلَامٌ', 'salāmun', 'Paix !', 'Tanwin + Madd Alif — beauté de la prolongation', 315),
('qe-97-5-2', 97, 'القدر', 'Al-Qadr', 5, 2, 'هي', 'هِيَ', 'hiya', 'elle est', NULL, 316),
('qe-97-5-3', 97, 'القدر', 'Al-Qadr', 5, 3, 'حتى', 'حَتَّىٰ', 'ḥattā', 'jusqu''à', 'Ha pharyngal + Chadda', 317),
('qe-97-5-4', 97, 'القدر', 'Al-Qadr', 5, 4, 'مطلع', 'مَطْلَعِ', 'maṭlaʕi', 'l''apparition de', 'Ta emphatique', 318),
('qe-97-5-5', 97, 'القدر', 'Al-Qadr', 5, 5, 'الفجر', 'الْفَجْرِ', 'al-fajri', 'l''aube', NULL, 319)

ON CONFLICT (id) DO NOTHING;
