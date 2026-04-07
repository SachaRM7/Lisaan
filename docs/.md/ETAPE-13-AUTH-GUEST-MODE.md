# ÉTAPE 13 — AUTH + GUEST MODE

> **Objectif :** Permettre à l'utilisateur de s'inscrire (email/Google/Apple), se connecter, ou utiliser l'app sans compte (Guest Mode) avec migration seamless vers un compte complet sans perte de progression.

---

## CONTEXTE

### Ce qui existe déjà
- Onboarding complet (É1) : 5 écrans + recommandation de variante
- `useUserStore` (Zustand) : stocke userId, displayName, streak, XP, onboarding answers
- `useSettingsStore` (Zustand) : lit/écrit SQLite, sync fire-and-forget
- SQLite local (7 tables + sync_metadata) : user_progress, srs_cards, user_settings, letters, diacritics, modules, lessons
- `sync-manager.ts` : PUSH progression SQLite → Supabase Cloud (fire-and-forget)
- `content-sync.ts` : PULL contenu Cloud → SQLite
- `remote.ts` : client Supabase Cloud (importé UNIQUEMENT par sync-manager et content-sync)
- Supabase Cloud configuré (projet "Lisaan", Europe, free tier)
- Design System complet (É12) avec Jost, bottom sheets, haptics, Bento cards
- Écran Profil existant avec réglages

### Ce qui doit changer
- L'app démarre actuellement sans auth → il faut un écran de choix Auth/Guest APRÈS l'onboarding
- `useUserStore` ne gère pas `is_guest` ni `guest_id` → à ajouter
- `sync-manager.ts` pushe toujours → doit être conditionnel (désactivé en Guest)
- Pas d'écran de connexion/inscription → à créer
- Pas de flow de conversion Guest → Auth → à implémenter

---

## ARCHITECTURE

### Flux utilisateur

```
Premier lancement :
  Splash → Onboarding (5 écrans) → Écran Recommandation
  → NOUVEAU : Écran Auth Choice
      ├── "Créer un compte" → Auth Screen (email / Google / Apple) → Home
      └── "Continuer sans compte" → Génère guest_id local → Home

Lancement suivant (Guest) :
  Splash → Home (guest_id retrouvé dans AsyncStorage)

Lancement suivant (Auth) :
  Splash → Session Supabase valide ? → Home
                                    → Auth Screen si session expirée

Conversion Guest → Auth (depuis Profil) :
  Profil → "Créer un compte" → Auth Screen → Migration SQLite → Sync PUSH → Home
```

### Modèle de données

#### Changements dans useUserStore (Zustand + AsyncStorage)

```typescript
interface UserState {
  // Existant
  userId: string | null;
  displayName: string | null;
  streak_current: number;
  streak_longest: number;
  total_xp: number;
  onboarding_answers: OnboardingAnswers | null;
  recommended_variant: Variant | null;
  active_variant: Variant | null;
  daily_goal_minutes: number;

  // NOUVEAU
  isGuest: boolean;           // true si pas de compte
  guestId: string | null;     // UUID généré localement pour le guest
  email: string | null;       // email du compte auth (null si guest)
  authProvider: 'email' | 'google' | 'apple' | null; // provider utilisé

  // Le userId effectif = isGuest ? guestId : supabaseAuthUid
}
```

**Persistance :** `isGuest`, `guestId`, `email`, `authProvider` sont persistés dans AsyncStorage (via Zustand persist middleware) pour survivre aux redémarrages.

#### Pas de changement de schéma SQLite

Les tables SQLite utilisent déjà `user_id TEXT`. En Guest Mode, `user_id` = `guestId`. Lors de la conversion, on UPDATE toutes les lignes.

### Règles du Guest Mode

