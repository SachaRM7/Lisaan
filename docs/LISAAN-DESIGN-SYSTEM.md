# LISAAN — DESIGN SYSTEM
## Document technique pour Claude Code — Version 1.0

> **Identité :** L'application doit se démarquer par son élégance, sa sérénité et la mise en valeur absolue de la calligraphie arabe. Ce n'est pas un jeu basique, c'est un outil précieux et raffiné.

> **Règle absolue :** Tu dois STRICTEMENT utiliser les tokens de ce document pour tout le stylisme. Interdiction d'utiliser des couleurs "en dur", des espacements aléatoires, ou des valeurs hors de cette échelle.

---

# 1. THÈME — STRUCTURE LIGHT / DARK

L'architecture du thème doit supporter le Light et le Dark mode dès la fondation. Implémenter un `ThemeProvider` contextuel avec un hook `useTheme()`. Au MVP, seul le Light mode est actif — le Dark mode est prêt mais non exposé dans les réglages.

```typescript
// src/constants/theme.ts

export const palette = {
  light: {
    background: {
      main: '#FDFBF7',    // Blanc cassé chaleureux — fond app
      card: '#FFFFFF',     // Blanc pur — cards (profondeur)
      group: '#F5F2EA',    // Sable — zones secondaires, fond badges
    },
    brand: {
      primary: '#0F624C',  // Émeraude — boutons, icônes, progression
      light: '#E5EFEB',    // Émeraude clair — fonds de tags, états pressés
      dark: '#0A4334',     // Émeraude sombre — texte accentué sur fond clair
    },
    accent: {
      gold: '#D4AF37',     // Or — streaks, étoiles, couronnes, récompenses
    },
    text: {
      heroArabic: '#000000', // Noir pur — EXCLUSIF au texte arabe
      primary: '#374151',    // Gris foncé — texte UI principal
      secondary: '#6B7280',  // Gris moyen — texte UI secondaire
      inverse: '#FFFFFF',    // Blanc — texte sur fond sombre
    },
    status: {
      success: '#10B981',
      successLight: '#ECFDF5',
      error: '#EF4444',
      errorLight: '#FEF2F2',
      disabled: '#D1D5DB',
    },
    border: {
      subtle: '#F5F2EA',     // Bordures très légères (= group)
      medium: '#E5E7EB',     // Bordures plus visibles
    },
    shadowColor: '#0F624C',  // Ombres teintées émeraude (jamais noir)
  },

  dark: {
    background: {
      main: '#171614',
      card: '#1E1D1B',
      group: '#262522',
    },
    brand: {
      primary: '#158769',
      light: '#1A3B32',
      dark: '#A7D4C6',
    },
    accent: {
      gold: '#E5C558',
    },
    text: {
      heroArabic: '#FFFFFF',
      primary: '#E5E7EB',
      secondary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    status: {
      success: '#34D399',
      successLight: '#064E3B',
      error: '#F87171',
      errorLight: '#7F1D1D',
      disabled: '#374151',
    },
    border: {
      subtle: '#262522',
      medium: '#374151',
    },
    shadowColor: '#000000',
  },
} as const;
```

---

# 2. TYPOGRAPHIE

## Police arabe : Amiri
- Fichiers : `Amiri-Regular.ttf`, `Amiri-Bold.ttf` (déjà dans `assets/fonts/`)
- Usage : TOUT le texte arabe pédagogique (lettres, mots, phrases, harakats)
- **Règle absolue :** `lineHeight` doit TOUJOURS être au ratio 1.8 à 2.0 pour ne jamais couper les harakats (diacritiques au-dessus et en-dessous)

## Police UI française : Jost
- **Remplace Inter dans tout le projet**
- Source : Google Fonts — https://fonts.google.com/specimen/Jost
- Fichiers à télécharger et placer dans `assets/fonts/` :
  - `Jost-Regular.ttf` (400)
  - `Jost-Medium.ttf` (500)
  - `Jost-SemiBold.ttf` (600)
- Caractère : Géométrique, éditorial, intemporel. Inspirée de Futura. Contraste harmonieux avec les courbes organiques d'Amiri.

## Échelle typographique

