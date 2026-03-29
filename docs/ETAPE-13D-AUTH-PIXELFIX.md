# PROMPT CLAUDE CODE — É13D Fix pixel-perfect écran Auth

## Contexte

`app/auth.tsx` est quasi-final. 3 corrections visuelles mineures à appliquer. Un seul fichier à modifier. Aucun changement de logique.

---

## FIX 1 — Artefact visuel sur le logo

Un trait diagonal noir apparaît au-dessus/à droite du texte latin "LISAAN". Cause probable : le Text arabe لِسَان a un diacritique (kashida ou harakats) qui déborde et chevauche la zone du texte latin à cause du `marginTop: -20`.

**Corrections :**
1. Sur le `Text` arabe لِسَان : ajouter `overflow: 'hidden'` sur son **container** `View` (pas sur le Text lui-même — ça peut couper les harakats)
2. S'assurer que le Text arabe et le Text latin sont dans **deux View séparés** — pas frères directs dans le même conteneur flex sans isolation
3. Changer la couleur du texte arabe لِسَان de `#000000` vers `#0F624C` (`brand.primary`) — **le logo arabe doit avoir la même couleur que le texte latin "LISAAN"**
4. Si le trait persiste, augmenter le `marginTop` du texte latin de `-20` à `-10` ou `-12` jusqu'à ce que l'artefact disparaisse. Tester visuellement.

---

## FIX 2 — Casse des placeholders

Passer tous les placeholders de ALL CAPS à casse standard (majuscule initiale) :

| Avant | Après |
|-------|-------|
| `"PRÉNOM OU PSEUDO"` | `"Prénom ou pseudo"` |
| `"EMAIL"` | `"Email"` |
| `"MOT DE PASSE"` | `"Mot de passe"` |

Chercher ces trois chaînes dans `app/auth.tsx` et remplacer. Si la propriété `textTransform: 'uppercase'` est appliquée aux placeholders via les styles, la supprimer aussi.

---

## FIX 3 — Zone OAuth

1. **Supprimer** le texte "Connexion sociale bientôt disponible" (ou toute variante : "OAuth bientôt disponible", "Prochainement", etc.). Chercher cette chaîne et supprimer le `Text` + son container.

2. **Ajouter `opacity: 0.5`** sur les deux boutons OAuth (Apple et Google) pour indiquer visuellement qu'ils sont inactifs. Appliquer l'opacité sur le `Pressable` / `TouchableOpacity` englobant de chaque bouton, pas sur les enfants individuellement.

---

## Checkpoint

- [ ] Le logo لِسَان est en couleur `#0F624C` (même vert que "LISAAN")
- [ ] Aucun trait noir parasite autour du logo
- [ ] Les placeholders sont en casse standard : "Prénom ou pseudo", "Email", "Mot de passe"
- [ ] Aucun texte "bientôt disponible" ne subsiste
- [ ] Les boutons Apple et Google sont à 50% d'opacité
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] Aucune régression fonctionnelle (inscription email, guest, toggle, etc.)
