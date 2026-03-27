# LISAAN — É12 DESIGN SYSTEM & RESKIN PREMIUM
## Prompt Claude Code — Missions séquentielles

> **Contexte :** Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe. L'app est fonctionnelle (11 étapes complétées) mais le design est générique. Ce prompt implémente un Design System premium complet et reskin toute l'app.
>
> **AVANT DE COMMENCER :** Lis le fichier `docs/LISAAN-DESIGN-SYSTEM.md` — c'est la source de vérité pour TOUTES les valeurs de design (couleurs, typo, spacing, composants, ombres). Ne jamais inventer de valeurs hors de ce document.
>
> **Skills disponibles :** Si tu as des skills dans `.claude/skills/`, lis-les avant de commencer. Elles contiennent des bonnes pratiques de design frontend.

---

## MISSION 1 — Installer la police Jost + ThemeProvider

### Actions :
1. Télécharger les fichiers de police Jost depuis Google Fonts (Regular 400, Medium 500, SemiBold 600) et les placer dans `assets/fonts/`
2. Mettre à jour le chargement des polices dans `app/_layout.tsx` : ajouter `Jost-Regular`, `Jost-Medium`, `Jost-SemiBold` dans `useFonts`. Garder `Amiri-Regular` et `Amiri-Bold` (déjà présents). **Supprimer Inter** du chargement s'il est encore référencé.
3. Créer `src/contexts/ThemeContext.tsx` :
   - Exporter un `ThemeProvider` qui wrap l'app
   - Exporter un hook `useTheme()` qui retourne le thème complet (colors, spacing, borderRadius, typography, shadows)
   - Le provider utilise un state `isDarkMode` (par défaut `false`, pas exposé dans les settings au MVP)
   - Les couleurs sont résolues dynamiquement selon `isDarkMode` via la palette light/dark
4. Réécrire `src/constants/theme.ts` avec la structure exacte du Design System : `palette` (light + dark), `spacing`, `borderRadius`, `typography`, `getShadows`. Exporter tout en `as const`.
5. Wrapper l'app avec `<ThemeProvider>` dans `app/_layout.tsx`

### Checkpoint :
- L'app démarre sans erreur
- `useTheme()` est utilisable dans n'importe quel composant
- Les polices Jost se chargent (vérifier dans le log Expo)
- Aucune référence à Inter ne subsiste dans le projet (faire un grep)

---

## MISSION 2 — Composants UI atomiques

### Actions :
1. Créer `src/components/ui/Button.tsx` :
   - Props : `variant` (`primary` | `secondary` | `ghost`), `disabled`, `onPress`, `label`, `loading`
   - Consomme `useTheme()` pour toutes les couleurs
   - Implémente les 3 variantes avec tous les états (default/pressed/disabled) selon les specs du Design System section 4.1
   - Animation `scale(0.98)` au press via `Pressable` + `Animated`
   - Typographie : Jost-SemiBold 16px

2. Créer `src/components/ui/Card.tsx` :
   - Props : `variant` (`default` | `lesson` | `exercise`), `state` (selon la variante), `children`
   - Applique fond, bordure, ombre, radius selon les specs section 4.2
   - Les ombres utilisent `getShadows()` du thème (jamais de noir)

3. Créer `src/components/ui/ProgressBar.tsx` :
   - Props : `progress` (0-1), `height` (défaut 6), `variant` (`standard` | `thin`)
   - Animation spring via Reanimated (stiffness 90, damping 15)
   - Track : `background.group`, fill : `brand.primary`, radius pill

4. Créer `src/components/ui/Toggle.tsx` :
   - Props : `value`, `onValueChange`
   - Specs section 4.6 (track 52x32, thumb 26px)
   - Animation fluide du thumb

5. Créer `src/components/ui/Badge.tsx` :
   - Props : `variant` (`status` | `difficulty` | `category`), `label`
   - Specs section 4.5

6. Créer `src/components/ui/Divider.tsx` :
   - Le micro-séparateur avec losange central (section 6.2)
   - Ligne 1px `border.subtle` + losange 4x4px centré

### Checkpoint :
- Chaque composant se rend correctement en isolation
- Tous consomment `useTheme()` — aucune couleur hardcodée
- Les animations de bouton (scale) et progress bar (spring) fonctionnent

---

## MISSION 3 — Floating Tab Bar

