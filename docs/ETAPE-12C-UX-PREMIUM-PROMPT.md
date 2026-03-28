# LISAAN — É12c UX PREMIUM
## Prompt Claude Code — Missions séquentielles

> **Contexte :** Le reskin É12 (Design System, tokens, composants atomiques) est terminé. Cette étape améliore l'UX : layout Bento pour Learn, exercices premium avec haptics, profil "tableau d'honneur", réglages avec bottom sheets enrichies, tap-pour-révéler, et transitions fluides.
>
> **AVANT DE COMMENCER :** Relis `docs/LISAAN-DESIGN-SYSTEM.md` — source de vérité pour TOUS les tokens visuels. Utilise `useTheme()` partout. Aucune couleur hardcodée.
>
> **Ce qui NE DOIT PAS changer :** engines/*, db/*, stores/*, hooks/*, types/*, le SRS, la sync, les routes Expo Router existantes.

---

## MISSION 1 — Layout Bento pour l'écran Learn

L'écran Learn utilise actuellement un accordéon (les leçons se déplient sous le module). On passe à un layout **Bento asymétrique** : le module actif est une carte Hero full-width, les modules complétés et verrouillés sont des cartes carrées 2 par ligne.

### Actions :

1. **Créer `src/components/ui/CircleProgress.tsx`** — Cercle de progression SVG :
   - Props : `progress` (0-1), `size` (défaut 48), `strokeWidth` (défaut 3), `label` (ex: "5/7")
   - Track : stroke `background.group`
   - Fill : stroke `brand.primary`, animé avec Reanimated (spring)
   - Label centré : Jost-Medium, small 14px, `text.primary`

2. **Créer 3 sous-composants de card module :**

   **a) `src/components/learn/HeroModuleCard.tsx`** — Le module en cours (full-width) :
   - Largeur : 100%. Hauteur minimum : 220px
   - Fond `background.card`, ombre `medium`, bordure 2px `brand.primary`, radius `md` (16)
   - Haut-Gauche : badge "EN COURS" (fond `brand.light`, texte `brand.dark`, Jost-Medium small 14px)
   - Centre : titre arabe massif (`arabicHero` 48px, `text.heroArabic`, très aéré)
   - Bas : flex-row. Gauche : bouton primaire "Continuer" (pill). Droite : CircleProgress (48x48)
   - Sous le titre arabe : "MODULE N" (Jost-Medium, tiny 12px, uppercase, `text.secondary`) + titre français (Jost-Regular, body 16px, `text.primary`)
   - **Micro-interaction press :** scale 0.98 + ombre passe de `medium` à `prominent` (100ms, Reanimated UI thread)
   - Le tap sur "Continuer" navigue vers la dernière leçon non complétée. Le tap sur la card elle-même navigue vers la page de détail du module.

   **b) `src/components/learn/CompletedModuleCard.tsx`** — Module terminé (carré, 2 par ligne) :
   - Largeur : 47-48% (avec gap, 2 par ligne). AspectRatio 1:1
   - Fond `background.card`, ombre `subtle`, radius `md` (16)
   - Haut-Droite : icône checkmark ronde (fond `status.successLight`, icône `status.success`, 24x24)
   - Centre : calligraphie arabe (`arabicBody` 28px, `text.heroArabic`)
   - Bas-Gauche : titre français (`text.secondary`, small 14px, 2 lignes max, tronqué)
   - Le tap navigue vers la page de détail du module

   **c) `src/components/learn/LockedModuleCard.tsx`** — Module verrouillé (carré, 2 par ligne) :
   - Largeur : 47-48%. AspectRatio 1:1
   - Fond `background.group` (sable), aucune ombre (elevation 0), radius `md` (16)
   - Centre : calligraphie arabe du module en filigrane (couleur `text.primary` à 5-10% opacité)
   - Pas de cadenas visible, juste le titre arabe fantôme
   - Le tap ne fait rien (ou feedback léger "Module verrouillé")

3. **Réécrire `app/(tabs)/learn.tsx`** :
   - Fond `background.main`
   - Header : "Lisaan" (Jost-SemiBold, h2) à gauche + chip streak à droite (fond `background.card`, radius md, ombre subtle, icône flamme `accent.gold` + compteur)
   - Logique de tri des modules :
     - Trouver le premier module `in_progress` (ou le dernier débloqué) → `HeroModuleCard`
     - Filtrer les modules `completed` → grille de `CompletedModuleCard`
     - Filtrer les modules `locked` → grille de `LockedModuleCard`
   - Layout : ScrollView vertical. Hero card en premier (full-width), puis les cartes complétées et verrouillées dans un conteneur flex-row wrap avec gap 16px
   - Padding-X 24px sur le ScrollView
   - PaddingBottom suffisant (96px+) pour la floating tab bar

4. **Supprimer toute logique d'accordéon** (expand/collapse des leçons dans learn.tsx)

### Checkpoint :
- L'écran Learn montre une carte Hero massive pour le module actif
- Les modules complétés sont en grille carrée 2x2
- Les modules verrouillés ont la calligraphie fantôme sans cadenas
- Le cercle de progression SVG fonctionne et s'anime
- Taper sur "Continuer" du Hero navigue vers la bonne leçon

---

## MISSION 2 — Page de détail du module (Drill-down)

Taper sur une card module (Hero ou Completed) ouvre une page dédiée listant les leçons.

### Actions :

1. **Créer `app/module/[id].tsx`** (ou adapter une route existante) :
   - `headerShown: false` (on fait un header custom)
   - Fond `background.main`

2. **Header custom :**
   - Bouton retour : cercle 40x40, fond `background.card` à 80% opacité, icône flèche gauche (`text.primary`), ombre `subtle`, positionné en haut à gauche (padding 24)
   - Zone titre (sous le bouton retour, padding-X 24) :
     - "MODULE N" (Jost-Medium, tiny 12px, uppercase, `text.secondary`, letterSpacing 1)
     - Titre français (Jost-SemiBold, h1 24px, `text.primary`)
     - Titre arabe (Amiri, `arabicTitle` 36px, `text.heroArabic`)
     - CircleProgress du module

3. **Liste des leçons avec effet stagger :**
   - Utiliser `FadeInDown` de `react-native-reanimated` avec délai en cascade (leçon 1 à 0ms, leçon 2 à 50ms, leçon 3 à 100ms, etc.)
   - Chaque leçon est une row (padding-X 24, hauteur min 64) :
     - Gauche : numéro (`text.secondary`, small 14px, width fixe 32px)
     - Centre : titre français (Jost-Regular, body 16px, `text.primary`)
     - Droite : titre arabe (Amiri, `arabicBody` 28px)
   - Statuts visuels :
     - `locked` : opacité 0.4, pas cliquable
     - `available` : opacité 1.0, cliquable
     - `in_progress` : opacité 1.0, petit dot `brand.primary` à côté du numéro
     - `completed` : opacité 0.6, pastille check `status.success` à droite
   - Séparateur : ligne 1px `border.subtle` entre chaque leçon
   - Tap sur une leçon → navigue vers `lesson/[id]` (comportement existant)

4. **Transition d'entrée (depuis Learn) :**
   - Configurer la transition du Stack pour cette route : Fade In + TranslateY (de +40px à 0px)
   - Courbe : spring douce (damping 20, stiffness 90) ou bezier (0.25, 1, 0.5, 1) sur 350ms
   - Le fond du Stack Navigator = `background.main` (pas de flash blanc/noir)

### Checkpoint :
- Taper un module dans Learn ouvre la page détail avec animation fluide (pas de slide latéral)
- Les leçons apparaissent en cascade (stagger effect)
- Le bouton retour ramène à Learn
- Les statuts de leçons sont visuellement distincts
- Le swipe-back fonctionne

---

## MISSION 3 — Exercices premium (feedback, haptics, séquence de validation)

### Actions :

1. **MCQExercise.tsx — améliorer la séquence de validation :**
   - Le bouton "Valider" est désactivé (`status.disabled`, fond grisé) tant qu'aucune option n'est sélectionnée
   - Sur bonne réponse :
     - Card sélectionnée → fond `status.successLight`, bordure `status.success`, texte `status.success`
     - Haptic feedback type "Success" (via `expo-haptics` : `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`)
     - Le bouton "Valider" devient "Continuer" (transition par passage à la question suivante, ou après 800ms auto)
   - Sur mauvaise réponse :
     - Card sélectionnée → fond `status.errorLight`, bordure `status.error`, texte `status.error`
     - Animation shake (Reanimated : translateX oscillation ±10px, 3 aller-retours, 300ms)
     - Haptic feedback type "Error" (`Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)`)
     - La bonne réponse s'illumine en vert simultanément
   - Installer `expo-haptics` si pas déjà présent (`npx expo install expo-haptics`)

2. **MatchExercise.tsx — améliorer les feedbacks :**
   - Sélection d'une carte : fond `brand.light`, bordure 2px `brand.primary`
   - Match correct : les deux cartes passent en vert (`status.success`). Haptic success. Après 600ms, les deux se grisent (opacité 0.5, `status.disabled`)
   - Match incorrect : les deux passent en rouge (`status.error`). Haptic error. Shake sur la seconde. Après 800ms, retour à l'état par défaut

3. **FillBlankExercise.tsx — améliorer le champ de saisie :**
   - État focus : bordure 2px `brand.primary`
   - Correct : champ fond `status.successLight`, bordure `status.success`
   - Incorrect : champ fond `status.errorLight`, bordure `status.error`. La bonne réponse s'affiche en dessous en vert

4. **Confirmation de sortie :**
   - La croix de fermeture (X) dans le header des exercices doit demander confirmation : "Veux-tu vraiment quitter la leçon ? Ta progression sera perdue."
   - Utiliser un `Alert.alert()` natif (simple et efficace), pas une modale custom

### Checkpoint :
- Les haptics se déclenchent (tester sur device physique, pas simulateur)
- L'animation shake est visible sur mauvaise réponse
- La bonne réponse s'illumine en vert quand on se trompe
- Le bouton Valider est grisé quand rien n'est sélectionné
- La croix X demande confirmation avant de quitter

---

## MISSION 4 — Écran Profil refondu ("Tableau d'honneur")

### Actions :

1. **Réécrire `app/(tabs)/profile.tsx`** :
   - Fond `background.main`
   - Header : titre "Mon Parcours" centré (Jost-Medium, h2, `text.primary`) + icône rouage (Settings) en haut à droite (`text.secondary`)

2. **Zone Identité (haut) :**
   - Centré horizontalement, padding vertical 32px
   - Avatar : cercle 80x80, fond `brand.light`, bordure 2px `brand.primary`. Au centre : initiale de l'utilisateur (Jost-SemiBold, h1 24px, `brand.dark`). Récupérer l'initiale depuis le display_name ou l'email.
   - Nom : Jost-SemiBold, h1 24px, `text.primary`, margin-top 16
   - Date d'inscription : Jost-Regular, small 14px, `text.secondary`. Format "Membre depuis [mois année]"

3. **Zone Dashboard SRS (carte unifiée) :**
   - Grande carte horizontale. Fond `background.card`, radius lg=24, ombre `medium`, padding 24, margin-X 24, margin-top 24
   - Flex-row, 3 colonnes séparées par lignes verticales 1px `border.subtle`
   - Col 1 : icône flamme `accent.gold` + valeur streak (Jost-SemiBold, h1 24px, `brand.dark`) + "jours" (Jost-Regular, tiny 12px, `text.secondary`)
   - Col 2 : icône étoile `brand.primary` + XP total + "XP total"
   - Col 3 : icône couronne `accent.gold` + streak record + "record"

4. **Zone Badges "Mes Accomplissements" :**
   - Grand conteneur fond `background.group`, radius lg=24 (radius supérieur uniquement si possible, sinon lg partout), padding 24, margin-top 32
   - Titre : "MES ACCOMPLISSEMENTS" (Jost-SemiBold, tiny 12px, uppercase, `text.secondary`, letterSpacing 1, margin-bottom 16)
   - Grille 3 colonnes, gap 16
   - Badge débloqué : carré aspect-ratio 1:1, fond `background.card`, ombre `subtle`, radius md=16. Contenu : icône/illustration avec accents `accent.gold`. Label sous le badge (Jost-Regular, tiny 12px, `text.primary`)
   - Badge verrouillé : carré aspect-ratio 1:1, fond `background.card` à 50% opacité, radius md=16. **PAS DE CADENAS.** Afficher le contenu du badge en silhouette grise unie (`status.disabled`, opacité 0.3). Label "???" sous le badge (Jost-Regular, tiny 12px, `text.secondary`)

### Checkpoint :
- L'avatar avec initiale est visible en haut
- La carte stats est unifiée et élégante (3 colonnes avec icônes)
- Les badges verrouillés n'ont PAS de cadenas — juste une silhouette grise
- Le titre est "MES ACCOMPLISSEMENTS" pas "BADGES"

---

## MISSION 5 — Réglages avec Bottom Sheets enrichies

### Actions :

1. **Créer `src/components/ui/BottomSheet.tsx`** — composant bottom sheet réutilisable :
   - Props : `visible`, `onClose`, `title`, `children`
   - Fond `background.card`, border-radius supérieur lg=24
   - Drag handle : pilule 40x4px centrée, fond `background.group`
   - Titre centré : Jost-Medium, h2 20px, `text.primary`
   - Overlay : fond noir à 30% opacité, tap pour fermer
   - Animation d'entrée : slide up depuis le bas (Reanimated ou `Modal` natif)

2. **Créer `src/components/ui/RichSelectionRow.tsx`** — pour les choix conceptuels (harakats, translittération, etc.) :
   - Props : `title`, `subtitle`, `selected`, `onPress`
   - Hauteur min 72px, padding vertical 16, padding-X 24
   - Gauche : titre (Jost-Medium, body 16px, `text.primary`) + sous-titre (Jost-Regular, small 14px, `text.secondary`)
   - Droite : checkmark `brand.primary` si sélectionné, rien sinon
   - État sélectionné : fond `brand.light`, titre `brand.primary`, sous-titre `brand.dark`
   - Haptic "Selection" au tap

3. **Créer `src/components/ui/SegmentedControl.tsx`** — pour les choix quantitatifs (taille du texte) :
   - Props : `options` (tableau de { label, value }), `selectedValue`, `onValueChange`
   - Conteneur : fond `background.group`, radius pill, hauteur 56px
   - Thumb animé : fond `background.card`, ombre `subtle`, radius pill — glisse avec spring
   - Segment actif : texte/icône `brand.primary`. Inactif : `text.secondary`
   - Haptic "Selection" à chaque changement
   - Pour la taille du texte spécifiquement : afficher la lettre أ en 3 tailles croissantes comme labels des segments

4. **Refactorer les réglages dans profile.tsx** (ou l'écran Settings séparé si existant) :
   - La Preview Hero (كِتَابٌ) se met à jour en temps réel avec un fade (Reanimated) quand un réglage change
   - Les lignes de réglages : fond transparent. Texte gauche (Jost-Medium, body 16px, `text.primary`). Valeur actuelle dans un chip à droite (fond `brand.light`, texte `brand.dark`, radius sm). Chevron `>` après le chip.
   - Tap sur une ligne → ouvre la BottomSheet correspondante
   - Fermeture auto de la BottomSheet 300ms après sélection

5. **Textes descriptifs des modes** (à intégrer dans les RichSelectionRow) :
   - "Toujours affichés" → "Visible en permanence pendant les leçons."
   - "Tap pour révéler" → "Masqué par défaut. Touchez l'écran en cas de doute."
   - "Adaptatif" → "Disparaît progressivement selon votre maîtrise." (+ badge "Recommandé" si pertinent)
   - "Masqués" → "Totalement invisible. Pour un défi maximal."

6. **Le réglage Taille du texte** utilise le SegmentedControl avec 3 segments (أ petit / أ moyen / أ grand) au lieu d'une liste verticale

### Checkpoint :
- Les bottom sheets s'ouvrent depuis le bas avec drag handle
- Les RichSelectionRow affichent titre + sous-titre explicatif
- Le SegmentedControl de taille a le thumb animé
- La preview كِتَابٌ se met à jour en temps réel
- Les haptics se déclenchent à chaque sélection
- Les bottom sheets se ferment auto après sélection

---

## MISSION 6 — Tap-pour-révéler (interaction in-situ)

### Actions :

1. **Modifier `src/components/arabic/ArabicText.tsx`** pour supporter le tap-pour-révéler :
   - Nouveau prop : `revealMode` (`'always'` | `'tap'` | `'hidden'`)
   - Si `revealMode === 'tap'` :
     - Harakats : le mot s'affiche sans diacritiques. Un tap simple sur le mot déclenche un `FadeIn` (Reanimated, 200ms) des harakats. Un second tap les re-masque.
     - **Important :** le `lineHeight` (1.9) ne doit JAMAIS changer entre l'état avec/sans harakats — pas de saut de mise en page
   - Si `revealMode === 'hidden'` : jamais de harakats
   - Si `revealMode === 'always'` : harakats toujours visibles

2. **Ajouter le tap-pour-révéler sur la translittération et la traduction :**
   - Quand le mode est `'tap'`, à la place du texte, afficher un indicateur discret : "···" en pointillés (`text.secondary` à 30% opacité)
   - Un tap sur cette zone fait apparaître le texte avec `FadeIn` (200ms)
   - Un second tap re-masque

3. **Connecter au settings store :**
   - Lire `harakats_mode`, `transliteration_mode`, `translation_mode` depuis le store
   - Mapper les valeurs du store vers le `revealMode` du composant
   - Le mode par défaut pour les nouveaux utilisateurs devrait être `'tap'` (pas `'always'`)

4. **Appliquer dans les composants qui affichent du texte arabe :**
   - WordCard, SentenceCard, et les composants d'exercice
   - Dans les exercices : le mode tap-pour-révéler est un "filet de sécurité" — l'utilisateur peut vérifier les harakats s'il doute, mais ils ne sont pas affichés par défaut

### Checkpoint :
- En mode "tap", le mot arabe s'affiche sans harakats
- Taper sur le mot fait apparaître les harakats en fade (200ms)
- Taper à nouveau les masque
- La translittération montre "···" en mode tap, et le texte apparaît au tap
- Aucun saut de layout quand les harakats apparaissent/disparaissent
- Le lineHeight reste constant (1.9)

---

## MISSION 7 — Transitions et polish final

### Actions :

1. **Micro-interaction sur toutes les cards cliquables :**
   - HeroModuleCard, CompletedModuleCard, cards de leçon : scale 0.98 au `onPressIn` (Reanimated, 100ms), retour à 1.0 au `onPressOut`
   - Utiliser `Pressable` + `useAnimatedStyle` pour que l'animation soit sur le UI thread

2. **Transition Learn → Module :**
   - Déjà spécifié en Mission 2, vérifier que c'est bien fade+translateY et pas le slide par défaut

3. **Vérifier le fond de TOUS les écrans :**
   - Chaque écran et chaque Stack Navigator doit avoir `background.main` comme fond par défaut
   - Aucun flash blanc ou noir pendant les transitions

4. **PaddingBottom sur tous les écrans à tabs :**
   - Learn, Review, Profile : paddingBottom minimum 96px pour la floating tab bar

5. **Nettoyage :**
   - Supprimer tout code mort lié à l'ancien accordéon
   - Vérifier qu'aucun composant n'importe encore l'ancien layout de learn.tsx
   - Grep pour des couleurs hardcodées qui auraient été ajoutées

### Checkpoint final :
- Parcours complet : Learn (Bento) → tap module → leçons (stagger) → tap leçon → exercice (haptics, shake, valider/continuer) → retour
- Profile : avatar, stats, accomplissements
- Réglages : bottom sheets, segmented control taille, preview live
- Tap-pour-révéler fonctionne partout
- Toutes les transitions sont fluides (pas de slide latéral brut, pas de flash)
- L'app donne l'impression d'un produit premium, pas d'un prototype
