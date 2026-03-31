# Architecture Guard — Vérification complète des invariants

Exécute toutes les vérifications d'architecture du projet Lisaan en une passe.

## Vérifications à exécuter

### 1. Imports remote.ts
```bash
echo "=== REMOTE IMPORTS ==="
grep -rn "from.*db/remote\|from.*supabase\|import.*supabase" src/ app/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts"
```
Résultats attendus UNIQUEMENT dans : content-sync.ts, sync-manager.ts, user-data-pull.ts, guest-migration.ts, auth.tsx, _layout.tsx.
Tout autre fichier = VIOLATION CRITIQUE.

### 2. Exercise registry
```bash
echo "=== EXERCISE REGISTRY ==="
grep -rn "exerciseRegistry.set\|exerciseRegistry.register" src/ --include="*.ts" --include="*.tsx"
```
Vérifie que chaque ExerciseType déclaré dans `src/types/exercise.ts` a une entrée correspondante dans le registry.

### 3. Composants sans hooks DB
```bash
echo "=== COMPOSANTS DB DIRECTS ==="
grep -rn "getLocalDB\|executeQuery\|SELECT.*FROM\|INSERT.*INTO\|UPDATE.*SET" src/components/ --include="*.tsx"
```
Les composants ne doivent JAMAIS faire de requêtes SQLite directes. Ils passent par les hooks.

### 4. Engines sans JSX
```bash
echo "=== ENGINES JSX ==="
grep -rn "React\.\|<View\|<Text\|<TouchableOpacity\|useState\|useEffect" src/engines/ --include="*.ts"
```
Les engines ne doivent JAMAIS contenir de JSX ou de hooks React.

### 5. Schema consistency
```bash
echo "=== SCHEMA LOCAL ==="
grep -c "CREATE TABLE" src/db/schema-local.ts
echo "=== CONTENT SYNC TABLES ==="
grep -c "syncTable\|TABLES_TO_SYNC\|tableName" src/engines/content-sync.ts
```
Le nombre de tables contenu dans schema-local.ts doit correspondre aux tables syncées dans content-sync.ts.

## Résumé
Pour chaque vérification, affiche ✅ ou ❌ avec détails. Propose un fix pour chaque violation.