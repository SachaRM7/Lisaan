/**
 * LISAAN DESIGN SYSTEM — tokens officiels v2.0
 * Source de vérité pour toutes les valeurs visuelles.
 * NE PAS modifier ces valeurs sans mettre à jour le fichier LISAAN-DESIGN-SYSTEM.md.
 */

// ─── Palette ──────────────────────────────────────────────

export const palette = {
  light: {
    background: {
      main: '#FDFBF7',   // Blanc cassé chaleureux — fond app
      card: '#FFFFFF',    // Blanc pur — cards (profondeur)
      group: '#F5F2EA',   // Sable — zones secondaires, fond badges
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
      subtle: '#F5F2EA',   // Bordures très légères
      medium: '#E5E7EB',   // Bordures plus visibles
    },
    shadowColor: '#0F624C', // Ombres teintées émeraude
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

// ─── Typographie ──────────────────────────────────────────

export const typography = {
  family: {
    arabic: 'Amiri',            // Amiri-Regular (ancien alias 'Amiri')
    arabicBold: 'Amiri-Bold',
    ui: 'Jost-Regular',
    uiMedium: 'Jost-Medium',
    uiBold: 'Jost-SemiBold',   // SemiBold (600), pas Bold (700)
  },
  size: {
    // Arabe
    arabicHero: 48,      // Lettre/mot en vedette (centre d'écran QCM)
    arabicDisplay: 64,   // Lettre isolée dans zone Hero
    arabicTitle: 36,     // Titre arabe dans les cards module
    arabicBody: 28,      // Texte arabe courant (leçons, exercices)
    arabicSmall: 22,     // Texte arabe secondaire (exemples, annotations)

    // UI française
    h1: 24,              // Titres d'écran
    h2: 20,              // Sous-titres, titres de sections
    body: 16,            // Texte principal UI
    small: 14,           // Labels, tags, metadata
    tiny: 12,            // Captions, catégories (MODULE 1, BADGES)
  },
  lineHeight: {
    arabic: 1.9,         // Sécurité harakats — NE JAMAIS DESCENDRE SOUS 1.8
    ui: 1.5,
  },
  letterSpacing: {
    caps: 1,             // Labels uppercase (MODULE 1, BADGES · 3/10)
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────

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
  hero: 64,   // Padding massif autour du texte arabe Hero
} as const;

// ─── Border Radius ────────────────────────────────────────

export const borderRadius = {
  sm: 8,      // Badges, petits éléments
  md: 16,     // Cards standard
  lg: 24,     // Modales, grands conteneurs
  xl: 32,     // Zone Hero arabe
  pill: 9999, // Boutons, tab bar, barres de progression
} as const;

// ─── Ombres ───────────────────────────────────────────────

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

// ─── Animation ────────────────────────────────────────────

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 90,
  },
} as const;

// ─── Rétrocompatibilité (à supprimer mission par mission) ─

/**
 * @deprecated Utiliser `useTheme()` à la place.
 * Ces aliases sont maintenus le temps du reskin.
 */
export const Colors = {
  primary: palette.light.brand.primary,
  primaryDark: palette.light.brand.dark,
  primaryLight: palette.light.brand.light,
  bg: palette.light.background.main,
  bgCard: palette.light.background.card,
  bgCanvas: palette.light.background.card,
  textPrimary: palette.light.text.primary,
  textSecondary: palette.light.text.secondary,
  textMuted: palette.light.status.disabled,
  textOnPrimary: palette.light.text.inverse,
  gold: palette.light.accent.gold,
  goldLight: '#E8D9A0',
  success: palette.light.status.success,
  successLight: palette.light.status.successLight,
  error: palette.light.status.error,
  errorLight: palette.light.status.errorLight,
  warning: '#D97706',
  warningLight: '#FEF3C7',
  srsFailed: palette.light.status.error,
  srsDifficult: '#D97706',
  srsCorrect: palette.light.brand.primary,
  srsEasy: '#2B5866',
  border: palette.light.border.medium,
  borderSelected: palette.light.brand.primary,
  overlay: 'rgba(0,0,0,0.3)',
  transparent: 'transparent',
} as const;

/** @deprecated Utiliser `useTheme().typography` */
export const Fonts = {
  arabic: 'Amiri',
  arabicAlt: 'NotoNaskhArabic',
  sans: 'Jost-Regular',
  sansBold: 'Jost-SemiBold',
  sansSemiBold: 'Jost-SemiBold',
  sansMedium: 'Jost-Medium',
} as const;

/** @deprecated Utiliser `useTheme().typography.size` */
export const FontSizes = {
  arabicXL: 64,
  arabicLG: 48,
  arabicMD: 36,
  arabicSM: 28,
  arabicXS: 22,
  title: 24,
  heading: 20,
  body: 16,
  caption: 14,
  small: 12,
} as const;

/** @deprecated Utiliser `useTheme().spacing` */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

/** @deprecated Utiliser `useTheme().borderRadius` */
export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

/** @deprecated Utiliser `useTheme().shadows` */
export const Shadows = {
  card: {
    shadowColor: palette.light.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHover: {
    shadowColor: palette.light.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

/** @deprecated Utiliser `useTheme().spacing` */
export const Layout = {
  screenPaddingH: 24,
  cardPaddingH: 24,
  cardPaddingV: 24,
  tabBarHeight: 72,
  headerHeight: 56,
  progressBarHeight: 6,
  buttonHeight: 56,
} as const;

/** @deprecated Utiliser `animation` */
export const Animation = animation;