### Actions :
1. Réécrire `app/(tabs)/_layout.tsx` pour implémenter la tab bar flottante :
   - La tab bar ne touche PAS les bords de l'écran
   - marginHorizontal : 24, marginBottom : 24
   - borderRadius : pill (9999)
   - Hauteur : 72px
   - Fond : `background.card` à 90% opacité
   - Effet blur si possible (tester `expo-blur` ou `@react-native-community/blur`). Si le blur ne fonctionne pas bien, utiliser simplement le fond à 95% opacité — le blur est un nice-to-have, pas un bloquant.
   - Ombre : `prominent`
   - Position : `absolute`, bottom: 0
   - Icônes : 24px, couleur active `brand.primary`, inactive `text.secondary`
   - Indicateur actif : dot 4px `accent.gold` positionné 4px sous l'icône active
2. Ajouter un `paddingBottom` suffisant (minimum 96px) au contenu scrollable de chaque tab pour que le contenu ne soit pas masqué par la tab bar flottante

### Checkpoint :
- La tab bar flotte au-dessus du contenu avec les marges correctes
- Le dot or apparaît sous l'onglet actif
- Le contenu scrolle correctement derrière la tab bar
- La tab bar est visuellement "premium" (arrondie, ombre, semi-transparente)

---

## MISSION 4 — Reskin des composants arabes

### Actions :
1. **ArabicText.tsx** : Mettre à jour pour consommer `useTheme()`. Le texte arabe utilise toujours `text.heroArabic` (noir pur en light). Le lineHeight doit être à ratio 1.9. Les tailles suivent l'échelle du thème (`arabicHero`, `arabicTitle`, `arabicBody`, `arabicSmall`).

2. **LetterCard.tsx** : Appliquer le design "Hero Arabe" — la lettre est dans un carré adouci (radius xl=32, fond `background.group`), padding massif (hero=64). Ombre subtle. La lettre en `arabicHero` (48px) ou `arabicDisplay` (64px) centrée.

3. **DiacriticCard.tsx** : Même traitement que LetterCard — carré adouci, fond `background.group`, texte arabe hero centré.

4. **SyllableDisplay.tsx** : Fond `background.group`, radius md, padding généreux. Syllabes en `arabicBody` (28px).

5. **WordCard.tsx** : Card standard (fond `background.card`, radius md, ombre subtle). Mot arabe en `arabicTitle` (36px), translitération en Jost-Regular `text.secondary` 14px.

6. **SentenceCard.tsx** : Card standard. Phrase arabe en `arabicBody` (28px), traduction en Jost-Regular `text.secondary` 16px.

7. **RootFamilyDisplay.tsx** : Fond `background.group`, radius lg. Racine en `arabicTitle`, mots dérivés en `arabicBody`.

8. **DialogueDisplay.tsx** : Cards alternées avec léger décalage visuel. Texte arabe en `arabicBody`.

9. **HarakatToggle.tsx** : Utiliser le composant Toggle créé en Mission 2.

### Checkpoint :
- Tout le texte arabe utilise Amiri avec lineHeight 1.9
- Les harakats (diacritiques) ne sont jamais coupés
- Les cartes de lettres ont l'effet "vitrine" avec fond sable et padding massif
- Aucune couleur hardcodée dans les composants arabes

---

## MISSION 5 — Reskin des composants exercices

### Actions :
1. **MCQExercise.tsx** : Les options de réponse utilisent le composant Card variant `exercise` avec les 4 états (default, selected, correct, incorrect). Animation shake sur incorrect. Bordure 2px émeraude sur selected.

2. **MatchExercise.tsx** : Même système de cards exercice. Les paires matched changent d'état visuel (fond `brand.light`).

3. **FillBlankExercise.tsx** : Le champ vide est un rectangle arrondi (radius sm) en pointillés (`border.medium`). Quand rempli, le fond passe à `brand.light`.

4. **ExerciseRenderer.tsx** : S'assurer qu'il utilise le fond `background.main` et que la zone de question Hero est correctement stylée (carré adouci 160x160, radius xl, fond `background.group`, texte `arabicDisplay` 64px centré).

5. **index.ts** (exercise registry) : Pas de changement visuel, juste s'assurer que les imports sont corrects.

### Checkpoint :
- Les QCM sont en mode "distraction-free" (pas de header lourd)
- L'état selected a une bordure émeraude visible
- L'état correct est vert pâle, incorrect est rose pâle (jamais rouge agressif)
- Le texte arabe hero flotte au centre avec beaucoup d'espace

---

## MISSION 6 — Reskin écran Learn (tab)

### Actions :
1. Réécrire `app/(tabs)/learn.tsx` selon les directives section 7.1 :
   - Fond `background.main`
   - Header : "Lisaan" (Jost-SemiBold, h2, `text.primary`) à gauche + chip streak à droite (fond `background.card`, radius md, ombre subtle, icône flamme `accent.gold` + compteur)
   - Les modules sont des cards empilées (gap 24)
   - Chaque card module : titre arabe massif à droite (`arabicTitle`, 36px), "MODULE N" uppercase à gauche (`text.secondary`, tiny 12px, letterSpacing 1) + titre français (`text.primary`, body 16px)
   - Barre de progression fine (4px) intégrée au bas de chaque card
   - Les leçons à l'intérieur du module utilisent le composant Card variant `lesson` avec les 4 états
