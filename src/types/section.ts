// src/types/section.ts

import type { ExerciseConfig, ExerciseResult } from './exercise';

/**
 * Une section est l'unité atomique de consommation dans une leçon.
 * Elle contient :
 * - Des items de présentation (teaching) : LetterCards, WordCards, SentenceCards...
 * - Des exercices générés pour ces items
 *
 * Taille cible : 4-6 items de teaching + 8-12 exercices = ~3-5 minutes.
 */
export interface LessonSection {
  /** Identifiant unique de la section dans la leçon (ex: "section-1", "section-2") */
  id: string;
  /** Titre court affiché dans la mini-roadmap (ex: "Mots de la famille") */
  title_fr: string;
  /** Index dans la leçon (0-based) */
  index: number;
  /** IDs des items de présentation (letter IDs, word IDs, sentence IDs...) */
  teachingItemIds: string[];
  /** Exercices générés pour cette section */
  exercises: ExerciseConfig[];
}

/**
 * Résultat complet d'une leçon découpée en sections.
 * Retourné par tous les generators.
 */
export interface LessonSections {
  /** Le type de contenu de la leçon (pour savoir quel composant de teaching utiliser) */
  contentType: 'letters' | 'diacritics' | 'words' | 'sentences' | 'grammar' | 'conjugation';
  /** Les sections ordonnées */
  sections: LessonSection[];
}

/**
 * Progression d'une section dans une session en cours.
 */
export interface SectionProgress {
  sectionId: string;
  /** true = les items de teaching ont tous été lus */
  teachingCompleted: boolean;
  /** Index du prochain exercice à jouer (0 = pas encore commencé) */
  nextExerciseIndex: number;
  /** Résultats des exercices déjà complétés */
  exerciseResults: ExerciseResult[];
  /** Statut global de la section */
  status: 'not_started' | 'teaching' | 'exercises' | 'completed';
}

/**
 * État complet d'une session de leçon en cours.
 * Persisté dans SQLite local (table lesson_session).
 */
export interface LessonSessionState {
  lessonId: string;
  userId: string;
  /** Index de la section active (0-based) */
  currentSectionIndex: number;
  /** Progression par section */
  sectionProgress: SectionProgress[];
  /** Timestamp de dernière mise à jour */
  updatedAt: string;
}