| Aspect | Comportement Guest | Comportement Auth |
|---|---|---|
| Onboarding | Complet, identique | Complet, identique |
| Leçons & exercices | Tous accessibles | Tous accessibles |
| Progression SQLite | Écrite avec `guestId` | Écrite avec Supabase UID |
| SRS (révision) | Fonctionne localement | Fonctionne + sync cloud |
| Streaks & XP | Comptés localement | Comptés + sync cloud |
| Sync PUSH | **DÉSACTIVÉ** | Actif (fire-and-forget) |
| Sync PULL contenu | Actif (pas besoin d'auth) | Actif |
| Multi-device | Non (local uniquement) | Oui (via Cloud) |
| Perte de données | Si désinstallation = perdu | Récupérable via Cloud |

### Conversion Guest → Auth (migration seamless)

```
1. User clique "Créer un compte" dans Profil
2. Auth Screen s'affiche (email / Google / Apple)
3. Supabase Auth crée le compte → retourne newUserId
4. Migration SQLite :
   UPDATE user_progress SET user_id = :newUserId WHERE user_id = :guestId
   UPDATE srs_cards SET user_id = :newUserId WHERE user_id = :guestId
   UPDATE user_settings SET user_id = :newUserId WHERE user_id = :guestId
5. useUserStore :
   userId = newUserId
   isGuest = false
   guestId = null
   email = authEmail
   authProvider = provider
6. Sync PUSH activé → runSync() pousse tout vers Cloud
7. Retour au Profil avec confirmation
```

### Supabase Auth Config

#### Providers à activer dans le Dashboard Supabase
- **Email** : activé, confirmation email désactivée au MVP (pour simplifier), à activer en prod
- **Google** : OAuth avec Google Cloud Console (client ID iOS + Android)
- **Apple** : Sign in with Apple (obligatoire sur iOS si autres OAuth présents)

#### RLS Policies (déjà en place)
Le contenu (letters, diacritics, modules, lessons) est accessible en SELECT sans auth (anon key suffit). Les tables utilisateur (user_progress, srs_cards, user_settings) ont des policies `auth.uid() = user_id` — donc inaccessibles en Guest (ce qui est correct, le Guest ne sync pas).

---

## MISSIONS CLAUDE CODE

> **Rappel workflow :** Chaque mission est une liste d'actions atomiques. Checkpoint de validation à la fin de chaque mission. Ne pas passer à la mission suivante sans valider le checkpoint.

---

### MISSION 1 — Préparer le store et la persistance Auth

**Objectif :** Adapter `useUserStore` pour gérer Guest et Auth, avec persistance AsyncStorage.

1. Installer `@react-native-async-storage/async-storage` si pas déjà présent :
   ```bash
   npx expo install @react-native-async-storage/async-storage
   ```

2. Ouvrir `src/stores/useUserStore.ts`. Ajouter les champs suivants au state :
   ```typescript
   isGuest: boolean;        // défaut: false
   guestId: string | null;  // défaut: null
   email: string | null;    // défaut: null
   authProvider: 'email' | 'google' | 'apple' | null; // défaut: null
   ```

3. Ajouter un getter computed `effectiveUserId` :
   ```typescript
   // Le userId utilisé partout dans l'app
   effectiveUserId: () => string | null
   // Implémentation : return isGuest ? guestId : userId
   ```

4. Ajouter les actions suivantes :
   ```typescript
   setGuestMode: (guestId: string) => void
   // → set isGuest = true, guestId = guestId, userId = null

   setAuthUser: (userId: string, email: string, provider: 'email' | 'google' | 'apple') => void
   // → set isGuest = false, userId = userId, email = email, authProvider = provider, guestId = null

   clearUser: () => void
   // → reset tout à null/false (pour déconnexion)
   ```

5. Ajouter la persistance Zustand avec AsyncStorage :
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { persist, createJSONStorage } from 'zustand/middleware';

   // Wrapper le store avec persist
   // Clés à persister : userId, isGuest, guestId, email, authProvider,
   //   displayName, onboarding_answers, recommended_variant, active_variant,
   //   streak_current, streak_longest, total_xp, daily_goal_minutes
   ```

6. **IMPORTANT** — Partout dans l'app où `useUserStore.userId` est utilisé pour des opérations SQLite, remplacer par `useUserStore.getState().effectiveUserId()`. Chercher tous les usages avec :
   ```bash
   grep -rn "userId" src/ app/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts"
   ```
   Les fichiers les plus probables : `local-queries.ts`, `sync-manager.ts`, `content-sync.ts`, les hooks (`useProgress.ts`, `useSRSCards.ts`), les engines (`exercise-generator.ts`, `srs.ts`, `streak.ts`, `xp.ts`).

   **Règle :** `effectiveUserId()` est la SEULE source de vérité pour l'identifiant utilisateur dans les opérations de données.

**✅ CHECKPOINT MISSION 1 :**
- [ ] `useUserStore` a les 4 nouveaux champs + `effectiveUserId` + 3 nouvelles actions
- [ ] Le store est persisté dans AsyncStorage
- [ ] Tous les usages de `userId` dans les opérations SQLite pointent vers `effectiveUserId()`
- [ ] L'app compile sans erreur TypeScript
- [ ] L'app démarre normalement (pas de régression)

---

### MISSION 2 — Conditionner le Sync PUSH au mode Auth

**Objectif :** Le sync PUSH (progression → Cloud) ne doit s'exécuter QUE si l'utilisateur est authentifié (pas Guest).

1. Ouvrir `src/engines/sync-manager.ts`.

2. Dans la fonction `runSync()` (ou équivalent), ajouter un guard en tout début :
   ```typescript
   const { isGuest } = useUserStore.getState();
   if (isGuest) {
     console.log('[SyncManager] Guest mode — PUSH skipped');
     return;
   }
   ```

3. Dans le listener NetInfo (la fonction qui déclenche le sync au retour de connexion), ajouter le même guard :
   ```typescript
   if (useUserStore.getState().isGuest) return;
   ```

4. Le sync PULL contenu (`content-sync.ts`) ne doit PAS être conditionné — le contenu est public et accessible avec la anon key. Vérifier que `content-sync.ts` n'utilise pas `auth.uid()` ni ne requiert de session.

5. Vérifier que `user-data-pull.ts` (pull initial progression Cloud → SQLite) est aussi gardé par `!isGuest` car un Guest n'a pas de données cloud.

**✅ CHECKPOINT MISSION 2 :**
- [ ] `runSync()` ne s'exécute plus si `isGuest === true`
- [ ] Le listener NetInfo ne déclenche pas de sync PUSH en Guest
- [ ] Le PULL contenu fonctionne toujours (Guest et Auth)
- [ ] `user-data-pull.ts` est gardé
- [ ] Pas de régression sur le sync existant

---

### MISSION 3 — Créer l'écran Auth Choice (post-onboarding)

**Objectif :** Créer l'écran qui s'affiche après l'onboarding et propose "Créer un compte" ou "Continuer sans compte".

1. Créer le fichier `app/auth-choice.tsx`.

2. Le design doit suivre le Design System Lisaan (police Jost, tokens de couleur du fichier `design-tokens.ts` ou `constants/`). L'écran contient :
   - **Header :** Logo Lisaan ou titre "لِسَان" en Amiri
   - **Titre :** "Prêt à commencer ?" (Jost SemiBold, 24px)
   - **Sous-titre :** "Crée un compte pour sauvegarder ta progression sur tous tes appareils." (Jost Regular, 16px, couleur secondaire)
   - **Bouton principal :** "Créer un compte" → navigue vers `/auth-screen`
   - **Bouton secondaire (outline ou texte) :** "Continuer sans compte" → exécute le flow Guest :
     ```typescript
     import * as Crypto from 'expo-crypto';
     const guestId = Crypto.randomUUID();
     useUserStore.getState().setGuestMode(guestId);
     // Écrire les user_settings par défaut dans SQLite avec ce guestId
     // Naviguer vers /(tabs)/learn
     router.replace('/(tabs)/learn');
     ```
   - **Note discrète en bas :** "Tu pourras créer un compte plus tard depuis ton profil." (Jost Regular, 13px, couleur muted)

3. **Intégrer dans le flux de navigation :** Ouvrir le fichier qui gère la fin de l'onboarding (probablement `app/onboarding/` ou la logique dans `_layout.tsx`). Après l'écran de recommandation, au lieu de naviguer directement vers `/(tabs)/learn`, naviguer vers `/auth-choice`.

4. **Conditionner l'affichage :** Dans `app/_layout.tsx` (ou le root navigator), la logique de démarrage doit être :
   ```
   Si pas d'onboarding fait → /onboarding
   Si onboarding fait MAIS ni guest ni auth → /auth-choice
   Si guest OU auth → /(tabs)/learn
   ```
   Utiliser `useUserStore` (persisté) pour vérifier : `isGuest || userId` → l'utilisateur a déjà choisi.

**✅ CHECKPOINT MISSION 3 :**
- [ ] L'écran `auth-choice` s'affiche après l'onboarding
- [ ] Le bouton "Continuer sans compte" génère un guestId, l'écrit dans le store, et navigue vers Home
- [ ] Le bouton "Créer un compte" navigue vers `/auth-screen` (écran vide pour l'instant, c'est OK)
- [ ] Au redémarrage, un Guest retrouve sa session (AsyncStorage) et arrive directement sur Home
- [ ] Le flux onboarding → auth-choice → home est fluide, pas de flash d'écran

---

### MISSION 4 — Créer l'écran Auth Screen (inscription/connexion)

**Objectif :** Écran de connexion/inscription avec email + mot de passe, Google et Apple.

1. Créer le fichier `app/auth-screen.tsx`.

2. L'écran a **deux modes** (toggle en haut ou tab) : "S'inscrire" et "Se connecter".

3. **Mode inscription :**
   - Champ "Prénom ou pseudo" (TextInput, stocké comme `displayName`)
   - Champ "Email" (TextInput, keyboardType email)
   - Champ "Mot de passe" (TextInput, secureTextEntry, minimum 8 caractères)
   - Bouton "Créer mon compte" → appelle :
     ```typescript
     import { supabase } from '@/src/db/remote';

     const { data, error } = await supabase.auth.signUp({
       email,
       password,
       options: { data: { display_name: displayName } }
     });

     if (data.user) {
       useUserStore.getState().setAuthUser(data.user.id, email, 'email');
       useUserStore.getState().setDisplayName(displayName);
       // Écrire user_settings par défaut dans SQLite
       // Naviguer vers /(tabs)/learn
     }
     ```
   - Gestion d'erreur : afficher un message sous le formulaire (pas d'Alert native)

4. **Mode connexion :**
   - Champ "Email"
   - Champ "Mot de passe"
   - Bouton "Se connecter" → `supabase.auth.signInWithPassword({ email, password })`
   - En cas de succès : `setAuthUser(user.id, email, 'email')` + pull données cloud si existantes + naviguer

5. **OAuth Google :**
   - Installer `expo-auth-session` et `expo-web-browser` si pas présents :
     ```bash
     npx expo install expo-auth-session expo-web-browser
     ```
   - Implémenter le flow Google OAuth avec Supabase :
     ```typescript
     import * as Google from 'expo-auth-session/providers/google';
     import * as WebBrowser from 'expo-web-browser';

     WebBrowser.maybeCompleteAuthSession();

     // Utiliser supabase.auth.signInWithOAuth ou le flow manual avec
     // Google.useAuthRequest + échange du token avec Supabase
     ```
   - **NOTE :** Ceci nécessite un Google Cloud Console project configuré avec les bons redirect URIs. Pour l'instant, implémenter le code côté app. La config Google Console sera faite manuellement.
   - Bouton "Continuer avec Google" (icône Google + texte)

6. **Sign in with Apple :**
   - Installer `expo-apple-authentication` :
     ```bash
     npx expo install expo-apple-authentication
     ```
   - Implémenter :
     ```typescript
     import * as AppleAuthentication from 'expo-apple-authentication';

     const credential = await AppleAuthentication.signInAsync({
       requestedScopes: [
         AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
         AppleAuthentication.AppleAuthenticationScope.EMAIL,
       ],
     });

     // Échanger le identityToken avec Supabase
     const { data, error } = await supabase.auth.signInWithIdToken({
       provider: 'apple',
       token: credential.identityToken!,
     });
     ```
   - Bouton "Continuer avec Apple" (style Apple standard, noir)
   - **Conditionner l'affichage** : ne montrer le bouton Apple QUE sur iOS (`Platform.OS === 'ios'`)

7. **Design :**
   - Séparateur "ou" entre le formulaire email et les boutons OAuth
   - Les boutons OAuth sont au-dessus du formulaire email (convention mobile 2025)
   - Ordre : Apple (iOS only, en haut) → Google → séparateur "ou" → formulaire email
   - Loading state sur les boutons pendant les requêtes
   - Les erreurs s'affichent inline, pas en Alert

8. **Paramètre `mode` :** L'écran peut être appelé avec un paramètre pour déterminer le contexte :
   - `mode: 'signup'` (depuis auth-choice, première utilisation)
   - `mode: 'login'` (depuis un retour utilisateur)
   - `mode: 'convert'` (depuis Profil, conversion Guest → Auth, voir Mission 6)

   Si `mode === 'convert'`, après le succès auth, déclencher la migration (Mission 6) au lieu de juste naviguer.

**✅ CHECKPOINT MISSION 4 :**
- [ ] L'écran auth-screen s'affiche avec les deux modes (inscription/connexion)
- [ ] L'inscription email fonctionne (compte créé dans Supabase, userId dans le store)
- [ ] La connexion email fonctionne
- [ ] Le bouton Google est présent et le code OAuth est implémenté (même si la config Console n'est pas encore faite)
- [ ] Le bouton Apple est présent sur iOS avec le flow `signInWithIdToken`
- [ ] Les erreurs s'affichent inline
- [ ] Après succès, navigation vers Home
- [ ] Pas de crash si réseau absent (message d'erreur approprié)

---

### MISSION 5 — Session management et auto-login

**Objectif :** Gérer la persistance de session Supabase et le routing automatique au démarrage.

1. **Listener de session Supabase.** Dans `app/_layout.tsx` (ou un provider dédié), ajouter :
   ```typescript
   useEffect(() => {
     // Récupérer la session existante au démarrage
     supabase.auth.getSession().then(({ data: { session } }) => {
       if (session) {
         useUserStore.getState().setAuthUser(
           session.user.id,
           session.user.email!,
           // Détecter le provider depuis session.user.app_metadata
           detectProvider(session.user)
         );
       }
     });

     // Écouter les changements de session (refresh token, logout)
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         if (event === 'SIGNED_IN' && session) {
           useUserStore.getState().setAuthUser(
             session.user.id,
             session.user.email!,
             detectProvider(session.user)
           );
         } else if (event === 'SIGNED_OUT') {
           useUserStore.getState().clearUser();
         }
       }
     );

     return () => subscription.unsubscribe();
   }, []);
   ```

2. **Routing conditionnel au démarrage.** La logique dans `_layout.tsx` doit être :
   ```typescript
   // Après chargement des polices + init SQLite :
   const { isGuest, userId } = useUserStore();
   const hasCompletedOnboarding = useUserStore(s => s.onboarding_answers !== null);

   if (!hasCompletedOnboarding) {
     // → Onboarding
   } else if (!isGuest && !userId) {
     // Onboarding fait mais pas de choix auth/guest → auth-choice
   } else {
     // Guest ou Auth → Home
   }
   ```

3. **Logout.** Créer une fonction `logout` accessible depuis le Profil :
   ```typescript
   async function logout() {
     if (!useUserStore.getState().isGuest) {
       await supabase.auth.signOut();
     }
     useUserStore.getState().clearUser();
     // Optionnel : vider les tables user dans SQLite ?
     // Pour le MVP : NE PAS vider. L'utilisateur pourra se reconnecter.
     router.replace('/auth-choice');
   }
   ```

4. **Configurer Supabase Auth storage.** Dans `src/db/remote.ts`, s'assurer que le client Supabase utilise un storage persistant compatible React Native :
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { createClient } from '@supabase/supabase-js';

   export const supabase = createClient(
     process.env.EXPO_PUBLIC_SUPABASE_URL!,
     process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
     {
       auth: {
         storage: AsyncStorage,
         autoRefreshToken: true,
         persistSession: true,
         detectSessionInUrl: false, // Important pour React Native
       },
     }
   );
   ```