2. Supprimer tout texte de progression "x/y" — le remplacer par des barres de progression graphiques

### Checkpoint :
- L'écran Learn a un aspect éditorial et aéré
- Le texte arabe des modules est grand et mis en valeur
- La progression est graphique (barres), pas textuelle
- Le chip streak avec la flamme dorée est visible en haut à droite

---

## MISSION 7 — Reskin écrans Lesson + Exercises

### Actions :
1. **lesson/[id].tsx** (LessonHub) : Fond `background.main`. Header minimaliste (flèche retour + titre de la leçon centré, Jost-Medium h2). Les sections utilisent les cards standards. Boutons "Relire" et "S'exercer" utilisent les composants Button (secondary et primary).

2. **lesson/[id]/exercises.tsx** + **exercise/[id].tsx** : Interface distraction-free :
   - Fond `background.main`
   - Header : croix de fermeture (X) à gauche (`text.secondary`, 24px) + barre de progression ultra-fine en haut (4px)
   - Zone hero au centre de l'écran
   - Bouton "Valider" : Button primary en safe area basse (hauteur 56, pill, fond `brand.primary`)

3. **SectionPlayer.tsx** : Intégrer les nouvelles cards et le nouveau style. Le contenu pédagogique (texte de leçon) utilise Jost-Regular body 16px pour le français, Amiri arabicBody 28px pour l'arabe.

### Checkpoint :
- L'écran d'exercice est clean et focalisé (distraction-free)
- Le bouton Valider est un beau pill émeraude en bas
- La barre de progression fine est visible en haut
- La navigation retour est une simple croix, pas un header lourd

---

## MISSION 8 — Reskin écrans Review + Review Session

### Actions :
1. **app/(tabs)/review.tsx** : Fond `background.main`. Cards de révision SRS avec le style Card standard. Afficher le nombre de cartes dues avec un Badge variant `status`. Si aucune carte due, afficher un empty state avec le pattern Zellige subtil en fond (si réalisable, sinon un simple message stylé).

2. **review-session.tsx** : Même interface distraction-free que les exercices. Zone hero pour la carte SRS, options de réponse en cards exercice.

### Checkpoint :
- L'onglet Review est visuellement cohérent avec Learn
- La review session est immersive et focalisée

---

## MISSION 9 — Reskin écran Profil + Settings

### Actions :
1. **app/(tabs)/profile.tsx** :
   - Fond `background.main`
   - **Top Card Stats** : fond `background.card`, radius lg=24, ombre medium, padding 24. Flex-row, 3 colonnes séparées par lignes 1px `border.subtle`. Chaque colonne : icône + valeur (Jost-SemiBold, h1=24px, `text.primary`) + label (tiny 12px, `text.secondary`). Icône flamme `accent.gold`, étoile `accent.gold`, trophée `accent.gold`.
   - **Section Badges** : conteneur fond `background.group`, radius lg=24, padding 24. Header "BADGES · n/10" (Jost-Medium, tiny 12px, uppercase, `text.secondary`, letterSpacing 1). Grille 3x3, gap 16. Badge verrouillé : 80x80, fond `background.card` à 50% opacité, radius md, silhouette cadenas `status.disabled`. Badge débloqué : 80x80, fond `background.card`, ombre subtle, accents `accent.gold`.
   - **Settings intégrés** dans le profil (ou lien vers settings) : les SettingRow utilisent le style ligne 64px avec toggle

2. **SettingRow.tsx** : Hauteur 64, flex-row space-between, padding-X 20. Bordure basse 1px `border.subtle` (sauf dernière). Label Jost-Medium body 16px `text.primary`. Valeur/toggle à droite.

