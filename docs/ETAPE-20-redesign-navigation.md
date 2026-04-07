# ÉTAPE 20 — Redesign Navigation : Home "Aujourd'hui", Parcours, 3 onglets

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe pour francophones.
> Étapes terminées : 0 → 19. É19 = dialectes levantin/khaliji, sourates 93/94/97, dashboard analytics, infrastructure bêta.
> Cette étape **restructure entièrement la navigation et la home** pour supporter la croissance multi-variantes (MSA, 4 dialectes, coranique).
> Règle : missions séquentielles, checkpoints obligatoires.

> **Philosophie de cette étape** :
> - L'app a dépassé le stade "parcours MSA unique". Avec 10 modules MSA, 4 dialectes, et 12+ sourates coraniques, la grille plate actuelle est illisible et ne scale pas.
> - On passe d'une home "catalogue de modules" à un **hub quotidien intelligent** : l'utilisateur sait immédiatement quoi faire en ouvrant l'app.
> - La structure tripartite (MSA tronc / Dialectes spécialisations / Coranique sanctuaire) reflète les 3 intentions d'apprentissage distinctes.
> - Le coranique a un traitement visuel différent (fond sombre, or, sérénité) car l'intention est mémorisation/spiritualité, pas acquisition conversationnelle.
> - **Aucune donnée utilisateur n'est perdue.** C'est une restructuration UI pure — le modèle de données, les hooks, le SRS, la progression restent identiques.

---

## Périmètre de É20

| Domaine | Changement | Impact |
|---------|-----------|--------|
| Tab bar | 4 → 3 onglets (Aujourd'hui, Parcours, Profil) | Layout racine, routing |
| Home | Grille modules → dashboard "Aujourd'hui" | Nouveau screen complet |
| Parcours | Nouveau screen : MSA + Dialectes + Coranique | Nouveau screen complet |
| Profil | Absorbe la section Analytics | Modification screen existant |
| Coranique (inner) | Screen poussé depuis Parcours, thème dark | Nouveau screen |
| Dialecte (inner) | Screen poussé depuis Parcours, accent coloré | Nouveau screen |
| Identité variantes | Couleurs accent par variante | Constantes thème |

**Ce qui est OUT de É20 :**
- Refonte des écrans d'exercice ou de leçon — inchangés
- Modification du moteur SRS ou du système de progression — inchangés
- Nouveau contenu (modules, sourates, variantes) — pas de seeds
- Dark mode global — hors scope
- Animations de transition entre univers — É21+

---

## MISSION 0 — Scan initial

Lance `@codebase-scout` pour obtenir l'état actuel du repo, en particulier :
- La structure de `src/app/(tabs)/` (layout tab bar actuel)
- Les screens existants (home, révision, profil, analytics)
- Les hooks de progression (`useModules`, `useProgress`, `useSrsStats` ou similaires)
- Les composants de cards modules existants

Confirme l'état avant de commencer.

---

## MISSION 1 — Constantes d'identité par variante

### Contexte
Chaque univers (MSA, Darija, Égyptien, Levantin, Khaliji, Coranique) doit avoir une identité visuelle propre. On centralise ça dans le thème.

### Actions

1. Dans `src/constants/theme.ts` (ou le fichier thème existant), ajouter un objet `variantThemes` :

```typescript
export const variantThemes = {
  msa: {
    accent: '#0F624C',      // Émeraude — identique au brand primary
    accentLight: '#E5EFEB',
    label: 'Arabe Standard',
    labelAr: 'العربية الفصحى',
    icon: 'book-open',       // lucide icon name
  },
  darija: {
    accent: '#E2725B',      // Terre cuite
    accentLight: '#FBEEE8',
    label: 'Darija',
    labelAr: 'الدارجة المغربية',
    icon: 'message-circle',
  },
  egyptian: {
    accent: '#D4944C',      // Ocre chaud
    accentLight: '#FBF3E8',
    label: 'Égyptien',
    labelAr: 'العامية المصرية',
    icon: 'message-circle',
  },
  levantine: {
    accent: '#5D8AA8',      // Bleu air force
    accentLight: '#EBF1F5',
    label: 'Levantin',
    labelAr: 'الشامي',
    icon: 'message-circle',
  },
  khaliji: {
    accent: '#8B7355',      // Sable foncé
    accentLight: '#F5F0E8',
    label: 'Khaliji',
    labelAr: 'الخليجي',
    icon: 'message-circle',
  },
  quran: {
    accent: '#D4AF37',      // Or
    accentLight: '#0A3D30',  // Dark emerald (fond, pas light)
    background: '#0A3D30',   // Fond sombre dédié
    label: 'Arabe Coranique',
    labelAr: 'القرآن الكريم',
    icon: 'book',
  },
} as const;

export type VariantKey = keyof typeof variantThemes;
```

2. Vérifier que les clés (`darija`, `egyptian`, `levantine`, `khaliji`) correspondent aux valeurs `variant` utilisées dans la table `modules` et `word_variants` en base. Adapter si nécessaire (utiliser `@codebase-scout` pour trouver les valeurs exactes).

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] `variantThemes` exporté et typé, aucun import cassé