**✅ CHECKPOINT MISSION 5 :**
- [ ] Au démarrage, si une session Supabase existe, l'utilisateur arrive directement sur Home (pas d'écran de login)
- [ ] Si la session expire, l'utilisateur est redirigé vers auth-screen
- [ ] Le listener `onAuthStateChange` met à jour le store en temps réel
- [ ] Le bouton "Se déconnecter" dans Profil fonctionne et ramène à auth-choice
- [ ] Le client Supabase persiste la session dans AsyncStorage
- [ ] Un Guest au démarrage arrive directement sur Home (pas de re-onboarding)

---

### MISSION 6 — Migration Guest → Auth (conversion seamless)

**Objectif :** Quand un Guest crée un compte, migrer toutes ses données locales vers le nouveau userId et activer le sync.

1. Créer le fichier `src/engines/guest-migration.ts` :
   ```typescript
   import { getLocalDB } from '@/src/db/local';
   import { useUserStore } from '@/src/stores/useUserStore';
   import { runSync } from '@/src/engines/sync-manager';

   export async function migrateGuestToAuth(newUserId: string): Promise<void> {
     const db = getLocalDB();
     const oldGuestId = useUserStore.getState().guestId;

     if (!oldGuestId) {
       throw new Error('No guest ID found — cannot migrate');
     }

     // Transaction atomique pour la migration
     await db.withTransactionAsync(async () => {
       // 1. Migrer user_progress
       await db.runAsync(
         'UPDATE user_progress SET user_id = ?, synced_at = NULL WHERE user_id = ?',
         [newUserId, oldGuestId]
       );

       // 2. Migrer srs_cards
       await db.runAsync(
         'UPDATE srs_cards SET user_id = ?, synced_at = NULL WHERE user_id = ?',
         [newUserId, oldGuestId]
       );

       // 3. Migrer user_settings
       await db.runAsync(
         'UPDATE user_settings SET user_id = ?, synced_at = NULL WHERE user_id = ?',
         [newUserId, oldGuestId]
       );
     });

     // 4. Déclencher un sync complet (toutes les lignes ont synced_at = NULL)
     await runSync();

     console.log(`[GuestMigration] Migrated ${oldGuestId} → ${newUserId}`);
   }
   ```

