# Mettre le Studio à l'heure du programme réel

Le site n'affiche que ce qui est publié dans Sanity. Modifier le code
ne change donc rien à ce qu'on voit : les films, les tarifs et les
textes vivent dans le Studio.

Ce dossier contient de quoi y verser **le contenu réel du cinéma** en
une seule commande.

## La commande

Depuis la racine du dépôt :

```sh
npx sanity login          # la première fois seulement
npx sanity exec sanity/import/mettre-a-jour.mjs --with-user-token
```

Le script raconte tout ce qu'il fait, ligne par ligne. Le relancer ne
crée jamais de doublon : il compare avant d'écrire.

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
salles. Le logo et l'image de partage déjà déposés ne sont pas touchés.

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
- **Les citations de presse.** Les articles sont connus (La Liberté,
  Cineuropa, RTS, Le Temps) mais une citation ne s'invente pas :
  recopiez la phrase à mettre en avant dans « Critiques presse », puis
  choisissez-la depuis la fiche du film.

## Les deux fichiers

- `programme.data.mjs` — les textes, rien que les textes. C'est là qu'on
  corrige un synopsis ou une durée.
- `mettre-a-jour.mjs` — le script qui parle à Sanity.
