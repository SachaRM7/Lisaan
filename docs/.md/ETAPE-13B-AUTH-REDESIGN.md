# PROMPT CLAUDE CODE — Refonte écran Auth (fusion auth-choice + auth-screen)

Avant de commencer, relis `docs/LISAAN-DESIGN-SYSTEM.md` pour les tokens visuels.

## Contexte

É13 a créé deux écrans séparés :
- `app/auth-choice.tsx` — écran post-onboarding avec "Créer un compte" et "Continuer sans compte"
- `app/auth-screen.tsx` — écran inscription/connexion email + OAuth

Ce découpage crée un flux en deux étapes inutile. On fusionne les deux en **un seul écran premium** inspiré d'un mockup validé. L'écran unique gère les 3 modes (signup, login, convert) + le Guest flow, dans une interface élégante avec toggle inscription/connexion.

## CE QUI NE DOIT PAS CHANGER

- La logique dans `useUserStore` (isGuest, guestId, effectiveUserId, setAuthUser, setGuestMode, clearUser)
- Le sync conditionnel dans `sync-manager.ts` (PUSH désactivé en Guest)
- Le fichier `guest-migration.ts` et sa logique de migration
- Le listener de session Supabase dans `_layout.tsx`
- Le routing conditionnel au démarrage dans `_layout.tsx`
- Le bouton "Créer un compte" dans le Profil (mode convert)
- Le client Supabase dans `remote.ts`
- Les dépendances installées (expo-auth-session, expo-apple-authentication, expo-crypto, etc.)

---

## MISSION 1 — Fusionner en un seul écran `app/auth.tsx`

### Actions :

1. **Créer `app/auth.tsx`** — le nouvel écran unifié. Puis **supprimer** `app/auth-choice.tsx` et `app/auth-screen.tsx`.

2. **Paramètre `mode`** : L'écran accepte un paramètre de route optionnel :
   - Pas de paramètre ou `mode: 'signup'` → mode inscription (défaut, affiché après onboarding)
   - `mode: 'login'` → mode connexion (session expirée ou retour utilisateur)
   - `mode: 'convert'` → mode conversion Guest → Auth (depuis Profil)

   Utiliser `useLocalSearchParams` d'Expo Router pour lire le mode.

3. **Toggle interne** : L'écran contient un state `isLogin` (boolean). Le mode initial dépend du paramètre : `signup` → `isLogin = false`, `login` → `isLogin = true`, `convert` → `isLogin = false`.

4. **Mettre à jour toutes les références** dans le codebase :
   ```bash
   grep -rn "auth-choice\|auth-screen" app/ src/ --include="*.ts" --include="*.tsx"
   ```
   Remplacer :
   - `/auth-choice` → `/auth`
   - `/auth-screen` → `/auth`
   - `auth-choice` → `auth`
   - `auth-screen?mode=convert` → `auth?mode=convert`
   - `auth-screen?mode=login` → `auth?mode=login`

5. **Dans `_layout.tsx`**, le routing conditionnel reste identique sauf la route :
   ```typescript
   // Avant :
   // router.replace('/auth-choice');
   // Après :
   router.replace('/auth');
   ```

6. **Dans `app/(tabs)/profile.tsx`**, le bouton de conversion Guest :
   ```typescript
   // Avant :
   // router.push('/auth-screen?mode=convert');
   // Après :
   router.push('/auth?mode=convert');
   ```

7. **Dans la fonction `logout()`** :
   ```typescript
   // Avant :
   // router.replace('/auth-choice');
   // Après :
   router.replace('/auth');
   ```

### Checkpoint M1 :
- [ ] `app/auth.tsx` existe
- [ ] `app/auth-choice.tsx` supprimé
- [ ] `app/auth-screen.tsx` supprimé
- [ ] Aucune référence à `auth-choice` ou `auth-screen` dans le codebase
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 2 — Implémenter le design de l'écran unifié

### Structure visuelle

L'écran est un ScrollView plein écran avec cette structure :

