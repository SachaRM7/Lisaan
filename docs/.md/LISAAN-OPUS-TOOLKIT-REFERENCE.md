# LISAAN — RÉFÉRENCE OPUS : TOOLKIT CLAUDE CODE EN PLACE

> **Ce fichier est une référence interne pour Claude Opus.**
> Il documente le toolkit Claude Code déployé dans le repo Lisaan.
> **Opus doit lire ce fichier avant de rédiger tout prompt d'étape ou toute réponse liée au projet Lisaan.**

---

## État : déployé et commité (31 mars 2026)

Le repo `D:\Documents\Lisaan` contient désormais :

### CLAUDE.md (racine)

Claude Code lit ce fichier automatiquement à chaque session. Il encode TOUS les invariants du projet :
- Architecture offline-first (règle d'or, fichiers autorisés à importer remote.ts)
- Auth (effectiveUserId, guest mode)
- Exercise Engine (plugin registry pattern, types existants, générateurs)
- SRS SM-2 (paramètres, item types, paires de confusion)
- Moteur de révision polymorphique (6 modes, validateur écrit, normalisation arabe)
- Design system (useTheme, Jost/Amiri, lineHeight ≥ 1.8, ombres émeraude, tokens)
- Settings store (harakats_mode, transliteration_mode, etc.)
- Modules M1→M10 avec contenu et étape de création
- Tables DB (contenu + utilisateur + système)
- Séquence de démarrage
- Conventions de code et liste des interdits

### Slash commands (.claude/commands/)

| Commande | Fichier | Usage |
|----------|---------|-------|
| `/checkpoint` | checkpoint.md | Batterie de validation fin de mission (tsc, archi, couleurs, userId, lineHeight) |
| `/architecture-guard` | architecture-guard.md | Vérification profonde invariants (imports, registry, composants DB, engines JSX, schema) |
| `/new-mission N` | new-mission.md | Démarrage structuré : état repo + tsc + lecture étape + confirmation |
| `/regression` | regression.md | Test de non-régression complet avant nouvelle étape |

### Hooks (.claude/settings.json)

| Événement | Action | Type |
|-----------|--------|------|
| PostToolUse Write(*.ts/*.tsx) | `npx tsc --noEmit` | Informatif (exit 0) |
| PostToolUse Write(src/hooks/*.ts) | Vérif import remote.ts dans hooks | Informatif |
| PostToolUse Write(src/engines/*.ts) | Vérif import remote.ts (sauf sync files) | Informatif |
| PreToolUse Bash | Bloque commandes destructrices (rm -rf src, DROP TABLE, etc.) | Bloquant (exit 2) |

### Subagents (.claude/agents/)

| Agent | Fichier | Invocation | Usage |
|-------|---------|-----------|-------|
| regression-tester | regression-tester.md | `@regression-tester` | Rapport ✅/❌ sur 6 axes (TS, offline, registry, schema, userId, tokens) |
| codebase-scout | codebase-scout.md | `@codebase-scout` | Scan du repo → résumé structuré (modules, types, stores, hooks, engines) |
| arabic-content-validator | arabic-content-validator.md | `@arabic-content-validator` | Validation contenu arabe (harakats, conjugaisons, IDs, paires confusion) |

---

## IMPACT SUR LES PROMPTS D'ÉTAPE (RÈGLES OPUS)

### CE QUE JE SUPPRIME de mes prompts à partir de É14 :

1. **Le bloc "Rappel architecture (CRITIQUE)"** en en-tête — SUPPRIMÉ.
   Il est dans CLAUDE.md. Claude Code le lit automatiquement.
   → Je ne répète PLUS : offline-first, remote.ts, effectiveUserId, design system.

2. **Les vérifications bash manuelles dans les checkpoints de mission** — REMPLACÉES.
   Ancien format :
   ```
   Checkpoint :
   - [ ] `npx tsc --noEmit` → 0 erreur
   - [ ] `grep -rn "from.*db/remote" src/hooks/ ...` → 0 résultat
   - [ ] Aucune couleur hardcodée
   ```
   Nouveau format :
   ```
   Checkpoint :
   - [ ] `/checkpoint` → tout vert
   - [ ] [vérifications spécifiques à cette mission uniquement]
   ```

3. **Le scan de repo en début d'étape** — REMPLACÉ.
   Ancien : Mission 1 = "Fais un grep pour comprendre l'état du code..."
   Nouveau : "Lance `@codebase-scout` puis confirme l'état avant de commencer."

4. **La vérification de régression en fin d'étape** — REMPLACÉE.
   Ancien : 20 lignes de grep + tests manuels
   Nouveau : "Lance `@regression-tester`. Si tout vert, l'étape est validée."

5. **La validation du contenu arabe** — REMPLACÉE.
   Ancien : instructions manuelles de vérification harakats
   Nouveau : "Lance `@arabic-content-validator` sur les seeds de cette mission."

### CE QUE JE GARDE dans mes prompts :

1. **Le bloc "Contexte projet" en en-tête** — GARDÉ mais raccourci.
   Format simplifié :
   ```
   > Étapes terminées : 0–13E.
   > Cette étape : [objectif spécifique]
   > Règle : missions séquentielles, checkpoints obligatoires.
   ```

2. **La philosophie de l'étape** — GARDÉ.
   Les choix pédagogiques ne sont pas dans CLAUDE.md.

3. **Le périmètre (IN/OUT)** — GARDÉ.

4. **Les missions détaillées avec actions atomiques** — GARDÉ.
   C'est le cœur du prompt.

5. **Les checkpoints spécifiques à la mission** — GARDÉ.
   Mais réduits aux vérifications métier uniquement (pas les checks génériques).

6. **La gestion /docs** — GARDÉ.

### ESTIMATION D'ÉCONOMIE

Chaque prompt d'étape typique (É11→É13E) contenait ~50-80 lignes de contexte répétitif.
Avec le toolkit, ces lignes sont supprimées → économie de ~2000-3000 tokens par prompt.
Sur une étape de 10 missions, ça représente ~20-30K tokens économisés.
Les hooks évitent aussi les allers-retours de correction (erreur TS détectée au checkpoint au lieu d'être détectée en continu).

---

## WORKFLOW : QUI PRODUIT QUOI

### Circuit standard (la majorité des étapes)

```
Sacha → Opus → .md étape → Claude Code
```

Opus est le cerveau unique. Il conçoit les modules, l'architecture, les seeds SQL, la logique pédagogique, et produit le .md exécutable directement.

### Circuit design (UI/UX/reskin uniquement)

```
Sacha → Gemini (direction créative, maquettes, choix visuels)
      → Opus (filtre : valide ou modifie selon l'état réel du projet)
      → .md étape → Claude Code
```

Gemini intervient **uniquement** quand il y a un travail de direction artistique ou de design UI/UX (reskin, nouveau composant visuel, nouveau screen, animation). Opus reçoit la proposition de Gemini, la confronte à l'architecture réelle et au design system existant, puis intègre (ou corrige) dans le .md exécutable.

**Règle Opus** : quand Sacha transmet un prompt venant de Gemini, toujours vérifier la compatibilité avec le design system en place (LISAAN-DESIGN-SYSTEM.md) et les composants UI existants avant d'intégrer. Ne jamais relayer tel quel sans validation.

---

## GESTION /docs

Le workflow /docs ne change PAS :
- Le CLAUDE.md est à la RACINE du projet, pas dans /docs
- /docs contient toujours : étape courante + lisaan-seed-letters.json
- Les commands, hooks et agents vivent dans .claude/ (commité dans git)

---

## MAINTENANCE DU TOOLKIT

Si une nouvelle convention apparaît (nouveau type d'exercice, nouveau store, nouvelle table) :
1. Opus met à jour cette référence
2. Opus rédige un mini-prompt Claude Code pour mettre à jour CLAUDE.md
3. L'utilisateur exécute le mini-prompt dans Claude Code
4. Commit

Si un nouveau subagent ou command est nécessaire :
1. Opus le rédige dans le prompt d'étape concerné
2. Claude Code le crée dans .claude/agents/ ou .claude/commands/
3. Opus met à jour cette référence

---

*Créé le 31 mars 2026. Mettre à jour à chaque modification du toolkit.*