2. **Intégrer dans le flow Auth Screen.** Dans `app/auth-screen.tsx`, quand `mode === 'convert'` :
   ```typescript
   // Après succès de l'inscription/connexion :
   if (mode === 'convert') {
     const newUserId = data.user.id;

     // D'abord migrer les données
     await migrateGuestToAuth(newUserId);

     // Puis mettre à jour le store
     useUserStore.getState().setAuthUser(newUserId, email, provider);

     // Afficher une confirmation
     // Naviguer vers le profil ou home
     router.replace('/(tabs)/profile');
   }
   ```

3. **Ajouter le bouton de conversion dans le Profil.** Ouvrir `app/(tabs)/profile.tsx` :
   - Si `isGuest === true`, afficher une section en haut du profil :
     ```
     ┌─────────────────────────────────────┐
     │  ☁️  Sauvegarde ta progression       │
     │  Crée un compte pour ne rien perdre │
     │  et synchroniser tes appareils.     │
     │                                     │
     │  [ Créer un compte ]                │
     └─────────────────────────────────────┘
     ```
   - Ce bouton navigue vers `/auth-screen?mode=convert`
   - Le style suit le Design System : card avec fond légèrement teinté (couleur accent en opacité 0.08), texte en Jost, bouton principal du DS
   - Si `isGuest === false` : cette section n'apparaît pas (l'utilisateur est déjà connecté)