3. **Card Preview Hero** (en haut des réglages d'affichage) : fond `background.card`, radius md, ombre subtle, padding 32. Texte arabe centré كِتَابٌ en `arabicHero` 48px + sous-titre "kitābun" `text.secondary` body 16px.

### Checkpoint :
- L'écran profil est élégant avec la card stats en haut
- Les badges verrouillés sont en silhouette grise discrète
- La preview live du texte arabe dans les réglages fonctionne
- Les toggles utilisent le nouveau composant Toggle

---

## MISSION 10 — Reskin Onboarding

### Actions :
1. **OnboardingShell.tsx** : Fond `background.main`. Barre de progression fine en haut (5 étapes). Titre de l'étape en Jost-SemiBold h1. Sous-titre en Jost-Regular body `text.secondary`.

2. **OptionCard.tsx** : Utiliser le style Card exercice. État default : fond `background.card`, border 1px `border.subtle`. État selected : fond `brand.light`, border 2px `brand.primary`.

3. **step1-5.tsx** : S'assurer que chaque écran utilise le shell et les cards uniformément. Le bouton "Continuer" est un Button primary (pill émeraude).

4. **recommendation.tsx** : Écran de recommandation avec les barres de pertinence colorées (remplissage `brand.primary`, track `background.group`). Message personnalisé en Jost-Regular. Bouton "Commencer" : Button primary large.

### Checkpoint :
- L'onboarding est clean et premium dès le premier écran
- Les options sélectionnées ont la bordure émeraude
- Le bouton Continuer est un pill émeraude
- L'écran de recommandation est engageant

---

## MISSION 11 — Modales et écrans spéciaux

### Actions :
1. **ModuleCompleteScreen.tsx** : Fond `background.main`. Titre "Module complété !" en Jost-SemiBold h1 `brand.primary`. Pattern Zellige subtil en fond (si réalisable, sinon fond uni). Icône de succès avec accents `accent.gold`. Bouton "Continuer" : Button primary.

2. **BadgeUnlockModal.tsx** : Modal avec fond overlay sombre (50% opacité). Card centrale fond `background.card`, radius lg, ombre prominent. Badge débloqué avec accents or. Pattern Zellige en fond de la card (2-4% opacité).

3. **StreakCelebration.tsx** : Animation de la flamme `accent.gold`. Texte de félicitation en Jost-SemiBold.

4. **XPFloatingLabel.tsx** : Label flottant "+X XP" en Jost-SemiBold, couleur `brand.primary`, animation fade-up.

5. **ContentDownloadScreen.tsx** : Fond `background.main`. Barre de progression centrée. Texte "Préparation du contenu..." en Jost-Regular body `text.secondary`.

6. **NetworkErrorScreen.tsx** : Style cohérent avec le thème.

### Checkpoint :
- La modale de badge est visuellement récompensante (accents or, ombre forte)
- Le streak celebration utilise la couleur or
- Tous les écrans spéciaux sont visuellement cohérents avec le reste

---

## MISSION 12 — Nettoyage final

### Actions :
1. **Grep global** pour trouver et éliminer :
   - Toute couleur hex hardcodée (chercher `#` dans les fichiers .tsx/.ts, sauf dans theme.ts)
   - Toute référence à "Inter" (remplacer par Jost)
   - Toute utilisation de `StyleSheet.create` avec des valeurs qui devraient venir du thème
   - Tout `fontSize` qui ne correspond pas à l'échelle typographique du thème

2. **Vérifier la cohérence** : chaque écran utilise `useTheme()`, chaque composant consomme le thème

3. **Tester visuellement** :
   - Le texte arabe avec harakats n'est jamais coupé (lineHeight 1.9)
   - Les ombres sont teintées émeraude (pas noires)
   - La tab bar flotte correctement
   - Les animations de boutons et progress bars fonctionnent
   - Le fond de l'app est `#FDFBF7` (blanc cassé chaleureux), PAS blanc pur

4. **Supprimer les anciens tokens** : si `src/constants/theme.ts` contenait d'anciens tokens pré-reskin, s'assurer qu'ils sont entièrement remplacés par les nouveaux

### Checkpoint final :
- `grep -rn '#[0-9a-fA-F]\{6\}' src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v constants` ne retourne rien (aucune couleur hardcodée hors du fichier thème)
- `grep -rn 'Inter' src/ app/` ne retourne rien
- L'app démarre, navigue entre tous les onglets, ouvre une leçon, fait un exercice, le tout avec le nouveau design
- L'expérience visuelle est "premium et sereine" — pas "prototype fonctionnel"

---

## NOTES IMPORTANTES

### Ce qui NE DOIT PAS changer :
- La logique métier (SRS, exercise engine, generators, sync, progression)
- La structure de navigation (Expo Router, tabs, routes)
- Le schéma SQLite et les queries
- Les stores Zustand
- Les hooks de données

### Ce qui DOIT changer :
- TOUT le stylisme visuel (couleurs, fonts, spacing, radius, shadows)
- Les composants UI (boutons, cards, toggles, progress bars, tab bar)
- La mise en page des écrans (espacement, hiérarchie visuelle)
- La police UI (Inter → Jost)

### Ordre d'exécution :
Exécuter les missions dans l'ordre 1 → 12. Chaque mission dépend de la précédente. Ne pas sauter de mission. Valider chaque checkpoint avant de passer à la suite.
