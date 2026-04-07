-- ============================================================
-- ÉTAPE 19 — Seed quran_entries : sourate 93 (Adh-Duha)
-- ============================================================

INSERT INTO quran_entries (id, surah_number, surah_name_ar, surah_name_fr, ayah_number, word_position, arabic, arabic_vocalized, transliteration, translation_fr, tajwid_notes, sort_order) VALUES

-- V1 : وَالضُّحَىٰ
('qe-93-1-1', 93, 'الضحى', 'Adh-Duha', 1, 1, 'والضحى', 'وَالضُّحَىٰ', 'waḍ-ḍuḥā', 'Par le matin lumineux !', 'Waw serment + Dhad emphatique + Chadda', 200),

-- V2 : وَاللَّيْلِ إِذَا سَجَىٰ
('qe-93-2-1', 93, 'الضحى', 'Adh-Duha', 2, 1, 'والليل', 'وَاللَّيْلِ', 'wal-layli', 'Et par la nuit', 'Lam solaire + Chadda', 201),
('qe-93-2-2', 93, 'الضحى', 'Adh-Duha', 2, 2, 'إذا', 'إِذَا', 'idhā', 'quand', NULL, 202),
('qe-93-2-3', 93, 'الضحى', 'Adh-Duha', 2, 3, 'سجى', 'سَجَىٰ', 'sajā', 'elle s''étend (couvre tout)', 'Alif maqsura — prononciation tendue', 203),

-- V3 : مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ
('qe-93-3-1', 93, 'الضحى', 'Adh-Duha', 3, 1, 'ما', 'مَا', 'mā', 'Ton Seigneur ne t''a pas', NULL, 204),
('qe-93-3-2', 93, 'الضحى', 'Adh-Duha', 3, 2, 'ودعك', 'وَدَّعَكَ', 'waddaʕaka', 'abandonné', 'Chadda sur Dal — intensité', 205),
('qe-93-3-3', 93, 'الضحى', 'Adh-Duha', 3, 3, 'ربك', 'رَبُّكَ', 'rabbuka', 'ton Seigneur', 'Chadda sur Ba', 206),
('qe-93-3-4', 93, 'الضحى', 'Adh-Duha', 3, 4, 'وما', 'وَمَا', 'wa-mā', 'et ne t''a pas', NULL, 207),
('qe-93-3-5', 93, 'الضحى', 'Adh-Duha', 3, 5, 'قلى', 'قَلَىٰ', 'qalā', 'haï', 'Alif maqsura', 208),

-- V4 : وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ
('qe-93-4-1', 93, 'الضحى', 'Adh-Duha', 4, 1, 'وللآخرة', 'وَلَلْآخِرَةُ', 'wa-lal-āḵiratu', 'Et certes la vie future', 'Deux Lam — insistance + Hamza de jonction', 209),
('qe-93-4-2', 93, 'الضحى', 'Adh-Duha', 4, 2, 'خير', 'خَيْرٌ', 'ḵayrun', 'est meilleure', 'Tanwin — indétermination', 210),
('qe-93-4-3', 93, 'الضحى', 'Adh-Duha', 4, 3, 'لك', 'لَّكَ', 'laka', 'pour toi', 'Chadda sur Lam — fusion', 211),
('qe-93-4-4', 93, 'الضحى', 'Adh-Duha', 4, 4, 'من', 'مِنَ', 'mina', 'que', NULL, 212),
('qe-93-4-5', 93, 'الضحى', 'Adh-Duha', 4, 5, 'الأولى', 'الْأُولَىٰ', 'al-ūlā', 'la première (vie)', 'Alif maqsura', 213),

-- V5 : وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ
('qe-93-5-1', 93, 'الضحى', 'Adh-Duha', 5, 1, 'ولسوف', 'وَلَسَوْفَ', 'wa-la-sawfa', 'Et ton Seigneur te donnera', 'Lam d''insistance + Sawfa futur lointain', 214),
('qe-93-5-2', 93, 'الضحى', 'Adh-Duha', 5, 2, 'يعطيك', 'يُعْطِيكَ', 'yuʕṭīka', 'Il te donnera', NULL, 215),
('qe-93-5-3', 93, 'الضحى', 'Adh-Duha', 5, 3, 'ربك', 'رَبُّكَ', 'rabbuka', 'ton Seigneur', NULL, 216),
('qe-93-5-4', 93, 'الضحى', 'Adh-Duha', 5, 4, 'فترضى', 'فَتَرْضَىٰ', 'fa-tarḍā', 'et tu seras satisfait', 'Alif maqsura + Sad emphatique', 217),