4. **Ajouter l'email et le bouton déconnexion dans le Profil (mode Auth).** Si l'utilisateur est connecté :
   - Afficher son email sous son displayName
   - Ajouter un bouton "Se déconnecter" en bas des réglages (style texte rouge discret)

**✅ CHECKPOINT MISSION 6 :**
- [ ] Un Guest peut cliquer "Créer un compte" dans le Profil
- [ ] Après inscription, TOUTES les données SQLite sont migrées vers le nouveau userId
- [ ] Les synced_at sont remis à NULL → le sync PUSH envoie tout vers Cloud
- [ ] Le store est mis à jour (isGuest = false, userId = newUserId)
- [ ] La progression (XP, streak, leçons complétées, cartes SRS) est intacte après migration
- [ ] Le Profil affiche l'email et le bouton déconnexion en mode Auth
- [ ] Pas de doublon dans SQLite après migration

---

### MISSION 7 — Tests et edge cases

**Objectif :** Vérifier tous les scénarios critiques.

1. **Scénarios à tester manuellement :**

   | # | Scénario | Résultat attendu |
   |---|---|---|
   | 1 | Premier lancement → onboarding → "Continuer sans compte" | Guest mode, home, pas de sync PUSH |
   | 2 | Guest fait 3 leçons → ferme l'app → rouvre | Progression conservée (AsyncStorage + SQLite) |
   | 3 | Guest → Profil → "Créer un compte" (email) | Migration, sync PUSH, profil affiche email |
   | 4 | Guest → Profil → "Créer un compte" (Google) | Idem via OAuth Google |
   | 5 | Premier lancement → onboarding → "Créer un compte" | Auth mode direct, sync activé |
   | 6 | Auth user ferme l'app → rouvre | Auto-login, home directe |
   | 7 | Auth user → "Se déconnecter" → rouvre | auth-choice affiché |
   | 8 | Auth user → se déconnecte → se reconnecte | Progression cloud récupérée |
   | 9 | Guest sans réseau → toute l'app fonctionne | Pas de crash, pas de tentative de sync |
   | 10 | Auth user sans réseau → fait des leçons → réseau revient | Sync PUSH rattrape le retard |

