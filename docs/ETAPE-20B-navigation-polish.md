# ÉTAPE 20B — Polish Navigation & Visual Refinement

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe pour francophones.
> Étapes terminées : 0 → 20. É20 = restructuration navigation (Home Aujourd'hui, Parcours, Profil).
> **Cette étape corrige les problèmes visuels et structurels constatés après É20** : la tab bar a encore 6 onglets, des doublons persistent, et le raffinement visuel "premium" n'est pas au niveau.
> Règle : missions séquentielles, checkpoints obligatoires.

> **Philosophie de cette étape** :
> - É20 a posé le "zonage" — É20B injecte le **raffinement**.
> - Principe directeur : **Less is More**. Chaque pixel doit justifier sa présence.
> - La différenciation MSA / Dialectes / Coranique se fait par le contenu intérieur des cartes, jamais par des containers visuellement incompatibles.
> - L'app doit évoquer un produit Apple : retenue, espace, hiérarchie typographique plutôt que surcharge colorée.

---

## Périmètre de É20B

| Domaine | Problème constaté | Fix |
|---------|-------------------|-----|
| Tab bar | 6 onglets visibles (Learn, Review, Analytics toujours là) | Suppression stricte → 3 onglets |
| Home — Explorer | Grille de 2 colonnes MSA/Dialectes = doublon du Parcours | Remplacer par ligne d'icônes raccourcis |
| Badges "Nouveau" | Pills rouges/corail = trop agressives | Remplacer par dot discret ou texte gris |
| Cartes — bordures | Contours verts/noirs 2px = effet scolaire | Supprimer, ombre diffuse uniquement |
| Carte Coranique | Bloc vert foncé massif dans Parcours casse l'unité | Même container blanc que les autres, or intérieur |
| Onglet Learn | Grille plate 2 colonnes de tous les modules | Supprimer l'onglet entièrement |
| Boutons | Alternance "Reprendre"/"Continuer" | Harmoniser sur "Reprendre" partout |
| Home — CTA doublon | "Reprendre 0/0 Leçon 0/0" visible quand pas de données | Gérer l'état vide proprement |

**Ce qui est OUT de É20B :**
- Modification du moteur d'exercices ou SRS — inchangé
- Nouveau contenu — pas de seeds
- Animations de transition — É21+
- Refonte du Profil — seulement s'assurer qu'Analytics y est

---

## MISSION 0 — Diagnostic

Lance `@codebase-scout` pour identifier :
- **Tous les fichiers de layout tab bar** : `src/app/(tabs)/_layout.tsx` et tout autre `_layout` qui définit des onglets
- Les routes encore actives pour Learn, Review, Analytics comme onglets
- Les fichiers de screens pour ces onglets supprimés (pour savoir lesquels garder accessibles via push et lesquels supprimer)
- Le composant `ExploreSection` de la Home (ou équivalent) qui affiche la grille 2 colonnes

Confirme l'état avant de toucher quoi que ce soit.

---

## MISSION 1 — Nettoyage Tab Bar : strictement 3 onglets

### Contexte
Les screenshots montrent 6 onglets : Aujourd'hui, Parcours, Profil, Learn, Review, Analytics. Il ne doit en rester que 3.

### Actions

1. Dans le layout tab bar (`src/app/(tabs)/_layout.tsx`), **supprimer** les définitions d'onglet pour :
   - `learn` (ou tout nom associé)
   - `review` (ou tout nom associé)
   - `analytics` (ou tout nom associé)

2. **Ne pas supprimer les screens eux-mêmes** — le screen Review doit rester accessible via `router.push()` depuis la carte SRS de la Home. Le screen Analytics doit rester accessible depuis le Profil. Seul leur statut d'onglet disparaît.

3. Vérifier qu'il ne reste que 3 `Tab.Screen` (ou équivalent Expo Router) :
   - `index` (ou `today`) → "Aujourd'hui", icône `Home`
   - `parcours` → "Parcours", icône `BookOpen`
   - `profile` → "Profil", icône `User`

4. Style de la tab bar :
   - Fond : `#FDFBF7` (crème app)
   - Icônes inactives : gris `#B0AEA6`
   - Icône active : émeraude `#0F624C`
   - Indicateur actif : simple **dot** circulaire 4px émeraude sous l'icône active (pas de highlight background, pas de texte gras)
   - Pas de bordure top sur la tab bar, juste une ombre très subtile vers le haut

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] L'app affiche exactement 3 onglets
- [ ] Review accessible via navigation push (depuis Home)
- [ ] Analytics accessible via navigation push (depuis Profil)
- [ ] Aucune route orpheline

---

## MISSION 2 — Home "Aujourd'hui" : nettoyage section Explorer

### Contexte
La section "Explorer" en bas de la Home affiche une grille 2 colonnes (Arabe Standard / Dialectes / Coranique) qui est un doublon quasi-exact de l'onglet Parcours.

### Actions

1. **Remplacer** la grille de cards Explorer par une ligne minimaliste :