-- V6 : أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ
('qe-93-6-1', 93, 'الضحى', 'Adh-Duha', 6, 1, 'ألم', 'أَلَمْ', 'alam', 'Ne t''a-t-Il pas trouvé', 'Hamza interrogatif + Lam de négation', 218),
('qe-93-6-2', 93, 'الضحى', 'Adh-Duha', 6, 2, 'يجدك', 'يَجِدْكَ', 'yajidka', 'Il t''a trouvé', NULL, 219),
('qe-93-6-3', 93, 'الضحى', 'Adh-Duha', 6, 3, 'يتيما', 'يَتِيمًا', 'yatīman', 'orphelin', 'Tanwin + Ya = longueur', 220),
('qe-93-6-4', 93, 'الضحى', 'Adh-Duha', 6, 4, 'فآوى', 'فَآوَىٰ', 'fa-āwā', 'et Il t''a recueilli', 'Alif maqsura + Hamza + Madd', 221),

-- V7 : وَوَجَدَكَ ضَالًّا فَهَدَىٰ
('qe-93-7-1', 93, 'الضحى', 'Adh-Duha', 7, 1, 'وجدك', 'وَوَجَدَكَ', 'wa-wajadaka', 'et Il t''a trouvé', NULL, 222),
('qe-93-7-2', 93, 'الضحى', 'Adh-Duha', 7, 2, 'ضالا', 'ضَالًّا', 'ḍāllan', 'égaré', 'Dhad emphatique + Chadda + Tanwin', 223),
('qe-93-7-3', 93, 'الضحى', 'Adh-Duha', 7, 3, 'فهدى', 'فَهَدَىٰ', 'fa-hadā', 'et Il t''a guidé', 'Alif maqsura', 224),

-- V8 : وَوَجَدَكَ عَائِلًا فَأَغْنَىٰ
('qe-93-8-1', 93, 'الضحى', 'Adh-Duha', 8, 1, 'وجدك', 'وَوَجَدَكَ', 'wa-wajadaka', 'Et Il t''a trouvé', NULL, 225),
('qe-93-8-2', 93, 'الضحى', 'Adh-Duha', 8, 2, 'عائلا', 'عَائِلًا', 'ʕāilan', 'pauvre', 'Ayn pharyngal + Tanwin', 226),
('qe-93-8-3', 93, 'الضحى', 'Adh-Duha', 8, 3, 'فأغنى', 'فَأَغْنَىٰ', 'fa-aghnā', 'et Il t''a enrichi', 'Hamza + Alif maqsura', 227),

-- V9 : فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ
('qe-93-9-1', 93, 'الضحى', 'Adh-Duha', 9, 1, 'فأما', 'فَأَمَّا', 'fa-ammā', 'Quant à l''orphelin', 'Chadda sur Mim', 228),
('qe-93-9-2', 93, 'الضحى', 'Adh-Duha', 9, 2, 'اليتيم', 'الْيَتِيمَ', 'al-yatīma', 'l''orphelin', NULL, 229),
('qe-93-9-3', 93, 'الضحى', 'Adh-Duha', 9, 3, 'فلا', 'فَلَا', 'fa-lā', 'ne', NULL, 230),
('qe-93-9-4', 93, 'الضحى', 'Adh-Duha', 9, 4, 'تقهر', 'تَقْهَرْ', 'taqhar', 'l''opprime pas', NULL, 231),

-- V10 : وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ
('qe-93-10-1', 93, 'الضحى', 'Adh-Duha', 10, 1, 'وأما', 'وَأَمَّا', 'wa-ammā', 'Et quant au mendiant', NULL, 232),
('qe-93-10-2', 93, 'الضحى', 'Adh-Duha', 10, 2, 'السائل', 'السَّائِلَ', 's-sāʼila', 'celui qui demande', 'Sin lettre solaire', 233),
('qe-93-10-3', 93, 'الضحى', 'Adh-Duha', 10, 3, 'فلا', 'فَلَا', 'fa-lā', 'ne', NULL, 234),
('qe-93-10-4', 93, 'الضحى', 'Adh-Duha', 10, 4, 'تنهر', 'تَنْهَرْ', 'tanhar', 'le rabroue pas', NULL, 235),

-- V11 : وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ
('qe-93-11-1', 93, 'الضحى', 'Adh-Duha', 11, 1, 'وأما', 'وَأَمَّا', 'wa-ammā', 'Et quant aux bienfaits', NULL, 236),
('qe-93-11-2', 93, 'الضحى', 'Adh-Duha', 11, 2, 'بنعمة', 'بِنِعْمَةِ', 'bi-niʕmati', 'aux bienfaits de', 'Ayn pharyngal', 237),
('qe-93-11-3', 93, 'الضحى', 'Adh-Duha', 11, 3, 'ربك', 'رَبِّكَ', 'rabbika', 'ton Seigneur', NULL, 238),
('qe-93-11-4', 93, 'الضحى', 'Adh-Duha', 11, 4, 'فحدث', 'فَحَدِّثْ', 'fa-ḥaddith', 'proclame-les !', 'Chadda sur Dal — insistance', 239)

ON CONFLICT (id) DO NOTHING;
