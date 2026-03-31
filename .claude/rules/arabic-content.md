# Règles contenu arabe

- `arabic_vocalized` DOIT contenir des harakats. `arabic` est le même texte SANS diacritiques.
- Translittération doit correspondre aux harakats (pas à la forme nue)
- Conjugaisons : toujours 8 pronoms (ana, anta, anti, huwa, hiya, nahnu, antum, hum)
- IDs : format `{type}-{verbe}-{tense}-{pronom}` (ex: `conj-kataba-present-ana`)
- Après ajout de contenu, lancer `@arabic-content-validator`