```typescript
export const typography = {
  family: {
    arabic: 'Amiri-Regular',
    arabicBold: 'Amiri-Bold',
    ui: 'Jost-Regular',
    uiMedium: 'Jost-Medium',
    uiBold: 'Jost-SemiBold',   // SemiBold (600), pas Bold (700)
  },
  size: {
    // Arabe
    arabicHero: 48,     // Lettre/mot en vedette (centre d'écran QCM)
    arabicDisplay: 64,  // Lettre isolée dans zone Hero
    arabicTitle: 36,    // Titre arabe dans les cards module
    arabicBody: 28,     // Texte arabe courant (leçons, exercices)
    arabicSmall: 22,    // Texte arabe secondaire (exemples, annotations)

    // UI française
    h1: 24,             // Titres d'écran (Apprendre, Profil, Réglages)
    h2: 20,             // Sous-titres, titres de sections
    body: 16,           // Texte principal UI
    small: 14,          // Labels, tags, metadata
    tiny: 12,           // Captions, catégories (MODULE 1, BADGES)
  },
  lineHeight: {
    arabic: 1.9,        // Sécurité harakats — NE JAMAIS DESCENDRE SOUS 1.8
    ui: 1.5,            // Texte UI standard
  },
  letterSpacing: {
    caps: 1,            // Pour les labels uppercase (MODULE 1, BADGES · 3/10)
  },
} as const;
```

---

# 3. SPACING, BORDER RADIUS, OMBRES

```typescript
export const spacing = {
  micro: 4,
  xs: 8,
  sm: 12,
  base: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  hero: 64,    // Padding massif autour du texte arabe Hero
} as const;

export const borderRadius = {
  sm: 8,       // Badges, petits éléments
  md: 16,      // Cards standard
  lg: 24,      // Modales, grands conteneurs
  xl: 32,      // Zone Hero arabe
  pill: 9999,  // Boutons, tab bar, barres de progression
} as const;
```

## Ombres
**Interdiction d'utiliser des ombres noires standard.** Utiliser la couleur `shadowColor` du thème (émeraude en light, noir en dark) avec une très faible opacité pour un effet "glow" naturel.

```typescript
// Générées dynamiquement selon le mode (light/dark)
export const getShadows = (isDarkMode: boolean, shadowColor: string) => ({
  subtle: {
    shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDarkMode ? 0.5 : 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  prominent: {
    shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDarkMode ? 0.7 : 0.12,
    shadowRadius: 32,
    elevation: 10,
  },
});
```

---

# 4. COMPOSANTS — SPECS COMPLÈTES

## 4.1 Boutons

### Bouton Primaire (CTA principal)
| Propriété | Valeur |
|---|---|
| height | 56 |
| borderRadius | pill (9999) |
| paddingHorizontal | 24 |
| fontFamily | Jost-SemiBold |
| fontSize | 16 |
| **default** | fond `brand.primary`, texte `text.inverse`, ombre `prominent` |
| **pressed** | fond `brand.dark`, scale 0.98, ombre `medium` |
| **disabled** | fond `status.disabled`, texte `text.secondary`, ombre none |

### Bouton Secondaire (actions alternatives)
| Propriété | Valeur |
|---|---|
| height | 56 |
| borderRadius | pill (9999) |
| paddingHorizontal | 24 |
| **default** | fond transparent, border 2px `brand.primary`, texte `brand.primary` |
| **pressed** | fond `brand.light`, border 2px `brand.primary`, texte `brand.dark` |
| **disabled** | border 2px `status.disabled`, texte `status.disabled` |

### Bouton Ghost (navigation, liens)
| Propriété | Valeur |
|---|---|
| height | 48 |
| borderRadius | md (16) |
| paddingHorizontal | 16 |
| **default** | fond transparent, texte `text.secondary` |
| **pressed** | fond `background.group`, texte `text.primary` |

## 4.2 Cards

### Card Leçon (écran Learn)
| État | Fond | Bordure | Ombre | Opacité | Extras |
|---|---|---|---|---|---|
| locked | `background.main` | none | none | 0.5 | icônes en grayscale |
| available | `background.card` | 1px `border.subtle` | subtle | 1.0 | — |
| in_progress | `background.card` | 1px `brand.primary` | medium | 1.0 | barre de progression visible |
| completed | `background.card` | none | subtle | 1.0 | indicateur or `accent.gold` |

Global card leçon : borderRadius `md` (16), padding `lg` (24).

### Card Exercice (options de réponse QCM)
| État | Fond | Bordure | Couleur texte | Ombre | Animation |
|---|---|---|---|---|---|
| default | `background.card` | 1px `border.subtle` | `text.primary` | subtle | — |
| selected | `brand.light` | 2px `brand.primary` | `brand.primary` | medium | — |
| correct | `status.successLight` | 2px `status.success` | `status.success` | — | — |
| incorrect | `status.errorLight` | 2px `status.error` | `status.error` | — | shake |

