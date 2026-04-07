# PROMPT CLAUDE CODE — É12b NAVIGATION PREMIUM

Avant de commencer, relis `docs/LISAAN-DESIGN-SYSTEM.md` pour les tokens visuels.

## Contexte
L'écran Learn utilise actuellement un système d'accordéon : taper un module déplie ses leçons directement dans la page. Ce pattern ne scale pas (surcharge cognitive, mur de texte, perte de repères). On passe à une navigation **drill-down** (tap module → page dédiée aux leçons) avec des transitions premium.

## CE QUI NE DOIT PAS CHANGER
- La logique de progression (quel module/leçon est dispo, en cours, complété)
- Les données (hooks, stores, engines)
- Les autres écrans (Review, Profile, exercices, onboarding)
- La structure Expo Router existante

---

## MISSION 1 — Refactorer l'écran Learn en vue globale (modules uniquement)

### Actions :
1. **Modifier `app/(tabs)/learn.tsx`** pour qu'il affiche UNIQUEMENT la liste des modules (plus d'accordéon, plus de leçons visibles directement) :

   **a) Hero "Reprendre" en haut de l'écran :**
   - Grande card distincte tout en haut, fond `background.card`, radius `lg` (24), ombre `medium`
   - Contenu : "Reprendre" (Jost-SemiBold, h2) + indication de la dernière position (ex: "Module 3, Leçon 4 — Ma famille")
   - Titre arabe de la leçon en cours à droite (`arabicBody`, 28px)
   - Bouton ou card entière cliquable → navigue vers la leçon en cours
   - Si aucune leçon en cours (tout complété ou premier lancement), afficher un message adapté

   **b) Liste des modules :**
   - Cards modules empilées (gap 24, padding-X 24)
   - Chaque card est cliquable **dans son ensemble** (pas d'accordéon)
   - Le tap navigue vers `/lesson/module-[id]` (ou équivalent — voir Mission 2)
   - Design de la card module (reprendre le design actuel du Design System) :
     - "MODULE N" (Jost-Medium, tiny 12px, uppercase, `text.secondary`, letterSpacing 1)
     - Titre français (Jost-Medium, body 16px, `text.primary`)
     - Titre arabe à droite (`arabicTitle` 36px, `text.heroArabic`)
     - **Remplacer la barre de progression linéaire par un cercle de progression** : cercle SVG de 48x48, stroke `brand.primary` (rempli), stroke `background.group` (track), strokeWidth 3, radius pill. Texte "5/7" au centre (Jost-Medium, small 14px, `text.primary`).
     - Positionnement du cercle : à gauche du titre français, ou sous les titres — choisir le layout le plus élégant

2. **Supprimer toute logique d'accordéon** (expand/collapse) de learn.tsx

### Checkpoint :
- L'écran Learn affiche une card "Reprendre" en haut + la liste des modules compactes
- Taper un module ne déplie rien — ça navigue vers une nouvelle page
- Le cercle de progression est visible sur chaque card module

---

## MISSION 2 — Créer l'écran détail du module

### Actions :
1. **Créer un nouvel écran** `app/module/[id].tsx` (ou adapter la route existante si plus approprié avec Expo Router)

2. **Header custom (pas le header natif)** :
   - Masquer le header natif du Stack Navigator (`headerShown: false`)
   - Bouton retour flottant en haut à gauche : cercle 40x40, fond `background.card` à 80% opacité + blur si possible, icône flèche gauche (`text.primary`), ombre `subtle`
   - Zone titre sous le bouton retour :
     - "MODULE N" (Jost-Medium, tiny 12px, uppercase, `text.secondary`, letterSpacing 1)
     - Titre français (Jost-SemiBold, h1 24px, `text.primary`)
     - Titre arabe (Amiri, `arabicTitle` 36px, `text.heroArabic`)
     - Barre ou cercle de progression du module

3. **Liste des leçons** avec effet stagger :
   - Utiliser `Animated` de `react-native-reanimated` avec `FadeInDown` et un délai en cascade (leçon 1 à 0ms, leçon 2 à 50ms, leçon 3 à 100ms, etc.)
   - Chaque leçon est une row :
     - **Gauche :** numéro de leçon (`text.secondary`, small 14px, width fixe 32px)
     - **Centre :** titre français (`text.primary`, body 16px, Jost-Regular)
     - **Droite :** titre arabe (`arabicBody` 28px, Amiri) + pastille statut
   - **Statuts visuels :**
     - `locked` : opacité 0.4, icône cadenas `status.disabled`
     - `available` : opacité 1.0, pas d'icône
     - `in_progress` : opacité 1.0, petit indicateur `brand.primary`
     - `completed` : opacité 0.6, pastille check `status.success`
   - Séparateur entre chaque leçon : ligne 1px `border.subtle`
   - Tap sur une leçon → navigue vers `lesson/[id]` (comportement existant)

### Checkpoint :
- Taper un module dans Learn ouvre une nouvelle page avec la liste des leçons
- L'animation stagger est visible (les leçons apparaissent en cascade)
- Le bouton retour ramène à l'écran Learn
- Les statuts de leçons (locked/available/completed) sont visuellement distincts

---

## MISSION 3 — Transition premium entre Learn et Module

### Actions :
1. **Configurer la transition du Stack Navigator** pour la route module/[id] :
   - Remplacer le `slide_from_right` par défaut
   - Utiliser une animation custom : **Fade In + TranslateY** (l'écran de détail apparaît avec un fondu et un léger mouvement vers le haut, de +40px à 0px)
   - Courbe : spring douce `withSpring({ damping: 20, stiffness: 90, mass: 1 })` ou bezier `(0.25, 1, 0.5, 1)` sur 350ms
   - Le fond du Stack Navigator doit être `background.main` (`#FDFBF7`) pour éviter tout flash blanc/noir

2. **Micro-interaction au press sur la card module** :
   - `onPressIn` : scale 0.98 + ombre passe de `subtle` à `medium` (durée 100ms)
   - `onPressOut` : retour à scale 1.0 + navigation
   - Utiliser `Animated` de Reanimated pour que l'animation tourne sur le UI thread (60fps garanti)

3. **S'assurer que le background de TOUS les écrans du Stack** est `background.main` (pas de fond blanc par défaut qui flasherait pendant la transition)

### Checkpoint :
- La transition Learn → Module est fluide (fade + slide up, pas de slide latéral brut)
- La card a un micro-feedback au press (scale down léger)
- Aucun flash blanc/noir pendant la transition
- Le retour (bouton ou geste swipe back) est également fluide

---

## MISSION 4 — Nettoyage

### Actions :
1. Supprimer tout code mort lié à l'ancien système d'accordéon dans learn.tsx
2. S'assurer que le LessonHub (`src/components/lesson/LessonHub.tsx`) est toujours utilisé correctement — soit il est remplacé par le nouvel écran module/[id], soit il est adapté. Pas de duplication.
3. Vérifier que la navigation lesson/[id] fonctionne toujours correctement depuis le nouvel écran module
4. Vérifier que la progression (compléter une leçon) met bien à jour le cercle de progression du module et la card "Reprendre"

### Checkpoint :
- Parcours complet fonctionnel : Learn → tap module → voir leçons → tap leçon → exercices → retour
- La card "Reprendre" reflète la bonne position
- Aucun code d'accordéon ne subsiste
- Aucune régression sur les autres onglets (Review, Profile)
