# FIX URGENT — Tab Bar + Bordures (post É20B)

Les 3 corrections suivantes sont **non négociables**. Exécute dans l'ordre.

## 1. Tab Bar — Supprimer les 3 onglets fantômes (CRITIQUE)

Ouvre `src/app/(tabs)/_layout.tsx`. Il y a encore des `Tab.Screen` (ou `Tabs.Screen`) pour `learn`, `review` et `analytics`.

**Supprime-les.** Il ne doit rester que 3 `Tab.Screen` :
- `index` → "Aujourd'hui" (icône Home)
- `parcours` → "Parcours" (icône BookOpen)  
- `profile` → "Profil" (icône User)

Si les fichiers screen `learn.tsx`, `review.tsx`, `analytics.tsx` existent dans `src/app/(tabs)/`, **déplace-les** hors du dossier `(tabs)` (par ex. vers `src/app/review.tsx` ou `src/app/(screens)/review.tsx`) pour qu'ils restent accessibles via `router.push` mais ne soient plus des onglets.

Après ce changement : `ls src/app/\(tabs\)/` ne doit montrer que `_layout.tsx`, `index.tsx`, `parcours.tsx`, `profile.tsx` (plus éventuellement des fichiers utilitaires).

### Validation
- [ ] L'app affiche exactement 3 onglets espacés uniformément
- [ ] Tap "Réviser" sur la carte SRS → ouvre le screen review (via push, pas via tab)
- [ ] `/checkpoint`

## 2. Bordures → Ombres sur toutes les cards

```bash
grep -rn "borderWidth\|borderColor" src/components/today/ src/components/parcours/ src/app/\(tabs\)/index.tsx
```

Pour **chaque occurrence** trouvée sur une card/container :
- Supprime `borderWidth` et `borderColor`
- Ajoute (si pas déjà présent) :
```typescript
shadowColor: '#0F624C',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 10,
elevation: 2,
```

### Validation
- [ ] Aucun `borderWidth` sur les cards de Home/Parcours (re-grep pour confirmer)
- [ ] Visuellement : les cartes "flottent", pas d'encadrement visible
- [ ] `/checkpoint`

## 3. Micro-copy : supprimer "Première leçon"

Dans `ContinueCard` (ou le composant équivalent), le texte "Première leçon" à droite du bouton "Commencer" est redondant. **Supprime-le.** Le bouton "Commencer →" suffit seul.

### Validation
- [ ] Plus de texte "Première leçon" visible
- [ ] `/checkpoint`
