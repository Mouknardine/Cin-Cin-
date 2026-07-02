# Brancher Sanity (gestion du contenu)

Le site est composé de **simples fichiers HTML/CSS/JS** (`index.html`,
`films/`, `agenda/`, `annonces/`, `histoire/`, `infos-pratiques/`, `film/`,
`assets/`) — pas de build, pas de framework, hébergeables tels quels
n'importe où, y compris un hébergement mutualisé sans serveur comme
Infomaniak. Le contenu Sanity est lu **directement par le navigateur de
chaque visiteur**, à chaque affichage — une publication dans le Studio
apparaît donc en ligne immédiatement, **sans jamais reconstruire ni
redéployer le site**. Tant qu'aucun projet Sanity n'est configuré (ou en
cas de souci réseau/CORS), le site affiche un contenu d'exemple à la
place — jamais de page vide.

Le Studio (l'interface d'édition, dans le dossier `sanity/`) est un outil
séparé, à part le site : c'est la seule partie du projet qui utilise encore
Node/npm, puisque Sanity Studio en a besoin pour fonctionner.

## 1. Créer le projet Sanity (une seule fois)

1. Créer un compte gratuit sur <https://www.sanity.io/manage>.
2. Créer un projet (nom libre, ex. « Zinéma »), dataset **production**.
3. Noter le **Project ID** (visible dans l'URL et la page du projet).

## 2. Brancher le site sur ce projet

Ouvrir `assets/js/data.js` et renseigner les deux constantes tout en haut
du fichier :

```js
var SANITY_PROJECT_ID = "xxxxxxxx";
var SANITY_DATASET = "production";
```

Ce ne sont pas des informations secrètes (elles sont visibles de tous les
visiteurs, comme sur n'importe quel site), donc pas besoin de variable
d'environnement ni de build : une fois ces deux lignes modifiées et le
fichier envoyé sur l'hébergement, le site lit directement le contenu
Sanity.

## 3. Configuration du Studio (uniquement pour l'interface d'édition)

Copier `.env.local.example` vers `.env.local` et remplir le Project ID :

```
SANITY_STUDIO_PROJECT_ID=xxxxxxxx
```

Puis :

```
npm run studio:dev      # Studio local sur http://localhost:3333
npm run studio:deploy   # Héberge le Studio sur https://<nom>.sanity.studio
```

Au premier lancement, autoriser l'origine dans Sanity Manage →
**API → CORS origins** (ajouter `http://localhost:3333` et l'URL du Studio
déployé).

## 4. Pré-remplir avec le contenu d'exemple (facultatif)

Pour partir des films/séances/annonces d'exemple plutôt que d'une base
vide : créer un token **Editor** (Sanity Manage → API → Tokens), le mettre
dans `SANITY_API_WRITE_TOKEN` de `.env.local`, puis :

```
npm run seed
```

## 5. Ce qui se gère depuis le Studio

| Rubrique | Contenu modifiable |
|---|---|
| **Films** | titre, réalisateur·rice, année, pays, durée, langue/sous-titres, âge, genres, statut (à l'affiche, avant-première, prochainement, cycle, passé), synopsis, **affiche** (image), photos, bande-annonce, critique liée, prix, lien SumUp, case « Mettre en avant sur l'accueil » (fait passer le film en tête du canevas d'accueil) |
| **Séances** | date, heure, salle, note de version, statut (disponible / complet / annulé), prix, lien SumUp, film lié |
| **Annonces** | titre, catégorie, date, image, résumé, texte, lien, épinglée |
| **Critiques** | citation, auteur, média, lien |
| **Histoire** | étapes de la frise : année, titre, texte, image, ordre |
| **Réglages du site** | accroche, description SEO, **intro de la page Histoire**, adresse, téléphone, e-mail, horaires, accès, lien carte, réseaux sociaux |

Tout champ laissé vide retombe sur un texte de secours raisonnable ; les
films sans affiche reçoivent automatiquement une affiche typographique
générée.

## 6. Autoriser le site à lire Sanity depuis le navigateur (CORS)

Le contenu étant récupéré directement par le navigateur du visiteur, il
faut indiquer à Sanity quels sites ont le droit de lui parler. Sans cette
étape, le site retombe silencieusement sur le contenu d'exemple.

Aller dans **Sanity Manage → API → CORS origins → Add CORS origin** et
ajouter, sans case « Allow credentials » à cocher :

- l'adresse définitive du site (ex. `https://www.zinema.ch`, ou l'URL
  GitHub Pages `https://mouknardine.github.io`) ;
- `http://localhost:8000` (ou le port utilisé) pour tester le site en local.

## 7. Mettre le site en ligne

Aucun build n'est nécessaire : il suffit d'envoyer les fichiers du site
(`index.html`, `films/`, `agenda/`, `annonces/`, `histoire/`,
`infos-pratiques/`, `film/`, `assets/` — pas `sanity/` ni les autres
fichiers du dépôt, qui ne concernent que l'édition de contenu) sur
l'hébergement :

- **Infomaniak (hébergement mutualisé)** : envoyer ces dossiers/fichiers
  par FTP dans le répertoire du site (souvent nommé `web` ou
  correspondant au nom de domaine).
- **GitHub Pages** : le workflow `.github/workflows/deploy-pages.yml`
  publie automatiquement ces mêmes fichiers à chaque envoi sur la branche.

Cet envoi n'est à refaire qu'en cas de changement de **code ou de
design** — **jamais** pour une simple mise à jour de contenu, qui
apparaît seule dès qu'elle est publiée dans le Studio.
