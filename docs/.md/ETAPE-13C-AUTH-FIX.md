# PROMPT CLAUDE CODE — É13C Fix écran Auth (redesign Gemini)

Avant de commencer, relis `docs/LISAAN-DESIGN-SYSTEM.md` pour les tokens visuels.

## Contexte

É13B a créé `app/auth.tsx` (fusion auth-choice + auth-screen). Le résultat fonctionnel est correct mais le rendu visuel ne correspond pas au mockup validé. Ce fix reprend le design pixel par pixel d'après les specs Gemini.

## CE QUI NE DOIT PAS CHANGER

- Le fichier reste `app/auth.tsx` — on ne crée pas de nouveau fichier
- Toute la logique auth (signup, login, OAuth, Guest, convert, migrateGuestToAuth) reste identique
- Le routing (`/auth`, `mode` param), le store, le sync, les imports — tout est préservé
- On ne touche qu'au rendu visuel (JSX + styles)

## MISSION UNIQUE — Refactorer le rendu de `app/auth.tsx`

### Principe global

L'écran utilise un état local `isLogin` (booléen) pour basculer entre Inscription et Connexion. Le design est premium et serein, centré sur le principe du "Hero Arabe" : la calligraphie لِسَان domine l'écran.

**Polices :** UI = Jost (Regular 400, Medium 500, SemiBold 600). Arabe = Amiri-Bold. Si des fonts ne sont pas chargées, utiliser le system font en fallback — ne jamais crasher.

---

### Section A — Le "Hero Arabe" (Logo)

**Container :**
- Centré horizontalement (`alignItems: 'center'`)
- `marginTop: 80`, `marginBottom: 40`

**Texte arabe لِسَان :**
- Police : `Amiri-Bold`
- Taille : `80`
- Couleur : `#000000` (`text.heroArabic`)
- `lineHeight: 120` — **CRITIQUE** : ne jamais descendre sous 1.5× la fontSize pour les harakats. Les diacritiques (kasra sous le lam, shadda+kasra sur le sin) seront coupées si le lineHeight est trop bas.
- `textAlign: 'center'`

**Texte latin "LISAAN" :**
- Police : `Jost-SemiBold`
- Taille : `14`
- Couleur : `#0F624C` (`brand.primary`)
- `letterSpacing: 6`
- `textAlign: 'center'`
- `marginTop: -20` (remonte sous le texte arabe pour un effet logo compact)
- `textTransform: 'uppercase'`

---

### Section B — La carte principale (Auth Card)

**Container :**
- `marginHorizontal: 24`
- `backgroundColor: '#FFFFFF'` (`background.card`)
- `borderRadius: 32`
- `padding: 32`
- Ombre douce teintée émeraude :
  ```typescript
  shadowColor: '#0F624C',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 24,
  elevation: 5,
  ```

---

### Section B1 — Header de la carte

**Layout :** `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'flex-end'`, `marginBottom: 32`

**Titre (gauche) :**
- Inscription → "Créer un compte"
- Connexion → "Bienvenue"
- Police : `Jost-SemiBold`, taille `26`, couleur `#111827` (`text.primary`)

**Toggle (droite) :**
- Inscription → "SE CONNECTER"
- Connexion → "S'INSCRIRE"
- Police : `Jost-SemiBold`, taille `11`, couleur `#0F624C` (`brand.primary`)
- `letterSpacing: 1.5`, `textTransform: 'uppercase'`
- `borderBottomWidth: 2`, `borderBottomColor: '#0F624C'` à 25% opacité (soit `rgba(15, 98, 76, 0.25)`)
- `paddingBottom: 4`
- `onPress` → `setIsLogin(!isLogin)` avec `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` avant le setState
- En mode `convert` → **ne pas afficher** le toggle

---

### Section B2 — Champs de formulaire

**Chaque champ (TextInput) :**
- `height: 58`
- `borderRadius: 18`
- `borderWidth: 1`, `borderColor: '#F5F2EA'` (`border.subtle`)
- `backgroundColor: '#FDFBF7'` (`background.main`)
- `paddingHorizontal: 22`
- `fontFamily: 'Jost-Medium'`
- `fontSize: 13`
- `color: '#111827'` (`text.primary`)
- `letterSpacing: 1`

**Placeholder :**
- `placeholderTextColor: '#9CA3AF'` (gris moyen, légèrement plus clair que `text.secondary`)
- Texte en UPPERCASE (écrire le placeholder directement en majuscules : "PRÉNOM OU PSEUDO", "EMAIL", "MOT DE PASSE")

