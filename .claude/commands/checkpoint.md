# Checkpoint de validation

Exécute la batterie complète de validations pour la mission en cours :

## 1. TypeScript
```bash
npx tsc --noEmit
```
Doit retourner 0 erreur. Si des erreurs, liste-les et corrige-les.

## 2. Architecture offline-first
```bash
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/ src/engines/ --include="*.ts" --include="*.tsx" | grep -v content-sync | grep -v sync-manager | grep -v user-data-pull | grep -v guest-migration
```
Doit retourner ZÉRO résultat. Si des violations, corrige-les.

## 3. Couleurs hardcodées
```bash
grep -rn "#[0-9A-Fa-f]\{6\}" src/components/ src/screens/ app/ --include="*.tsx" | grep -v theme | grep -v constants | grep -v ".test." | grep -v node_modules
```
Vérifie chaque résultat. Si c'est une couleur hardcodée hors du fichier theme, signale-la.

## 4. userId direct (doit être effectiveUserId)
```bash
grep -rn "useUserStore.*\.userId[^(]" src/ app/ --include="*.ts" --include="*.tsx" | grep -v "effectiveUserId" | grep -v ".d.ts" | grep -v node_modules | grep -v useUserStore.ts
```
Si des résultats, ce sont des usages de userId qui devraient passer par effectiveUserId().

## 5. LineHeight arabe
```bash
grep -rn "lineHeight" src/components/arabic/ --include="*.tsx"
```
Vérifie que toutes les valeurs sont ≥ 1.8 pour le texte arabe.

## Rapport
Présente un résumé : ✅ pour chaque check qui passe, ❌ pour chaque violation avec le fichier et la ligne.