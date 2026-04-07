# Reproduire la Stack Obsidian + IA de Mickaël Ahouansou — Guide de A à Z pour débutants

> **Objectif** : Construire pas à pas un **système extensible à l'infini** de gestion de connaissances piloté par l'IA. Le coffre Obsidian est le noyau stable. Chaque nouvelle capacité = un fichier skill + éventuellement un MCP. Tu ne reconstruis jamais rien — tu empiles. Ce guide est basé sur les échanges et captures d'écran partagés par Mickaël Ahouansou dans le groupe Telegram "Le Lab X".

---

## Table des matières

1. [Le principe fondamental : une architecture extensible à l'infini](#1-le-principe-fondamental--une-architecture-extensible-à-linfini)
2. [Installer et configurer Obsidian](#2-installer-et-configurer-obsidian)
3. [Créer la structure ACE du coffre (le noyau stable)](#3-créer-la-structure-ace-du-coffre-le-noyau-stable)
4. [Mettre en place Atlas — le savoir](#4-mettre-en-place-atlas--le-savoir)
5. [Mettre en place Calendrier](#5-mettre-en-place-calendrier)
6. [Mettre en place Efforts — les projets](#6-mettre-en-place-efforts--les-projets)
7. [Système de frontmatter et métadonnées (le contrat entre toi et l'IA)](#7-système-de-frontmatter-et-métadonnées-le-contrat-entre-toi-et-lia)
8. [Connecter l'IA à Obsidian (MCP) — la prise universelle](#8-connecter-lia-à-obsidian-mcp--la-prise-universelle)
9. [Ta première skill : le clipping web](#9-ta-première-skill--le-clipping-web)
10. [Comment ajouter n'importe quelle capacité (le pattern)](#10-comment-ajouter-nimporte-quelle-capacité-le-pattern)
11. [Exemple concret : brancher X/Twitter](#11-exemple-concret--brancher-xtwitter)
12. [Exemple concret : piloter Notebook LM](#12-exemple-concret--piloter-notebook-lm)
13. [L'anatomie d'une skill bien écrite](#13-lanatomie-dune-skill-bien-écrite)
14. [Le rituel hebdomadaire ARC (10-15 min)](#14-le-rituel-hebdomadaire-arc-10-15-min)
15. [Planification automatique avec l'IA](#15-planification-automatique-avec-lia)
16. [Synchronisation multi-appareils](#16-synchronisation-multi-appareils)
17. [Résumé et checklist de démarrage](#17-résumé-et-checklist-de-démarrage)
18. [Annexe — Ressources Optimike pour aller plus loin](#18-annexe--ressources-du-site-optimike-pour-aller-plus-loin)

---

## 1. Le principe fondamental : une architecture extensible à l'infini

**Ce n'est pas une stack figée. C'est une machine à empiler des capacités.**

Mickaël le dit : "j'ajoute des trucs littéralement toutes les semaines". Il tombe sur un repo Python pour piloter Notebook LM depuis un agent ? "Ben direct ça devient une stack en plus." Pas de refonte. Pas de migration. Juste un nouveau fichier skill, éventuellement un nouveau MCP, et son agent sait faire un truc de plus.

### Le modèle mental

Imagine trois couches :

```
┌─────────────────────────────────────────────────┐
│         SKILLS (extensibles à l'infini)          │
│                                                   │
│  skill-clipping  skill-twitter  skill-notebook-lm │
│  skill-arc       skill-projet   skill-youtube     │
│  skill-???       skill-???      skill-???         │
│              (tu ajoutes ce que tu veux)           │
├─────────────────────────────────────────────────┤
│         MCP SERVERS (les prises d'accès)          │
│                                                   │
│  obsidian-mcp    markitdown-mcp    bird/clix      │
│  notebook-lm     n'importe quel    nouveau MCP    │
│              (tu branches ce que tu veux)          │
├─────────────────────────────────────────────────┤
│         OBSIDIAN (le noyau stable)                │
│                                                   │
│  Atlas / Calendrier / Efforts                     │
│  Frontmatter canonique + SOPs                     │
│  Dataview + Templates                             │
│              (ça, ça ne change jamais)             │
└─────────────────────────────────────────────────┘
```

**Le noyau (Obsidian + structure ACE + frontmatter) est stable.** C'est la fondation. Tu le construis une fois, bien. Ensuite, chaque nouvelle capacité n'est qu'un fichier skill qui dit à l'IA : "voilà comment utiliser ce nouvel outil, et voilà où ranger le résultat dans le coffre."

### Pourquoi ça scale à l'infini

- **Le Markdown est universel** : n'importe quelle source (web, PDF, audio, vidéo, API) peut être convertie en `.md`. Donc n'importe quoi peut entrer dans le coffre.
- **Le MCP est un standard ouvert** : n'importe quel outil qui expose un serveur MCP devient accessible à l'IA. Nouvel outil ? Nouveau MCP. C'est tout.
- **Les skills sont juste du texte** : un fichier `.md` qui explique à l'IA quoi faire. Pas de code à maintenir, pas de plugin à compiler. Tu écris des instructions en langue naturelle.
- **Le frontmatter est le contrat** : tant que chaque nouvelle note respecte la structure de métadonnées, elle s'intègre automatiquement dans les vues Dataview, les recherches, et les workflows IA existants.

### Les outils actuels de Mickaël (mais la liste grossit chaque semaine)

| Couche | Outil | Rôle |
|--------|-------|------|
| Noyau | **Obsidian** | Coffre central, tout est stocké ici en `.md` |
| MCP | **Obsidian MCP** (optimike) | L'IA lit/écrit/cherche dans le coffre |
| MCP | **MarkItDown MCP** (Microsoft) | Convertit n'importe quel fichier/URL en Markdown |
| Outil | **Trafilatura** | Scraper web → contenu propre |
| Outil | **Bird / CLIX** | CLI pour X/Twitter sans l'API payante |
| Agent | **Claude Code / Codex / Hermes** | L'agent IA qui orchestre tout |
| Skills | **Fichiers .md d'instructions** | Disent à l'IA *comment* faire chaque tâche |

La beauté : la colonne "Skills" n'a pas de limite. Tu ajoutes une ligne, tu gagnes une capacité.

---

## 2. Installer et configurer Obsidian

### 2.1 Télécharger Obsidian

1. Va sur [obsidian.md](https://obsidian.md) et télécharge la version pour ton OS (Windows, Mac, Linux, iOS, Android).
2. Installe-le comme n'importe quelle application.

### 2.2 Créer un coffre (vault)

1. Ouvre Obsidian.
2. Clique sur **"Créer un nouveau coffre"**.
3. Nomme-le comme tu veux (Mickaël a nommé le sien **ÉLYSIA**).
4. Choisis un emplacement sur ton disque.

> **Astuce** : Choisis un dossier qui sera facile à synchroniser plus tard (ex : dans un dossier cloud ou un dossier Git).

### 2.3 Plugins communautaires essentiels

Active les plugins communautaires dans `Réglages > Plugins communautaires > Activer`. Voici les plus utiles pour cette stack :

**Plugins structurants (le socle) :**

- **Dataview** : transforme tes notes en base de données interrogeable. Tu crées des vues dynamiques (tableaux, listes, tâches) à partir des métadonnées YAML de tes notes. C'est ce qui génère la vue "Clippings" de Mickaël avec 372 résultats triés par date.
- **Templater** : templates dynamiques avec variables (`{{date}}`, `{{title}}`). Indispensable pour que chaque type de note (clipping, projet, daily) démarre avec la bonne structure.
- **Calendar** + **Periodic Notes** : vue calendrier + notes quotidiennes/hebdomadaires automatiques.
- **Obsidian Git** (optionnel) : versionner et synchroniser via Git.

**Plugins IA (la couche intelligence) :**

- **Smart Connections** : le plugin IA le plus important selon le site d'Optimike. Il détecte les connexions sémantiques entre tes notes, suggère des liens que tu n'aurais pas vus, et permet de **chatter avec tes notes** via Smart Chat. Tu poses une question, il fouille ton coffre et te répond avec le contexte.
- **Copilot Obsidian** : assistant IA tout-en-un. Génère du contenu, résume des notes denses, enrichit sémantiquement tes textes. Se connecte à GPT-4, Claude, ou des modèles locaux.
- **Text Generator** : génération de texte à la volée propulsée par GPT. Résumés, reformulations, listes d'idées, prompts personnalisés.
- **Local GPT** : permet d'utiliser des modèles IA locaux (via Ollama) sans envoyer tes données dans le cloud. Confidentialité maximale.

### 2.4 Modèles IA : cloud vs local

Tu as le choix entre deux approches pour l'IA dans Obsidian :

**Modèles cloud** (GPT-4, Claude) : plus puissants pour les tâches complexes (rédaction stratégique, extraction de signaux faibles), mais nécessitent une API payante et envoient tes données à l'extérieur.

**Modèles locaux** (Llama3, Phi-3/4 via Ollama) : gratuits, confidentiels (tes données ne sortent jamais de ta machine), rapides. Suffisants pour la plupart des usages PKM : résumés, Q&A sur tes notes, classification.

Pour installer Ollama et un modèle local :

```bash
# Installer Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Lancer un modèle (ex: Phi-4)
ollama run phi4
```

Ensuite, dans les réglages de Copilot ou Local GPT dans Obsidian, remplace l'URL d'API par `http://localhost:11434/api`. Tu as maintenant un copilote IA 100% local, sans coût d'abonnement.

> **Recommandation d'Optimike** : pour un consultant ou un indépendant sensible à la souveraineté de ses données, le couple Ollama + Llama3 suffit pour booster l'analyse, les connexions et l'exploitation stratégique des notes.

---

## 3. Créer la structure ACE du coffre (le noyau stable)

Mickaël utilise la méthode **ACE** (Atlas, Calendrier, Efforts) inspirée de la méthode **ACCESS** de Nick Milo (créateur de Linking Your Thinking). Il l'utilise depuis 3-4 ans.

### La structure de dossiers

Crée cette arborescence à la racine de ton coffre :

```
ÉLYSIA/                          (ou le nom de ton coffre)
├── Atlas/                       (Savoir — ~3044 notes chez Mickaël)
│   ├── Briefs/
│   ├── Étincelles/
│   ├── Maps/
│   ├── META/
│   └── Sources/
│       ├── Clippings/           (articles web clippés — 372+)
│       ├── Copilot/
│       ├── Cours suivis/
│       ├── Films/
│       ├── GitHub/
│       ├── Livres/
│       ├── Musique/
│       ├── Revues scientifiques/
│       ├── Séries/
│       ├── Swipe Files/
│       ├── Vidéos/
│       ├── Voicenotes/
│       └── X/                   (posts Twitter/X)
│
├── Calendrier/                  (Plannings — ~599 notes)
│   ├── Archives/
│   └── Journaux/
│
└── Efforts/                     (Projets — ~2246 notes)
    └── Projets/
        └── Internes/
            └── [Nom du projet]/
```

### Ce que signifie chaque zone

- **Atlas** = tout ce qui est **savoir** : les connaissances que tu accumules, les articles que tu lis, les notes de concept, les MOCs (Maps of Content).
- **Calendrier** = tout ce qui est **lié au temps** : plans de semaine, reviews hebdo/mensuelles, plans à 3 mois, daily notes.
- **Efforts** = tout ce qui **demande du travail** : projets actifs, créations, livrables, chantiers clients.

---

## 4. Mettre en place Atlas — le savoir

### 4.1 Le dossier Sources/Clippings

C'est le cœur de la veille. Chaque article ou post clippé du web atterrit ici sous forme de note Markdown avec :

- Un **frontmatter** complet (métadonnées YAML)
- Un **résumé** en callout
- Des **actions** à mener
- Un bloc **impacts/décisions**
- La **traduction en français** du contenu

Voici un exemple de note clippée tel que visible dans les screenshots :

```markdown
---
collection: Clippings
titre: "La couche manquante de la stack agentique"
sources:
  - https://x.com/...
  - https://abs.twimg.com/...
auteur: Rohit
profil_x: "@rohit4verse"
description: "Pourquoi la vraie faille des systèmes agentiques n'est pas..."
source_langue: en
source_type: x
lu: false
banner: https://abs.twimg.com/...
image: https://abs.twimg.com/...
theme_principal: "IA & agents"
themes_secondaires:
  - "Tech & outils"
  - "Études de cas & benchmarks"
impact_objectifs: 4
potentiel_inspiration: 4
rang: 5
confiance_classement: haute
justification_classement: "Trace architecture et mémoire agentique avec cas PlayerZero..."
---

# La couche manquante de la stack agentique — Rohit

~ Clippings

## Résumé

> [!summary]
> - **Thèse** : le vrai manque des systèmes agentiques n'est ni le modèle ni le tool calling, mais la couche de mémoire décisionnelle qui permet de savoir pourquoi un agent a agi.
> - **Point clé** : sans traces riches, rejouables et append-only, un agent qui casse quelque chose en production devient un fantôme impossible à debugger proprement.
> - **Cadre proposé** : passer d'un simple logging applicatif à une trace architecture inspirée de l'event sourcing.

## Actions

- Vérifier si nos agents conservent aujourd'hui le contexte utile de décision
- Séparer clairement logs, traces, mémoire procédurale, mémoire sémantique et mémoire épisodique dans nos architectures
- Examiner si un graphe de contexte ou une couche de replay permettrait de mieux debugger

## Impacts / Décisions

- Ce texte pousse une idée structurante : la mémoire agentique est une infrastructure de production...
```

### 4.2 La vue Collection "Clippings"

Mickaël utilise une note **Maps/Clippings.md** qui affiche automatiquement tous les clippings sous forme de tableau grâce à Dataview :

```markdown
# Clippings

~ Collections

Cette note rassemble toutes les notes dont la propriété `collection` indique `Clippings`.
```

Avec une requête Dataview (dans la note) :

```dataview
TABLE creation, lu
FROM "Atlas/Sources/Clippings"
WHERE collection = "Clippings"
SORT creation DESC
```

Cela donne le tableau visible dans les screenshots : 372 résultats, triés par date de création, avec une colonne "lu" à cocher.

---

## 5. Mettre en place Calendrier

Le dossier Calendrier contient tout ce qui est temporel :

```
Calendrier/
├── Journaux/
│   ├── 2026-03-24 - lundi.md        (daily notes)
│   ├── 2026-03-25 - mardi.md
│   └── ...
├── Archives/
├── SAS IA/
│   └── Traces (14 jours)/           (file d'attente IA)
├── 2026-W13 - Arc de la semaine.md  (arc hebdo)
├── 2026-W13 - Plan de la semaine.md
└── 2026-W13 - Tâches et projets.md
```

### Notes clés

- **Daily notes** : une phrase par jour, 7 one-liners par semaine.
- **Arc de la semaine** : la vision/direction de la semaine (généré avec l'IA).
- **Plan de la semaine** : les tâches concrètes, priorisées, avec les projets en cours.
- **SAS IA — Traces** : une file d'attente de 14 jours d'éléments à traiter par l'IA.

### Template de Daily Note (à mettre dans ton dossier Templates/)

```markdown
---
type: daily
date: "{{date:YYYY-MM-DD}}"
tags:
  - daily
  - journal
---

# {{date}}

## Objectif du jour
-

## Tâches prioritaires
- [ ] Tâche 1
- [ ] Tâche 2

## Notes libres
-

## One-liner de la journée
> [résumé en 1 phrase de ce qui s'est passé]
```

Configure Periodic Notes pour utiliser ce template automatiquement à chaque nouvelle journée.

---

## 6. Mettre en place Efforts — les projets

Chaque projet a sa propre note avec un format structuré. Voici le modèle visible dans les screenshots :

```markdown
---
collection: Projets
type: projet
parent: "IGNIS V — Projet (pivot)"
statut: actif
rang: 2
client: false
type_projet: "optimisation site"
entité: "Nexus IA"
création: 2026-03-24
modification: 2026-03-24
---

# Nexus IA — Chantier clarification copy du site

## Snapshot (canon)

- **Objectif** : rendre le site Nexus IA nettement plus limpide pour ses cibles prioritaires sans banaliser son positionnement premium.
- **DoD (résultat observable)** : Home, Build, Run, About et Orientation deviennent compréhensibles à froid pour une ESN...

- **État (3 bullets max)** :
  - le site Next est en ligne sur `main` et sert bien
  - la structure, la DA et le funnel tiennent, mais le wording reste trop cryptique
  - la cible de clarification prioritaire est Build, puis Run, About, Home, Orientation

- **Contraintes / garde-fous (3 max)** :
  - garder la singularité premium
  - parler d'effets client visibles avant de parler du système
  - ne pas rouvrir un chantier design

- **Décisions (max 3, datées)** :
  - 2026-03-24 — considérer `main` comme branche canon du site
```

Ce format permet à l'IA de comprendre instantanément l'état d'un projet quand tu lui demandes de le reprendre.

---

## 7. Système de frontmatter et métadonnées (le contrat entre toi et l'IA)

Le frontmatter (bloc YAML en haut de chaque note) est **crucial**. C'est le **contrat** qui permet à tout le système de tenir quand tu empiles des skills. Tant que chaque note — qu'elle soit créée par toi, par une skill de clipping, par une skill Twitter, ou par une skill qui n'existe pas encore — respecte ce contrat, elle s'intègre automatiquement dans les vues Dataview, les recherches, et tous les workflows IA existants et futurs.

### Métadonnées communes à toutes les notes

```yaml
---
collection: Clippings | Projets | SOP | ...
type: projet | SOP | clipping | ...
création: 2026-03-24
modification: 2026-03-24
---
```

### Métadonnées spécifiques aux Clippings

```yaml
---
auteur: "Nom de l'auteur"
profil_x: "@handle"
source_langue: en | fr
source_type: x | web | youtube | pdf
theme_principal: "IA & agents"
themes_secondaires:
  - "Tech & outils"
impact_objectifs: 1-5
potentiel_inspiration: 1-5
rang: 1-5
confiance_classement: haute | moyenne | basse
lu: true | false
---
```

### Métadonnées spécifiques aux Projets

```yaml
---
parent: "Projet parent"
statut: actif | parking | archivé
rang: 1-5
client: true | false
type_projet: "optimisation site | création | ..."
entité: "Nom de l'entreprise"
---
```

### La logique de classification hiérarchique

Mickaël explique que l'IA doit savoir dans quelle zone ranger une note :

1. **Première question** : cette note va dans Atlas, Calendrier ou Effort ?
2. **Deuxième question** (si Atlas) : dans quel sous-dossier de Sources ? Quel thème principal ?
3. **Troisième question** : quelles métadonnées spécifiques ?

> **Point clé** : "Il faut avoir des règles de classifications extrêmement strictes, sinon l'IA fait n'importe quoi. J'ai des SOP pour tout."

Avec le temps et des règles bien écrites, l'IA "lit dans ton cerveau" — tu n'as plus besoin de rien préciser.

### Bonnes pratiques de nommage (issues du site Optimike)

Le site d'Optimike recommande ces conventions pour les propriétés :

- **Noms courts et explicites** en `snake_case` ou `kebab-case` (ex : `source_type`, `impact_objectifs`)
- **Typage strict** : respecter les types (texte, nombre, date, booléen) pour que les filtres Dataview et les tris fonctionnent correctement
- **Standardiser tes templates** : utiliser des modèles cohérents pour chaque type de note. Cela permet à l'IA de détecter les patterns et d'automatiser plus efficacement
- **Texte riche en signal** : éviter les listings déconnectés. Plus ton contenu est rédigé de manière explicite, plus l'IA peut en extraire du sens utile

### Obsidian Bases (fonctionnalité native récente)

Obsidian a introduit **Bases** : des vues Table et Cartes intégrées nativement, sans plugin. Tu peux créer des fichiers `.base` qui affichent tes notes comme une vraie base de données.

Exemple d'un fichier `Clippings.base` pour un Read-it-later :

```base
filters:
  and:
    - file.inFolder("Clippings")
views:
  - type: table
    name: "À lire"
    filters: { and: [ "read != true" ] }
  - type: table
    name: "Lus"
    filters: { and: [ "read == true" ] }
```

Autres recettes utiles : pipeline éditorial (Idée → Brouillon → Publié), CRM léger (Prospects/Clients), catalogue de projets. Le site d'Optimike propose un article complet avec des recettes prêtes à copier-coller.

> **Tip** : centralise tes fichiers `.base` dans un dossier `_Bases/` pour faciliter la maintenance.

---

## 8. Connecter l'IA à Obsidian (MCP) — la prise universelle

Le MCP (Model Context Protocol) est **la prise sur laquelle tout se branche**. C'est le standard qui permet à n'importe quel LLM de lire et écrire dans ton coffre. Sans MCP, ton Obsidian est un cerveau muet. Avec, c'est un cerveau que l'IA peut consulter et alimenter.

### 8.1 Le MCP Obsidian (obligatoire — c'est la base)

Mickaël utilise le MCP **optimike_obsidian_mcp_stdio**. C'est la prise principale. Voici les outils qu'il expose (visibles dans les screenshots) :

- `obsidian_list_notes` : lister les notes
- `obsidian_read_note` : lire une note
- `obsidian_update_note` : modifier une note
- `obsidian_search_replace` : chercher/remplacer dans une note
- `obsidian_global_search` : recherche globale dans le coffre

### 8.2 Ajouter d'autres MCPs (c'est comme brancher une rallonge)

Chaque nouveau MCP = une nouvelle capacité. Tu les ajoutes dans ton fichier de configuration :

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "obsidian-mcp-stdio"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/chemin/vers/ton/coffre"
      }
    },
    "markitdown": {
      "command": "npx",
      "args": ["-y", "markitdown-mcp"]
    }
  }
}
```

Demain tu trouves un MCP pour YouTube ? Tu ajoutes 5 lignes ici. Un MCP pour Notion ? 5 lignes. Un MCP pour un outil qui n'existe pas encore ? Pareil. Le coffre Obsidian ne change pas. La config MCP grandit, et les skills suivent.

> **Note** : Vérifie toujours la documentation actuelle du MCP que tu choisis — les noms de packages évoluent vite.

### 8.3 Ce que l'IA peut faire une fois branchée

Avec le MCP Obsidian seul, l'IA peut déjà lire, créer, modifier, rechercher, classer et générer dans tout le coffre. Mais **c'est la combinaison MCP + skill** qui crée la magie : le MCP donne les mains, la skill donne le cerveau.

### 8.4 L'intelligence interne : Smart Connections

Le MCP c'est pour les agents externes (Claude Code, Codex). Mais **à l'intérieur** d'Obsidian, tu veux aussi de l'intelligence. C'est le rôle de **Smart Connections** :

- **Chat avec tes notes** : tu poses une question ("Quels sont les points communs entre mes projets X et Y ?") et l'IA fouille ton coffre pour te répondre avec contexte.
- **Connexions sémantiques** : le plugin détecte les liens cachés entre tes notes — pas les liens que tu as créés manuellement, mais ceux que le *sens* du contenu révèle. Il peut découvrir qu'une note sur la "gestion de la complexité" fait écho à une autre écrite 6 mois plus tôt sur un sujet apparemment différent.
- **Suggestions proactives** : il te propose des regroupements, des thèmes émergents, des angles que tu n'avais pas vus.

Smart Connections se connecte soit à un modèle cloud (GPT-4, Claude), soit à un modèle local via Ollama. Combiné au MCP pour les agents externes, tu obtiens deux couches d'intelligence : une qui travaille *dans* Obsidian quand tu navigues, une qui travaille *depuis l'extérieur* quand tu donnes des commandes à ton agent.

---

## 9. Ta première skill : le clipping web

Le clipping web est le meilleur premier cas d'usage. Il est concret, utile immédiatement, et il t'apprend le pattern que tu vas réutiliser pour tout le reste.

### 9.1 Les outils de conversion

**Trafilatura** — scraper web en Python :

```bash
pip install trafilatura
trafilatura -u "https://example.com/article" --output-format markdown
```

**MarkItDown** — le couteau suisse de Microsoft. Convertit en Markdown : PDF, PowerPoint, Word, Excel, Images (EXIF + OCR), Audio (transcription), HTML, CSV, JSON, XML, ZIP, YouTube, EPubs.

```bash
pip install markitdown
markitdown "https://example.com/article"
markitdown document.pdf
```

**MarkItDown MCP** — la version serveur, pour que l'IA le fasse elle-même :

Repo : `github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp`

### 9.2 La skill de clipping

Crée un fichier `skill-clipping.md` dans ton coffre (ou dans le dossier skills de ton agent) :

```markdown
# Skill : Clipper un article web dans ÉLYSIA

## Étapes
1. Utiliser MarkItDown ou Trafilatura pour extraire le contenu
2. Créer la note dans Atlas/Sources/Clippings/
3. Nommer : "Auteur — Titre (YYYY-MM-DD).md"
4. Remplir le frontmatter canonique
5. Ajouter le résumé en callout avec Thèse, Point clé, Cadre proposé
6. Ajouter les Actions (3 max)
7. Ajouter les Impacts / Décisions
8. Traduire intégralement en français si source_langue != fr
9. Évaluer : impact_objectifs, potentiel_inspiration, rang, confiance
```

### 9.3 Le workflow complet

1. Tu trouves un article intéressant.
2. Tu donnes l'URL à ton IA (via Claude Code, Codex, ou un agent).
3. L'IA lit la skill → sait exactement quoi faire.
4. L'IA utilise MarkItDown (MCP) pour extraire le contenu.
5. L'IA utilise le MCP Obsidian pour créer la note au bon endroit avec le bon frontmatter.
6. La note apparaît automatiquement dans ta vue Dataview "Clippings".

**Tout ça en une seule commande.** Et tu viens de comprendre le pattern.

---

## 10. Comment ajouter n'importe quelle capacité (le pattern)

**C'est LA section clé de ce guide.** Tout ce qui suit — Twitter, Notebook LM, YouTube, n'importe quoi — suit exactement le même pattern en 3 étapes :

### Le pattern universel

```
ÉTAPE 1 : Trouver l'outil d'accès
         → Un MCP, une CLI, une API, un script Python...
         → "Comment mon IA peut-elle ACCÉDER à cette source ?"

ÉTAPE 2 : Écrire la skill
         → Un fichier .md qui dit à l'IA :
           - Comment utiliser l'outil
           - Quel frontmatter appliquer
           - Où ranger le résultat dans le coffre
           - Quelles conventions respecter

ÉTAPE 3 : Tester et itérer
         → Lancer la skill sur 3-5 exemples
         → Corriger les instructions qui manquent de précision
         → Affiner jusqu'à ce que "2 mots suffisent"
```

### Pourquoi ça marche à l'infini

Le noyau ne bouge jamais. La structure ACE reste la même. Le frontmatter reste le même contrat. Chaque nouvelle skill ne fait que répondre à deux questions :

1. **Comment récupérer le contenu ?** (quel outil, quel MCP)
2. **Comment le ranger dans le coffre ?** (quel dossier, quel frontmatter, quels callouts)

C'est pour ça que Mickaël peut "ajouter des trucs littéralement toutes les semaines" sans jamais casser ce qui existe.

### Exemples de capacités ajoutables

| Nouvelle capacité | Outil d'accès | Skill à écrire |
|-------------------|---------------|-----------------|
| Clipper X/Twitter | Bird, CLIX, ou API Twitter | skill-twitter.md |
| Clipper YouTube | MarkItDown (supporte YouTube) | skill-youtube.md |
| Importer des PDF | MarkItDown MCP | skill-pdf-import.md |
| Piloter Notebook LM | Repo Python dédié | skill-notebooklm.md |
| Résumer des podcasts | Whisper + MarkItDown | skill-podcast.md |
| Veille GitHub | API GitHub ou MCP GitHub | skill-github.md |
| Importer des newsletters | MarkItDown sur les emails | skill-newsletter.md |
| Gérer un CRM simple | MCP Obsidian seul (tout en notes) | skill-crm.md |
| Rédiger des posts LinkedIn | MCP Obsidian + prompt dans skill | skill-linkedin.md |
| **[Ton idée ici]** | **[L'outil que tu trouves]** | **[La skill que tu écris]** |

La dernière ligne est la plus importante. **Le tableau n'a pas de fin.**

---

## 11. Exemple concret : brancher X/Twitter

Appliquons le pattern.

### Étape 1 : l'outil d'accès

Mickaël utilise **Bird**, une ancienne CLI de Peter Steinberger :

```bash
bird read https://x.com/i/status/20348496729852...
```

Alternatives : **CLIX** et autres CLI récentes pour accéder à X sans l'API payante. Ou l'API Twitter officielle si tu as le budget.

### Étape 2 : la skill

```markdown
# Skill : Clipper un post X/Twitter dans ÉLYSIA

## Accès
- Utiliser bird ou CLIX pour lire le post/thread
- Le markdown est le langage naturel de l'IA, pas besoin de convertir

## Rangement
- Dossier : Atlas/Sources/X/ ou Atlas/Sources/Clippings/
- Nommage : "Auteur — Titre ou résumé (YYYY-MM-DD).md"

## Frontmatter spécifique
source_type: x
profil_x: "@handle"
[+ frontmatter canonique standard]

## Traitement
- Traduire en français si nécessaire
- Ajouter les callouts : Résumé, Actions, Impacts
- Évaluer impact et rang
```

### Étape 3 : tester

Tu dis à ton agent : "Clippe ce post" + l'URL. Il lit la skill, utilise bird, crée la note, applique le frontmatter. Tu corriges ce qui cloche. Au bout de 3-5 essais, c'est calé.

### Résultat visible dans les screenshots

Mickaël montre un clipping complet d'un post de Manthan Gupta sur la mémoire des agents IA. Le post est arrivé dans `Atlas/Sources/Clippings/` avec frontmatter canonique, traduction FR, callouts, et classification automatique. L'agent a utilisé bird pour lire, le MCP Obsidian pour écrire, et la skill pour savoir quoi faire.

---

## 12. Exemple concret : piloter Notebook LM

Mickaël mentionne qu'il est "tombé sur un repo Python pour faire de l'agentique pour contrôler Notebook LM, ben direct ça devient une stack en plus."

### Le pattern appliqué

**Étape 1** : Le repo Python est l'outil d'accès. Tu l'installes, tu vérifies qu'il fonctionne en CLI.

**Étape 2** : Tu écris une skill `skill-notebooklm.md` :

```markdown
# Skill : Piloter Notebook LM depuis ÉLYSIA

## Accès
- Utiliser [nom du repo] pour interagir avec Notebook LM
- Commandes disponibles : [lister ce que le repo permet]

## Cas d'usage
- Envoyer un ensemble de clippings à Notebook LM pour générer un podcast/résumé
- Récupérer les résumés générés et les stocker dans Atlas/

## Rangement des résultats
- Dossier : Atlas/Sources/Voicenotes/ ou Atlas/Briefs/
- Frontmatter : [adapter le template canonique]
```

**Étape 3** : Tu testes, tu affines, c'est branché.

### Le point crucial

Tu n'as pas restructuré ton coffre. Tu n'as pas modifié ta config MCP Obsidian. Tu n'as pas touché à tes autres skills. Tu as juste **ajouté** un outil + un fichier d'instructions. Et maintenant ton agent sait piloter Notebook LM en plus de tout le reste.

**C'est ça, "step up à l'infini".**

---

## 13. L'anatomie d'une skill bien écrite

> "Il faut avoir des règles de classifications extrêmement strictes, sinon l'IA fait nimp. J'ai des SOP pour tout."

### Structure type d'une skill

```markdown
# Skill : [Nom de la capacité]

## Contexte
[Quand cette skill doit être utilisée]

## Accès / Outils
[Comment accéder à la source de données — quel MCP, quelle CLI, quelle API]

## Règles de classification
[Où ranger dans le coffre, quel nommage de fichier]

## Frontmatter canonique
[Le template YAML exact à appliquer]

## Traitement du contenu
[Traduire ? Résumer ? Structurer comment ?]

## Callouts obligatoires
[Résumé, Actions, Impacts — avec le format exact attendu]

## Conventions
[Tout ce que l'IA doit savoir pour ne pas improviser]
```

### Les erreurs à éviter

- **Trop vague** : "Crée une note bien structurée" → l'IA va inventer sa propre structure à chaque fois.
- **Pas de frontmatter template** : l'IA va oublier des champs ou en inventer.
- **Pas de conventions de nommage** : tu vas te retrouver avec des fichiers nommés n'importe comment.
- **Pas de règle de rangement** : l'IA va créer la note à la racine ou dans le mauvais dossier.

### Les 3 règles d'un vault pensé "IA-first" (issues du site Optimike)

Le site d'Optimike insiste sur un point : implémenter l'IA ne suffit pas. Ton coffre doit être **pensé en amont** pour dialoguer avec elle. Trois règles :

1. **Standardise tes structures** : utilise des templates cohérents pour chaque type de note (clipping, réunion, projet, idée…). Cela permet à l'IA de détecter les patterns et d'automatiser plus efficacement.
2. **Privilégie le texte riche en signal** : évite les listes déconnectées sans contexte. Plus ton contenu est rédigé de manière explicite, plus l'IA peut en extraire du sens utile.
3. **Crée des zones d'émergence** : réserve des notes ou dashboards pour regrouper les suggestions IA, les connexions découvertes, les idées synthétisées. Ces points de convergence deviennent tes hubs cognitifs.

### 3 scénarios d'automatisation concrets

Le site d'Optimike propose ces workflows IA que tu peux implémenter comme skills :

**Débrief automatique** : à la fin d'une session de travail, un prompt IA résume la note et propose 3 insights à réexplorer plus tard. → `skill-debrief.md`

**Préparation de livrable** : à partir d'un dossier de recherche, l'IA regroupe les points communs, propose un angle d'analyse, génère une structure préliminaire. → `skill-livrable.md`

**Révision hebdomadaire augmentée** : tous les vendredis, l'IA synthétise les notes marquées "important", propose des regroupements par thème et alimente automatiquement la note d'objectifs de la semaine. → C'est exactement ce que fait la skill `elysia-arc-copilot` de Mickaël.

Chacun de ces scénarios = le même pattern : un outil d'accès (le MCP Obsidian), une skill, et c'est empilé.

### Le test de qualité d'une skill

Si tu dois corriger le résultat de l'IA plus de 1 fois sur 5, ta skill n'est pas assez précise. Ajoute des contraintes. Sois plus explicite. Donne des exemples concrets dans la skill elle-même.

Le but final : **"2 mots suffisent pour ton agent"**, comme le dit Mickaël. "Clippe ça" et tout est parfait du premier coup.

### La skill la plus importante : l'organisation du coffre

C'est la skill mère. Elle dit à l'IA :

```markdown
# Skill : Organisation du coffre ÉLYSIA

## Structure
- Atlas/ : Savoir (Clippings, Livres, Vidéos, etc.)
- Calendrier/ : Temporel (Daily notes, Plans de semaine, Arcs)
- Efforts/ : Projets actifs et livrables

## Règles de classification
1. Déterminer si c'est du Savoir (Atlas), du Temporel (Calendrier), ou un Effort
2. Si Atlas → identifier le type de source
3. Appliquer le frontmatter canonique correspondant
4. Ne jamais créer de nouveau dossier sans autorisation

## Conventions globales
- Toujours traduire en français
- Toujours ajouter les callouts : Résumé, Actions, Impacts
- Les collections Dataview sont la source de vérité
- L'IA ne visite en général que 1 à 2 notes pour trouver ce qu'il faut
```

Toutes les autres skills **héritent** de celle-ci. Quand tu écris une skill de clipping, tu n'as pas besoin de re-expliquer la structure ACE — l'IA la connaît déjà via la skill d'organisation.

---

## 14. Le rituel hebdomadaire ARC (10-15 min)

Mickaël a un SOP pour sa revue hebdomadaire. Ce rituel est le **moteur humain** du système — c'est le moment où toi, tu décides ce qui compte, et l'IA exécute.

### Setup (30 secondes)

- Ouvrir la note `[[YYYY-W.. - Arc de la semaine]]`
- Ouvrir aussi `[[YYYY-W.. - Plan de la semaine]]`

### Niveau 1 — Low Energy (5-7 min) — 50% de la valeur

1. **Log** : écrire 7 one-liners (lun→dim) — un résumé d'une phrase par jour.
2. **Clippings** (revue légère) : regarde 1 à 3 clippings max et décide pour chacun :
   - `converti` → transformé en note utile
   - `lié` → relié à une note existante
   - `parking` → mis de côté pour plus tard
   - `ignoré` → pas pertinent
   - *Priorité : les clippings qui nourrissent un projet actif ou une création visible.*
3. **SAS IA** (1 trace) : ouvrir `Calendrier/Journaux/SAS IA — Traces (14 jours)` et choisir 1 item à traiter.
4. **3 conversions** : convertir la trace SAS IA si pertinent, en utilisant les clippings retenus.
5. **PMN** : écrire un Post-it Mental de la semaine en 3 lignes.

### Niveau 2 — Medium (+5 min) — +25% de valeur

- Depuis le log, créer ou relier 1 à 3 notes utiles (Substrat, note Projet, note Création).
- Les relier dans l'ARC de la semaine.

### Niveau 3 — High (+10 min) — +25% de valeur

- Refactoriser : restructurer une note, ajouter des liens, nettoyer un Substrat.
- Optionnel : préparer un micro-brief pour une Création.

> **L'idée** : même avec 5 minutes et peu d'énergie, tu fais avancer ton système. Les niveaux 2 et 3 sont bonus.

---

## 15. Planification automatique avec l'IA

C'est le résultat final de tout le système. C'est là que "10 mots suffisent".

### Comment ça marche

Mickaël utilise une skill `elysia-arc-copilot` qui :

1. Lit l'ARC hebdomadaire en cours.
2. Récupère le contexte Calendrier minimal (plans récents, daily notes).
3. Consulte tous les projets actifs, leurs statuts, leurs priorités.
4. Connaît les objectifs à 3 mois.
5. Propose un plan de semaine complet — sans qu'on ait besoin d'écrire quoi que ce soit.

### Exemple de résultat (visible dans les screenshots)

L'IA génère un document structuré avec la semaine en cours, les projets prioritaires avec liens Obsidian (`[[Projet X]]`), le Top 3 des priorités, les projets sous contrainte, un backlog de tâches, le tout avec des checkboxes.

### Pourquoi ça marche

> "Comme il connaît tous mes projets, tous mes tafs, tous mes objectifs à 3 mois et qu'il sait où les chercher, tout mon plan de la semaine en 10 mots."

La clé : l'IA n'a besoin de visiter que **1 à 2 notes maximum** pour trouver tout ce qu'il faut, grâce à la structure hiérarchique et aux liens entre notes. Et cette skill `elysia-arc-copilot` n'est elle-même qu'**une skill de plus** dans le système — elle a été ajoutée comme toutes les autres, avec le même pattern.

---

## 16. Synchronisation multi-appareils

Mickaël confirme : "Oui, et synchro sur tous mes devices."

### Options de synchronisation

1. **Obsidian Sync** (payant, ~8€/mois) : la solution officielle, chiffrée de bout en bout. La plus simple.
2. **iCloud** (Mac/iOS) : gratuit si tu es dans l'écosystème Apple. Tu places ton coffre dans iCloud Drive.
3. **Syncthing** (gratuit, open source) : synchronisation P2P entre appareils, sans cloud.
4. **Git** (gratuit) : avec le plugin Obsidian Git, tu peux push/pull automatiquement. Plus technique.

---

## 17. Résumé et checklist de démarrage

### L'architecture — vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                      TON CERVEAU                         │
│                   (10 mots suffisent)                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│             AGENT IA (Claude Code / Codex / Hermes)      │
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │              SKILLS (∞ extensibles)               │     │
│  │                                                   │     │
│  │  skill-organisation   skill-clipping              │     │
│  │  skill-twitter        skill-arc-copilot           │     │
│  │  skill-notebooklm    skill-youtube                │     │
│  │  skill-???           skill-???                    │     │
│  │  skill-???           skill-???                    │     │
│  │         (la liste n'a pas de fin)                 │     │
│  └─────────────────────────────────────────────────┘     │
└──────┬──────────┬──────────┬──────────┬─────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ MCP      │ │MarkIt  │ │Bird /  │ │ ???    │
│ Obsidian │ │Down MCP│ │CLIX    │ │ MCP    │
│ (base)   │ │        │ │        │ │        │
└────┬─────┘ └───┬────┘ └───┬────┘ └───┬────┘
     │           │          │          │
     ▼           ▼          ▼          ▼
┌─────────────────────────────────────────────────────────┐
│               OBSIDIAN (le noyau stable)                  │
│                                                           │
│  ┌──────────┐  ┌─────────────┐  ┌───────────┐           │
│  │  Atlas    │  │ Calendrier  │  │  Efforts  │           │
│  │ (Savoir)  │  │   (Temps)   │  │ (Projets) │           │
│  └──────────┘  └─────────────┘  └───────────┘           │
│                                                           │
│  Frontmatter canonique = le contrat universel             │
│  Sync : Obsidian Sync / iCloud / Syncthing / Git         │
└─────────────────────────────────────────────────────────┘
```

### Phase 1 — Le noyau (semaine 1)

- [ ] Installer Obsidian
- [ ] Créer la structure ACE (Atlas / Calendrier / Efforts)
- [ ] Créer les sous-dossiers d'Atlas/Sources
- [ ] Installer les plugins : Dataview, Templater, Periodic Notes
- [ ] Définir le frontmatter canonique (Clippings, Projets, SOPs)
- [ ] Créer les templates correspondants

### Phase 2 — Brancher l'IA (semaine 2)

- [ ] Installer Python + Trafilatura + MarkItDown
- [ ] Configurer le MCP Obsidian (optimike ou autre)
- [ ] Connecter le MCP à Claude Code, Codex ou Hermes
- [ ] Écrire la skill d'organisation du coffre
- [ ] Écrire la skill de clipping web
- [ ] Clipper tes 10 premiers articles → corriger la skill si besoin

### Phase 3 — Empiler (semaine 3 et au-delà, à l'infini)

- [ ] Écrire une skill Twitter → brancher bird/CLIX
- [ ] Créer ta première note de projet structurée
- [ ] Écrire la skill ARC copilot pour la planification
- [ ] Mettre en place le rituel ARC hebdomadaire
- [ ] Configurer la synchronisation multi-appareils
- [ ] **Chaque semaine : trouver un nouvel outil, écrire une skill, l'empiler**

### L'état d'esprit

Le système de Mickaël n'est pas né en un jour. Il itère depuis 3-4 ans sur la structure ACE, et il ajoute des capacités IA depuis que les MCPs existent. Ce qui fait la différence :

1. **Le noyau est solide** : ACE + frontmatter + SOPs strictes. Ça, tu le construis une fois bien.
2. **Chaque skill est indépendante** : tu peux en ajouter une sans toucher aux autres.
3. **Le pattern est toujours le même** : outil d'accès → skill → test → empilé.
4. **L'IA s'améliore avec toi** : plus tes skills sont précises, plus l'IA est autonome. Au bout d'un moment, elle "lit dans ton cerveau".

Le résultat ? Un système où **chaque semaine tu peux faire quelque chose de nouveau**, sans jamais reconstruire ce qui existe.

---

## 18. Annexe — Ressources du site Optimike pour aller plus loin

Le site [optimike.net](https://www.optimike.net/) de Mickaël contient des dizaines d'articles détaillés. Voici les plus utiles par thème, classés dans l'ordre de lecture recommandé pour construire ta stack :

### Fondations Obsidian

| Article | Ce que tu y apprends |
|---------|---------------------|
| [Guide Obsidian Bases](https://www.optimike.net/guide-obsidian-bases/) | Démarrer de zéro : vault, notes, liens, raccourcis |
| [Fonctions principales d'Obsidian](https://www.optimike.net/fonctions-principales-obsidian/) | Tour d'horizon des outils intégrés |
| [Templates Obsidian](https://www.optimike.net/obsidian-templates/) | Modèles à copier : daily note, réunion, projet, lecture |
| [Dataview Obsidian](https://www.optimike.net/dataview-obsidian/) | Transformer tes notes en base de données interrogeable |
| [Obsidian Bases — Vues & Propriétés](https://www.optimike.net/obsidian-bases-vues-proprietes-design-bonnes-pratiques/) | Design des données, recettes `.base`, conventions de nommage |

### IA dans Obsidian

| Article | Ce que tu y apprends |
|---------|---------------------|
| [Obsidian et IA](https://www.optimike.net/obsidian-ia/) | Vue d'ensemble : Smart Connections, Ollama, modèles locaux vs cloud |
| [Cas d'usage IA Obsidian](https://www.optimike.net/cas-usages-ia-obsidian/) | Classification auto, résumés GPT, graphes sémantiques |
| [Comparatif IA cloud vs local](https://www.optimike.net/comparatif-ia-cloud-vs-local/) | GPT-4 vs Llama3 vs Phi-3 : quand utiliser quoi |
| [Plugins IA Obsidian](https://www.optimike.net/plugins-ia-obsidian/) | Smart Connections, Copilot, Text Generator, Semantic Search |
| [Plugins IA pour automatiser](https://www.optimike.net/plugins-obsidian-automatisation-ia/) | Scénarios concrets : débrief auto, révision hebdo, préparation livrable |
| [Copilot Obsidian](https://www.optimike.net/copilot-obsidian/) | Installation, configuration API, prompts personnalisés |
| [Chattez avec vos notes (modèles locaux)](https://www.optimike.net/chattez-avec-vos-notes-obsidian-avec-modeles-locaux-intelligence-artificielle/) | Installer Ollama + Local GPT pour un assistant 100% privé |

### Plugins utiles pour la stack

| Article | Plugin |
|---------|--------|
| [Calendar Obsidian](https://www.optimike.net/calendar-obsidian/) | Vue calendrier pour daily/weekly notes |
| [Kanban Obsidian](https://www.optimike.net/kanban-obsidian/) | Projets en colonnes visuelles |
| [Day Planner Obsidian](https://www.optimike.net/day-planner-obsidian/) | Planifier ses journées dans Obsidian |
| [Git Obsidian](https://www.optimike.net/git-obsidian/) | Synchroniser et versionner automatiquement |
| [Homepage Obsidian](https://www.optimike.net/homepage-obsidian/) | Créer une note d'accueil personnalisée |
| [Meta Bind Obsidian](https://www.optimike.net/meta-bind-obsidian/) | Champs interactifs et métadonnées dynamiques |
| [Commander Obsidian](https://www.optimike.net/commander-obsidian/) | Déclencher des actions personnalisées rapidement |
| [Breadcrumbs Obsidian](https://www.optimike.net/breadcrumbs-obsidian/) | Liens hiérarchiques entre notes (utile pour ACE) |

### Méthodes PKM

| Article | Ce que tu y apprends |
|---------|---------------------|
| [Guide complet du PKM](https://www.optimike.net/guide-complet-du-pkm/) | Transformer l'information en atout stratégique |
| [Méthode Zettelkasten](https://www.optimike.net/methode-zettelkasten/) | Réseau de notes interconnectées (complémentaire à ACE) |
| [Construire un second cerveau (livre)](https://www.optimike.net/livre-construire-second-cerveau/) | Idées clés du livre de Tiago Forte |
| [Obsidian comme logiciel PKM](https://www.optimike.net/logiciel-pkm-obsidian/) | Pourquoi Obsidian est l'outil modulaire idéal |

> **Note** : Mickaël a annoncé une cinquantaine d'articles sur l'agentique prévus pour mai 2026. Ce guide sera à compléter avec ces nouveaux contenus quand ils sortiront — en particulier sur les workflows MCP avancés, les skills d'automatisation, et les agents autonomes dans Obsidian.

---

*Guide reconstitué à partir des échanges de Mickaël Ahouansou dans le groupe Telegram "Le Lab X" (canal Débutants, mars 2026) et enrichi avec le contenu de son site [optimike.net](https://www.optimike.net/).*
