# LISAAN — É12d ÉCRANS DE CÉLÉBRATION & MATCH EXERCISE
## Prompt Claude Code — Mission unique

> **Contexte :** Le reskin É12/É12c est terminé. Il reste des écrans qui utilisent encore des cliparts/emojis/confettis, et le MatchExercise a besoin d'un redesign premium.
>
> **Relis `docs/LISAAN-DESIGN-SYSTEM.md`** pour les tokens. Utilise `useTheme()` partout.

---

## MISSION UNIQUE — Redesign des écrans de célébration + Match Exercise

### Principe : 
Remplacer l'esthétique "jeu mobile cheap" par une célébration "premium et sereine". Or doré, géométrie, calligraphie. Interdiction absolue de cliparts, emojis célébratoires, ou confettis multicolores.

### 1. Écran "Leçon Terminée" (résultat après exercices — affiche le score)

- Fond `background.main`
- **Supprimer** le clipart/emoji en haut. Le remplacer par un **médaillon circulaire** : cercle 120px, fond `background.card`, bordure 2px `accent.gold`, ombre `medium`. À l'intérieur : une icône géométrique simple (checkmark stylisé ou étoile fine) en `accent.gold`. Pas de clipart.
- **Titre :** "Leçon Terminée !" (Jost-SemiBold, h1 24px, `text.primary`)
- **Sous-titre conditionnel :** "Parfait !" si score = 100%, "Bien joué !" si > 70%, "Continue tes efforts !" sinon (Jost-Medium, body 16px, `brand.primary`). Pas d'emoji.
- **Carte de score :** fond `background.card`, radius md=16, ombre `subtle`, padding 24, margin-X 24. Score "X/Y" en grand (Jost-SemiBold, h1 24px, `brand.primary`) + "bonnes réponses" (Jost-Regular, small 14px, `text.secondary`). ProgressBar (hauteur 6px) + pourcentage.
- **Carte stats (XP + streak) :** fond `background.group`, radius md=16, padding 16, margin-X 24, margin-top 16. Flex-row, séparateur vertical 1px `border.subtle`. Gauche : icône étoile `brand.primary` + "+X XP" (Jost-SemiBold, body 16px, `brand.dark`). Droite : icône flamme `accent.gold` + "N jours" (Jost-SemiBold, body 16px, `brand.dark`).
- **Temps :** "Temps total : Xs" (Jost-Regular, small 14px, `text.secondary`, centré)
- **Bouton :** "Continuer →" Button primary pill, bottom 24

### 2. Écran "Leçon Complétée" avec parties (LessonHub état completed)

- **Supprimer** le header lourd actuel. Remplacer par le même médaillon doré + "Leçon Complétée !" (Jost-SemiBold, h1 24px, `brand.primary`)
- **Liste des parties :** chaque ligne épurée = nom de la partie (Jost-Regular, body 16px, `text.primary`) + coche ronde à droite (cercle 24x24, fond `status.successLight`, icône checkmark `status.success`). Séparateur 1px `border.subtle`.
- **Boutons par partie :** "Relire" (Button secondary, compact) et "S'exercer" (Button primary, compact) côte à côte
- **"Tout refaire depuis le début" :** Button ghost en bas (pas de bordure épaisse comme actuellement)

### 3. Écran "Module Complété" (`module-complete.tsx`)

C'est un accomplissement majeur — l'écran doit être plus majestueux.

- **Fond :** `background.main` (PAS le fond vert foncé actuel)
- **Supprimer** les confettis multicolores et le clipart de livres
- **Tiers supérieur :** pattern Zellige subtil (2-4% opacité `brand.primary`) en fond avec fade-out vers le bas. Au centre : icône géométrique majestueuse — couronne stylisée ou étoile ornée en `accent.gold`, taille 80px
- **Titre :** "Félicitations !" (Jost-SemiBold, h1 24px, `text.primary`). "Tu as terminé le Module N" (Jost-Regular, body 16px, `text.secondary`). Titre arabe du module (Amiri, `arabicTitle` 36px, `text.heroArabic`)
- **Carte tableau d'honneur :** fond `background.card`, radius lg=24, ombre `prominent`, padding 24, margin-X 24, margin-top 32. Flex-row 3 colonnes séparées par lignes 1px `accent.gold` à 20% opacité. Chaque colonne : icône dorée (`accent.gold`) + grand nombre (Jost-SemiBold, h1 24px, `brand.dark`) + label (Jost-Regular, tiny 12px, `text.secondary`). Colonnes : XP total / Leçons / Minutes.
- **Bouton :** "Retour à l'accueil →" Button primary pill, bottom 32. PAS de bouton jaune/or — rester sur le pill émeraude standard.

### 4. Empty state "Rien à réviser" (onglet Réviser)