```
┌──────────────────────────────────────────┐
│  Fond background.main + pattern Zellige  │
│  (étoile 8 branches, brand.primary       │
│   à 3% opacité, strokes 1px)            │
│                                          │
│           ┌──────────┐                   │
│           │  لِسَان   │  ← Amiri, 64px   │
│           │  LISAAN  │  ← Jost-SemiBold  │
│           └──────────┘     tiny 12px     │
│                              uppercase   │
│                              letterSp 3  │
│                              brand.primary│
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Card blanche                      │  │
│  │  fond background.card              │  │
│  │  radius lg=24, ombre medium        │  │
│  │  padding 32                        │  │
│  │                                    │  │
│  │  ┌─ Header ──────────────────────┐ │  │
│  │  │ "Créer un compte"  SE CONNECTER│ │  │
│  │  │  Jost-SemiBold      toggle     │ │  │
│  │  │  h1 24px            Jost-Medium│ │  │
│  │  │  text.primary       tiny 12px  │ │  │
│  │  │                     uppercase  │ │  │
│  │  │                     brand.primary│ │ │
│  │  │                     border-b 2px│ │ │
│  │  │                     brand.light │ │  │
│  │  └────────────────────────────────┘ │  │
│  │                                    │  │
│  │  [Si inscription : champ Prénom]   │  │
│  │  [Champ Email]                     │  │
│  │  [Champ Mot de passe + eye toggle] │  │
│  │                                    │  │
│  │  ┌────────────────────────────┐    │  │
│  │  │   CRÉER MON COMPTE  →     │    │  │
│  │  │   Button primary pill      │    │  │
│  │  └────────────────────────────┘    │  │
│  │                                    │  │
│  │  ──────── OU ────────              │  │
│  │                                    │  │
│  │  ┌────────────────────────────┐    │  │
│  │  │ 🍎 Continuer avec Apple    │    │  │
│  │  │    Button outline pill     │    │  │
│  │  └────────────────────────────┘    │  │
│  │  ┌────────────────────────────┐    │  │
│  │  │ G  Continuer avec Google   │    │  │
│  │  │    Button outline pill     │    │  │
│  │  └────────────────────────────┘    │  │
│  │                                    │  │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │  │
│  │                                    │  │
│  │  "Explorer sans compte →"          │  │
│  │   Jost-Regular, body 16px          │  │
│  │   text.secondary                   │  │
│  │   Touchable, centré                │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  "En continuant, tu acceptes nos         │
│   Conditions et notre Politique          │
│   de confidentialité."                   │
│   Jost-Regular, tiny 12px               │
│   text.secondary, centré                 │
│   Liens soulignés                        │
└──────────────────────────────────────────┘
```

### Specs détaillées