```
EXPLORER LES UNIVERS

[📖]          [💬]          [✦]
Standard    Dialectes    Coranique
```

   - Titre : "Explorer les univers" en Jost Medium 12px, lettres espacées (tracking), gris `#8C8C8C`, uppercase
   - 3 icônes alignées horizontalement avec espacement égal :
     - Standard : icône `BookOpen` (lucide), couleur émeraude `#0F624C`
     - Dialectes : icône `MessageCircle` (lucide), couleur terracotta `#E2725B`
     - Coranique : icône `Star` (lucide), couleur or `#D4AF37`
   - Sous chaque icône : label en Jost Regular 13px, gris `#5A5A5A`
   - Icônes **sans cadre, sans fond, sans card** — juste l'icône + label
   - Sous la rangée : lien discret "Voir tout le parcours →" en Jost Regular 13px émeraude, centré
   - Tap sur une icône → `router.push('/parcours')` (switch vers l'onglet Parcours, idéalement scrollé à la section correspondante si faisable simplement, sinon juste le switch suffit)

2. **Supprimer** tout composant de grille/cards Explorer de la Home (l'ancien `ExploreSection` ou équivalent avec les grosses cartes MSA/Dialectes).

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] La Home n'a plus de grille de modules
- [ ] 3 icônes filaires visibles, tap fonctionnel
- [ ] Aucune sensation de "doublon" entre Home et Parcours

---

## MISSION 3 — Suppression des bordures, harmonisation des cartes

### Contexte
Les screenshots montrent des contours verts/noirs de 2px autour des cartes principales. Effet "scolaire" incompatible avec le positionnement premium.

### Actions

1. Rechercher **toutes** les occurrences de `borderWidth`, `borderColor` dans les composants de la Home et du Parcours. Commande : `grep -rn "borderWidth\|borderColor" src/components/today/ src/components/parcours/ src/app/\(tabs\)/`

2. **Supprimer** toutes les bordures sur les cards (ContinueCard, SrsCard, DialecteCard, QuranicCard, MsaModuleItem, etc.). Les remplacer par :
   ```typescript
   {
     backgroundColor: '#FFFFFF',
     borderRadius: 16,
     // Ombre iOS
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.06,
     shadowRadius: 12,
     // Ombre Android
     elevation: 2,
   }
   ```

3. **Carte Coranique dans Parcours** : actuellement un gros bloc vert foncé massif. La transformer en :
   - **Même container blanc** que les autres cartes (fond `#FFFFFF`, radius 16, shadow)
   - À l'intérieur : calligraphie "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ" en Amiri, couleur or `#D4AF37`, grande taille
   - Sous-titre "X sourates étudiées · Y mémorisées" en gris
   - Un filet/ligne décorative fine or (1px) en haut de la card comme accent subtil
   - **Pas de fond vert foncé** — le fond sombre est réservé à l'écran intérieur coranique quand on y entre

4. Le même principe s'applique aux cartes dialectes dans Parcours : **même container blanc**, accent de couleur uniquement via un filet supérieur fin (2px en haut de la card) de la couleur du dialecte (terracotta pour Darija, ocre pour Égyptien, etc.).

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] Aucune bordure visible autour des cards (vérifier visuellement)
- [ ] Toutes les cards ont le même format container (blanc, radius 16, shadow diffuse)
- [ ] Le Coranique se différencie par la typo or à l'intérieur, pas par le fond
- [ ] Les dialectes se différencient par un filet coloré en haut

---

## MISSION 4 — Badges "Nouveau" : discrétion

### Contexte
Les badges "Nouveau" sur les dialectes sont en rouge/corail, créant un effet promotionnel incongruent.

### Actions

1. Chercher le composant badge "Nouveau" : `grep -rn "Nouveau\|nouveau\|NewBadge\|new-badge" src/`

2. Remplacer le style actuel par :
   - **Option A (dot)** : un cercle de 6px de la couleur accent du dialecte, positionné en haut à droite de la card, sans texte
   - **Option B (texte)** : le mot "Nouveau" en Jost Light 11px, couleur gris `#999999`, sans fond, sans pill, sans bordure

   → Choisir l'option A si le badge est sur une card (plus propre). Option B si c'est inline dans une liste.

3. **Supprimer** tout fond coloré, toute pill arrondie colorée pour les badges "Nouveau".

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] Les badges "Nouveau" sont visuellement discrets
- [ ] Aucun rouge/corail visible sur les badges

---

## MISSION 5 — Harmonisation boutons et états vides

### Contexte
Les screenshots montrent "Reprendre" sur certains écrans et "Continuer" sur d'autres. On voit aussi "0/0 Leçon 0/0" quand il n'y a pas de données.

### Actions

1. **Harmoniser le CTA principal** : utiliser "Reprendre" partout pour le bouton de la carte "Continuer" (la carte reste "Continuer ta leçon" en titre, mais le bouton dit "Reprendre →").

2. **État vide de la ContinueCard** : quand le module en cours a 0 progression (aucune leçon commencée) :
   - Ne pas afficher "0/0 Leçon 0/0" — c'est un artefact technique
   - Afficher à la place : "Commencer →" comme label du bouton
   - Cacher la barre de progression si elle est à 0%

