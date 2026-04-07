# Guide pas à pas — X Gender Analyzer
## Pour débutants complets en Python

---

## ÉTAPE 0 : Installer Python

### Sur Windows

1. Va sur **https://www.python.org/downloads/**
2. Clique sur le gros bouton jaune **"Download Python 3.x.x"**
3. Lance le fichier téléchargé (`.exe`)
4. **⚠️ TRÈS IMPORTANT** : Coche la case **"Add Python to PATH"** en bas de la fenêtre d'installation
5. Clique sur **"Install Now"**
6. Attends que ça finisse, puis ferme

### Sur Mac

1. Va sur **https://www.python.org/downloads/**
2. Télécharge et installe le `.pkg`
3. Ou bien, si tu as Homebrew : ouvre le Terminal et tape `brew install python`

### Vérifier que ça marche

Ouvre un **terminal** :
- **Windows** : tape `cmd` dans la barre de recherche Windows, clique sur "Invite de commandes"
- **Mac** : ouvre l'app "Terminal" (dans Applications > Utilitaires)

Tape cette commande et appuie sur Entrée :

```
python --version
```

Tu dois voir quelque chose comme `Python 3.12.x`. Si ça affiche une erreur, essaie :

```
python3 --version
```

Si ça marche avec `python3`, utilise `python3` et `pip3` partout à la place de `python` et `pip` dans ce guide.

---

## ÉTAPE 1 : Télécharger et dézipper le projet