2. **Vérifier les imports.** S'assurer que `remote.ts` (Supabase) n'est importé que dans :
   - `sync-manager.ts`
   - `content-sync.ts`
   - `user-data-pull.ts`
   - `auth-screen.tsx` (pour les appels auth)
   - `guest-migration.ts` (indirectement via sync-manager)
   - `_layout.tsx` (pour le listener de session)
   
   **Nulle part ailleurs.** Vérifier avec :
   ```bash
   grep -rn "from.*remote" src/ app/ --include="*.ts" --include="*.tsx" | grep -v node_modules
   ```

3. **Vérifier qu'aucun écran ne crash si `effectiveUserId()` retourne null.** Chercher les usages et ajouter des guards si nécessaire.

**✅ CHECKPOINT MISSION 7 :**
- [ ] Les 10 scénarios du tableau passent
- [ ] `remote.ts` n'est importé que dans les fichiers autorisés
- [ ] Aucun crash si userId null temporairement (entre onboarding et auth-choice)
- [ ] L'app compile sans warning TypeScript

---

## FICHIERS À GÉRER DANS /docs

### Garder :
- `ETAPE-13-AUTH-GUEST-MODE.md` (ce fichier)
- `lisaan-seed-letters.json`

### Supprimer :
- Tout fichier d'étape précédente (`ETAPE-12*.md`, etc.)

