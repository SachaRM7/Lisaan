/**
 * Lisaan i18n
 * French-only for MVP, but structure is ready for multi-language.
 * All user-facing strings should come from here.
 */

const fr = {
  // Navigation
  nav: {
    learn: 'Apprendre',
    review: 'Réviser',
    profile: 'Profil',
  },

  // Common
  common: {
    continue: 'Continuer',
    validate: 'Valider',
    cancel: 'Annuler',
    back: 'Retour',
    skip: 'Passer',
    close: 'Fermer',
    retry: 'Réessayer',
    next: 'Suivant',
    done: 'Terminé',
  },

  // Onboarding
  onboarding: {
    step: (current: number, total: number) => `ÉTAPE ${current} SUR ${total}`,
    q1_title: 'Pourquoi apprendre\nl\'arabe ?',
    q1_subtitle: 'Choisis une ou plusieurs raisons',
    q2_title: 'Quel est ton niveau\nactuel ?',
    q2_subtitle: 'Sélectionne le niveau qui te correspond',
    q3_title: 'Ton objectif\nprioritaire ?',
    q4_title: 'Avec quel dialecte\nes-tu le plus en contact ?',
    q5_title: 'Combien de temps\npar jour ?',
    recommendation_title: 'Ta recommandation\npersonnalisée',
    recommendation_subtitle: 'Basée sur ton profil et tes objectifs',
    alphabet_reassurance: 'L\'alphabet est le même pour toutes les variantes, tu ne l\'apprendras qu\'une seule fois.',
    start_adventure: 'Commencer l\'aventure',
    coming_soon: 'Prochainement',
  },

  // Learn
  learn: {
    greeting: (name: string) => `Bonjour, ${name}`,
    continue_path: 'Continue ton parcours',
    module: 'MODULE',
    completed: (pct: number) => `${pct}% terminé`,
  },

  // Review
  review: {
    title: 'Révision',
    to_review: 'À revoir',
    new_cards: 'Nouvelles',
    mastery: 'Maîtrise',
    card_of: (current: number, total: number) => `Carte ${current} sur ${total}`,
    tap_to_flip: 'Touche pour retourner',
    failed: 'Raté',
    difficult: 'Difficile',
    correct: 'Correct',
    easy: 'Facile',
    days: (n: number) => n === 1 ? '1 jour' : `${n} jours`,
  },

  // Exercises
  exercise: {
    bravo: 'Bravo !',
    correct_answer: 'C\'est la bonne réponse.',
    try_again: 'Essaie encore.',
    validate_trace: 'Valider mon tracé',
    clear: 'Effacer',
    guide: 'Guide',
    trace_instruction: (letter: string) => `Trace la lettre ${letter}`,
    trace_hint: 'Suis le tracé fantôme avec ton doigt',
    which_form: 'Quelle est la forme initiale de cette lettre ?',
    lives_remaining: (n: number) => n.toString(),
  },

  // Settings
  settings: {
    title: 'Réglages',
    display: 'AFFICHAGE',
    exercises: 'EXERCICES',
    audio: 'AUDIO',
    harakats: 'Harakats (تشكيل)',
    harakats_desc: 'Afficher les voyelles courtes',
    transliteration: 'Translittération',
    transliteration_desc: 'kitāb, madrasa...',
    translation: 'Traduction',
    translation_desc: 'Afficher la traduction française',
    font_size: 'Taille de police arabe',
    font_size_desc: 'Ajuster la lisibilité',
    direction: 'Direction d\'exercice',
    direction_desc: 'Arabe → Français ou inverse',
    audio_speed: 'Vitesse audio',
    audio_speed_desc: 'Vitesse de lecture des sons',
    autoplay: 'Lecture automatique',
    autoplay_desc: 'Jouer le son automatiquement',
  },
} as const;

// Default locale
export const t = fr;

export type TranslationKeys = typeof fr;
