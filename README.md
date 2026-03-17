# لِسَان — Lisaan

**L'arabe, enfin accessible.**

Application mobile d'apprentissage de l'arabe conçue pour le cerveau latin. Du premier Alif à la lecture autonome.

## Stack technique

- **Mobile** : React Native + Expo (SDK 52+)
- **Langage** : TypeScript (strict mode)
- **State** : Zustand + React Query
- **Navigation** : Expo Router (file-based)
- **Base locale** : expo-sqlite (offline-first)
- **Backend** : Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Animations** : React Native Reanimated 3

## Structure du projet

```
lisaan/
├── app/                      # Expo Router (screens)
│   ├── (tabs)/               # Tab navigation
│   │   ├── learn.tsx         # Parcours principal
│   │   ├── review.tsx        # Révision SRS
│   │   └── profile.tsx       # Profil & réglages
│   ├── onboarding/           # Flux d'onboarding
│   ├── lesson/[id].tsx       # Écran de leçon
│   └── exercise/[id].tsx     # Écran d'exercice
├── src/
│   ├── components/           # Composants réutilisables
│   │   ├── arabic/           # ArabicText, LetterCard, HarakatToggle
│   │   ├── exercises/        # Exercise Registry + composants
│   │   └── ui/               # Boutons, modales, cartes
│   ├── engines/              # Logique métier
│   │   ├── srs.ts            # Algorithme SRS (SM-2)
│   │   ├── exercise-runner.ts # Séquenceur d'exercices
│   │   ├── onboarding-scorer.ts # Recommandation de variante
│   │   └── sync-manager.ts   # Sync offline/online
│   ├── db/                   # Couche données
│   │   ├── local.ts          # SQLite
│   │   └── remote.ts         # Supabase client
│   ├── stores/               # Zustand stores
│   ├── types/                # TypeScript types
│   ├── constants/            # Design tokens, config
│   └── i18n/                 # Internationalisation
├── supabase/                 # Backend
│   ├── migrations/           # SQL schema
│   └── seed/                 # Données initiales
└── assets/                   # Fonts, audio, images
```

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Copier et remplir les variables d'environnement
cp .env.example .env

# Lancer le serveur de développement
npx expo start
```

## Architecture

- **Offline-first** : tout le contenu et la progression fonctionnent sans connexion
- **Content as Data** : les leçons, exercices et mots sont des données, pas du code
- **Exercise Engine générique** : ajouter un type d'exercice = 1 composant + 1 ligne de registration
- **Multi-variante dès le départ** : le data model supporte MSA + dialectes + coranique

## Licence

Propriétaire — Tous droits réservés.
