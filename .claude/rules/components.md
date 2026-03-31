# Règles composants

- JAMAIS de requête SQLite directe (getLocalDB, executeQuery, SELECT, INSERT)
- Toujours passer par les hooks (useLetters, useProgress, useSRSCards, etc.)
- Couleurs : UNIQUEMENT via `useTheme()`, jamais de hex en dur
- Texte arabe : lineHeight minimum 1.8, police Amiri, couleur `text.heroArabic`