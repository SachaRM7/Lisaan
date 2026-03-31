# Test de régression complet

Exécute une vérification de non-régression sur l'ensemble des modules Lisaan.

## 1. Compilation
```bash
npx tsc --noEmit
```

## 2. Architecture
```bash
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/ src/engines/ --include="*.ts" --include="*.tsx" | grep -v content-sync | grep -v sync-manager | grep -v user-data-pull | grep -v guest-migration
```

## 3. Imports circulaires
```bash
# Vérifier les imports potentiellement circulaires entre engines
grep -rn "from.*engines/" src/engines/ --include="*.ts" | grep -v node_modules
```
Signaler tout import entre engines qui pourrait créer un cycle.

## 4. Exports manquants
```bash
# Vérifier que les composants d'exercice sont exportés
ls -la src/components/exercises/
cat src/components/exercises/index.ts
```
Chaque fichier d'exercice doit avoir une entrée dans le registry.

## 5. Types cohérents
```bash
# Vérifier l'union ExerciseType
grep -A 20 "export type ExerciseType" src/types/exercise.ts
```
Comparer avec les entrées du registry.

## 6. Schéma SQLite
```bash
# Compter les tables
grep "CREATE TABLE" src/db/schema-local.ts
```

## Rapport
Résumé complet avec ✅/❌ par vérification. Si tout passe, affiche "✅ Régression OK — prêt pour la mission suivante".cla