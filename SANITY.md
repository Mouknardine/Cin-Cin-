# Brancher Sanity (gestion du contenu)

Le site est **statique** (GitHub Pages) : le contenu est lu depuis Sanity
**au moment du build**, puis figé dans les pages HTML. Tant qu'aucun projet
Sanity n'est configuré, le site affiche un contenu d'exemple — dès que les
variables ci-dessous sont renseignées, c'est le contenu de Sanity qui est
utilisé, sans aucune modification de design.

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

## 6. Brancher le déploiement GitHub Pages

Dans le dépôt GitHub → **Settings → Secrets and variables → Actions** :

- **Secret** `SANITY_PROJECT_ID` = le Project ID.
- (Facultatif) **Variable** `SANITY_DATASET` si le dataset n'est pas
  `production`.

Le workflow de déploiement lit ces valeurs : au prochain build, le site
est généré avec le contenu Sanity publié.

## 7. Reconstruction automatique à chaque publication

Le site étant statique, une modification dans le Studio n'apparaît en
ligne qu'après un nouveau build. Deux options :

**Manuelle** — GitHub → onglet **Actions** → « Déploiement GitHub Pages »
→ **Run workflow**.

**Automatique (recommandé)** — un webhook Sanity déclenche le build à
chaque publication :

1. GitHub → Settings (du compte) → Developer settings →
   **Fine-grained personal access token** limité à ce dépôt, permission
   **Contents : Read and write**. Copier le token.
2. Sanity Manage → **API → Webhooks → Create webhook** :
   - URL : `https://api.github.com/repos/Mouknardine/Cin-Cin-/dispatches`
   - Trigger on : Create, Update, Delete
   - HTTP method : `POST`
   - HTTP headers :
     - `Authorization` : `Bearer <le token>`
     - `Accept` : `application/vnd.github+json`
   - Payload (projection) : `{"event_type": "sanity-content-update"}`
3. Chaque publication dans le Studio relance alors le workflow
   (déclencheur `repository_dispatch`) et le site se met à jour tout seul
   en ~2 minutes.
