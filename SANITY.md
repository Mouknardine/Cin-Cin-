# Brancher Sanity (gestion du contenu)

Le site est **statique** (fichiers HTML/CSS/JS, hébergeables n'importe où,
y compris en hébergement mutualisé sans serveur type Infomaniak). Le
contenu Sanity est lu **directement par le navigateur de chaque visiteur**,
à chaque affichage — une publication dans le Studio apparaît donc en ligne
immédiatement, **sans jamais reconstruire ni redéployer le site**. Tant
qu'aucun projet Sanity n'est configuré (ou en cas de souci réseau/CORS), le
site affiche un contenu d'exemple à la place — jamais de page vide.

Le site n'a besoin d'être reconstruit et redéployé que pour un changement
de **code ou de design** — jamais pour un changement de contenu.

## 1. Créer le projet Sanity (une seule fois)

1. Créer un compte gratuit sur <https://www.sanity.io/manage>.
2. Créer un projet (nom libre, ex. « Zinéma »), dataset **production**.
3. Noter le **Project ID** (visible dans l'URL et la page du projet).

## 2. Configuration locale

Copier `.env.local.example` vers `.env.local` et remplir le Project ID
(les deux préfixes pointent vers le même projet) :

```
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxxxxx
SANITY_STUDIO_PROJECT_ID=xxxxxxxx
```

## 3. Lancer le Studio (interface d'édition)

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

Le contenu étant désormais récupéré directement par le navigateur du
visiteur, il faut indiquer à Sanity quels sites ont le droit de lui parler.
Sans cette étape, le site retombe silencieusement sur le contenu d'exemple.

Aller dans **Sanity Manage → API → CORS origins → Add CORS origin** et
ajouter, sans case « Allow credentials » à cocher :

- l'adresse définitive du site (ex. `https://www.zinema.ch` ou l'URL
  GitHub Pages `https://mouknardine.github.io`) ;
- `http://localhost:3000` pour tester le site en local.

## 7. Brancher le déploiement (code/design uniquement)

Le build a seulement besoin de connaître le projet Sanity pour l'inclure
dans les fichiers générés (ce ne sont pas des informations secrètes,
elles sont visibles de tous les visiteurs) :

- En local : les valeurs de `.env.local` (étape 2) suffisent.
- Sur GitHub → **Settings → Secrets and variables → Actions** :
  - **Secret** `SANITY_PROJECT_ID` = le Project ID.
  - (Facultatif) **Variable** `SANITY_DATASET` si le dataset n'est pas
    `production`.

Ce build/déploiement n'est à relancer que lors d'un changement de code ou
de design (GitHub → onglet **Actions** → « Déploiement GitHub Pages » →
**Run workflow**, ou upload manuel du dossier `out/` sur Infomaniak) —
**jamais** pour une simple mise à jour de contenu, qui apparaît seule.
