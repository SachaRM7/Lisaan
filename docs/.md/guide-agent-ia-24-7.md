# Guide Complet : Construire ton Agent IA Personnel 24/7 pour 21$/mois

> **Ce que tu vas construire** : Un agent IA qui tourne en permanence sur un ordinateur chez toi, fait des recherches pendant que tu dors, t'envoie un briefing chaque matin sur Telegram, et devient plus intelligent chaque jour.
> **Pré-requis** : Savoir ouvrir un terminal et taper des commandes basiques. C'est tout.
> **Coût** : 21$/mois + un ordinateur (Mac Mini, vieux laptop, ou n'importe quelle machine Linux).
> **Temps d'installation** : 30 minutes (version minimale) à un week-end (version complète).

---

## Table des matières

1. [Vue d'ensemble : ce que fait le système](#1-vue-densemble)
2. [Le matériel](#2-le-matériel)
3. [Le framework : Hermes Agent](#3-le-framework--hermes-agent)
4. [Les modèles IA (le "cerveau")](#4-les-modèles-ia)
5. [Les tâches automatisées (cron jobs)](#5-les-tâches-automatisées-cron-jobs)
6. [Les scripts shell (les "muscles")](#6-les-scripts-shell)
7. [Les compétences custom (skills)](#7-les-compétences-custom-skills)
8. [Le système de contexte ALIVE](#8-le-système-de-contexte-alive)
9. [Apprendre ton style d'écriture à l'IA](#9-apprendre-ton-style-décriture-à-lia)
10. [Les erreurs à éviter](#10-les-erreurs-à-éviter)
11. [Installation pas à pas](#11-installation-pas-à-pas)
12. [La philosophie derrière tout ça](#12-la-philosophie)

---

## 1. Vue d'ensemble

Imagine que tu as un employé junior qui travaille 24h/24, ne dort jamais, et a accès à ton terminal. Chaque matin à 7h, il t'envoie un message Telegram avec :

- Ce qui s'est passé pendant la nuit dans tes domaines d'intérêt
- Les articles et papiers de recherche importants publiés récemment
- Les discussions intéressantes sur Reddit et Hacker News
- Une liste de priorités pour ta journée, basée sur tes vrais projets et deadlines

Le système décrit ici fait exactement ça. Il a tourné 18 tâches planifiées entre 7h hier et 7h aujourd'hui : recherche web, lecture d'articles complets, exécution de scripts contre 8 APIs différentes, rédaction de brouillons, évaluation de la qualité, et mise à jour d'un système de mémoire structuré.

### Les composants en un coup d'œil

| Composant | Rôle | Analogie |
|-----------|------|----------|
| **Mac Mini** | La machine qui fait tout tourner 24/7 | Le bureau |
| **Hermes Agent** | Le framework Python qui orchestre tout | Le système nerveux |
| **GLM-5** | Le modèle IA pour les conversations directes | Le cerveau "senior" |
| **GLM-4.7** | Le modèle IA pour les tâches automatisées | Le cerveau "junior" |
| **Qwen3.5 (local)** | Le modèle de compression de contexte | La gomme qui nettoie le tableau |
| **Telegram** | L'interface utilisateur | Le téléphone |
| **Cron jobs** | Les 18 tâches planifiées | L'agenda de l'employé |
| **Shell scripts** | Les 35 scripts d'automatisation | La boîte à outils |
| **Skills** | Les compétences à la demande | Les fiches de poste |
| **ALIVE** | Le système de contexte structuré | Les carnets de notes par projet |

---

## 2. Le matériel

### Ce dont tu as besoin

Un **Mac Mini M4 16 Go de RAM** (environ 600€). Mais ce n'est pas obligatoire : n'importe quel ordinateur qui peut rester allumé 24h/24 fait l'affaire — un vieux laptop sous Linux, un mini PC, etc.

### L'empreinte sur le disque

| Élément | Taille |
|---------|--------|
| Framework Hermes Agent | ~120 Mo |
| Modèle local (Qwen3.5) | ~3,4 Go |
| Modèle local additionnel | ~3,2 Go |
| **Total** | **~6,7 Go** |

### Ce que tu n'as PAS besoin

- ❌ Serveur cloud
- ❌ GPU dédié
- ❌ Facture AWS mensuelle
- ❌ Cluster de calcul

> C'est un ordinateur de la taille d'un sandwich, posé dans ton salon, qui fait tout tourner.

---

## 3. Le framework : Hermes Agent

**Hermes Agent** est un framework Python open-source créé par Nous Research. C'est la colonne vertébrale du système.

### Comment ça marche concrètement

L'interface est un **bot Telegram**. Tu lui écris comme tu écrirais à un collègue. Il a accès à un terminal, peut lire et écrire des fichiers, chercher sur le web, récupérer des pages complètes, exécuter du code, et lancer des scripts shell.

Il tourne comme un **service macOS launchd** : il démarre au boot et redémarre s'il plante.

### Ce que Hermes te donne

- Bot Telegram avec accès complet aux outils (terminal, fichiers, recherche web, exécution de code)
- Planificateur cron — des tâches tournent sur un horaire, les résultats arrivent sur Telegram
- Système de skills — des fichiers Markdown qui enseignent de nouvelles capacités à l'agent
- Système de mémoire — des fichiers persistants que l'agent lit et écrit entre les sessions
- Gestion de session — compression, timeout d'inactivité, reset quotidien
- Support MCP — Model Context Protocol pour étendre les outils disponibles

### Ce que Hermes ne te donne PAS

- Pas de chaîne de fallback multi-modèles (un seul modèle de secours)
- Pas de nettoyage automatique des sessions (il faut scripter)
- Pas de bonne écriture (limitation du modèle, pas du framework)

---

## 4. Les modèles IA

### Pourquoi 3 modèles différents ?

Chaque modèle a un job précis. Utiliser le même modèle pour tout créerait des problèmes de coût, de quota, et de performance.

### Modèle 1 : GLM-5 — Pour les conversations directes

- **Fournisseur** : Z.AI (plan Coding à 21$/mois)
- **Usage** : Quand tu écris directement au bot sur Telegram
- **Pourquoi celui-là** : Le modèle le moins cher avec un *tool calling* (appel d'outils) qui fonctionne vraiment
- **Point fort** : Raisonne bien, suit des instructions complexes multi-étapes
- **Point faible** : Écrit comme une IA. Chaque brouillon sonne artificiel

#### Le piège des "tokens de raisonnement"

GLM-5 génère toujours des tokens de raisonnement internes (sa "réflexion" avant de répondre). Ces tokens sont stockés dans l'historique de conversation. À chaque nouveau message, il relit toute sa réflexion passée.

> **Imagine** : chaque fois que tu poses une question à ton assistant, il relit tout son journal de la journée avant de répondre. Au bout de 15-20 échanges, il met 10 minutes à répondre parce qu'il relit des milliers de mots de réflexion précédente.

### Modèle 2 : GLM-4.7 — Pour les tâches automatisées

- **Fournisseur** : Z.AI (même plan)
- **Usage** : Les 18 cron jobs
- **Pourquoi** : Z.AI a une limite de 600 requêtes par 5 heures. Si les tâches auto utilisaient GLM-5, elles mangeraient le quota des conversations interactives

### Modèle 3 : Qwen3.5 — Pour la compression (local)

- **Tourne sur** : Ollama, directement sur le Mac Mini
- **Usage** : Résumer les vieilles conversations pour libérer de l'espace dans le contexte
- **Coût** : 0€ — tourne en local, aucune API
- **Taille** : 3,4 Go, ~20 tokens/seconde sur puce M4

#### Pourquoi la compression en local est critique

Voici ce qui se passait avec la compression sur l'API cloud :

```
Tâche cron → génère des messages → le contexte grandit
→ Seuil de compression atteint → appel à l'API cloud
→ Consomme du quota API → d'autres tâches tournent → encore plus de compression
→ Limite de taux atteinte → la compression échoue silencieusement
→ Le contexte grandit sans limite → l'agent met 10+ minutes à répondre
```

La solution : compression en local via Ollama. Gratuit, sans limite de taux, sans dépendance à une API.

#### Le timeout d'inactivité

Même après avoir corrigé la compression, l'agent restait lent aux heures de pointe. La cause : le timeout de session par défaut était de 1440 minutes (24 heures). Les sessions ne se réinitialisaient jamais pendant la journée.

> **Imagine** : ton bureau se couvre de papiers tout au long de la journée et tu ne ranges jamais. Le soir, tu ne retrouves plus rien et chaque tâche prend 10 fois plus longtemps. Le timeout d'inactivité, c'est la fréquence à laquelle tu ranges. 24 heures = tu ne ranges jamais. 60 minutes = tu ranges toutes les heures. Même travail, 100 fois plus rapide.

**Configuration qui fonctionne** :

```yaml
# dans .env
OPENAI_BASE_URL=http://localhost:11434/v1

# dans config.yaml
summary_model: qwen3.5:4b
compression_threshold: 0.50    # compresse quand le contexte est à moitié plein
ollama_keep_alive: 5m          # libère la RAM après 5 min d'inactivité
```

---

## 5. Les tâches automatisées (cron jobs)

C'est le cœur du système : **18 tâches planifiées** qui tournent tout au long de la journée. Toutes utilisent GLM-4.7, envoient les résultats sur Telegram, et lisent/écrivent dans le système de contexte.

### Le planning quotidien

| Heure | Tâche | Ce qu'elle fait |
|-------|-------|-----------------|
| 07:00 | **Briefing matinal** | Météo, prix crypto, mouvements overnight, top Hacker News et Reddit. Lit tous les fichiers de contexte projet pour identifier les priorités du jour |
| 07:30 | **Dashboard concurrence** | Suivi de 11+ protocoles concurrents : changements de TVL, propositions de gouvernance, annonces de partenariats |
| 09:00 & 17:00 | **Monitoring on-chain** | Surveillance de requêtes Dune Analytics, deux fois par jour |
| 10:00 | **Rédaction de brouillons** | Crée des brouillons de posts pour la chaîne Telegram |
| 11:00 | **Nudge quotidien** | Lit TOUS les fichiers de contexte projet et suggère où concentrer l'effort selon l'urgence et les deadlines. C'est un moteur de priorisation |
| 12:00 | **Revue des brouillons** | Sélectionne le meilleur brouillon non publié, le vérifie contre les règles de style |
| 14:00 | **Recherche IA** | Actualités IA, papiers arXiv, frameworks d'agents. Sources : arXiv, Reddit, Hacker News, Techmeme |
| 16:00 | **Recherche domaine 2** | Spécialisée sur un second domaine |
| 18:00 | **Recherche DeFi** | Stablecoins, RWA, gouvernance, analyse concurrentielle |
| 20:00 | **Deep dive** | Choisit un sujet du jour et fait une analyse approfondie avec lecture d'articles complets |
| 21:00 | **Health check** | Vérifie tous les crons, le statut du gateway, l'espace disque, les services launchd |
| 22:00 | **Performance contenu** | Analyse les métriques de performance du contenu publié |
| 23:00 | **Nightly builder** | Le plus audacieux : identifie les lacunes trouvées pendant la recherche (scripts manquants, sources cassées) et écrit du code pour les combler. Autonomement. Pendant que tu dors. |

### Le planning périodique

| Quand | Tâche | Ce qu'elle fait |
|-------|-------|-----------------|
| Lun/Jeu 09:00 | **CRM outreach** | Automatise une partie du workflow de développement commercial |
| Lundi 09:00 | **Intel hebdo** | Brief d'intelligence concurrentielle |
| Dim/Mer 20:00 | **Digest apprentissage** | Ressources d'apprentissage de la semaine |
| Dimanche 08:00 | **Planificateur hebdo** | Lit les données de performance, les recherches, et l'état des projets → produit un plan de contenu et de priorités |

### Le monitoring horaire

**Toutes les heures de 9h à 20h** : détection de breaking news. Flux RSS + monitoring TVL + alertes de peg stablecoin + détection de tweets viraux.

### Anatomie d'une tâche de recherche (13 étapes)

Voici comment fonctionne la tâche "research-ai", la plus complexe. Son prompt fait environ 3000 mots. Voici ce qu'elle fait réellement :

**Étape 1 — Règles de vérification des sources.** Règle martelée : ne jamais inclure une info sans une URL réellement visitée. Si la recherche n'a rien donné, le dire.

> Pourquoi : GLM-4.7 hallucine parfois des URLs. Cette instruction réduit les sources inventées à quasi-zéro.

**Étape 2 — Chargement du contexte.** L'agent lit 7 fichiers : sa mémoire persistante, le journal d'opérations, les priorités de recherche, le guide de style d'écriture, les corrections de style passées, l'archive de recherche IA, et les fichiers de contexte projet. La recherche est guidée par ce sur quoi tu travailles vraiment.

**Étape 3 — Vérification email.** Consulte une boîte mail d'alertes via Himalaya (un client email en ligne de commande).

**Étape 4 — Scan arXiv.** Lance un script Python qui interroge l'API arXiv pour les papiers récents sur les agents IA, le raisonnement LLM, et l'utilisation d'outils.

**Étape 5 — Vérification du nightly builder.** Est-ce que le constructeur nocturne a créé de nouveaux outils ? Si oui, les noter.

**Étape 6 — Recherche web.** Diversité de sources obligatoire. Le prompt dit explicitement : chercher sur Techmeme d'abord, puis Hacker News, puis Reddit, puis combler les trous avec la recherche web générale.

> Pourquoi : Sans cette règle, le modèle utilise Reddit pour tout parce que Reddit est très bien classé dans les résultats de recherche. Pendant des jours, chaque briefing n'avait que des sources Reddit.

**Étape 7 — Lecture approfondie.** Récupérer et lire en entier les 2-3 articles les plus intéressants.

**Étape 8 — ÉCRIRE les résultats.** Obligatoire. Le prompt dit : "une session sans écriture est un échec." Les résultats sont écrits dans le fichier d'archive de recherche IA. Demain, la prochaine session démarre sur une base de connaissances plus riche.

**Étape 9 — Brouillon.** Si quelque chose mérite d'être publié, rédiger un brouillon. Lire les corrections de style d'abord.

**Étape 10 — Contrôle qualité.** Lancer `check_draft.sh`. Le brouillon doit obtenir ≥70/100 contre les règles de style.

**Étape 11 — Journal d'opérations.** Une ligne résumant ce qui s'est passé.

**Étape 12 — Mise à jour du contexte.** Mettre à jour les fichiers de contexte projet avec les résultats de la session.

**Étape 13 — Auto-vérification.** "Ai-je écrit du nouveau contenu dans l'archive de recherche ? Si NON, retourner à l'étape 8." Empêche l'agent de faire toute la recherche sans rien sauvegarder.

> **En résumé** : chaque tâche de recherche, c'est comme envoyer un employé en mission avec une checklist de 13 points. Charge tes priorités. Vérifie ta boîte mail. Scanne les papiers académiques. Lis les actus. Clique vraiment sur les articles et lis-les en entier. Note ce que tu as trouvé. Rédige un brouillon si c'est intéressant. Vérifie que ton brouillon ne sonne pas artificiel. Logue ce que tu as fait. Mets à jour l'équipe. Et si tu n'as rien noté, retourne le faire.

---

## 6. Les scripts shell

35 scripts, chacun dans `~/.hermes/scripts/`, avec un lien symbolique dans `~/scripts/` pour un accès facile. L'agent est le cerveau, les scripts sont les muscles.

### Scripts de données

| Script | Ce qu'il fait | Clé API nécessaire ? |
|--------|--------------|---------------------|
| `coingecko.sh` | Prix BTC/ETH/AAVE/MKR, variations 24h, données de peg stablecoin | Non |
| `defillama.sh` | Classement TVL des protocoles CDP, capitalisations stablecoins | Non |
| `rwa-tracker.sh` | Scan complet du secteur RWA : 120+ protocoles, 25Mds$+ TVL | Non |
| `hackernews.sh` | Top stories Hacker News filtrées par mots-clés | Non |
| `reddit-digest.sh` | Top posts de subreddits ciblés via les endpoints JSON publics | Non |
| `governance-tracker.sh` | Votes de gouvernance actifs sur Snapshot.org + flux RSS de forums | Non |
| `arxiv-digest.py` | Papiers arXiv récents sur les agents, le raisonnement, l'utilisation d'outils | Non |
| `fred.sh` | Données économiques de la Fed : taux, inflation, masse monétaire | Oui (gratuite) |

### Scripts de monitoring

| Script | Ce qu'il fait |
|--------|--------------|
| `tvl-monitor.sh` | Cache un snapshot TVL, alerte si un protocole suivi bouge de >10% |
| `stablecoin-supply-monitor.sh` | Détecte les mints/burns de >100M$ en USDT/USDC/DAI |
| `breaking-news.sh` | Combine tous les monitors + RSS + détection de tweets viraux |
| `health-check.sh` | Surveille l'exécution des crons, les services, l'espace disque |

### Scripts de contenu

| Script | Ce qu'il fait |
|--------|--------------|
| `check_draft.sh` | Note les brouillons de 0 à 100 contre tes règles de style. Tout ce qui est en dessous de 70 est signalé |
| `draft-review.sh` | Sélectionne le meilleur brouillon non publié chaque jour |
| `mark_posted.sh` | Déplace un brouillon vers l'archive "publié", logue dans le calendrier de contenu |
| `log-performance.sh` | Enregistre les métriques de performance : impressions, engagement, favoris |

### Scripts d'infrastructure

| Script | Ce qu'il fait |
|--------|--------------|
| `update-walnut.sh` | Ajoute une entrée de log horodatée dans le fichier de contexte projet. Appelé à la fin de chaque cron de recherche. C'est la colle entre les crons et le système de contexte |
| `compact_memory.sh` | Archive les logs de session de plus de 3 jours, réduit le journal d'opérations à 7 jours. Empêche la croissance infinie |
| `github-push-nightly.sh` | Scanne 13 patterns regex pour détecter des secrets (clés API, tokens, mots de passe) avant chaque push Git |
| `auto-update.sh` | Mise à jour quotidienne du framework Hermes |
| `docker-cleanup.sh` | Supprime les conteneurs Docker zombies de plus de 4 heures |

### Principe de conception

Aucun de ces scripts n'est compliqué. La plupart font moins de 50 lignes. La valeur vient du fait d'en avoir 35 qui travaillent ensemble dans un système planifié.

> **Analogie** : les scripts, c'est comme une boîte à outils. L'agent IA sait utiliser un marteau, un tournevis et une clé, mais tu dois lui donner les vrais outils. Chaque script connecte l'agent à une source de données ou une capacité spécifique. Sans eux, l'agent ne peut que chercher sur le web. Avec eux, il peut interroger des protocoles DeFi, scanner des papiers académiques, surveiller l'activité on-chain, vérifier sa propre santé, et pousser du code sur GitHub.

---

## 7. Les compétences custom (skills)

Les skills dans Hermes sont des **fichiers Markdown**. Tu écris un document expliquant ce que tu veux que l'agent fasse, quand, et comment. L'agent le lit quand il est invoqué.

### Comment ça marche

Tu écris un fichier `SKILL.md` → L'agent le lit au moment de l'appel → Il suit les instructions.

La beauté : écrire un nouveau skill prend 10 minutes. Le tester prend un message Telegram. L'affiner, c'est modifier un fichier texte. Compare ça à construire un plugin, déployer un service, ou câbler une API.

### Exemples de skills

#### Skill 1 : Vision cross-projet ("walnuts")

**Déclencheur** : Taper `walnuts` dans Telegram.

**Ce qu'il fait** : L'agent lit les 5 fichiers de contexte projet → synthétise une vue d'ensemble avec priorités, blocages, et tensions.

**Exemple de sortie** :

```
5 walnuts à travers ton monde.

projet-alpha — pré-lancement, 2-3 semaines.
projet-beta — en prod mais pas de prospection lancée.
oz-agent — plafond de qualité sur les brouillons.

tension : lancement alpha + prospection beta + qualité agent
sont en compétition pour ton attention dans la même fenêtre.
```

Un mot dans Telegram, 10 secondes, conscience situationnelle totale sur chaque projet.

#### Skill 2 : Rédaction de contenu

Rédige des posts pour une chaîne Telegram dans un format visuel : 1-4 phrases + image. Inclut des règles de vérification d'URL parce que GLM-5 invente des URLs environ 5% du temps.

#### Skill 3 : Intelligence concurrentielle

Analyse de marché à la demande : classements TVL, plongée dans les concurrents, cartographie d'opportunités, suivi de gouvernance. Combine données DeFiLlama + scripts shell + recherche web.

#### Skill 4 : Détection de signaux cross-sources

Combine cotes de marchés prédictifs, flux stablecoins, momentum RWA, signaux sociaux (Reddit), et alpha de gouvernance.

#### Skill 5 : Boucle de feedback sur le style (voice-learn)

Le plus puissant. Quand tu modifies un brouillon de l'IA avant de le publier, ce skill extrait ce que tu as changé et pourquoi, sauvegarde la leçon, et chaque futur brouillon lit ces leçons avant d'écrire. (Détaillé dans la section 9.)

---

## 8. Le système de contexte ALIVE

C'est la partie qui fait la plus grande différence. C'est ce qui permet au système de s'améliorer avec le temps.

### Le concept

**ALIVE** est un système de contexte structuré. Pense à un graphe de connaissances personnel sur disque. L'unité de base est un "walnut" — un conteneur de contexte pour un projet ou un domaine.

### La structure de fichiers

```
~/world/
  .alive/                              ← configuration
  02_Life/ma-marque/                   ← marque perso, contenu, croissance
  04_Ventures/projet-alpha/            ← projet principal
  04_Ventures/projet-beta/             ← second projet
  04_Ventures/micro-entreprise/        ← activité pro
  05_Experiments/oz-agent/             ← l'agent lui-même
```

Chaque walnut a un dossier `_core/` avec **5 fichiers** :

| Fichier | Contenu |
|---------|---------|
| `key.md` | Identité, thèse, connexions aux autres walnuts |
| `now.md` | Phase actuelle, prochaine action, blocages |
| `tasks.md` | Urgent / actif / backlog |
| `insights.md` | Connaissances accumulées, leçons apprises |
| `log.md` | Historique des sessions (ajout en tête, le plus récent d'abord) |

### Les 3 couches d'intégration

#### Couche 1 : Les crons ÉCRIVENT dans les walnuts

À la fin de chaque tâche de recherche, le script `update-walnut.sh` ajoute une entrée de log dans le walnut correspondant :

- `research-ai` logue dans le walnut `oz-agent`
- `research-defi` logue dans le walnut `projet-alpha`
- Chaque walnut accumule automatiquement un historique de ce qui a été recherché, trouvé, et appris

#### Couche 2 : Les crons LISENT les walnuts

Avant de chercher, chaque cron lit les tâches et insights du walnut concerné :

- `research-ai` lit les tâches de `oz-agent` ("améliorer la qualité des brouillons") → cherche des techniques de prompt engineering spécifiquement
- `research-defi` lit les tâches de `projet-alpha` ("mapper les opportunités RWA") → cherche des actus de protocoles RWA spécifiquement
- Le briefing matinal lit TOUS les fichiers `now.md` → fait remonter ce qui compte aujourd'hui sur chaque projet

#### Couche 3 : Telegram accède au contexte walnut

Quand tu tapes `walnuts`, l'agent lit les 5 fichiers walnut et te donne une vue synthétique cross-projet.

### L'effet composé

Voici la boucle qui rend le système plus intelligent chaque jour :

```
1. Tu mets à jour les tâches du walnut (manuellement ou via Telegram)
2. Les crons lisent les tâches → la recherche s'aligne sur tes priorités
3. La recherche produit des résultats → les résultats mettent à jour le log du walnut
4. Tu ajustes les tâches en fonction des résultats
5. Le prochain cron capte les priorités ajustées
6. La recherche devient plus ciblée
7. Les résultats deviennent plus pertinents
8. Recommencer
```

> **Analogie** : Imagine que tu as 5 carnets, un par projet. Avant de faire une recherche, tu relis le carnet concerné pour te rappeler ce sur quoi tu travailles et ce dont tu as besoin. Après la recherche, tu notes ce que tu as trouvé. Demain, tu relis et ta recherche est meilleure parce qu'elle s'appuie sur les notes d'hier. ALIVE, c'est ça, sauf que l'agent IA fait la relecture et la prise de notes automatiquement.

---

## 9. Apprendre ton style d'écriture à l'IA

### Le problème

L'approche classique : écrire un meilleur prompt. Ajouter plus de règles, plus d'exemples, plus de contraintes. "Écris au format expérience personnelle." "Utilise des minuscules." "Pas de listes à puces." "Varie la longueur des phrases."

Même avec 39 000 caractères d'instructions de style, le modèle produit du texte générique. Plus de règles ≠ meilleur résultat. Au-delà d'un certain point, le modèle ne peut plus intégrer des instructions abstraites supplémentaires.

### La solution : le journal de corrections

Au lieu de dire à l'IA comment écrire, tu lui montres ce que tu as changé.

**Le cycle après chaque publication** :

```
1. Tu dis "J'ai modifié ton brouillon" sur Telegram
2. Le skill voice-learn s'active
3. Il lit le brouillon original et ta version publiée
4. Il extrait chaque différence : changements de ton, coupes, ajouts, remplacements de mots
5. Il sauve chaque leçon dans voice-corrections.md
6. Chaque futur cron de rédaction lit voice-corrections.md AVANT d'écrire
```

### Pourquoi les corrections battent les prompts

| Prompt (abstrait) | Correction (concret) |
|---|---|
| "Écris au format expérience personnelle" | "Tu as écrit 'je ne dis pas que c'est un clone de UST' — j'ai coupé ça parce que les précautions préventives sapent l'expertise. Ne refais plus ça." |

Après 151 corrections concrètes — "quand tu as fait X, j'ai changé en Y, parce que Z" — le modèle commence à éviter les erreurs tout seul. Pas parfaitement. Mais suffisamment pour que le temps d'édition passe de 80% de réécriture à environ 50%.

### Le principe fondamental

> Le spécifique bat l'abstrait. Toujours.

Le modèle ne peut pas écrire comme un humain. Mais il peut écrire comme une IA légèrement meilleure qui connaît 151 choses spécifiques à éviter. Et c'est suffisant quand l'humain fait la passe finale.

---

## 10. Les erreurs à éviter

### Erreur 1 : Compression sur API cloud

**Problème** : La compression via l'API cloud crée des échecs silencieux. Les sessions grandissent sans limite et tu ne t'en rends pas compte jusqu'à ce que l'agent mette 10 minutes à répondre.

**Solution** : Compression locale via Ollama dès le jour 1. Gratuit, fiable, zéro limite de taux.

### Erreur 2 : Même modèle pour tout

**Problème** : Si tu patches le code du planificateur pour changer le modèle, ça sera écrasé à chaque mise à jour du framework.

**Solution** : Configurer `"model": "glm-4.7"` dans le fichier `jobs.json` de chaque tâche. Survit aux mises à jour.

### Erreur 3 : Compter sur l'IA pour bien écrire

**Problème** : Tu vas réécrire 50-80% de chaque brouillon pendant des semaines.

**Solution** : Construire la boucle de feedback sur le style dès le jour 1. Accepter que les corrections prennent du temps à s'accumuler. Viser 50+ corrections avant d'espérer des brouillons utilisables.

### Erreur 4 : Timeout de session trop long

**Problème** : Le défaut est souvent 24h. Sessions longues = contexte surchargé = réponses lentes.

**Solution** : Timeout à 60 minutes. Sessions courtes = contexte frais = réponses rapides. La recherche est sauvegardée dans des fichiers entre les sessions de toute façon.

### Erreur 5 : Pas de diversité de sources

**Problème** : Sans consigne explicite, le modèle utilise Reddit pour tout parce que Reddit est très bien classé dans les résultats de recherche.

**Solution** : Règle explicite dans le prompt : "Cherche sur Techmeme d'abord, puis Hacker News, puis Reddit, PUIS utilise la recherche web pour combler les trous." Spécifier l'ordre.

### Erreur 6 : Ne pas surveiller la compression

**Problème** : La compression échoue silencieusement. Si l'agent met soudainement 10 minutes à répondre et envoie 8 messages de dump de contexte, la compression est probablement cassée.

**Solution** : Vérifier le modèle, le endpoint, le manifeste. Relancer `ollama pull` pour forcer un téléchargement propre.

---

## 11. Installation pas à pas

### Version minimale (30 minutes)

#### Étape 1 : Installer Hermes Agent

```bash
hermes install
```

#### Étape 2 : Obtenir le plan Z.AI Coding (21$/mois)

Configurer dans `.env` :

```bash
GLM_API_KEY=ta_clé_ici
GLM_BASE_URL=https://api.z.ai/api/coding/paas/v4
```

> **Attention** : Utiliser le endpoint `/coding/paas/v4`, PAS `/paas/v4`. La clé du plan coding ne fonctionne que sur le endpoint coding.

#### Étape 3 : Créer un bot Telegram via @BotFather

```bash
TELEGRAM_BOT_TOKEN=ton_token_ici
```

#### Étape 4 : Démarrer le gateway

```bash
hermes gateway start
```

#### Étape 5 : Créer 2-3 cron jobs

Commencer avec un briefing matinal, une session de recherche, et un moniteur de breaking news. Dans `jobs.json`, mettre `"model": "glm-4.7"` sur chaque job.

**Tu as maintenant un agent IA 24/7 sur ta machine, accessible via Telegram, avec des tâches de recherche automatisées.**

---

### Version complète (un week-end)

Tout ce qui précède, plus :

#### Étape 6 : Installer Ollama + modèle de compression

```bash
brew install ollama          # sur Mac
# ou curl -fsSL https://ollama.com/install.sh | sh   # sur Linux

ollama pull qwen3.5:4b
```

Configurer dans `.env` et `config.yaml` :

```yaml
# .env
OPENAI_BASE_URL=http://localhost:11434/v1

# config.yaml
summary_model: qwen3.5:4b
compression_threshold: 0.50
ollama_keep_alive: 5m
# timeout de session : 60 minutes
```

#### Étape 7 : Créer 5-10 scripts shell pour tes sources de données

Choisis des APIs pertinentes pour ton domaine. La plupart des APIs publiques (CoinGecko, DeFiLlama, Hacker News, Reddit, arXiv) ne nécessitent pas de clé API.

Exemple de structure pour un script :

```bash
#!/bin/bash
# hackernews.sh — Top stories filtrées par mots-clés
KEYWORDS="AI|agents|LLM"
curl -s "https://hacker-news.firebaseio.com/v0/topstories.json" | \
  jq '.[0:10]' | \
  # ... filtrer et formater les résultats
```

#### Étape 8 : Créer 2-3 skills custom

Commencer avec un skill de contexte cross-projet et un skill de rédaction pour ton domaine. Chaque skill est un fichier Markdown dans le dossier skills de Hermes.

#### Étape 9 : Mettre en place ALIVE avec 3-5 walnuts

Créer la structure de dossiers :

```bash
mkdir -p ~/world/.alive
mkdir -p ~/world/02_Life/ma-marque/_core
mkdir -p ~/world/04_Ventures/projet-alpha/_core
mkdir -p ~/world/05_Experiments/mon-agent/_core
```

Écrire les fichiers `key.md` et `now.md` pour chaque projet. Câbler les crons pour lire/écrire les walnuts via `update-walnut.sh`.

#### Étape 10 : Lancer la boucle de feedback sur le style dès le jour 1

Créer `voice-corrections.md`. Chaque fois que tu modifies un brouillon, loguer ce que tu as changé et pourquoi. Câbler le cron de rédaction pour lire les corrections avant d'écrire.

### Ce dont tu as besoin (résumé)

| Nécessaire | Pas nécessaire |
|-----------|---------------|
| Mac Mini, vieux laptop, ou toute machine allumée 24/7 (Linux marche aussi) | Expérience en programmation au-delà du scripting shell basique |
| 21$/mois pour Z.AI (ou n'importe quel fournisseur compatible OpenAI) | La permission de qui que ce soit |
| Un compte Telegram | Un serveur cloud |
| De la patience avec le contenu généré par l'IA (ce sera mauvais au début — c'est normal) | Un GPU |

---

## 12. La philosophie

Ce n'est pas une question de construire un agent IA parfait.

Le modèle produit du texte générique. La recherche hallucine parfois des URLs. Les crons plantent. La compression casse silencieusement. Le modèle ne peut pas écrire comme un humain et ne le pourra probablement jamais.

Mais il tourne 24h/24. Pendant que tu dors, il scanne les papiers arXiv, surveille les stablecoins, vérifie Reddit et Hacker News, suit la TVL des concurrents, et rédige des brouillons de posts que tu édites le matin.

### L'agent est persistant. Et persistance × temps = contexte composé.

Après des semaines de fonctionnement :

- Les fichiers de mémoire ont capturé des tendances
- Les logs des walnuts ont un historique
- Les corrections de style se sont accumulées
- Chaque nouvelle session démarre d'une base plus riche que la précédente
- La recherche est plus ciblée parce qu'elle lit les priorités avant de chercher
- Les brouillons sont légèrement meilleurs parce qu'ils lisent les corrections avant d'écrire
- Les priorités sont plus affûtées parce que le briefing matinal lit ce qui s'est réellement passé la veille

### Le principe fondamental

> L'IA est le moteur. Le contexte est le carburant. Et le carburant se compose.

Rien de tout ça n'est magique. La valeur n'est pas dans le modèle — c'est dans le contexte structuré qui s'accumule autour de lui.