### Ne PAS mettre dans /docs :
- Le brief projet et l'architecture → restent dans le projet Opus "Apprendre l'arabe"

---

## DÉPENDANCES À INSTALLER

```bash
npx expo install @react-native-async-storage/async-storage
npx expo install expo-auth-session expo-web-browser
npx expo install expo-apple-authentication
npx expo install expo-crypto
```

> Note : `expo-crypto` est peut-être déjà installé. Vérifier avant d'installer.

---

## RÉSUMÉ DES FICHIERS À CRÉER/MODIFIER

| Action | Fichier | Mission |
|---|---|---|
| MODIFIER | `src/stores/useUserStore.ts` | M1 |
| MODIFIER | `src/engines/sync-manager.ts` | M2 |
| MODIFIER | `src/engines/user-data-pull.ts` | M2 |
| CRÉER | `app/auth-choice.tsx` | M3 |
| CRÉER | `app/auth-screen.tsx` | M4 |
| MODIFIER | `app/_layout.tsx` | M3, M5 |
| MODIFIER | `src/db/remote.ts` | M5 |
| CRÉER | `src/engines/guest-migration.ts` | M6 |
| MODIFIER | `app/(tabs)/profile.tsx` | M6 |
| MODIFIER | Tous les fichiers utilisant `userId` | M1 |
