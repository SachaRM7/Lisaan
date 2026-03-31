# Règles engines

- JAMAIS de JSX, hooks React (useState, useEffect), ou composants (<View>, <Text>) dans les engines
- JAMAIS d'import de `src/db/remote.ts` SAUF dans : content-sync.ts, sync-manager.ts, user-data-pull.ts, guest-migration.ts
- Les engines sont de la pure logique TypeScript
- Après chaque écriture locale, appeler `runSync()` en fire-and-forget