# ÉTAPE 13B — CORRECTIFS AUTH SCREEN (UI + BUGS)

> **Contexte :** L'Étape 13 (Auth + Guest Mode) a été implémentée. Des bugs et oublis UX ont été identifiés lors du test sur device. Ce prompt corrige tout.
>
> **AVANT DE COMMENCER :** Relis `docs/LISAAN-DESIGN-SYSTEM.md` pour les tokens visuels. Tous les correctifs doivent utiliser les tokens du Design System — aucune couleur ou valeur en dur.

---

## MISSION 1 — Désactiver Google OAuth (provider non activé côté Supabase)

**Problème :** Le bouton "Continuer avec Google" ouvre une page Supabase qui retourne `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`. Le provider Google n'est pas encore configuré dans le dashboard Supabase.

### Actions :

1. Ouvrir `app/auth-screen.tsx`.

2. Désactiver temporairement le bouton Google OAuth. **Ne pas supprimer le code**, simplement le rendre non-interactif et visuellement désactivé :
   - Ajouter une prop `disabled={true}` sur le `Pressable`/`TouchableOpacity` du bouton Google
   - Appliquer le style disabled : `opacity: 0.4`
   - Ajouter un texte discret sous le bouton : `"Bientôt disponible"` (Jost-Regular, 12px, couleur `text.secondary`, textAlign center, marginTop 4)
   - Le `onPress` du bouton ne doit rien faire quand disabled (pas d'appel OAuth, pas de navigation)

3. **Conserver tout le code OAuth Google existant** — il sera réactivé quand le provider sera configuré dans Supabase. Commenter le corps du handler avec `// TODO: Activer quand Google OAuth sera configuré dans Supabase Dashboard`.

**✅ CHECKPOINT MISSION 1 :**
- [ ] Le bouton Google est visible mais grisé (opacity 0.4)
- [ ] Le texte "Bientôt disponible" apparaît sous le bouton
- [ ] Appuyer sur le bouton ne fait rien (pas d'erreur, pas de navigation)
- [ ] Le code OAuth Google est conservé, commenté proprement

---

## MISSION 2 — Ajouter le logo Google sur le bouton

**Problème :** Le bouton "Continuer avec Google" n'a pas d'icône, contrairement au bouton Apple qui a le logo Apple.

### Actions :

1. Dans `app/auth-screen.tsx`, localiser le bouton "Continuer avec Google".

2. Ajouter l'icône Google à gauche du texte, alignée comme le logo Apple sur son bouton. **Utiliser un SVG inline** (pas de dépendance externe). Le "G" Google multicolore classique :

   ```tsx
   import Svg, { Path } from 'react-native-svg';

   function GoogleIcon({ size = 20 }: { size?: number }) {
     return (
       <Svg width={size} height={size} viewBox="0 0 24 24">
         <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
         <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
         <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
         <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
       </Svg>
     );
   }
   ```

3. Layout du bouton Google : `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'center'`, gap de 12 entre l'icône et le texte.

4. Vérifier que le bouton Apple a aussi son icône correctement alignée avec le même pattern (icône à gauche, texte centré, même gap). Si ce n'est pas le cas, harmoniser les deux boutons.

**✅ CHECKPOINT MISSION 2 :**
- [ ] Le bouton Google affiche le "G" multicolore à gauche du texte
- [ ] Le bouton Apple affiche le logo Apple à gauche du texte
- [ ] Les deux boutons ont un layout visuellement identique (même hauteur, même gap icône/texte)
- [ ] Le logo Google s'affiche correctement même avec le bouton désactivé (M1)

---

## MISSION 3 — Repositionner le bouton "Retour" en haut à gauche

**Problème :** Le bouton "Retour" est placé tout en bas de l'écran en petit texte. En UX mobile natif, l'utilisateur s'attend à un chevron `‹` ou une croix `✕` en haut à gauche.

### Actions :

1. Dans `app/auth-screen.tsx`, supprimer le bouton "Retour" du bas de l'écran.

2. Ajouter un header custom en haut de l'écran avec un bouton retour :
   ```tsx
   <View style={{
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: spacing.lg,    // 24
     paddingTop: spacing.md,           // 16
     height: 56,
   }}>
     <Pressable
       onPress={() => router.back()}
       hitSlop={12}
       style={{
         width: 40,
         height: 40,
         borderRadius: borderRadius.sm,  // 8
         alignItems: 'center',
         justifyContent: 'center',
       }}
     >
       <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
     </Pressable>
   </View>
   ```
   Utiliser `useTheme()` pour `spacing`, `borderRadius`, `colors`. Utiliser `Ionicons` (déjà disponible via `@expo/vector-icons`).

3. Ce header doit être au-dessus du contenu scrollable, fixe en haut.

4. Garder le titre "Crée ton compte" / "Connecte-toi" sous le header (pas dans le header). Le titre reste en grand (Jost-SemiBold, taille h1 ou 28px).

**✅ CHECKPOINT MISSION 3 :**
- [ ] Le chevron `‹` est en haut à gauche
- [ ] Appuyer dessus ramène à l'écran précédent (auth-choice ou profil selon le contexte)
- [ ] Plus aucun bouton "Retour" en bas de l'écran
- [ ] Le hitSlop rend le bouton facile à taper

---

## MISSION 4 — Améliorer les champs de formulaire (UX)

**Problème :** Plusieurs détails UX manquent sur les champs de saisie : espacement labels/champs insuffisant, pas d'icône œil sur le mot de passe, propriétés de clavier manquantes.

### Actions :

1. **Espacement labels ↔ champs :** Ajouter `marginBottom: 6` entre chaque label (EMAIL, MOT DE PASSE, PRÉNOM OU PSEUDO) et son `TextInput` correspondant. Ajouter `marginBottom: 20` entre chaque groupe label+input (pour séparer les champs entre eux).

2. **Champ Email — propriétés clavier :**
   ```tsx
   <TextInput
     keyboardType="email-address"
     autoCapitalize="none"
     autoCorrect={false}
     autoComplete="email"
     textContentType="emailAddress"
     // ... rest
   />
   ```

3. **Champ Mot de passe — secureTextEntry + icône œil :**
   - Ajouter un state `showPassword` (défaut `false`)
   - Le `TextInput` a `secureTextEntry={!showPassword}`
   - Ajouter `autoComplete="password"` et `textContentType="password"` (ou `"newPassword"` en mode inscription)
   - Placer une icône œil à droite à l'intérieur du champ :
     ```tsx
     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
       <TextInput
         style={{ flex: 1 }}
         secureTextEntry={!showPassword}
         // ...
       />
       <Pressable
         onPress={() => setShowPassword(!showPassword)}
         hitSlop={8}
         style={{ position: 'absolute', right: 16 }}
       >
         <Ionicons
           name={showPassword ? 'eye-off-outline' : 'eye-outline'}
           size={20}
           color={colors.text.secondary}
         />
       </Pressable>
     </View>
     ```
   - Le conteneur du champ doit avoir `position: 'relative'` pour que l'icône soit bien positionnée à droite.

4. **Champ Prénom/pseudo (mode inscription) :**
   ```tsx
   <TextInput
     autoCapitalize="words"
     autoCorrect={false}
     autoComplete="name"
     textContentType="name"
     // ...
   />
   ```

**✅ CHECKPOINT MISSION 4 :**
- [ ] Les labels ont un espace de 6px avec leur champ
- [ ] Les groupes de champs ont 20px d'espacement entre eux
- [ ] Le champ email ne force pas de majuscule au premier caractère
- [ ] Le champ email ouvre le clavier avec `@` visible
- [ ] Le mot de passe est masqué par défaut (petits points)
- [ ] L'icône œil toggle la visibilité du mot de passe
- [ ] Le champ prénom a autoCapitalize="words"

---

## MISSION 5 — Ajouter KeyboardAvoidingView

**Problème :** Quand le clavier natif apparaît, il risque de masquer le bouton "Créer mon compte" / "Se connecter".

### Actions :

1. Wrapper le contenu de `auth-screen.tsx` dans un `KeyboardAvoidingView` :
   ```tsx
   import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

   // Dans le return :
   <KeyboardAvoidingView
     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
     style={{ flex: 1 }}
     keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
   >
     <ScrollView
       contentContainerStyle={{ flexGrow: 1 }}
       keyboardShouldPersistTaps="handled"
       bounces={false}
     >
       {/* Header retour (Mission 3) */}
       {/* Titre */}
       {/* Toggle S'inscrire / Se connecter */}
       {/* Boutons OAuth */}
       {/* Séparateur "ou" */}
       {/* Formulaire */}
       {/* Bouton submit */}
     </ScrollView>
   </KeyboardAvoidingView>
   ```

2. `keyboardShouldPersistTaps="handled"` est important pour que l'utilisateur puisse taper le bouton submit sans que le clavier se ferme d'abord.

3. Tester sur iOS ET Android — le `behavior` diffère.

**✅ CHECKPOINT MISSION 5 :**
- [ ] Le clavier ne masque pas le bouton submit
- [ ] Le formulaire scrolle si nécessaire pour rester visible
- [ ] Taper le bouton submit fonctionne même avec le clavier ouvert
- [ ] Pas de comportement bizarre au focus/blur des champs

---

## MISSION 6 — Corriger la propagation du displayName au Profil

**Problème :** Après inscription, le profil affiche "Apprenant" avec un avatar "A" au lieu du pseudo saisi (ex: "SachaRbone" avec avatar "S").

### Actions :

1. Chercher le flux d'inscription email dans `auth-screen.tsx`. Vérifier que `displayName` est bien passé au store APRÈS le succès du `signUp` :
   ```typescript
   // Après supabase.auth.signUp réussi :
   useUserStore.getState().setAuthUser(data.user.id, email, 'email');
   useUserStore.getState().setDisplayName(displayName); // ← VÉRIFIER QUE CETTE LIGNE EXISTE
   ```

2. Ouvrir `app/(tabs)/profile.tsx`. Vérifier comment le displayName et l'avatar sont lus :
   ```bash
   grep -n "displayName\|display_name\|Apprenant\|avatar" app/\(tabs\)/profile.tsx
   ```

3. **L'avatar** doit afficher la première lettre du displayName :
   ```typescript
   const displayName = useUserStore(s => s.displayName);
   const avatarLetter = displayName ? displayName[0].toUpperCase() : '?';
   ```
   Si le profil utilise une valeur par défaut "Apprenant", c'est probablement parce que `displayName` est null au moment du rendu. S'assurer que le store est bien mis à jour AVANT la navigation vers Home.

4. Vérifier le même flux pour l'inscription OAuth (Google et Apple). Quand Apple renvoie le `fullName`, le stocker :
   ```typescript
   // Après AppleAuthentication.signInAsync :
   if (credential.fullName?.givenName) {
     useUserStore.getState().setDisplayName(credential.fullName.givenName);
   }
   ```

5. Vérifier aussi que `setDisplayName` persiste bien dans AsyncStorage (il doit faire partie des clés persistées du store Zustand).

6. **Chercher tous les endroits qui affichent le displayName** pour vérifier qu'ils lisent le store :
   ```bash
   grep -rn "displayName\|display_name\|Apprenant" app/ src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
   ```
   Corriger tout fallback "Apprenant" pour qu'il n'apparaisse que si `displayName` est réellement null/undefined (pas à cause d'un timing de store).

**✅ CHECKPOINT MISSION 6 :**
- [ ] Créer un compte avec pseudo "TestUser" → le profil affiche "TestUser" (pas "Apprenant")
- [ ] L'avatar affiche "T" (première lettre du pseudo)
- [ ] Après fermeture et réouverture de l'app, le pseudo est toujours affiché (persistance AsyncStorage)
- [ ] Si aucun pseudo n'est fourni (cas OAuth sans nom), le fallback "Apprenant" s'affiche correctement

---

## MISSION 7 — Vérifications finales

### Actions :

1. **Vérifier la cohérence visuelle** de tout l'écran auth-screen :
   - Le fond est `background.main` (#FDFBF7)
   - Les champs de saisie ont un fond `background.card` (#FFFFFF), une bordure `border.medium` (#E5E7EB), borderRadius `md` (16), height 56, paddingHorizontal 16
   - Les labels sont en Jost-Medium, 12px, uppercase, `text.secondary`, letterSpacing 1
   - Le bouton submit est le bouton primaire du Design System : height 56, borderRadius pill, fond `brand.primary`, Jost-SemiBold 16px, ombre prominent
   - Le toggle S'inscrire/Se connecter utilise les tokens du Design System

2. **Vérifier que le bouton Apple n'est affiché que sur iOS :**
   ```bash
   grep -n "Platform.OS\|ios\|apple" app/auth-screen.tsx
   ```
   S'assurer qu'il y a bien un `Platform.OS === 'ios'` conditionnel.

3. **Tester le flux complet :**
   - Lancer l'app → onboarding → auth-choice → "Créer un compte" → auth-screen
   - Taper un pseudo, un email, un mot de passe → le compte se crée dans Supabase
   - Le profil affiche le bon pseudo et la bonne initiale
   - Se déconnecter → revenir sur auth-choice
   - "Se connecter" → taper les mêmes identifiants → retour Home avec profil correct

4. Faire un dernier check TypeScript :
   ```bash
   npx tsc --noEmit
   ```

**✅ CHECKPOINT MISSION 7 :**
- [ ] Aucune couleur hardcodée dans auth-screen.tsx (tout via `useTheme()`)
- [ ] Bouton Apple conditionnel à iOS
- [ ] Le flux inscription → profil affiche le bon pseudo
- [ ] Le flux connexion fonctionne
- [ ] Le bouton Google est désactivé proprement
- [ ] 0 erreur TypeScript
- [ ] 0 warning significatif dans la console Expo

---

## RÉCAPITULATIF DES FICHIERS MODIFIÉS

| Action | Fichier | Mission(s) |
|---|---|---|
| MODIFIER | `app/auth-screen.tsx` | M1, M2, M3, M4, M5, M7 |
| VÉRIFIER/MODIFIER | `app/(tabs)/profile.tsx` | M6 |
| VÉRIFIER/MODIFIER | `src/stores/useUserStore.ts` | M6 |

---

## FICHIERS À GÉRER DANS /docs

### Garder :
- `ETAPE-13B-FIXES-AUTH.md` (ce fichier — remplace le précédent)
- `lisaan-seed-letters.json`

### Supprimer :
- `ETAPE-13-AUTH-GUEST-MODE.md` (intégré, plus besoin)