3. **État "aucun module en cours"** (tout est terminé ou premier lancement) :
   - Afficher une carte épurée : "Prêt à explorer ?" en Jost SemiBold + "Choisis ton premier parcours →" en gris + tap → onglet Parcours
   - Pas de badge variante, pas de progression, pas de titre arabe

4. Chercher toutes les occurrences : `grep -rn "Continuer\|continuer" src/` et harmoniser vers "Reprendre" pour le bouton action, sauf dans les titres de section.

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] Le bouton CTA affiche "Reprendre →" quand une leçon est en cours
- [ ] Le bouton CTA affiche "Commencer →" quand le module n'a pas encore été entamé
- [ ] Aucun "0/0" visible nulle part sur la Home
- [ ] L'état vide (aucun module en cours) est traité proprement

---

## MISSION 6 — Raffinement typographique

### Contexte
La hiérarchie visuelle doit être créée par la taille et le poids des polices, pas par la multiplication des couleurs.

### Actions

1. **Vérifier la hiérarchie typographique** sur la Home :
   - "Lisaan" header : Jost Bold 24px, noir `#1A1A1A`
   - "Salam, [nom]" : Jost SemiBold 20px, noir
   - Titre module (FR) : Jost SemiBold 18px, noir
   - Titre module (AR) : Amiri Bold 32px+, noir — c'est la star, elle doit être grande et aérée
   - Labels secondaires ("MODULE 7", "EXPLORER") : Jost Medium 11px, uppercase, tracking 1.5px, gris `#8C8C8C`
   - Corps : Jost Regular 14px, gris `#5A5A5A`

2. **S'assurer que l'arabe respire** : la calligraphie arabe dans la ContinueCard doit avoir au minimum 24px de padding vertical autour d'elle. C'est le cœur visuel de l'app.

3. **Vérifier le Parcours** : la liste MSA (timeline verticale) doit avoir le même traitement typographique :
   - Titre FR : Jost SemiBold 16px
   - Titre AR : Amiri Regular 20px
   - Pas de compétition de taille entre FR et AR — l'arabe est toujours plus grand

### Checkpoint
- [ ] `/checkpoint` → tout vert
- [ ] Hiérarchie visuelle cohérente entre Home et Parcours
- [ ] L'arabe est toujours le plus grand élément textuel dans ses contextes

---

## MISSION 7 — Régression complète

### Actions

1. Lance `@regression-tester` — tout doit être vert.

2. Test visuel systématique :
   - [ ] **Tab bar** : exactement 3 onglets, dot émeraude sous l'actif, fond crème
   - [ ] **Home** : Header → Greeting → ContinueCard (sans bordure, ombre douce) → SrsCard → 3 icônes Explorer → lien "Voir tout"
   - [ ] **Home état vide** : carte "Prêt à explorer ?" sans artefact 0/0
   - [ ] **Parcours MSA** : timeline verticale, pas de grille
   - [ ] **Parcours Dialectes** : cards blanches avec filet coloré en haut, badge "Nouveau" discret (dot ou texte gris)
   - [ ] **Parcours Coranique** : card blanche, calligraphie or à l'intérieur, pas de bloc vert foncé
   - [ ] **Écran intérieur Coranique** : ici le fond sombre est OK (c'est l'inner screen)
   - [ ] **Écran intérieur Dialecte** : accent coloré correct
   - [ ] **Profil** : Analytics accessible
   - [ ] **Navigation Review** : accessible depuis la carte SRS de la Home
   - [ ] **Aucune bordure de 2px** visible sur aucune card

### Checkpoint
- [ ] `@regression-tester` → tout vert
- [ ] Aucun warning TypeScript critique
- [ ] Navigation complète testée (tous les chemins)

---

## Gestion /docs

```
/docs/
  ETAPE-20B-navigation-polish.md   ← CE FICHIER (remplace É20)
  lisaan-seed-letters.json          ← garder

  Supprimer :
  - ETAPE-20-redesign-navigation.md (absorbé par 20B)
```

---

## Résumé des fichiers modifiés

| Action | Fichier | Quoi |
|--------|---------|------|
| Modifier | `src/app/(tabs)/_layout.tsx` | Supprimer onglets Learn/Review/Analytics, style tab bar |
| Modifier | `src/components/today/ExploreSection.tsx` | Grille → 3 icônes filaires |
| Modifier | `src/components/today/ContinueCard.tsx` | Supprimer bordure, gérer états vides, bouton "Reprendre" |
| Modifier | `src/components/today/SrsCard.tsx` | Supprimer bordure, ombre diffuse |
| Modifier | `src/components/parcours/QuranicCard.tsx` | Fond blanc, calligraphie or intérieure |
| Modifier | `src/components/parcours/DialecteCard.tsx` | Fond blanc, filet coloré en haut, badge dot |
| Modifier | `src/components/parcours/MsaModuleItem.tsx` | Supprimer bordure si présente |
| Modifier | Tout composant avec badge "Nouveau" | Style discret (dot ou texte gris) |