---

## MISSION 2 — Restructuration Tab Bar : 4 → 3 onglets

### Contexte
Actuellement : Apprendre / Réviser / Profil / Analytics.
Cible : **Aujourd'hui / Parcours / Profil**.
- "Aujourd'hui" remplace "Apprendre" (nouveau contenu, même slot)
- "Parcours" remplace "Réviser" (nouveau screen)
- "Profil" reste, absorbe Analytics
- L'onglet Analytics disparaît du tab bar

### Actions

1. Dans le layout tab bar (`src/app/(tabs)/_layout.tsx` ou équivalent), modifier les onglets :
   - Onglet 1 : name `index` (ou `today`), titre "Aujourd'hui", icône `Home` (lucide)
   - Onglet 2 : name `parcours`, titre "Parcours", icône `BookOpen` (lucide)
   - Onglet 3 : name `profile`, titre "Profil", icône `User` (lucide)
   - Supprimer l'onglet Analytics du tab bar

2. Créer le fichier screen `src/app/(tabs)/parcours.tsx` — pour l'instant un placeholder :
```typescript
export default function ParcoursScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Parcours — à implémenter Mission 4</Text>
  </View>;
}
```

3. Renommer/adapter le screen home existant. L'ancien contenu de la home (grille de modules) sera remplacé en Mission 3. **Ne pas supprimer l'ancien code** — le commenter ou le déplacer dans un fichier `_legacy-home.tsx` pour référence.

4. L'écran Analytics doit rester accessible : l'intégrer comme section scrollable en bas du screen Profil, ou comme sous-écran accessible via un bouton dans Profil. Choisir l'approche la plus simple selon l'implémentation actuelle.

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] L'app démarre et affiche 3 onglets fonctionnels
- [ ] Navigation entre les 3 onglets fonctionne
- [ ] Analytics toujours accessible depuis Profil
- [ ] Aucune route orpheline (vérifier qu'aucun `router.push` ne pointe vers l'ancien onglet Analytics)

---

## MISSION 3 — Home "Aujourd'hui"

### Contexte
L'écran principal de l'app. L'utilisateur doit savoir **quoi faire maintenant** en un coup d'œil.

### Structure de l'écran (ScrollView vertical)

**Zone A — Header**
- Gauche : "Lisaan" en Jost Bold
- Droite : flamme streak 🔥 + nombre

**Zone B — Greeting**
- "Salam, [prénom] 👋" en texte principal (utiliser le prénom du profil si disponible, sinon omettre)
- "Prêt pour ta session ?" en texte secondaire gris

