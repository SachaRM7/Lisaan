# 7. ARCHITECTURE "BENTO" (ÉCRAN D'ACCUEIL)
L'écran "Apprendre" utilise un Bento Layout pour hiérarchiser l'apprentissage. La logique est asymétrique : le module actif est immense, les autres sont compacts.

## A. La Grille (Container)
- **Layout :** Flexbox avec `flexWrap: 'wrap'`, `flexDirection: 'row'`, et `justifyContent: 'space-between'`.
- **Espacements :** Padding horizontal de l'écran `24px`. Gap (espace entre les cartes) `16px`.

## B. Composant 1 : La Carte "Héro" (Module Actif)
C'est le module en cours d'apprentissage. Il doit capter toute l'attention.
- **Taille :** Largeur 100% (prend toute la ligne). Hauteur généreuse (min 220px).
- **Design :** Fond `background.card`, Ombre `medium`. Bordure 2px `brand.primary`.
- **Contenu :**
  - Haut-Gauche : Badge "EN COURS" (Fond `brand.light`, Texte `brand.dark`, `uiSmall`).
  - Centre : Calligraphie arabe massive (`arabicHero` 48px ou plus, très aérée).
  - Bas : Ligne Flex-row. À gauche, un grand bouton primaire "Continuer". À droite, le grand cercle de progression.

## C. Composant 2 : Les Cartes "Complétées" (Historique)
Ce sont les anciens modules, consultables pour réviser.
- **Taille :** Largeur `47%` à `48%` (pour en placer deux par ligne avec le gap). Format carré (AspectRatio 1:1).
- **Design :** Fond `background.card`, Ombre `subtle`.
- **Contenu :** - Haut-Droite : Une icône de validation (Checkmark ronde, fond `status.successLight`, icône `status.success`).
  - Centre : Calligraphie arabe de taille moyenne (`arabicBody` 28px).
  - Bas-Gauche : Titre du module en français (`text.secondary`, `uiSmall` 14px, 1 ou 2 lignes max, tronqué si trop long).

## D. Composant 3 : Les Cartes "Verrouillées" (Futur)
Ce sont les modules inaccessibles. Ils doivent susciter l'envie sans distraire.
- **Taille :** Largeur `47%` à `48%`. Format carré.
- **Design :** Fond `background.group` (Sable), Aucune ombre (élévation 0).
- **Contenu :** - Centre : Une icône Cadenas minimaliste (`status.disabled`). 
  - Fond de la carte : La calligraphie arabe du module en "filigrane" absolu (Couleur `text.primary` avec opacité à 5% ou 10% maximum).

Ton système actuel qui détermine si un module est locked, in_progress ou completed est parfaitement valide.

La seule différence, c'est la façon dont ton composant React va filtrer et afficher ces données. Au lieu de faire un simple .map() sur tout ton tableau de modules, ton écran d'accueil fera un tri rapide :

Il cherche le premier module in_progress (ou le dernier débloqué) et le passe au composant Hero Card.

Il filtre tous les modules completed et les passe à la grille en tant que Cartes Historique.

Il filtre les modules locked et les affiche en tant que Cartes Verrouillées.

# 8. ARCHITECTURE DE L'ÉCRAN EXERCICE (QCM DISTRACTION-FREE)
Cet écran est le cœur de l'apprentissage. L'interface doit s'effacer totalement au profit de la calligraphie arabe. L'expérience doit être fluide, tactile, avec d'excellents retours visuels et haptiques.