- **Supprimer** le clipart de livres colorés
- Centré verticalement : icône géométrique douce (motif Zellige simplifié ou étoile 8 branches fine) en `brand.primary` à 15-20% opacité, taille 80px
- "Rien à réviser pour l'instant" (Jost-Medium, h2 20px, `text.primary`)
- "Termine ta première leçon pour débloquer les révisions." (Jost-Regular, body 16px, `text.secondary`, centré, margin-top 8)
- "Aller apprendre →" (Button primary pill, margin-top 24)

### 5. Redesign du MatchExercise (exercice d'association / paires à relier)

L'exercice de matching doit passer d'une liste clinique à une grille d'association premium et tactile.

- **Layout global :** Interface distraction-free (fond `background.main`, croix fermeture à gauche, barre de progression fine en haut)
- **Instructions :** "Associe les mots correspondants" (Jost-Medium, h2 20px, `text.primary`, centré, padding-Y 24)
- **Grille d'association :** Flex-row, 2 colonnes (Gauche: Arabe / Droite: Français). Padding-X 24, gap horizontal 16, gap vertical 16.
- **Carte d'association (chaque item) :**
  - Hauteur fixe 64px, radius md=16
  - Fond `background.card`, bordure 1px `border.subtle`, ombre `subtle`
  - Colonne arabe (gauche) : texte arabe centré dans un mini-écrin (carré 48x48, fond `background.group`, radius sm=8). Typo : Amiri `arabicBody` 28px (pas 36 — trop grand pour une carte de 64px)
  - Colonne français (droite) : texte français centré. Jost-Medium, body 16px, `text.primary`
- **États d'interaction :**
  - **Sélectionné (tap initial) :** fond `brand.light`, bordure 2px `brand.primary`. Haptic "Selection"
  - **Match correct :** les 2 cartes passent en fond `status.successLight`, bordure `status.success`. Haptic Success. Après 800ms, les 2 cartes se grisent (opacité 0.5, `status.disabled`)
  - **Match incorrect :** les 2 cartes passent en fond `status.errorLight`, bordure `status.error`. Haptic Error. Shake sur la seconde carte. Après 1s, retour à l'état par défaut

### 5. Écran "Décision post-leçon" (LessonHub état completed — page intermédiaire)

C'est l'écran qui s'affiche quand une leçon est terminée et que l'utilisateur peut choisir de relire ou s'exercer. Actuellement c'est des boutons empilés génériques sur fond vide.

- Fond `background.main`
- **Header épuré :** bouton retour `<` à gauche (`text.secondary`). Texte centré : "Mod. N · Leçon N · Terminée" (Jost-Medium, body 16px, `text.primary`)
- **Titre :** "Que veux-tu faire ?" (Jost-SemiBold, h2 20px, `text.primary`, centré, margin-top 32)
- **Deux cartes-boutons** (margin-X 24, gap 16, margin-top 24) :

  **Carte "Relire" :**
  - Fond `background.card`, radius md=16, ombre `subtle`, padding 24
  - Flex-row, alignItems center
  - Gauche : cercle 48px, fond `background.group`, contenant une icône livre ouvert fine (outline) en `accent.gold`
  - Droite : titre "Relire la leçon" (Jost-Medium, body 16px, `text.primary`) + sous-titre "Revoir le contenu et les mots clés" (Jost-Regular, small 14px, `text.secondary`)
  - Press : haptic "Selection", scale 0.98, puis navigation vers la relecture

  **Carte "S'exercer" :**
  - Fond `background.card`, radius md=16, ombre `subtle`, padding 24
  - Flex-row, alignItems center
  - Gauche : cercle 48px, fond `brand.light`, contenant une icône étoile/puzzle géométrique fine en `brand.primary`
  - Droite : titre "S'exercer" (Jost-Medium, body 16px, `text.primary`) + sous-titre "Refaire les exercices pour renforcer ta mémoire" (Jost-Regular, small 14px, `text.secondary`)
  - Press : haptic "Selection", scale 0.98, puis navigation vers les exercices

- **"Tout refaire depuis le début" :** Button ghost en bas (Jost-Regular, body 16px, `text.secondary`). Pas de bordure épaisse.
- **Supprimer** le texte arabe watermark en fond si présent — l'écran doit être distraction-free et focalisé sur le choix

### Checkpoint :
- Aucun clipart (livres colorés), emoji célébratoire (🎉🎯), ou confetti multicolore ne subsiste
- L'écran Module Complété a un fond `background.main` (blanc cassé), PAS vert foncé
- Le médaillon doré est visible sur les écrans de fin de leçon
- Le pattern Zellige est visible (subtil) sur l'écran Module Complété
- L'empty state Réviser n'a plus de clipart
- Tous les boutons sont des pills émeraude (pas de bouton jaune)
- La célébration est sobre, dorée, et premium
- L'écran de décision post-leçon affiche 2 cartes premium avec icônes et descriptions (pas des boutons empilés)
- "Tout refaire" est un bouton ghost discret, pas un bouton avec bordure épaisse
- Le MatchExercise utilise la grille 2 colonnes avec mini-écrins arabes, pas une liste plate
- Les haptics et animations (shake, grisage) fonctionnent sur le MatchExercise