**Fond de page :**
- Couleur : `background.main` (#FDFBF7)
- Pattern Zellige **subtil** en arrière-plan : étoile à 8 branches en strokes 1px, couleur `brand.primary` à 3% d'opacité. Utiliser un SVG pattern répété ou un composant SVG fullscreen en position absolute, `pointerEvents: 'none'`. Si trop complexe à implémenter en SVG pur, utiliser un fond uni `background.main` — c'est acceptable.
- **PAS de losanges gris.** Pas de pattern diamant/chevron.

**Logo hero :**
- Texte لِسَان en **Amiri-Bold**, taille `arabicDisplay` (64px), couleur `brand.primary`
- Sous-titre "LISAAN" en Jost-SemiBold, `tiny` (12px), uppercase, letterSpacing 3, `brand.primary`
- marginBottom 32 avant la card

**Card principale :**
- Fond `background.card`, borderRadius `lg` (24), ombre `medium` (via `getShadows()`), padding 32
- width : `100%` avec marginHorizontal 24 (ou `width: '100%', maxWidth: 420` sur tablette)

**Header de la card :**
- Flex-row, justifyContent space-between, alignItems flex-end, marginBottom 32
- Gauche : titre dynamique
  - Inscription : "Créer un compte" — Jost-SemiBold, h1 (24px), `text.primary`
  - Connexion : "Bienvenue" — Jost-SemiBold, h1 (24px), `text.primary`
  - Convert : "Créer un compte" — Jost-SemiBold, h1 (24px), `text.primary`
- Droite : toggle texte cliquable
  - Inscription : "SE CONNECTER" — Jost-Medium, tiny (12px), uppercase, letterSpacing 1, `brand.primary`, borderBottom 2px `brand.light`, paddingBottom 4
  - Connexion : "S'INSCRIRE" — même style
  - Convert : **pas de toggle** (on force l'inscription)
  - `onPress` → `setIsLogin(!isLogin)`

**Champs de formulaire :**
- Chaque champ : height 56, borderRadius md (16), border 1px `border.medium`, paddingHorizontal 20
- Fond : transparent (pas de fond gris)
- Placeholder : Jost-Medium, small (14px), uppercase, letterSpacing 1, `text.secondary`
- Valeur saisie : Jost-Regular, body (16px), `text.primary`
- Focus : border 2px `brand.primary` (remplace le 1px), pas de ring additionnel
- Gap entre les champs : spacing `sm` (12)
- **Pas d'icône** à droite des champs email et prénom — seulement le champ mot de passe a l'icône eye/eye-off
- Icône eye/eye-off : `text.secondary`, taille 20, position absolute right 20 top 50% -translate-y

**Champs affichés selon le mode :**
- Inscription (`isLogin = false`) : Prénom + Email + Mot de passe (3 champs)
- Connexion (`isLogin = true`) : Email + Mot de passe (2 champs)
- Transition : utiliser `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` avant le `setIsLogin` pour animer l'apparition/disparition du champ prénom

**Erreurs :**
- Affichées inline sous le champ concerné
- Jost-Regular, small (14px), `status.error`
- Erreur globale (ex : "Email déjà utilisé") : affichée au-dessus du bouton CTA
- **Jamais d'Alert()** — toujours inline

**Bouton CTA :**
- Button primary standard du DS : height 56, borderRadius pill, fond `brand.primary`, texte `text.inverse`
- Texte : Jost-SemiBold, body (16px), uppercase, letterSpacing 1
  - Inscription : "CRÉER MON COMPTE"
  - Connexion : "SE CONNECTER"
- Icône flèche droite (ArrowRight de lucide-react-native, size 18, strokeWidth 2.5) à droite du texte, gap 8
- marginTop spacing `md` (20)
- **Loading state :** quand la requête est en cours, remplacer le texte + icône par un ActivityIndicator `text.inverse`
- **Pressed state :** fond `brand.dark`, scale 0.98 (via Animated/Reanimated)

**Séparateur "OU" :**
- Flex-row, alignItems center, marginVertical spacing `lg` (24)
- Deux lignes flex-1, height 1px, `border.subtle`
- Texte "OU" au centre : Jost-SemiBold, tiny (12px), uppercase, letterSpacing 2, `text.secondary`, paddingHorizontal 16

**Boutons OAuth :**
- Height 52, borderRadius pill, border 1px `border.medium`, fond `background.card` (ou transparent)
- Flex-row, justifyContent center, alignItems center, gap 12
- Icône Apple : SVG path noir, size 20 (Apple visible uniquement sur iOS — `Platform.OS === 'ios'`)
- Icône Google : SVG path multicolore officiel, size 20
- Texte : Jost-SemiBold, small (14px), `text.primary`
- Gap entre les deux boutons : spacing `sm` (12)
- **Pressed state :** fond `background.group`

**Lien Guest ("Explorer sans compte →") :**
- **Position :** en bas de la card, après les boutons OAuth, séparé par un espace marginTop spacing `lg` (24)
- Touchable, centré
- Texte : "Explorer sans compte" — Jost-Regular, body (16px), `text.secondary`
- Icône flèche droite inline après le texte (ArrowRight, size 16, `text.secondary`)
- **Pressed state :** texte passe à `text.primary`
- **Action :** identique au flow Guest existant :
  ```typescript
  import * as Crypto from 'expo-crypto';
  const guestId = Crypto.randomUUID();
  useUserStore.getState().setGuestMode(guestId);
  router.replace('/(tabs)/learn');
  ```
- **Quand masquer le lien Guest :**
  - `mode === 'convert'` → masqué (l'utilisateur EST déjà Guest, il convertit)
  - `mode === 'login'` → masqué (l'utilisateur a déjà eu un compte)
  - `mode === 'signup'` ou pas de mode → visible

**Footer légal :**
- En dehors de la card, marginTop spacing `lg` (24), marginBottom spacing `xl` (32)
- Texte : "En continuant, tu acceptes nos Conditions et notre Politique de confidentialité."
- Jost-Regular, tiny (12px), `text.secondary`, textAlign center, maxWidth 300
- "Conditions" et "Politique de confidentialité" : soulignés, `text.secondary`, onPress → Linking.openURL

### Checkpoint M2 :
- [ ] L'écran auth s'affiche avec le logo hero لِسَان + card blanche
- [ ] Le toggle "SE CONNECTER / S'INSCRIRE" fonctionne avec animation du champ prénom
- [ ] Le fond est `background.main` (pas de losanges gris)
- [ ] Tous les tokens DS sont utilisés (zéro hex en dur dans le fichier)
- [ ] Le lien "Explorer sans compte" est visible en mode signup, masqué en convert/login
- [ ] Les champs n'ont pas d'icône illisible (seulement eye/eye-off sur le mot de passe)
- [ ] Aucune couleur ou police hardcodée

---

## MISSION 3 — Logique d'authentification

### Actions :

Reprendre **toute la logique auth** de l'ancien `auth-screen.tsx` et l'intégrer dans le nouvel écran. Si l'ancien écran n'a jamais été implémenté (É13 pas encore exécutée), implémenter la logique ici :

1. **Inscription email :**
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: { data: { display_name: displayName } },
   });
   if (error) {
     setError(error.message);
     return;
   }
   useUserStore.getState().setAuthUser(data.user!.id, email, 'email');
   ```

2. **Connexion email :**
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
   if (error) {
     setError(error.message);
     return;
   }
   useUserStore.getState().setAuthUser(data.user!.id, email, 'email');
   ```

3. **OAuth Google :**
   ```typescript
   import * as WebBrowser from 'expo-web-browser';
   import * as AuthSession from 'expo-auth-session';

   // Implémenter le flow OAuth Google avec expo-auth-session
   // Le callback met à jour le store via setAuthUser
   ```

4. **OAuth Apple (iOS only) :**
   ```typescript
   import * as AppleAuthentication from 'expo-apple-authentication';

   // Utiliser signInWithIdToken côté Supabase
   ```

5. **Navigation après succès :**
   ```typescript
   if (mode === 'convert') {
     await migrateGuestToAuth(data.user!.id);
     useUserStore.getState().setAuthUser(data.user!.id, email, provider);
     router.replace('/(tabs)/profile');
   } else {
     router.replace('/(tabs)/learn');
   }
   ```

6. **Gestion réseau :** Si pas de réseau, afficher une erreur inline "Connexion internet requise" — pas de crash.

### Checkpoint M3 :
- [ ] L'inscription email crée un compte dans Supabase et navigue vers Home
- [ ] La connexion email fonctionne
- [ ] Le bouton Google est implémenté (même si la config Console n'est pas encore faite)
- [ ] Le bouton Apple est implémenté (iOS uniquement, `Platform.OS === 'ios'`)
- [ ] Le mode `convert` déclenche `migrateGuestToAuth` puis navigue vers Profil
- [ ] Les erreurs s'affichent inline (jamais d'Alert)
- [ ] Le loading state est visible pendant les requêtes
- [ ] Pas de crash si réseau absent
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 4 — Nettoyage et vérification

### Actions :

1. **Supprimer les fichiers morts :**
   ```bash
   rm -f app/auth-choice.tsx app/auth-screen.tsx
   ```
   Vérifier que ces fichiers sont bien supprimés (pas juste vidés).

2. **Vérifier les imports :**
   ```bash
   grep -rn "auth-choice\|auth-screen" app/ src/ --include="*.ts" --include="*.tsx"
   # → 0 résultat attendu
   ```

3. **Vérifier les routes Expo Router :**
   S'assurer que le fichier `app/auth.tsx` est bien reconnu par Expo Router comme route `/auth`.

4. **Test des 6 scénarios critiques :**

   | # | Scénario | Résultat attendu |
   |---|----------|-----------------|
   | 1 | Onboarding terminé → `/auth` (signup) | Card avec 3 champs + OAuth + lien Guest |
   | 2 | Tap "Explorer sans compte" | Guest mode → Home |
   | 3 | Tap toggle "SE CONNECTER" | Animation, 2 champs, lien Guest masqué |
   | 4 | Inscription email réussie | Store mis à jour → Home |
   | 5 | Profil Guest → "Créer un compte" → `/auth?mode=convert` | Card sans toggle, sans lien Guest, 3 champs |
   | 6 | Logout → `/auth` | Card signup avec toggle et lien Guest |

5. **Vérifier la cohérence DS :**
   ```bash
   # Aucune couleur hex en dur dans le fichier auth
   grep -n "#[0-9a-fA-F]" app/auth.tsx
   # → 0 résultat attendu (sauf dans les SVG paths Apple/Google qui sont des constantes d'icône)
   ```

6. **Architecture :**
   ```bash
   grep -rn "from.*db/remote\|from.*supabase" app/auth.tsx
   # → Autorisé UNIQUEMENT pour les appels supabase.auth (signup, signIn, OAuth)
   # L'écran auth est une exception documentée (il DOIT parler à Supabase pour l'auth)
   ```

### Checkpoint M4 :
- [ ] `app/auth-choice.tsx` et `app/auth-screen.tsx` supprimés
- [ ] 0 référence à `auth-choice` ou `auth-screen` dans le codebase
- [ ] Les 6 scénarios du tableau passent
- [ ] 0 couleur hex en dur dans `app/auth.tsx` (hors SVG paths)
- [ ] L'écran compile et s'affiche correctement en mode signup, login et convert
- [ ] Le flux complet fonctionne : onboarding → auth → [Guest | Auth] → Home
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] Aucune régression sur les autres écrans

---

## RÉSUMÉ DES FICHIERS

| Action | Fichier |
|--------|---------|
| CRÉER | `app/auth.tsx` |
| SUPPRIMER | `app/auth-choice.tsx` |
| SUPPRIMER | `app/auth-screen.tsx` |
| MODIFIER | `app/_layout.tsx` (routes `/auth-choice` → `/auth`) |
| MODIFIER | `app/(tabs)/profile.tsx` (route convert → `/auth?mode=convert`) |
| MODIFIER | Tout fichier référençant `auth-choice` ou `auth-screen` |