Global card exercice : minHeight 64, borderRadius `md` (16).

## 4.3 Bottom Tab Bar

La tab bar **ne touche PAS les bords de l'écran**. C'est une pilule flottante avec glassmorphism.

| Propriété | Valeur |
|---|---|
| height | 72 |
| marginHorizontal | 24 |
| marginBottom | 24 |
| borderRadius | pill (9999) |
| backgroundColor | `background.card` à 90% opacité |
| backdropFilter | blur(15px) — via `@react-native-community/blur` ou équivalent |
| shadow | prominent |
| iconSize | 24 |
| **onglet actif** | iconColor `brand.primary` + dot indicator 4px `accent.gold` (4px sous l'icône) |
| **onglet inactif** | iconColor `text.secondary` |

## 4.4 Header

| Propriété | Valeur |
|---|---|
| height | 56 |
| paddingHorizontal | lg (24) |
| flexDirection | row |
| alignItems | center |
| justifyContent | space-between |
| titre | Jost-Medium, 20px, `text.primary`, centré |

## 4.5 Badge / Tag

| Propriété | Valeur |
|---|---|
| height | 32 |
| borderRadius | sm (8) |
| paddingHorizontal | 12 |
| fontFamily | Jost-Medium |
| fontSize | 14 |
| **variante status** | fond `brand.light`, texte `brand.dark` |
| **variante difficulty** | fond `status.errorLight`, texte `status.error` |
| **variante category** | fond `background.group`, texte `text.secondary` |

## 4.6 Toggle / Switch

| Propriété | Valeur |
|---|---|
| trackWidth | 52 |
| trackHeight | 32 |
| borderRadius | pill |
| thumbSize | 26 |
| **off** | track `background.group`, thumb `background.card`, ombre subtle |
| **on** | track `brand.primary`, thumb `background.card`, ombre subtle |

## 4.7 Barre de Progression

| Propriété | Valeur |
|---|---|
| height | 6 (standard) / 4 (fine, dans les cards) |
| borderRadius | pill |
| track color | `background.group` |
| fill color | `brand.primary` |
| animation | spring (stiffness 90, damping 15) via Reanimated |

---

# 5. RÈGLES ARCHITECTURALES

## 5.1 La Règle du "Hero Arabe"
Le texte arabe est le ROI de l'écran. Quand un caractère/mot arabe est en vedette :
- Padding massif autour (min `hero` = 64px d'espace vide)
- Placé dans un carré adouci (borderRadius `xl` = 32) avec fond `background.group` (#F5F2EA)
- Taille `arabicDisplay` (64px) ou `arabicHero` (48px)
- Couleur `text.heroArabic` (noir pur en light, blanc pur en dark)
- **JAMAIS** de pattern ou texture derrière le texte arabe d'apprentissage

## 5.2 Indicateurs de Progression
Remplacer les textes "x/y" par des éléments graphiques :
- Barres très fines (4-6px de hauteur, radius pill)
- Ou cercles de progression SVG
- Couleur de remplissage : `brand.primary`
- Couleur du track : `background.group`

## 5.3 Pas de Rouge Agressif
Les erreurs sont signalées doucement. Le rouge (`status.error`) est utilisé UNIQUEMENT pour les bordures et le texte, jamais en fond plein. Le fond d'erreur est `status.errorLight` (rose très pâle).

---

# 6. PATTERNS & TEXTURES PREMIUM

## 6.1 Pattern Géométrique (Skeleton Zellige)
- **Design :** Grille géométrique épurée basée sur l'étoile à 8 branches (Rub el Hizb). Uniquement des tracés (strokes) 1px, aucun remplissage plein.
- **Couleur :** `brand.primary` à 2-4% d'opacité (light) / `text.primary` à 3% (dark).
- **Emplacements autorisés :**
  1. Background de l'écran Profil (tiers supérieur avec fade-out vers le bas)
  2. Modales de succès (fond "Leçon complétée", "Badge débloqué")
  3. États vides (empty states)
- **INTERDICTION STRICTE :** Jamais derrière le texte arabe d'apprentissage ou la zone de focus QCM.

## 6.2 Ornements Discrets
- **Micro-Séparateur :** Ligne 1px `border.subtle` avec un losange géométrique 4x4px en son centre.
- **Filigrane Calligraphique :** Forme calligraphique abstraite (courbe d'un Noun ن ou Kashida fluide) dans le coin inférieur droit des grandes cartes, débordant (overflow: hidden). Couleur ton-sur-ton (`background.main` sur fond `background.card`).

---

# 7. DIRECTIVES PAR ÉCRAN

## 7.1 Écran "Apprendre" (Learn)
- Fond : `background.main`
- Header : "Lisaan" (Jost-SemiBold, 20px) à gauche + chip streak flottant à droite (fond `background.card`, radius md, ombre subtle, icône flamme `accent.gold`)
- ScrollView : padding-X 24, gap vertical 24
- **Card Module :** fond `background.card`, radius md, ombre subtle, padding 24
  - Haut-Droite : titre arabe (`text.heroArabic`, 36px, lineHeight 1.9)
  - Haut-Gauche : "MODULE 1" (`text.secondary`, 12px, uppercase, letterSpacing 1) + titre français (`text.primary`, 16px)
  - Bas : barre de progression (hauteur 4px, track `background.group`, fill `brand.primary`)

## 7.2 Écran "Exercice QCM" (Distraction-free)
- Fond : `background.main`
- Header minimaliste : croix de fermeture (X) isolée à gauche (`text.secondary`, 24px) + barre de progression ultra-fine en haut (hauteur 4px)
- **Zone Hero :** carré adouci centré (160x160, radius xl=32, fond `background.group`)
  - Lettre/mot arabe centré (`text.heroArabic`, 64px, lineHeight 1.9)
- **Zone réponses :** 3-4 cards empilées (margin-X 24, gap 16, minHeight 64)
  - Card par défaut : fond `background.card`, border 1px `border.subtle`, radius md, texte centré `text.primary` 16px
- **Bouton "Valider" :** Bouton Primaire (hauteur 56, pill, fond `brand.primary`, ombre prominent) en safe area basse

## 7.3 Écran "Profil"
- Fond : `background.main`
- **Top Card Stats :** fond `background.card`, radius lg=24, ombre medium, padding 24
  - Flex-row, 3 colonnes séparées par lignes verticales 1px `border.subtle`
  - Chaque colonne : icône + valeur (Jost-SemiBold, 24px, `text.primary`) + label (12px, `text.secondary`)
- **Section Badges :** fond `background.group`, radius lg=24, padding 24
  - En-tête : "BADGES · 3/10" (Jost-Medium, 12px, uppercase, `text.secondary`)
  - Grille 3x3, gap 16
  - Badge verrouillé : 80x80, fond `background.card` à 50% opacité, radius md, silhouette cadenas `status.disabled`
  - Badge débloqué : 80x80, fond `background.card`, ombre subtle, accents `accent.gold`

## 7.4 Écran "Réglages"
- Fond : `background.main`
- **Card Preview Hero :** fond `background.card`, radius md, ombre subtle, padding 32
  - Texte arabe centré : كِتَابٌ (`text.heroArabic`, 48px, lineHeight 1.9)
  - Sous-titre : "kitābun" (`text.secondary`, 16px)
- **Liste réglages :** fond `background.card`, radius lg=24, ombre subtle, margin-top 32
  - Ligne : hauteur 64, flex-row space-between, padding-X 20
  - Bordure basse 1px `border.subtle` (sauf dernière ligne)
  - Label : Jost-Medium, 16px, `text.primary`
  - Toggle à droite (specs section 4.6)

---

# 8. MIGRATION — CHECKLIST

Pour appliquer ce Design System au projet existant :

1. **Télécharger Jost** (Regular 400, Medium 500, SemiBold 600) depuis Google Fonts → `assets/fonts/`
2. **Créer `src/constants/theme.ts`** avec palette, spacing, borderRadius, typography, getShadows
3. **Créer `src/contexts/ThemeProvider.tsx`** avec `useTheme()` hook (light mode par défaut)
4. **Remplacer tous les design tokens existants** (`src/constants/tokens.ts` ou équivalent)
5. **Mettre à jour `useFonts`** dans `app/_layout.tsx` pour charger Jost au lieu d'Inter
6. **Reskin chaque écran** en consommant le thème via `useTheme()`
7. **Reskin chaque composant UI** (buttons, cards, toggles, progress bars)
8. **Implémenter la floating tab bar** avec glassmorphism
9. **Supprimer toutes les couleurs hardcodées** — grep le projet pour les hex codes

---

*Document consolidé par Claude Opus à partir de la direction artistique produite par Gemini. Police choisie : Jost. Mars 2026.*