**Zone C — Carte "Continuer"** (la plus grande, visuellement dominante)
- Affiche le **dernier module/leçon en cours**, quelle que soit la variante
- En haut à gauche : badge pill coloré avec la variante (ex: "MSA" en blanc sur fond émeraude, ou "Darija" en blanc sur fond terre cuite). Utiliser `variantThemes[variant].accent` pour la couleur.
- "MODULE N" en small caps gris
- Titre français en Jost SemiBold
- Titre arabe en Amiri Bold, grand, centré
- Barre de progression fine (% de la leçon ou du module)
- Bouton "Reprendre →" (émeraude filled) + "Leçon X/Y" à droite
- Si aucun module en cours (tout complété ou premier lancement) : afficher une carte d'invitation "Commencer votre parcours →" qui mène à l'écran Parcours

**Zone D — Carte "Révision du jour"** (plus petite)
- Icône circulaire refresh émeraude à gauche
- "N cartes à réviser" en Jost SemiBold
- Sous-titre : répartition par type ("Lettres : X · Conjugaisons : Y · Grammaire : Z")
- Bouton "Réviser →" (émeraude outlined) — ouvre l'écran de révision SRS existant
- Si 0 cartes à réviser : afficher "Aucune carte à réviser 🎉" avec le bouton grisé

**Zone E — "Explorer les univers"**
- Titre de section "Explorer" en small caps gris
- Grille 2 colonnes, 3 cards :
  - **"Arabe Standard"** — accent émeraude en haut, sous-titre "N modules · X% complété"
  - **"Dialectes"** — accent terre cuite, sous-titre "4 dialectes · Darija, Égyptien..."
  - **"Coranique"** — accent or, sous-titre "N sourates · X mémorisées"
- Chaque card : fond `#F5F2EA`, rounded 12px, tap → navigue vers l'écran Parcours (scrollé à la section correspondante si possible, sinon juste ouvre Parcours)
- La 3e card (Coranique) peut être centrée si impair, ou en full-width

### Données nécessaires
- Dernier module en cours : requête SQLite existante (vérifier quel hook fournit ça — probablement `useModules` ou `useProgress`)
- Stats SRS : hook SRS existant (nombre de cartes dues aujourd'hui par type)
- Progression globale par univers : peut nécessiter un nouveau hook ou une agrégation simple depuis les hooks existants
- Prénom utilisateur : depuis le store auth/profil

### Actions

1. Créer les composants (dans `src/components/today/` ou dossier adapté) :
   - `ContinueCard.tsx` — la grande carte de reprise
   - `SrsCard.tsx` — la carte révision du jour
   - `ExploreSection.tsx` — la grille des 3 univers
   - `TodayHeader.tsx` — header + greeting

2. Créer/modifier le screen home pour assembler ces composants dans un ScrollView.

3. Chaque composant utilise `useTheme()` pour les couleurs — jamais de couleurs hardcodées.

4. Le `ContinueCard` utilise `variantThemes` pour colorer le badge de variante dynamiquement selon le module en cours.

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] La home affiche la carte "Continuer" avec le bon module en cours et le bon badge variante
- [ ] La carte SRS affiche le nombre réel de cartes à réviser
- [ ] Les 3 cards "Explorer" s'affichent correctement
- [ ] Tap "Reprendre" navigue vers la bonne leçon
- [ ] Tap "Réviser" ouvre l'écran de révision SRS
- [ ] Si 0 cartes SRS : message "Aucune carte" visible
- [ ] Texte arabe en Amiri, UI en Jost, `lineHeight ≥ 1.8` pour l'arabe

---

## MISSION 4 — Écran "Parcours"

### Contexte
Le catalogue structuré de tout le contenu. Organisé en 3 sections verticales distinctes.

### Structure de l'écran (ScrollView vertical)

**Titre** : "Parcours" en Jost Bold, grand, en haut à gauche