1. Télécharge le fichier `x-gender-analyzer.zip` (celui que je t'ai envoyé)
2. Dézippe-le quelque part de simple, par exemple :
   - Windows : `C:\Users\TonNom\Documents\x-gender-analyzer\`
   - Mac : `/Users/TonNom/Documents/x-gender-analyzer/`

---

## ÉTAPE 2 : Ouvrir un terminal DANS le dossier du projet

### Windows

1. Ouvre l'Explorateur de fichiers
2. Navigue jusqu'au dossier `x-gender-analyzer`
3. Clique dans la barre d'adresse en haut (là où il y a le chemin du dossier)
4. Tape `cmd` et appuie sur Entrée → un terminal s'ouvre directement dans le bon dossier

**OU BIEN** : ouvre cmd normalement et tape :

```
cd C:\Users\TonNom\Documents\x-gender-analyzer
```

### Mac

1. Ouvre le Terminal
2. Tape :

```
cd /Users/TonNom/Documents/x-gender-analyzer
```

(Astuce Mac : tape `cd ` puis glisse-dépose le dossier dans le Terminal, ça écrit le chemin tout seul)

---

## ÉTAPE 3 : Installer les dépendances Python

Dans le terminal (qui est ouvert dans le bon dossier), tape :

```
pip install -r requirements.txt
```

Si ça dit "pip n'est pas reconnu", essaie :

```
pip3 install -r requirements.txt
```

Si ça dit "permission denied" (Mac/Linux) :

```
pip install -r requirements.txt --user
```

Tu vas voir plein de texte défiler, c'est normal. Attends que ça finisse. Tu dois voir "Successfully installed..." à la fin.

**Optionnel** — Si tu veux l'analyse par photo de profil (plus lent, nécessite plus de RAM) :

```
pip install -r requirements-deepface.txt
```

---

## ÉTAPE 4 : Configurer tes identifiants X (Twitter)

### 4a. Copier le fichier de config

Dans le terminal :

**Windows :**
```
copy config.example.toml config.toml
```

**Mac / Linux :**
```
cp config.example.toml config.toml
```

### 4b. Ouvrir config.toml pour l'éditer

Tu peux l'ouvrir avec n'importe quel éditeur de texte :
- **Windows** : clic droit sur `config.toml` → "Ouvrir avec" → Bloc-notes (ou Notepad)
- **Mac** : clic droit → "Ouvrir avec" → TextEdit

Ou bien si tu as VS Code installé :
```
code config.toml
```

### 4c. Remplir tes identifiants

Trouve cette section dans le fichier :

```toml
[[scraper.accounts]]
username = "votre_username_1"
password = "votre_mot_de_passe_1"
email = "votre@email.com"
email_password = "tYz9##J3etKzoMsa"
```

Remplace par tes vrais identifiants X. Exemple :

```toml
[[scraper.accounts]]
username = "jean_dupont42"
password = "MonMotDePasse123!"
email = "jean.dupont@gmail.com"
email_password = "MotDePasseGmail456"
```

**Explications :**
- `username` : ton nom d'utilisateur X (celui après le @)
- `password` : ton mot de passe X
- `email` : l'email associé à ton compte X
- `email_password` : le mot de passe de cette boîte email (twscrape en a besoin pour récupérer les codes de vérification que X envoie par email)

**⚠️ IMPORTANT :** twscrape se connecte comme si c'était toi sur X. Utilise de préférence un **compte secondaire** (un "alt") pour ne pas risquer ton compte principal.

### 4d. Configurer le compte cible

Trouve cette ligne :

```toml
target_username = "elonmusk"
```

Remplace `elonmusk` par le compte dont tu veux analyser les followers. Par exemple :

```toml
target_username = "Frfrfrfrfrfrfrfrfr"
```

### 4e. Ajuster les paramètres (optionnel)

```toml
max_followers = 1000          # Mets 500 pour un premier test, c'est plus rapide
tweets_per_user = 20          # Nombre de tweets à analyser par personne (0 = désactivé)
use_deepface = false          # Mets "true" si tu veux l'analyse par photo (plus lent)
language = "fr"               # Garde "fr" pour un compte francophone
```

### 4f. Sauvegarder

Sauvegarde le fichier (Ctrl+S sur Windows, Cmd+S sur Mac) et ferme l'éditeur.

---

## ÉTAPE 5 : Lancer l'analyse

Retourne dans ton terminal (toujours dans le dossier du projet) et tape :

### Premier test (petit volume, mode verbose pour tout voir)

```
python main.py --max=100 --verbose
```

Ça va :
1. Se connecter à X avec ton compte
2. Trouver le compte cible et récupérer 100 followers
3. Récupérer les tweets récents de chaque follower
4. Analyser chaque profil avec les 5 méthodes
5. Afficher le résultat dans le terminal
6. Exporter un CSV et un JSON dans le dossier `results/`

### Si tout marche, lance la version complète

```
python main.py
```

(Ça utilisera le `max_followers` défini dans config.toml)

### Autres commandes utiles

Analyser un autre compte sans modifier le fichier config :

```
python main.py --target=autre_compte --max=500
```

Exporter uniquement en CSV :

```
python main.py --format=csv
```

Reprendre une analyse interrompue (si tu as coupé en cours de route) :

```
python main.py --resume
```

---

## ÉTAPE 6 : Lire les résultats

### Dans le terminal

Tu verras un résumé comme ça :

```
═══════════════════════════════════════════════
  X GENDER ANALYZER — @cible (500 followers analysés)
═══════════════════════════════════════════════

  👨 Hommes    :   342  ( 68.4%)  ██████████████████░░░░░░░░░
  👩 Femmes    :   112  ( 22.4%)  ██████░░░░░░░░░░░░░░░░░░░░
  ❓ Inconnu   :    46  (  9.2%)  ██░░░░░░░░░░░░░░░░░░░░░░░░
```

### Fichiers exportés

Regarde dans le dossier `results/` (il se crée automatiquement). Tu y trouveras :

**Fichier CSV** (ouvrable avec Excel, Google Sheets, LibreOffice Calc) :
- `gender_analysis_cible_20260323_143022.csv`
- Colonnes : username, display_name, bio, genre inféré, confiance, signaux détectés

**Fichier JSON** (pour les développeurs ou pour un traitement ultérieur) :
- `gender_analysis_cible_20260323_143022.json`
- Contient aussi le résumé global

Pour ouvrir le CSV avec Excel :
1. Double-clique sur le fichier `.csv`
2. S'il ne s'affiche pas bien (tout dans une colonne), ouvre Excel d'abord → Fichier → Ouvrir → sélectionne le CSV → choisis "virgule" comme séparateur

---

## RÉSOLUTION DE PROBLÈMES COURANTS

### "python n'est pas reconnu comme commande"

→ Python n'est pas dans le PATH. Réinstalle Python en cochant "Add to PATH", ou utilise le chemin complet :

```
C:\Users\TonNom\AppData\Local\Programs\Python\Python312\python.exe main.py
```

### "ModuleNotFoundError: No module named 'twscrape'"

→ Les dépendances ne sont pas installées. Relance :

```
pip install -r requirements.txt
```

### "Login failed" ou erreur d'authentification twscrape

→ Causes possibles :
- Mauvais identifiants dans config.toml (vérifie username/password)
- X demande une vérification par email : twscrape essaie de lire le code automatiquement, il faut que `email_password` soit correct
- Compte bloqué/suspendu par X : utilise un autre compte
- Authentification à 2 facteurs (2FA) activée : **désactive la 2FA** sur le compte utilisé pour le scraping, ou utilise un compte sans 2FA

### "Rate limit exceeded" ou l'analyse est très lente

→ X limite le nombre de requêtes. Solutions :
- Ajouter un 2e ou 3e compte dans config.toml (twscrape les utilise en rotation)
- Réduire `max_followers` pour commencer petit
- Relancer avec `--resume` : le cache conserve ce qui a déjà été récupéré

### "No such file or directory: config.toml"

→ Tu n'es pas dans le bon dossier. Vérifie avec :

```
dir     (Windows)
ls      (Mac/Linux)
```

Tu dois voir les fichiers `main.py`, `config.toml`, etc. Si non, utilise `cd` pour naviguer vers le bon dossier.

### Le CSV s'affiche mal dans Excel

→ Ouvre Excel d'abord (fichier vide), puis : Données → À partir d'un fichier texte/CSV → Sélectionne le fichier → Vérifie que le séparateur est "virgule" et l'encodage "UTF-8".

---

## GLOSSAIRE

| Terme | Signification |
|-------|---------------|
| **terminal** | La fenêtre noire où tu tapes des commandes (cmd sur Windows, Terminal sur Mac) |
| **pip** | L'installateur de bibliothèques Python (comme un App Store pour Python) |
| **dépendances** | Les bibliothèques dont le projet a besoin pour fonctionner |
| **PATH** | La liste des dossiers où ton ordinateur cherche les programmes |
| **scraping** | Récupérer automatiquement des données depuis un site web |
| **rate limit** | Limite du nombre de requêtes que X autorise par période de temps |
| **cache** | Les données déjà téléchargées, stockées localement pour ne pas les re-télécharger |
| **CSV** | Format de fichier tableur (colonnes séparées par des virgules) |
| **JSON** | Format de fichier structuré, lisible par les programmes |
| **twscrape** | La bibliothèque Python qui se connecte à X pour récupérer les données |
| **DeepFace** | Bibliothèque d'IA qui analyse les visages dans les photos |
