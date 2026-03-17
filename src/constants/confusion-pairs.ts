// src/constants/confusion-pairs.ts

/**
 * Paires de lettres visuellement ou auditivement similaires.
 * Utilisées par le SRS pour plafonner les intervalles :
 * si une lettre d'une paire est maîtrisée mais pas l'autre,
 * la maîtrisée est plafonnée à 7 jours pour forcer la révision comparative.
 */
export const CONFUSION_PAIRS: string[][] = [
  // Même forme de base, différenciées par les points
  ['letter-002-ba', 'letter-003-ta', 'letter-004-tha'],
  // Forme de coupe, point au milieu / aucun / dessus
  ['letter-005-jim', 'letter-006-ha', 'letter-007-kha'],
  // Même forme, Dhal a un point
  ['letter-008-dal', 'letter-009-dhal'],
  // Même forme, Zay a un point
  ['letter-010-ra', 'letter-011-zay'],
  // Même dents, Shin a 3 points
  ['letter-012-sin', 'letter-013-shin'],
  // Même boucle, Dad a un point
  ['letter-014-sad', 'letter-015-dad'],
  // Même boucle verticale, Dhaa a un point
  ['letter-016-taa', 'letter-017-dhaa'],
  // Même forme, Ghayn a un point
  ['letter-018-ayn', 'letter-019-ghayn'],
  // Boucle similaire, 1 point vs 2 points
  ['letter-020-fa', 'letter-021-qaf'],
  // Sons proches (vélaire vs uvulaire)
  ['letter-021-qaf', 'letter-022-kaf'],
  // Sons proches (S normal vs S emphatique)
  ['letter-012-sin', 'letter-014-sad'],
  // Ta Marbuta ressemble à Ha' final
  ['letter-026-ha-end'],
];