**Section 1 — Arabe Standard (MSA)**
- Header de section : barre verticale émeraude 4px à gauche, "Arabe Standard" en Jost SemiBold, sous-titre "Le tronc commun" en gris
- Liste verticale des 10 modules MSA :
  - Chaque item : numéro dans un cercle émeraude, titre FR en Jost Medium, titre AR en Amiri sous le titre FR, indicateur de statut à droite (✓ vert si complété, cercle de progression si en cours, cadenas si verrouillé)
  - Les modules verrouillés : légèrement opacité réduite (0.5)
  - **Logique de verrouillage** : un module est déverrouillé si le précédent est complété. Module 1 toujours déverrouillé. Utiliser la même logique que l'ancienne home (elle existe déjà, la réutiliser).
  - Tap sur un module déverrouillé → navigue vers l'écran de leçons du module (route existante)

**Section 2 — Dialectes**
- Header de section : barre verticale terre cuite #E2725B à gauche, "Dialectes" en Jost SemiBold, sous-titre "Les couleurs de l'arabe" en gris
- Grille 2 colonnes de cards dialectes :
  - Darija : accent terre cuite, titre ar en Amiri, titre fr en dessous, badge ✓ si progression > 0
  - Égyptien : accent ocre #D4944C
  - Levantin : accent bleu #5D8AA8
  - Khaliji : accent sable #8B7355
- Chaque card : fond `#F5F2EA`, accent coloré en haut (bande 4px), rounded 12px
- Sous le titre : barre de progression fine ou "Nouveau" tag si pas commencé
- Tap → écran intérieur dialecte (Mission 5)
- **Pré-requis suggéré** (non bloquant) : si l'utilisateur n'a pas complété Module 2 MSA, afficher un petit texte discret sous la section : "💡 Recommandé : compléter Module 2 avant de commencer les dialectes"

**Section 3 — Arabe Coranique**
- Header de section : barre verticale or #D4AF37 à gauche, "Arabe Coranique" en Jost SemiBold, sous-titre "Comprendre les sourates" en gris
- Une seule card large, visuellement distincte :
  - Fond dark emerald #0A3D30, rounded 16px
  - "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ" en grand, Amiri, couleur or #D4AF37, centré
  - Sous-texte : "N sourates · X mémorisées" en blanc
  - Bouton "Découvrir →" en or outlined
  - Tap → écran intérieur coranique (Mission 6)

### Données nécessaires
- Liste des modules MSA avec statut de complétion : hook existant
- Liste des modules dialectes avec progression : hook existant (filtrer par `variant`)
- Stats coraniques : hook existant ou requête sourates

### Actions

1. Créer les composants (dans `src/components/parcours/` ou dossier adapté) :
   - `MsaModuleList.tsx` — la liste verticale des modules MSA
   - `MsaModuleItem.tsx` — un item de module avec cercle numéro + statut
   - `DialecteGrid.tsx` — la grille 2 colonnes des dialectes
   - `DialecteCard.tsx` — une card dialecte individuelle
   - `QuranicCard.tsx` — la grande card coranique dark
   - `SectionHeader.tsx` — composant réutilisable (barre couleur + titre + sous-titre)

2. Implémenter le screen `src/app/(tabs)/parcours.tsx` en assemblant ces composants.

3. La navigation depuis chaque item/card doit utiliser `router.push()` (Expo Router) vers les routes existantes des modules/leçons.

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] Les 10 modules MSA s'affichent dans l'ordre avec le bon statut (complété/en cours/verrouillé)
- [ ] Les 4 dialectes s'affichent en grille 2 colonnes avec les bonnes couleurs accent
- [ ] La card coranique dark est visuellement distincte (fond sombre, texte or)
- [ ] Tap sur un module MSA déverrouillé → navigue vers l'écran de leçons
- [ ] Tap sur un dialecte → navigue (placeholder OK si l'écran intérieur n'existe pas encore)
- [ ] Le pré-requis MSA s'affiche correctement (conditionnellement)
- [ ] Scroll fluide, pas de lag sur la liste de modules

---

## MISSION 5 — Écran intérieur Dialecte

### Contexte
Screen poussé (pas un tab) depuis la card dialecte dans Parcours. Un screen générique paramétré par la variante.

### Structure

