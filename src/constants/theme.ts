/**
 * Lisaan Design Tokens
 * Palette extracted from the validated mockups.
 * Single source of truth for all colors, spacing, typography, and layout values.
 */

// ─── Colors ───────────────────────────────────────────────

export const Colors = {
  // Primary palette
  primary: '#1B7A4E',        // Green CTA buttons, active tabs
  primaryDark: '#145C3A',    // Pressed state
  primaryLight: '#D6F0E0',   // Selected chips, light backgrounds

  // Background
  bg: '#FDF6EC',             // Main warm beige background
  bgCard: '#FFFFFF',         // Cards, input areas
  bgCanvas: '#FFFFFF',       // Tracing canvas

  // Text
  textPrimary: '#1A1A1A',   // Main text, Arabic content
  textSecondary: '#6B7280',  // Subtitles, hints
  textMuted: '#9CA3AF',      // Placeholders, disabled
  textOnPrimary: '#FFFFFF',  // Text on green buttons

  // Accent
  gold: '#C5A44E',           // Logo accent, streak icon
  goldLight: '#E8D9A0',      // Gold highlights

  // Feedback
  success: '#1B7A4E',        // Correct answers
  successLight: '#D6F0E0',   // Success banner bg
  error: '#DC2626',          // SRS "Raté"
  errorLight: '#FEE2E2',
  warning: '#D97706',        // SRS "Difficile"
  warningLight: '#FEF3C7',

  // SRS buttons
  srsFailed: '#DC2626',
  srsDifficult: '#D97706',
  srsCorrect: '#1B7A4E',
  srsEasy: '#2B5866',

  // Borders
  border: '#E5E7EB',
  borderSelected: '#1B7A4E',

  // Misc
  overlay: 'rgba(0,0,0,0.3)',
  transparent: 'transparent',
} as const;

// ─── Typography ───────────────────────────────────────────

export const Fonts = {
  // Arabic content (pedagogical)
  arabic: 'Amiri',
  arabicAlt: 'NotoNaskhArabic',

  // UI (French interface)
  sans: 'Inter',
  sansBold: 'Inter-Bold',
  sansSemiBold: 'Inter-SemiBold',
  sansMedium: 'Inter-Medium',
} as const;

export const FontSizes = {
  // Arabic text sizes (need to be larger for diacritics)
  arabicXL: 64,    // Letter display (hero)
  arabicLG: 48,    // Word display in cards
  arabicMD: 36,    // Words in exercises
  arabicSM: 28,    // Words in sentences
  arabicXS: 22,    // Inline arabic

  // UI text sizes
  title: 28,       // Screen titles
  heading: 22,     // Section headings
  body: 16,        // Body text
  caption: 14,     // Captions, labels
  small: 12,       // Badges, tags
} as const;

// ─── Spacing ──────────────────────────────────────────────

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

// ─── Border Radius ────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

// ─── Layout ───────────────────────────────────────────────

export const Layout = {
  screenPaddingH: 20,
  cardPaddingH: 16,
  cardPaddingV: 16,
  tabBarHeight: 80,
  headerHeight: 56,
  progressBarHeight: 6,
  buttonHeight: 52,
} as const;

// ─── Animation ────────────────────────────────────────────

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
  },
} as const;