**Focus state :**
- `borderWidth: 1.5`, `borderColor: '#0F624C'` (`brand.primary`)
- Implémenter avec `onFocus` / `onBlur` et un state pour tracker le champ focus

**Gap entre les champs :** `marginBottom: 14`

**Champs affichés :**
- Inscription (`isLogin === false`) : PRÉNOM OU PSEUDO + EMAIL + MOT DE PASSE
- Connexion (`isLogin === true`) : EMAIL + MOT DE PASSE
- Le champ prénom apparaît/disparaît avec le `LayoutAnimation` du toggle

**Champ mot de passe — icône eye :**
- Icône positionnée en `position: 'absolute'`, `right: 20`, `top: 0`, `bottom: 0`, `justifyContent: 'center'`
- Utiliser `Eye` / `EyeOff` de `lucide-react-native`, `size: 20`, `color: '#9CA3AF'`
- `onPress` → toggle `showPassword` state
- Le TextInput a `secureTextEntry: !showPassword`
- Ajouter `paddingRight: 52` au TextInput pour éviter que le texte passe sous l'icône

**Erreurs inline :**
- Affichées sous le champ concerné
- `Jost-Regular`, `fontSize: 13`, `color: '#EF4444'` (`status.error`)
- `marginTop: 4`, `marginBottom: 8`, `paddingLeft: 4`

---

### Section B3 — Bouton CTA

**Container :**
- `marginTop: 24`

**Bouton :**
- `height: 58`
- `borderRadius: 9999` (pill)
- `backgroundColor: '#0F624C'` (`brand.primary`)
- `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'center'`, `gap: 10`
- Ombre :
  ```typescript
  shadowColor: '#0F624C',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 14,
  elevation: 6,
  ```

**Texte du bouton :**
- Inscription → "CRÉER MON COMPTE"
- Connexion → "SE CONNECTER"
- Police : `Jost-SemiBold`, `fontSize: 14`, couleur `#FFFFFF` (`text.inverse`)
- `letterSpacing: 1.5`, `textTransform: 'uppercase'`

**Icône :**
- `ArrowRight` de `lucide-react-native`, `size: 18`, `strokeWidth: 2.5`, `color: '#FFFFFF'`

**Pressed state :**
- `backgroundColor: '#0A4334'` (`brand.dark`)
- Utiliser `Pressable` avec `({ pressed }) => [styles.button, pressed && styles.buttonPressed]`

**Loading state :**
- Remplacer texte + icône par `ActivityIndicator color="#FFFFFF" size="small"`

---

### Section B4 — Séparateur "OU"

**Container :**
- `flexDirection: 'row'`, `alignItems: 'center'`, `marginVertical: 28`

**Lignes :**
- `flex: 1`, `height: 1`, `backgroundColor: '#F5F2EA'` (`border.subtle`)

**Texte "OU" :**
- `paddingHorizontal: 20`
- `Jost-SemiBold`, `fontSize: 11`, `color: '#9CA3AF'`
- `letterSpacing: 3`, `textTransform: 'uppercase'`

---

### Section B5 — Boutons OAuth

**Chaque bouton OAuth :**
- `height: 54`
- `borderRadius: 9999` (pill)
- `borderWidth: 1.5`, `borderColor: '#F5F2EA'` (`border.subtle`)
- `backgroundColor: '#FFFFFF'` (`background.card`)
- `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'center'`, `gap: 14`
- Gap entre les deux boutons : `marginBottom: 12`

**Pressed state :**
- `backgroundColor: '#FDFBF7'` (`background.main`)

**Texte :**
- `Jost-SemiBold`, `fontSize: 14`, `color: '#374151'` (entre `text.primary` et `text.secondary`)

**Icône Apple :**
- SVG path noir, width/height 20
- **Visible uniquement sur iOS** : `{Platform.OS === 'ios' && ( ... )}`
- Texte : "Continuer avec Apple"

**Icône Google :**
- SVG path multicolore officiel (4 couleurs Google), width/height 20
- Texte : "Continuer avec Google"

**Ordre :** Apple (si iOS) en premier, Google en second.

---

### Section B6 — Lien Guest ("Explorer sans compte")

**Quand afficher :** Uniquement si `mode !== 'convert'` ET `mode !== 'login'` (visible seulement en mode signup / défaut).

**Container :**
- `marginTop: 28`
- `alignItems: 'center'`
- Séparateur fin au-dessus : `View` avec `height: 1`, `backgroundColor: '#F5F2EA'`, `marginBottom: 28`

**Texte :**
- "Explorer sans compte →"
- `Jost-Regular`, `fontSize: 15`, `color: '#6B7280'` (`text.secondary`)
- Tout le texte est un `Pressable` / `TouchableOpacity`