**Top bar** : flèche retour colorée (accent de la variante), titre "[Dialecte] — [Nom FR]" centré, petite ligne accent sous le titre.

**Fond** : `#FDFBF7` (fond app standard)

**Header card** (blanc, rounded 16px) :
- Titre arabe du dialecte en Amiri Bold, grand, centré, noir
- Sous-titre français en Jost Regular gris
- Barre de progression colorée (accent du dialecte) montrant X/Y variantes apprises
- "X/Y variantes apprises" en petit gris
- Si Module 2 MSA complété : "✓ Pré-requis complété" en petit vert. Sinon : "💡 Recommandé : compléter Module 2 MSA" en petit gris

**Liste des leçons** :
- Titre de section avec barre verticale accent du dialecte
- Vertical list de cards leçon :
  - Numéro dans un cercle accent du dialecte
  - Titre français
  - Titre arabe en Amiri sous le titre
  - Statut à droite (✓, progression circulaire, 🔒)
  - Ligne accent fine à gauche de chaque card

Tap sur une leçon déverrouillée → navigue vers l'écran d'exercices existant (même route que les leçons MSA, le moteur est polymorphique).

### Actions

1. Créer la route : `src/app/dialect/[variant].tsx` (ou dans le dossier de routes approprié — vérifier le pattern Expo Router existant avec `@codebase-scout`).

2. Le screen reçoit `variant` comme paramètre de route, récupère `variantThemes[variant]` pour les couleurs.

3. Réutiliser les hooks existants pour charger les modules/leçons de cette variante.

4. Le composant `SectionHeader` créé en Mission 4 est réutilisé ici.

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] Navigation Parcours → Dialecte → retour fonctionne
- [ ] Les couleurs accent changent selon le dialecte (Darija = terre cuite, Levantin = bleu, etc.)
- [ ] Les leçons s'affichent avec le bon statut
- [ ] Tap sur une leçon → lance les exercices

---

## MISSION 6 — Écran intérieur Coranique

### Contexte
Screen poussé depuis la card coranique dans Parcours. Ambiance visuelle distincte du reste de l'app.

### Structure

**Fond** : `#0A3D30` (dark emerald) — **tout l'écran**, pas juste une card

**Top bar** : flèche retour or #D4AF37, "Arabe Coranique" en Jost SemiBold blanc, centré. Petite ligne ornementale or fine en dessous.

**Progress card** (fond `#0F4A3A`, rounded 16px) :
- "N sourates étudiées" en blanc
- "X mémorisées · Y versets maîtrisés" en or #D4AF37
- Barre de progression fine or

**Liste des sourates** (vertical) :
- Chaque card : fond `#0F4A3A`, rounded 12px, bordure gauche or 2px
  - Numéro de sourate dans un cercle or (ex: "103")
  - Nom arabe en Amiri, blanc, grand : "سورة العصر"
  - Nom français en petit, gris clair : "Le Temps"
  - Nombre de versets : "3 versets" en petit
  - Statut à droite : ✓ or si mémorisée, cercle de progression or si en cours, tag "Nouveau" en or outlined si pas commencée

Tap sur une sourate → navigue vers l'écran d'exercices/leçons coranique existant.

### Actions

1. Créer la route : `src/app/quran/index.tsx` (ou emplacement adapté).

2. Ce screen utilise un thème inversé : fond sombre, texte clair. Utiliser `variantThemes.quran` pour les couleurs. **Ne pas modifier le ThemeProvider global** — gérer le thème localement dans ce screen via des styles inline ou un wrapper local.

3. Réutiliser les hooks existants pour charger les sourates et leur statut de progression/mémorisation.

4. Le `StatusBar` doit passer en `light-content` sur cet écran (texte blanc sur fond sombre) et revenir en `dark-content` quand on quitte.

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] L'écran a un fond dark emerald, pas le fond app standard
- [ ] Les sourates s'affichent avec le bon statut
- [ ] StatusBar lisible (texte clair sur fond sombre)
- [ ] Navigation retour → Parcours fonctionne
- [ ] Tap sur une sourate → lance la leçon coranique

