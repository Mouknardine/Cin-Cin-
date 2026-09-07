# Charger la vraie programmation dans le Studio

Ce dossier contient **le contenu réel du cinéma**, prêt à être versé dans
Sanity en une seule commande : les cinq films du programme, les tarifs,
l'adresse et les téléphones, les deux étapes de la frise, les deux
informations en cours, et les textes des sept pages du site.

Rien de tout cela n'est affiché depuis le code : une fois chargé, tout
se modifie normalement dans le Studio.

## 1. Déposer les affiches

Glissez les cinq affiches dans le dossier `affiches/`, avec **exactement**
ces noms de fichiers :

| Fichier attendu                        | Film                            |
| -------------------------------------- | ------------------------------- |
| `le-dernier-pour-la-route.jpg`         | Le Dernier pour la route        |
| `de-la-comedie-francaise.jpg`          | De la Comédie Française         |
| `les-matins-merveilleux.jpg`           | Les Matins merveilleux          |
| `ah-que-le-bonheur-est-proche.jpg`     | Ah que le bonheur est proche !  |

Prenez à chaque fois **le plus grand fichier** dont vous disposez : le site
se charge lui-même de les ramener toutes à la même taille, mais il ne peut
pas inventer des pixels qui manquent.

`Drowak` n'a pas d'affiche pour l'instant : le film sera chargé sans, et le
site affichera une affiche typographique fabriquée à partir de son titre,
jusqu'à ce qu'on dépose la vraie dans le Studio.

## 2. Lancer l'import

Depuis ce dossier :

```sh
cd sanity/import
npx sanity dataset import programme.ndjson production --replace
```

Sanity demandera de se connecter la première fois (`npx sanity login`).

- `--replace` remplace les fiches portant le même identifiant : relancer la
  commande deux fois ne crée jamais de doublon.
- Les affiches sont téléversées automatiquement avec les films.

## 3. Ce qu'il reste à faire à la main

- **Les séances.** Le programme ne donnait aucun horaire (le cinéma était
  en fermeture estivale jusqu'au 8 septembre). Elles se saisissent dans le
  Studio, depuis la fiche de chaque film, rubrique « Séances de ce film ».
  Tant qu'il n'y en a pas, la page Agenda affiche son message d'attente.
- **L'affiche de Drowak**, quand elle sera disponible.
- **Les citations de presse.** Les articles sont connus (La Liberté,
  Cineuropa, RTS, Le Temps) mais une citation ne s'invente pas : recopiez
  la phrase que vous voulez mettre en avant dans « Critiques presse », puis
  choisissez-la depuis la fiche du film.
- **Les réseaux sociaux**, s'il y en a, dans « Réglages du cinéma ».