**Pressed state :**
- Couleur passe à `#374151` (`text.primary`)

**Action :**
```typescript
import * as Crypto from 'expo-crypto';
const guestId = Crypto.randomUUID();
useUserStore.getState().setGuestMode(guestId);
router.replace('/(tabs)/learn');
```

---

### Section C — Footer légal

**Container :**
- En dehors de la card
- `marginTop: 32`, `marginBottom: 40`
- `paddingHorizontal: 48`
- `alignItems: 'center'`

**Texte :**
- "En continuant, tu acceptes nos Conditions et notre Politique de confidentialité."
- `Jost-Regular`, `fontSize: 12`, `color: '#9CA3AF'`, `textAlign: 'center'`, `lineHeight: 18`
- "Conditions" et "Politique de confidentialité" : `textDecorationLine: 'underline'`, `color: '#6B7280'`, `onPress` → `Linking.openURL(...)`

---

### Section D — Fond de page (pattern subtil optionnel)

**Si implémentable simplement :** Un pattern Zellige très subtil (étoile 8 branches, strokes 1px, `brand.primary` à 3% opacité) en position absolute derrière tout l'écran, `pointerEvents: 'none'`.

**Si trop complexe :** Fond uni `#FDFBF7` (`background.main`) — parfaitement acceptable. Ne PAS utiliser de losanges gris, de chevrons, ou de pattern diamant.

---

### Enveloppe globale

L'écran entier est un `ScrollView` (ou `KeyboardAvoidingView` + `ScrollView`) avec :
- `style={{ flex: 1, backgroundColor: '#FDFBF7' }}`
- `contentContainerStyle={{ paddingBottom: 40 }}`
- `keyboardShouldPersistTaps: 'handled'`

Le `KeyboardAvoidingView` est important pour que les champs soient accessibles quand le clavier est ouvert :
```typescript
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
>
  <ScrollView ...>
    {/* Hero + Card + Footer */}
  </ScrollView>
</KeyboardAvoidingView>
```

---

### Récapitulatif des valeurs clés

| Élément | Propriété | Valeur |
|---------|-----------|--------|
| Logo arabe | fontSize | 80 |
| Logo arabe | lineHeight | 120 |
| Logo latin | fontSize | 14 |
| Logo latin | letterSpacing | 6 |
| Card | borderRadius | 32 |
| Card | padding | 32 |
| Input | height | 58 |
| Input | borderRadius | 18 |
| Input | fontSize | 13 |
| Input | letterSpacing | 1 |
| CTA button | height | 58 |
| CTA button | borderRadius | 9999 |
| CTA text | fontSize | 14 |
| CTA text | letterSpacing | 1.5 |
| OAuth button | height | 54 |
| OAuth button | borderRadius | 9999 |
| Séparateur | marginVertical | 28 |
| Guest link | fontSize | 15 |
| Footer | fontSize | 12 |

---

### Checkpoint final

- [ ] Le logo لِسَان s'affiche en Amiri-Bold 80px avec les harakats non coupées (lineHeight 120)
- [ ] "LISAAN" en Jost-SemiBold 14px émeraude avec letterSpacing 6 est positionné sous le logo arabe
- [ ] La card a un borderRadius 32, padding 32, ombre émeraude douce
- [ ] Le toggle inscription/connexion est en haut à droite avec souligné à 25% opacité
- [ ] L'animation LayoutAnimation fonctionne au toggle (champ prénom apparaît/disparaît)
- [ ] Les champs ont un fond `background.main`, bordure `border.subtle`, placeholder en majuscules
- [ ] Le focus d'un champ passe la bordure en `brand.primary` 1.5px
- [ ] L'icône eye/eye-off est visible uniquement sur le champ mot de passe
- [ ] Le bouton CTA est un pill émeraude avec ombre, texte blanc + flèche
- [ ] Le séparateur "OU" a des lignes `border.subtle` et un texte gris espacé
- [ ] Le bouton Apple n'apparaît que sur iOS
- [ ] Les boutons OAuth sont des pills outline avec bordure `border.subtle`
- [ ] Le lien "Explorer sans compte →" est visible en mode signup, masqué en convert/login
- [ ] Le footer légal est discret sous la card
- [ ] Le fond est `background.main` uni (pas de losanges gris)
- [ ] Le clavier ne masque pas les champs (KeyboardAvoidingView)
- [ ] Toute la logique auth (signup, login, OAuth, Guest, convert) est fonctionnellement identique à avant
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] Aucune régression sur les autres écrans
