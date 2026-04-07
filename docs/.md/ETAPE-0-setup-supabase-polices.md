# ÉTAPE 0 — Setup Supabase + Polices arabes

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> Le repo est initialisé avec la structure complète (voir `/docs/lisaan-architecture-data-model.docx`).
> Cette étape configure le backend Supabase et les polices arabes avant toute feature.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

---

## MISSION 1 — Installer et configurer Supabase CLI

**Action :**
```
npm install supabase --save-dev
npx supabase init
```

**Ensuite :**
- Vérifie que le dossier `supabase/` contient `config.toml`
- Dans `config.toml`, modifie le `project_id` en `"lisaan"`
- Assure-toi que le `.gitignore` contient `.env` et `.env.local`

**Checkpoint :**
- [ ] `npx supabase --version` retourne une version
- [ ] `supabase/config.toml` existe avec `project_id = "lisaan"`
- [ ] Aucun fichier `.env` n'est tracké par git

---

## MISSION 2 — Créer la migration initiale du schéma

**Action :**
Copie le contenu du fichier `/docs/lisaan-migration-001.sql` dans une nouvelle migration Supabase :

```
npx supabase migration new initial_schema
```

Cela crée un fichier dans `supabase/migrations/` avec un timestamp. Colle INTÉGRALEMENT le contenu de `/docs/lisaan-migration-001.sql` dans ce fichier. Ne modifie rien, ne raccourcis rien. Le fichier fait environ 350 lignes et contient :
- Tous les ENUMs (variant_type, exercise_type, harakats_mode, etc.)
- Tables content : letters, diacritics, confusion_pairs, roots, words, word_variants, sentences, modules, lessons, exercises
- Tables user : users, user_settings, user_progress, srs_cards
- Tous les index
- Toutes les policies RLS
- Le trigger update_updated_at
- Le SEED DATA complet (28 lettres, 8 diacritiques, 4 modules, 6 racines, 6 mots d'exemple)

**Important :** Supprime l'ancien fichier placeholder `supabase/migrations/001_initial_schema.sql` s'il existe encore.

**Checkpoint :**
- [ ] Un seul fichier de migration existe dans `supabase/migrations/` (avec timestamp)
- [ ] Le fichier contient les `CREATE TYPE`, `CREATE TABLE`, `INSERT INTO` et `CREATE POLICY`
- [ ] Le fichier se termine par le commentaire `-- DONE`

---

## MISSION 3 — Lancer Supabase en local et appliquer la migration

**Action :**
```
npx supabase start
```

Attends que tous les services soient up (db, auth, storage, studio, etc.).
Puis applique la migration :

```
npx supabase db reset
```

Cela va appliquer la migration et exécuter le seed.

**Checkpoint :**
- [ ] `npx supabase status` affiche les URLs de tous les services (API, Studio, DB)
- [ ] Ouvre Supabase Studio (`http://localhost:54323`) et vérifie :
  - La table `letters` contient 28 lignes
  - La table `diacritics` contient 8 lignes
  - La table `modules` contient 4 lignes
  - La table `roots` contient 6 lignes
  - La table `words` contient 6 lignes
  - La table `word_variants` contient 6 lignes
- [ ] Aucune erreur dans la sortie de `db reset`

---

## MISSION 4 — Configurer les variables d'environnement

**Action :**
Après `npx supabase status`, récupère les valeurs de `API URL` et `anon key`.
Crée le fichier `.env` à la racine du projet :

```
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<la clé anon affichée par supabase status>
```

**Ensuite :**
Vérifie que le fichier `src/db/remote.ts` lit bien ces variables :
```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
```

Si ce n'est pas le cas, corrige-le.

**Checkpoint :**
- [ ] `.env` existe avec les deux variables remplies
- [ ] `.env` est dans le `.gitignore`
- [ ] `src/db/remote.ts` utilise `process.env.EXPO_PUBLIC_SUPABASE_URL`

---

## MISSION 5 — Télécharger et installer les polices arabes

**Action :**
Télécharge les polices suivantes et place-les dans `assets/fonts/` :

1. **Amiri** (police arabe calligraphique pour le contenu pédagogique) :
   - Télécharge depuis Google Fonts : https://fonts.google.com/specimen/Amiri
   - Fichiers nécessaires : `Amiri-Regular.ttf`, `Amiri-Bold.ttf`

2. **Noto Naskh Arabic** (police arabe alternative, plus lisible en petit) :
   - Télécharge depuis Google Fonts : https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic
   - Fichiers nécessaires : `NotoNaskhArabic-Regular.ttf`, `NotoNaskhArabic-Bold.ttf`

3. **Inter** (police UI pour l'interface française) :
   - Télécharge depuis Google Fonts : https://fonts.google.com/specimen/Inter
   - Fichiers nécessaires : `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`

**Commandes pour télécharger via curl :**
```bash
# Amiri
curl -L "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf" -o assets/fonts/Amiri-Regular.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Bold.ttf" -o assets/fonts/Amiri-Bold.ttf

# Noto Naskh Arabic
curl -L "https://github.com/google/fonts/raw/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf" -o assets/fonts/NotoNaskhArabic-Variable.ttf

# Inter
curl -L "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf" -o assets/fonts/Inter-Variable.ttf
```

> Note : si les URLs ne fonctionnent pas, télécharge manuellement depuis fonts.google.com et place les .ttf dans `assets/fonts/`.

**Checkpoint :**
- [ ] `assets/fonts/` contient au minimum : `Amiri-Regular.ttf`, `Amiri-Bold.ttf`
- [ ] Les fichiers font plus de 100 Ko chacun (ce ne sont pas des placeholders vides)
- [ ] `ls -la assets/fonts/` montre des tailles réalistes (Amiri ~300-500 Ko, Inter ~300 Ko)

---

## MISSION 6 — Configurer le chargement des polices dans Expo

**Action :**
Modifie `app/_layout.tsx` pour charger toutes les polices correctement.

Le hook `useFonts` doit charger :
```typescript
const [fontsLoaded] = useFonts({
  'Amiri': require('../assets/fonts/Amiri-Regular.ttf'),
  'Amiri-Bold': require('../assets/fonts/Amiri-Bold.ttf'),
});
```

Si tu as aussi téléchargé Inter et Noto Naskh, ajoute-les aussi :
```typescript
'Inter': require('../assets/fonts/Inter-Variable.ttf'),
'NotoNaskhArabic': require('../assets/fonts/NotoNaskhArabic-Variable.ttf'),
```

Si certaines polices ne sont pas disponibles (téléchargement échoué), commente-les proprement avec un `// TODO` et n'inclus que celles qui sont réellement présentes dans `assets/fonts/`.

**Ensuite :**
Vérifie que `src/constants/theme.ts` référence les bons noms de polices :
```typescript
export const Fonts = {
  arabic: 'Amiri',
  arabicAlt: 'NotoNaskhArabic',
  sans: 'Inter',
  // ...
} as const;
```

Les noms dans `Fonts` doivent correspondre exactement aux clés passées à `useFonts`.

**Checkpoint :**
- [ ] `app/_layout.tsx` charge les polices sans erreur
- [ ] Les noms dans `useFonts({...})` matchent ceux dans `src/constants/theme.ts`
- [ ] Aucun `require()` ne pointe vers un fichier inexistant

---

## MISSION 7 — Vérifier que l'app démarre sans erreur

**Action :**
```
npx expo start
```

Ouvre l'app sur un simulateur ou Expo Go. Vérifie :
- L'app se lance sans crash
- L'onglet "Apprendre" s'affiche avec les 4 modules
- L'onglet "Réviser" affiche la carte de révision avec le texte arabe كِتَاب
- L'onglet "Profil" (Réglages) affiche les sections Affichage / Exercices / Audio
- Le texte arabe utilise la police Amiri (pas la police système par défaut)

**Checkpoint final de l'étape :**
- [ ] `npx expo start` ne produit aucune erreur
- [ ] Les 3 onglets s'affichent correctement
- [ ] Le texte arabe est rendu avec la police Amiri
- [ ] Supabase tourne en local avec les 28 lettres seedées
- [ ] Les variables d'environnement sont configurées
- [ ] Aucun warning critique dans la console

---

## RÉSUMÉ DE L'ÉTAPE 0

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Supabase CLI installé et configuré | ✅ |
| 2 | Migration SQL complète créée | ✅ |
| 3 | Base locale avec seed appliqué (28 lettres, 8 diacritiques, etc.) | ✅ |
| 4 | Variables d'environnement configurées | ✅ |
| 5 | Polices Amiri + Inter + Noto Naskh téléchargées | ✅ |
| 6 | Chargement des polices dans Expo configuré | ✅ |
| 7 | App démarre sans erreur avec les polices arabes | ✅ |

> **Prochaine étape après validation :** Étape 1 — Flux d'onboarding complet (5 écrans + écran de recommandation)