---

## MISSION 7 — Intégration Profil + Analytics

### Contexte
Le screen Profil absorbe le contenu Analytics qui n'a plus d'onglet dédié.

### Actions

1. Dans le screen Profil existant, ajouter une section en bas (après les stats existantes) :
   - Titre de section "Analytics" ou "Statistiques détaillées"
   - Soit : intégrer directement les composants/vues du dashboard Analytics existant
   - Soit : ajouter un bouton "Voir les analytics →" qui pousse vers le screen Analytics existant (approche plus simple si le screen Analytics est complexe)

2. Choisir l'approche la plus simple et la moins invasive. Si le dashboard Analytics est un gros composant autonome, préférer l'approche bouton.

3. Supprimer toute référence à l'onglet Analytics dans la navigation (mais garder le screen accessible via push).

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] Analytics accessible depuis Profil
- [ ] Aucun onglet Analytics dans la tab bar
- [ ] Aucune route cassée

---

## MISSION 8 — Nettoyage et régression

### Actions

1. Supprimer le fichier legacy home commenté (ou le garder si tu préfères, mais le marquer clairement `// @deprecated É20`).

2. Vérifier toutes les routes `router.push()`/`router.replace()` dans le codebase : aucune ne doit pointer vers des screens supprimés ou renommés.

3. Vérifier que le `ContinueCard` de la home affiche correctement le badge variante pour tous les cas :
   - Module MSA en cours → badge émeraude "MSA"
   - Module dialecte en cours → badge coloré du dialecte
   - Module coranique en cours → badge or "Coranique"
   - Aucun module en cours → carte "Commencer" visible

4. Lance `@regression-tester` — tout doit être vert.

5. Test visuel rapide :
   - [ ] Home : carte continuer, SRS, explorer — tout visible
   - [ ] Parcours : 3 sections distinctes, scroll fluide
   - [ ] Coranique : fond sombre, texte or, StatusBar claire
   - [ ] Dialecte (Darija) : accent terre cuite visible
   - [ ] Profil : analytics accessible
   - [ ] Tab bar : 3 onglets, aucun 4e

### Checkpoint
- [ ] `@regression-tester` → tout vert
- [ ] Aucun warning TypeScript critique
- [ ] Navigation complète testée (tous les chemins)

---

## Gestion /docs

```
/docs/
  ETAPE-20-redesign-navigation.md    ← CE FICHIER (ajouter)
  lisaan-seed-letters.json           ← garder
  
  Supprimer :
  - ETAPE-19-*.md (ou le précédent en /docs)
```

---

## Résumé des fichiers créés/modifiés

| Action | Fichier |
|--------|---------|
| Modifier | `src/constants/theme.ts` — ajout `variantThemes` |
| Modifier | `src/app/(tabs)/_layout.tsx` — 3 onglets |
| Modifier | `src/app/(tabs)/index.tsx` — Home "Aujourd'hui" |
| Créer | `src/app/(tabs)/parcours.tsx` — Parcours |
| Créer | `src/app/dialect/[variant].tsx` — Inner dialecte |
| Créer | `src/app/quran/index.tsx` — Inner coranique |
| Modifier | `src/app/(tabs)/profile.tsx` — absorber Analytics |
| Créer | `src/components/today/ContinueCard.tsx` |
| Créer | `src/components/today/SrsCard.tsx` |
| Créer | `src/components/today/ExploreSection.tsx` |
| Créer | `src/components/today/TodayHeader.tsx` |
| Créer | `src/components/parcours/MsaModuleList.tsx` |
| Créer | `src/components/parcours/MsaModuleItem.tsx` |
| Créer | `src/components/parcours/DialecteGrid.tsx` |
| Créer | `src/components/parcours/DialecteCard.tsx` |
| Créer | `src/components/parcours/QuranicCard.tsx` |
| Créer | `src/components/parcours/SectionHeader.tsx` |
