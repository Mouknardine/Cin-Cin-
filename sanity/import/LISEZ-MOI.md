# Mettre le Studio à l'heure du programme réel

Le site n'affiche que ce qui est publié dans Sanity. Modifier le code
ne change donc rien à ce qu'on voit : les films, les tarifs et les
textes vivent dans le Studio.

Ce dossier contient de quoi y verser **le contenu réel du cinéma** en
une seule commande.

## Comment lancer — depuis GitHub, sans rien installer

Le contenu du site vit dans Sanity, pas dans le code : pousser du code
ne change donc jamais les films affichés. Tout se pilote depuis
l'onglet **Actions** du dépôt.

### Une seule fois : donner la clé à GitHub

1. Aller sur <https://www.sanity.io/manage> → projet **`vle63mzm`**
2. **API → Tokens → Add API token** — nom : `GitHub Actions`,
   droits : **Editor**. Copier le jeton (il ne se réaffiche plus).
3. Dans GitHub : **Settings → Secrets and variables → Actions →
   New repository secret**, nom `SANITY_WRITE_TOKEN`, coller le jeton.

Ce jeton se révoque à tout moment au même endroit dans Sanity.

### Ensuite, à volonté

**Actions → Mettre Sanity à jour → Run workflow**, puis choisir :

| Mode         | Ce que ça fait                                                        |
| ------------ | --------------------------------------------------------------------- |
| `voir`       | lit et affiche ce que le Studio contient. N'écrit rien.               |
| `simulation` | dit exactement ce qui changerait. N'écrit rien.                        |
| `appliquer`  | écrit vraiment, puis réaffiche l'état obtenu.                          |

Le résultat s'affiche dans le journal de l'exécution. Le mode
`simulation` avant `appliquer` évite toute surprise.

### Ou en ligne de commande, si on a le dépôt en local

```sh
export SANITY_WRITE_TOKEN='le-jeton'
node sanity/import/etat.mjs                        # voir
node sanity/import/mettre-a-jour.mjs               # simulation
node sanity/import/mettre-a-jour.mjs --appliquer   # pour de vrai
```

## Ce qu'il fait

**Les films.** Il reconnaît ceux du programme qui sont déjà saisis —
même sous un autre titre, en capitales, ou avec une autre adresse de
page — et les corrige au lieu d'en créer un deuxième. C'est le cas de
*Drowak*, présent sous son titre allemand *Sie glauben an Engel, Herr
Drowak?* : son affiche est conservée. Les quatre autres sont créés avec
l'affiche déposée dans `affiches/`.

**Les anciens films** passent en « Terminé » : ils quittent le site et
restent consultables dans le Studio. Rien n'est supprimé.

**Les tarifs, les coordonnées, les formules et les textes des sept
pages** sont remis d'après ce que le cinéma publie : 16.- / 10.-, carte
annuelle 60.-, rue du Maupas 4, les deux téléphones, l'IBAN, les trois
salles. L'image de partage déjà déposée n'est pas touchée.

**La frise et les informations** sont remplacées par les vraies (2001 et
2005 avec leurs architectes, designers et graphistes ; les projections
privées ; la fermeture estivale). Celles qui avaient été inventées
pendant la mise au point du site sont supprimées — la frise n'a pas
d'état « Terminé ». Le script les nomme une par une avant de le faire,
et Sanity garde un historique : une suppression se rattrape depuis le
Studio.

> Si vous avez déjà saisi vous-même des étapes de frise ou des
> événements dans le Studio, dites-le avant de lancer : ce sont les
> deux seuls endroits où le script supprime.

## Les affiches

Elles sont dans `affiches/`, au nom du film :

| Fichier                              | Film                           |
| ------------------------------------ | ------------------------------ |
| `le-dernier-pour-la-route.jpg`       | Le Dernier pour la route       |
| `de-la-comedie-francaise.jpg`        | De la Comédie Française        |
| `les-matins-merveilleux.jpg`         | Les Matins merveilleux         |
| `ah-que-le-bonheur-est-proche.jpg`   | Ah que le bonheur est proche ! |

Elles font 400 × 570 px, la plus petite taille disponible : la mise en
page est juste, mais elles seront un peu douces sur un grand écran. Les
remplacer par des fichiers plus grands **sous le même nom** et relancer
la commande suffit à les rendre nettes.

*Drowak* garde l'affiche déjà déposée dans le Studio.

## Ce qui reste à saisir à la main

- **Les séances.** Le programme du cinéma ne donnait aucun horaire (la
  salle était en fermeture estivale). Elles se créent depuis la fiche de
  chaque film, rubrique « Séances de ce film ». Tant qu'il n'y en a pas,
  la page Agenda affiche son message d'attente.
- **Les liens d'articles de presse.** Ils se collent dans la fiche du
  film, champ « Article de presse ». La page du film affiche alors
  « Article de presse », cliquable.

## Les trois fichiers

- `programme.data.mjs` — les textes, rien que les textes. C'est là qu'on
  corrige un synopsis ou une durée.
- `mettre-a-jour.mjs` — le script qui corrige le Studio.
- `etat.mjs` — dit ce que le Studio contient. Ne sait que lire.
