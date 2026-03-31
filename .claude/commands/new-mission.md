# Démarrer une nouvelle mission

Avant de commencer une mission du fichier d'étape :

## 1. État du repo
```bash
git status --short
git log --oneline -3
```

## 2. TypeScript propre
```bash
npx tsc --noEmit 2>&1 | tail -5
```
Si erreurs existantes, les lister AVANT de commencer. Ne pas les introduire, mais ne pas non plus les corriger si elles ne sont pas dans le périmètre de cette mission.

## 3. Lecture du contexte
Lis le fichier d'étape dans /docs/ pour identifier la mission à exécuter. Confirme :
- Numéro de la mission
- Objectif en une phrase
- Fichiers qui seront touchés
- Dépendances avec les missions précédentes

## 4. Confirmation
Demande confirmation avant de commencer l'implémentation.

$ARGUMENTS contient le numéro de mission (ex: `/new-mission 3`). Si vide, demande le numéro.