## A. Layout Global (Distraction-Free)
- **Fond d'écran :** `background.main` (`#FDFBF7`).
- **Safe Area :** Gérer impérativement le `SafeAreaView` en haut (encoche) et en bas (barre d'accueil iOS).
- **Header Minimaliste :**
  - Barre de progression : Épaisseur 4px, collée tout en haut de l'écran (sans padding top). Couleur de fond `background.group`, Remplissage `brand.primary` avec animation de largeur fluide (Reanimated).
  - Bouton Fermer (Croix) : Flottant en haut à gauche (Padding 24px), icône couleur `text.secondary`. Demande toujours une confirmation avant de quitter ("Voulez-vous vraiment quitter la leçon ?").

## B. La Zone "Hero" (La Question)
- **Positionnement :** Flex: 1, centré verticalement et horizontalement.
- **Conteneur :** Un carré aux angles très arrondis (Radius 32px), fond `background.group` (Sable) pour créer un effet d'écrin. Dimensions : ~160x160px (ou adaptatif selon le mot).
- **Typographie :** La lettre ou le mot en arabe doit être GIGANTESQUE (`arabicHero` 48px ou 64px). `lineHeight` strict de 1.9 pour protéger les Harakats. Couleur `text.heroArabic` (Noir pur).

## C. La Zone "Options" (Les Réponses)
- **Layout :** FlexBox vertical en bas de l'écran, juste au-dessus du bouton principal. Padding horizontal de 24px, gap de 16px entre les options.
- **Design de l'Option (Card) :** - Hauteur minimale : 64px. Radius : 16px.
  - État par défaut : Fond `background.card`, Bordure 1px `background.group`. Ombre `subtle`. Texte centré `text.primary` (16px, Medium).
  - État Sélectionné : Fond `brand.light`, Bordure 2px `brand.primary`. Ombre `medium`. Texte `brand.primary`.

## D. Le Bouton d'Action & Retours Visuels
- **Bouton "Valider" :** Bouton primaire (Radius pill, Hauteur 56px) épinglé en bas (Bottom 24px). Il est désactivé (`status.disabled`) tant qu'aucune option n'est sélectionnée.
- **Séquence de Validation (Crucial pour la sensation Premium) :**
  Lorsque l'utilisateur clique sur "Valider" :
  1. **Si Bonne Réponse :**
     - La carte de l'option sélectionnée passe en fond `status.successLight`, bordure `status.success`, texte `status.success`.
     - Déclencher un Haptic Feedback de type "Success".
     - Le bouton "Valider" devient "Continuer" (ou passe à la question suivante après 800ms automatiquement).
  2. **Si Mauvaise Réponse :**
     - La carte de l'option passe en fond `status.errorLight`, bordure `status.error`, texte `status.error`.
     - **Animation (Reanimated) :** La carte fait un "Shake" (secousse horizontale gauche/droite de 10px, 3 allers-retours rapides).
     - Déclencher un Haptic Feedback de type "Error" ou "Heavy".
     - La bonne réponse s'illumine en Vert pour corriger l'utilisateur.


# 9. LIBRAIRIE DE DESIGNS D'EXERCICES (UX & INTERACTION)
Objectif : Créer un moteur d'exercices haut de gamme, fluide et cohérent. Tous les exercices doivent utiliser l'interface "Distraction-Free" (Fond `background.main`, Header minimaliste avec barre de progression fine, Confirmation avant de quitter). L'arabe est le héros, magnifié dans un écrin Sable (`background.group`).

## A. La "Grammaire Visuelle" Commune (Principes Fondamentaux)
Peu importe le type d'exercice, ces règles s'appliquent :

1. **L'Écrin Arabe (Hero Area) :**
   - Le caractère, le mot ou la phrase arabe à étudier flotte au centre-haut de l'écran.
   - Il est impérativement dans un conteneur dédié (Radius 32px, fond `#F5F2EA`).
   - Typographie : `arabicHero` (48px+) ou `arabicTitle` (36px). `lineHeight` strict de 1.9.

2. **La Zone d'Action (Bottom Area) :**
   - Le bouton "Valider" (ou "Vérifier") est toujours épinglé en bas de l'écran (Bottom 24px), juste au-dessus de la safe area. Il est de type bouton primaire (`pill`, hauteur 56px, ombre `prominent`).

3. **La Séquence de Feedback (Haptics & Visuals) :**
   Lorsque l'utilisateur valide :
   - **Correct :** Haptic "Success". La zone de validation passe en vert (`status.successLight`). Le bouton devient "Continuer".
   - **Incorrect :** Haptic "Error/Heavy". La zone passe en rouge (`status.errorLight`). La bonne réponse s'affiche en vert. Animation "Shake" sur l'élément erroné.

---

## B. Spécifications pour les Types d'Exercices

### TYPE 1 : Le QCM Classique (Déjà défini)
(Reprendre les spécifications de la section #8 précédentes).

### TYPE 2 : Les Paires à Relier (Matching Pairs)
*C'est l'exercice pour le vocabulaire.*
- **Layout :** Grille à 2 colonnes (Gauche: Arabe / Droite: Français ou Image). Gap horizontal de 16px, gap vertical de 16px.
- **Les Cartes :** Format rectangulaire compact (hauteur ~48px), Radius 16px, fond `background.card`, ombre `subtle`.
- **Interaction :**
  1. L'utilisateur tape sur une carte (ex: "شَمْس"). La carte s'illumine en `brand.primary` (bordure 2px, fond `brand.light`).
  2. Il tape sur une carte de l'autre colonne (ex: "SOLEIL").
- **Validation :**
  - **Match Correct :** Les deux cartes passent en vert (`status.success`). Haptic success. Après 600ms, les deux cartes se grisent et deviennent inactives (`opacity 0.5`, `status.disabled`) pour montrer qu'elles sont hors-jeu.
  - **Match Incorrect :** Les deux cartes passent en rouge (`status.error`). Haptic error. Animation "Shake" sur la seconde carte. Après 800ms, la sélection est annulée (retour à l'état par défaut).

### TYPE 3 : L'Entrée de Texte (Compréhension Écrite)
*C'est l'exercice pour la production active.*
- **Layout :**
  - Hero Area : La phrase en français flottant au centre.
  - Zone de Réponse : Un grand champ de saisie (`TextInput`) juste au-dessus du clavier.
- **Le Champ de Saisie (Input) :** - Hauteur minimale : 56px. Radius : 16px.
  - Fond `background.card`, Bordure 1px `background.group`.
  - Typographie : `arabicBody` (28px). **Le clavier doit impérativement s'ouvrir en mode Arabe.**
  - État Focus : Bordure 2px `brand.primary`.
- **Validation :** Le moteur SRS vérifie la réponse. Si correct, le champ devient vert. Si incorrect, il devient rouge et la bonne réponse s'affiche en dessous en vert.

### TYPE 4 : L'Audio (Compréhension Orale)
- **Layout :**
  - Hero Area : Un grand cercle central (diamètre 120px, fond `brand.light`, radius 9999px) contenant une icône "Haut-Parleur" géante (`brand.primary`).
  - Zone de Réponse : Un QCM classique (TYPE 1) ou une Entrée de Texte (TYPE 3) en dessous.
- **Interaction :**
  - Taper sur le cercle joue l'audio. Un effet d'onde circulaire (Pulsing Ripple animation en Reanimated) se diffuse du centre vers l'extérieur pendant la lecture de l'audio.
  - La validation suit la règle du type de réponse choisi (QCM ou Texte).


# 10. ARCHITECTURE DE L'ÉCRAN PROFIL (LE TABLEAU D'HONNEUR)
L'objectif est d'abandonner le look "tableau de bord industriel" pour une esthétique de "galerie de médaillons précieux". L'écran doit être chaleureux (tons sable) et motivant.

## A. Structure Globale
- **Fond d'écran :** `background.main` (`#FDFBF7`).
- **Header :** Conserver l'icône Rouage (Settings) en haut à droite (`text.secondary`), mais ajouter le titre central "Mon Parcours" (`uiH2`, `text.primary`).

## B. Zone 1 : L'Identité (Haut de l'écran)
- **Layout :** Flex column, centré horizontalement. Padding vertical `32px`.
- **Contenu :**
  - **Avatar (Minimaliste Premium) :** Un cercle de 80x80px. Fond `brand.light`, bordure 2px `brand.primary`. Au centre, l'initiale de l'utilisateur (ex: "M") en `uiH1` (`brand.dark`).
  - **Nom :** "Mathieu" (`uiH1`, `text.primary`, margin-top `16px`).
  - **Date d'inscription :** "Membre depuis Octobre 2023" (`uiSmall`, `text.secondary`).

## C. Zone 2 : Le "Dashboard" SRS (Carte Unifiée)
Remplacer les 3 blocs gris par une seule carte élégante et "glassmorphe".
- **Layout :** Une seule grande carte horizontale (Margin horizontal `24px`, Margin top `24px`).
- **Design :** Fond `background.card`, Radius 24px (`radius.lg`), Ombre `medium`. Effet Blur subtil (si possible techniquement).
- **Contenu :** Une Flex-row divisée en 3 colonnes égales par des lignes verticales très fines (`background.group`).
  1. **Colonne Flamme (Série) :** Icône Flamme (`accent.gold`). Nombre "12" (`uiH1`, `brand.dark`), label "jours" (`uiSmall`, `text.secondary`).
  2. **Colonne Émeraude (XP) :** Icône Étoile (`brand.primary`). Nombre "1250" (`uiH1`, `brand.dark`), label "XP total" (`uiSmall`, `text.secondary`).
  3. **Colonne Couronne (Record) :** Icône Couronne (`accent.gold`). Nombre "150" (`uiH1`, `brand.dark`), label "meilleur jour" (`uiSmall`, `text.secondary`).

## D. Zone 3 : La Galerie de Badges (Le cœur du changement)
Remplacer la grille de cadenas gris par une collection de médaillons cachés.
- **Conteneur :** Un grand bloc avec Radius supérieur `radius.lg` (24px) qui "remonte" sur le fond de l'écran. Fond `background.group` (Sable `#F5F2EA`). Padding `24px`.
- **Titre Section :** "MES ACCOMPLISSEMENTS" (`uiSmall`, Bold, Uppercase, `text.secondary`, Margin-bottom `16px`).
- **La Grille :** 3 colonnes, Gap `16px`.
- **Le Design du Badge (Crucial) :** - Chaque badge est un carré (AspectRatio 1:1) avec `radius.md` (16px).
  - **RÈGLE ABSOLUE : INTERDICTION D'UTILISER L'ICÔNE CADENAS.**
  - **Badge Débloqué :** Fond `background.card`, Ombre `subtle`. Illustration calligraphique détaillée avec accents Or (`accent.gold`).
  - **Badge Verrouillé (Le "Fantôme") :** Fond `background.card` (opacité 0.5). L'illustration du badge est affichée, mais **en silhouette grise unie** (`status.disabled`, opacité 0.3). Cela crée du mystère et de l'envie : l'utilisateur voit la forme du trésor, mais pas ses détails.
- **Légende (Sous le badge) :** Si verrouillé, afficher le texte "Débloquez au Niveau X" (`uiTiny`, `text.secondary`, centré).

# 11. ARCHITECTURE DES RÉGLAGES ET MODALES (BOTTOM SHEETS)
L'écran des réglages et ses modales de sélection doivent être fluides et utiliser la grammaire visuelle définie.

## A. L'écran Réglages (Settings)
- **Preview Hero (La carte "Affichage") :** C'est le composant le plus important. Quand l'utilisateur change un réglage dans la modale, cette carte (qui affiche كِتَابٌ) doit **se mettre à jour en temps réel** (avec une animation de fondu fluide) pour montrer l'impact (ex: la translittération disparaît).
- **Lignes de réglages (Rows) :** Fond transparent. Texte à gauche (`text.primary`, `uiBody`). Valeur actuelle affichée dans une "Chip" à droite (Fond `brand.light`, Texte `brand.dark`, Radius `sm`), suivie d'un petit chevron (`>`).

## B. Les Bottom Sheets (Modales de sélection)
Elles remplacent les menus déroulants classiques pour une ergonomie mobile native (facilement cliquables à une main).
- **Conteneur :** Fond `background.card`. Border-radius supérieur uniquement : `radius.lg` (24px).
- **Drag Handle (Poignée) :** Une petite pilule grise (`background.group`, 40x4px) centrée tout en haut pour indiquer qu'on peut swiper vers le bas pour fermer.
- **Titre :** Centré, `uiH2` (`text.primary`).
- **Options de la liste :**
  - Hauteur 56px, flex-row, align-center.
  - **État non sélectionné :** Fond transparent, texte `text.primary`.
  - **État sélectionné :** Fond `status.successLight` (ou `brand.light`), texte `brand.primary` (en Medium). Une icône de validation (Checkmark) fine et élégante est alignée tout à droite (`brand.primary`).

---

# 12. UX DU SYSTÈME "ADAPTATIF" & CONTRÔLE EN LEÇON
L'utilisateur doit pouvoir configurer un affichage évolutif, mais toujours garder le contrôle pendant son apprentissage sans casser l'interface "Distraction-Free".

## A. Logique des 4 États
1. **Toujours affiché :** L'élément (ex: Harakats) est visible par défaut.
2. **Masqué :** L'élément est invisible et ne peut pas être révélé.
3. **Adaptatif (Le mode Smart) :** L'affichage dépend du score SRS du mot. 
   - Niveau 0-2 (Découverte) : Toujours affiché.
   - Niveau 3-4 (Acquisition) : Tap pour révéler.
   - Niveau 5+ (Maîtrise) : Masqué.
4. **Tap pour révéler (Le filet de sécurité) :** Par défaut, l'élément est caché. Si l'utilisateur a un doute, il tape dessus pour l'afficher temporairement.

## B. UI du "Tap pour révéler" (Dans l'écran Exercice / Leçon)
Il est **interdit** de rajouter des boutons moches "Afficher Traduction" qui polluent l'écran. Tout se fait in-situ.

- **Pour la Translittération / Traduction :**
  - Si l'état est "Tap pour révéler", à la place du texte, afficher un indicateur visuel très discret : une ligne en pointillés légers (`text.secondary`, opacité 30%) ou des petits points de suspension `...`.
  - **Interaction :** Un Tap sur cette zone déclenche un `FadeIn` (Reanimated, 200ms) du texte réel (`text.secondary`).
  
- **Pour les Harakats (Le défi technique) :**
  - Si les Harakats sont masqués ou en mode "Tap", le mot arabe s'affiche nu.
  - **Interaction :** Un Tap long (Press & Hold) ou un Tap simple sur le mot arabe déclenche un `FadeIn` des harakats par-dessus les lettres de base.
  - *Note d'implémentation :* Assurez-vous que l'ajout des harakats ne fasse pas "sauter" la ligne ou redimensionner le texte (garder le même `lineHeight` strict).

## C. Le Menu Contextuel d'Urgence (In-Lesson Toggles)
Si l'utilisateur est coincé en plein exercice et veut modifier ses réglages globaux (ex: tout réafficher d'un coup).
- **Design :** En haut à droite du header minimaliste de l'écran Exercice (opposé à la croix de fermeture), placer une icône d'engrenage ou un icône "Œil" très discret (`text.secondary`).
- **Action :** Ouvre une Bottom Sheet "miniature" rapide avec uniquement les toggles d'affichage (Harakats: On/Off, Traduction: On/Off). Ce changement outrepasse temporairement les réglages normaux pour la leçon en cours.


# 13. ARCHITECTURE DU RÉGLAGE "TAILLE DU TEXTE" (UX VISUELLE)
Le réglage de la taille du texte ne doit plus être une liste verticale de textes ("Petit", "Moyen", etc.). Il doit utiliser un sélecteur visuel horizontal (Segmented Control ou Slider discret) qui applique le changement en temps réel sur la Preview.

## A. Le Composant dans la Bottom Sheet
- **Conteneur :** Au lieu d'une liste empilée, on affiche un bloc horizontal centré. Padding horizontal `24px`.
- **Le Contrôle (Segmented Control) :** - Un conteneur à bords très arrondis (`radius.pill`), fond `background.group` (Sable), hauteur `56px`.
  - Divisé en 3 ou 4 segments égaux.
- **Iconographie Contextuelle :**
  - Segment 1 (Petit) : Une lettre arabe très fine/petite (ex: `أ` en taille 18px, `text.secondary`).
  - Segment 2 (Moyen) : La même lettre, taille moyenne (ex: `أ` en taille 24px, `text.secondary`).
  - Segment 3 (Grand) : La même lettre, grande taille (ex: `أ` en taille 32px, `text.secondary`).
- **État Actif (Sélectionné) :**
  - Un "Thumb" (pastille flottante, fond `background.card`, ombre `subtle`, radius `pill`) glisse avec une animation fluide (Spring) pour se placer derrière le segment actif.
  - La lettre du segment actif passe en couleur `brand.primary`.

## B. L'Interaction Temps Réel (Crucial)
- **Haptic Feedback :** Chaque changement de cran sur le sélecteur déclenche un retour haptique léger (`selection` ou `light`).
- **Lien avec la Preview :** Le grand texte arabe "كِتَابٌ" affiché dans la carte en haut de l'écran des réglages DOIT s'agrandir ou rétrécir en temps réel (via Reanimated) au moment précis où l'utilisateur change la taille dans la bottom sheet.


# 14. COHÉRENCE GLOBALE DES RÉGLAGES (RICH SELECTION UI)
L'écran des réglages utilise deux types de contrôles selon la nature de la donnée. L'objectif est de toujours expliquer à l'utilisateur l'impact de son choix sans qu'il ait à deviner.

## A. La Règle d'Attribution des Contrôles
1. **Valeurs Quantitatives (Taille, Vitesse, Objectif) :** - Utiliser un Segmented Control horizontal visuel (ex: petits/grands caractères) ou un Slider discret.
2. **Valeurs Conceptuelles (Harakats, Translittération, Sens) :** - Utiliser une liste verticale "Enrichie" (Rich Row) dans la Bottom Sheet.

## B. Design de la "Rich Selection Row" (Pour Harakats, Translittération, etc.)
Il ne s'agit plus d'une simple ligne de texte, mais d'une carte d'information cliquable.

- **Layout de la Row :** - Hauteur dynamique (min 72px), Padding vertical 16px, Padding horizontal 24px. Flex-row avec align-items au centre.
- **Partie Gauche (Contenu) :**
  - **Titre :** `uiBody` (16px), `text.primary`, Medium. (Ex: "Adaptatif").
  - **Sous-titre (Le secret premium) :** `uiSmall` (14px), `text.secondary`. Un texte très court qui explique le comportement. (Ex: "S'efface automatiquement quand vous maîtrisez le mot").
- **Partie Droite (Statut) :**
  - Si non sélectionné : Espace vide.
  - Si sélectionné : Icône Checkmark (`brand.primary`), alignée à droite.
- **État Sélectionné (Feedback visuel) :**
  - Le fond de la Row entière passe en `brand.light` (ou `status.successLight`).
  - Le Titre passe en `brand.primary`.
  - Le Sous-titre passe en `brand.dark` (avec une opacité légère).

## C. Textes descriptifs recommandés (À intégrer)
Pour garantir une expérience parfaite, voici les sous-titres à associer aux choix :
- **Toujours affichés :** "Visible en permanence pendant les leçons."
- **Tap pour révéler :** "Masqué par défaut. Touchez l'écran en cas de doute."
- **Adaptatif (Recommandé) :** "Disparaît progressivement selon votre niveau mémoriel."
- **Masqués :** "Totalement invisible. Pour un défi maximal."

## D. Transitions et Haptics
- Lorsqu'une option est sélectionnée dans la Bottom Sheet, déclencher un Haptic "Selection".
- Fermer automatiquement la Bottom Sheet après 300ms (pour laisser le temps de voir le checkmark apparaître).
- Mettre à jour la Preview de l'écran principal (la carte avec كِتَابٌ) en temps réel avec un fondu (Fade transition).