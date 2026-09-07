# Gérer le contenu du site — le Studio Sanity

> **État actuel** (31 août 2026)
> Projet Sanity **`vle63mzm`**, dataset `production`, organisation `oj78FguHq`.
> Studio en ligne : <https://cincin-zinema.sanity.studio>
> Le site est branché dessus ([assets/js/data.js](assets/js/data.js)).
>
> *Historique : le projet d'origine `g0k3smf3` (Studio `zinema.sanity.studio`)
> appartient à un autre compte. Son contenu a été recopié vers `vle63mzm` ;
> il n'est plus lu par le site.*

## En bref

**Le Studio** : <https://cincin-zinema.sanity.studio>
**Le site** : <https://mouknardine.github.io/Cin-Cin-/>

### Ajouter un film — 1 minute
1. **Films → À l'affiche → +**
2. Titre, puis on dépose l'**affiche** juste en dessous
3. Réalisation, durée, année, pays, version, synopsis
4. **Publish**

C'est en ligne. Aucun champ technique à remplir : l'adresse de la page
se fabrique toute seule.

### Les horaires d'un film — tout depuis sa fiche
Sur la fiche du film, un bloc **« Séances de ce film »** rassemble tout :

- la **liste de ses séances à venir** (date, heure, salle) ;
- pour chacune, un menu **Places disponibles / Complet / Annulée** —
  le changement est en ligne immédiatement, sans clic « Publish » ;
- une **corbeille** pour en supprimer une ;
- un bouton **Ajouter des séances** pour en créer plusieurs d'un coup :

1. Cliquer sur **Ajouter des séances**
2. Ajouter autant d'horaires que le film en a dans la semaine —
   jour + heure + salle (ex. mercredi 19:00 Salle 1, samedi 21:00 Salle 2,
   dimanche 11:00 Salle 1)
3. Choisir à partir de quand, et pendant combien de semaines
4. **Créer**

Toutes les séances sont créées **et publiées** d'un coup, et l'agenda du
site se remplit aussitôt. Pas besoin de créer une fiche par horaire : un
seul passage suffit pour tout le mois. Les doublons et les chevauchements
de salle sont écartés automatiquement, avec un bilan à la fin.

Le même assistant existe pour tous les films à la fois dans l'onglet
**Planification**, en haut du Studio, qui permet aussi de **dupliquer une
semaine entière** vers la suivante.

Pour une séance isolée (une soirée exceptionnelle) : **Agenda → Séances à
venir → +**, puis quatre champs — le film, la date, l'heure, la salle. Le
titre, l'affiche, la durée, la version et le prix viennent du film.

### Modifier un texte de page
**Textes des pages → le nom de la page.**

### Charger d'un coup la programmation
Depuis l'onglet **Actions** du dépôt, workflow **« Mettre Sanity à
jour »** : il lit le Studio (`voir`), dit ce qui changerait
(`simulation`), ou verse le contenu réel du cinéma — films du programme
avec leurs affiches, tarifs, coordonnées, frise, textes des pages — en
retirant de l'affiche les films qui n'y sont plus (`appliquer`).
Rien à installer.

Voir [sanity/import/LISEZ-MOI.md](sanity/import/LISEZ-MOI.md). Utile pour
repartir d'une base propre ; au quotidien, tout se saisit dans le Studio.

## Deux règles qui gouvernent tout

**1. Ce qui est publié est ce qui s'affiche. Rien d'autre.**
Le site ne contient plus aucun contenu d'exemple. Une rubrique vide dans le
Studio donne une rubrique vide sur le site, avec un message clair
(« Aucune séance n'est programmée pour l'instant »). Il n'y a plus de faux
films, de fausses annonces ni de fausse adresse qui apparaîtraient par-dessus
le vrai contenu. Autrement dit : **si vous ne le voyez pas dans le Studio,
personne ne le voit sur le site — et inversement.**

**2. Une image = un seul endroit.**
Chaque image vient de Sanity et de nulle part ailleurs. Il n'existe plus
d'image de secours cachée dans le code du site. Remplacer une affiche dans le
Studio la remplace partout, tout de suite : accueil, page Films, fiche du
film, agenda. On ne peut plus se retrouver avec l'ancienne image d'un côté et
la nouvelle de l'autre.

Chaque image demande aussi **une description en une phrase** (obligatoire).
Elle sert aux personnes malvoyantes, à Google, s'affiche si l'image ne charge
pas — et permet de savoir d'un coup d'œil quelle image on est en train de
remplacer.

## Publier

Le contenu est lu **directement par le navigateur de chaque visiteur**, à
chaque affichage de page. Un clic sur **Publish** dans le Studio et c'est en
ligne : **il n'y a rien d'autre à faire**, ni reconstruire, ni redéployer, ni
prévenir qui que ce soit. Il suffit de recharger la page du site.

Tant qu'un document est en brouillon (bandeau orange dans le Studio), il n'est
visible de personne sur le site.

L'onglet **Planification** est la seule exception, dans le bon sens : ce qu'on
y crée est publié directement, sans passer par un brouillon.

## Le menu du Studio

Neuf entrées, pas une de plus. Chacune porte le nom de la page du site
où son contenu apparaît, et **rien n'existe à deux endroits**.

```
Films                 les fiches de film — et, dans chaque fiche, ses horaires
Agenda                Séances à venir · Séances passées
Événement             cycles, brunchs, séances spéciales
Histoire              les étapes de la frise
Membership            formules et paiement
Citations de presse   les citations affichées sur les fiches de film
─────
Textes des pages      Accueil · Films · Agenda · Événement · Histoire ·
                      Membership · Contact
Réglages du cinéma    adresse, horaires, téléphones, e-mails, tarifs,
                      salles, logo, réseaux sociaux
Billets vendus        les commandes de la billetterie en ligne
```

**Il n'y a pas de rubrique « horaires ».** Les séances d'un film se
règlent dans la fiche de ce film — c'est là qu'on se pose la question.
« Agenda » sert seulement à retrouver une séance quand on ne se souvient
plus de quel film il s'agit.

**Il n'y a pas non plus de rubrique par statut** (à l'affiche, première,
prochainement, cycles). La liste « Films » les montre tous, et chaque
ligne affiche déjà l'affiche, le titre, l'état du film et sa réalisation.
Pour déplacer un film d'un onglet du site à l'autre, on ouvre sa fiche et
on change « Où en est ce film ? ».

## Modifier une page du site

Dans **Textes des pages**, chaque page du site a sa fiche, rangée dans
l'ordre exact du menu du site : Accueil · Films · Agenda · Événements ·
Histoire · Abonnements · Infos pratiques. Pour modifier la page Agenda,
on clique donc simplement sur « Agenda ».

Chaque fiche contient quatre choses :

| Champ | Où ça se voit |
|---|---|
| **Titre de la page** | Dans l'onglet du navigateur, dans les signets, et comme titre bleu cliquable dans les résultats Google. Il ne s'affiche pas sur la page elle-même — les pages du site s'ouvrent directement sur leur contenu, sans bandeau de titre. |
| **Paragraphe d'introduction** | En haut de la page, au-dessus du contenu. Laissé vide, il n'y a simplement pas de paragraphe. |
| **Message quand la page n'a rien à afficher** | Ce que lit un visiteur quand il n'y a pas encore de séance, de film ou d'événement. Le site n'invente jamais de contenu pour combler un vide : c'est cette phrase qui s'affiche. |
| **Description pour Google** | Le texte gris sous le titre dans les résultats de recherche. |

Le **contenu** d'une page (les films, les séances, les événements) ne se
règle pas ici : il vient des rubriques du haut du menu. Une fiche de page
ne sert qu'à ce qui entoure ce contenu.

Le contenu de ces pages, lui, vit dans les rubriques du haut du menu :
les films dans **Films**, les séances dans la fiche de leur film, les
étapes de la frise dans **Histoire**, les formules dans **Membership**,
et l'adresse comme les horaires dans **Réglages du cinéma**.

## Ce qui est lié à quoi (pour ne rien saisir deux fois)

- **Une séance** ne demande que quatre choses : le film, la date, l'heure, la
  salle. Le titre, l'affiche, la durée, la version, le prix et le lien de
  paiement sont repris de la fiche du film.
- **Les tarifs** sont écrits une seule fois dans « Réglages du cinéma →
  Tarifs & salles ». Ils s'affichent sur la page Abonnements, sur les boutons
  d'achat, et **ce sont eux que la caisse en ligne facture réellement**. Un
  film ou une séance peut imposer un prix différent (ciné-goûter, soirée
  spéciale) : il prend alors le pas.
- **Le nombre de places par salle** sert à ne jamais vendre plus de billets
  qu'il n'y a de sièges. Les *noms* des salles sont fixes (« Salle 1 »,
  « Salle 2 ») parce qu'ils servent de clé partout dans le site ; seul le
  nombre de places se modifie.
- **Un événement** peut pointer vers des films : leurs affiches apparaissent
  alors sur l'événement sans rien recopier.
- **Une critique** rattachée à un film s'affiche sur sa fiche.

## Ce qui se décide tout seul (rien à régler)

- **Ce qui remonte sur l'accueil** : les films à l'affiche d'abord, puis les
  avant-premières, les cycles et les films annoncés ; à égalité, celui dont la
  prochaine séance est la plus proche. Plus aucune case « mettre en avant ».
- **La taille des affiches** dans les grilles : le site s'en charge.
- **L'archivage** des séances, des films terminés et des événements passés :
  par les dates et le statut.
- **L'affiche d'un film qui n'en a pas encore** : le site en dessine une,
  typographique, à partir du titre. Elle disparaît dès qu'une vraie affiche
  est déposée.

## Les garde-fous

Le Studio refuse de publier une fiche incomplète et explique pourquoi :

- un film sans **affiche** ou sans **durée** (la durée sert à repérer deux
  films qui se chevaucheraient dans la même salle) ;
- une image sans **description** ;
- un événement dont le dernier jour est avant le premier ;
- un tarif réduit plus cher que le plein tarif ;
- une salle sans nombre de places.

Et il **avertit** (sans bloquer) si une séance chevauche une autre dans la
même salle — durée du film plus 15 minutes de pause comprises.

## L'onglet « Planification »

En haut du Studio, à côté de « Contenu ». Il sert à programmer vite :

- **Programmer un film** : choisir un film, ses créneaux habituels (ex. mercredi
  19 h Salle 1 + samedi 21 h Salle 2) et un nombre de semaines → toutes les
  séances sont créées et publiées d'un coup.
- **Dupliquer la semaine** : recopie toutes les séances de la semaine affichée
  vers la suivante, en un clic.
- **Supprimer une séance** : menu ⋮ sur la séance.
- **Conflits de salle** : les chevauchements existants apparaissent en rouge,
  l'outil refuse d'en créer de nouveaux, et les doublons sont ignorés.

## Travailler sur le Studio (côté technique)

```
npm install
npm run studio:dev      # Studio local sur http://localhost:3333
npm run studio:deploy   # Met en ligne https://cincin-zinema.sanity.studio
npm run typecheck       # Vérifie les schémas
```

Le Studio lit `.env.local` (copier `.env.local.example`). Le site, lui, n'a
besoin de rien : son Project ID est écrit dans
[assets/js/data.js](assets/js/data.js) — ce n'est pas une information secrète,
elle est visible de tous les visiteurs comme sur n'importe quel site.

**CORS** — le contenu étant récupéré par le navigateur du visiteur, chaque
adresse depuis laquelle le site est servi doit être autorisée dans
Sanity Manage → API → CORS origins. Sont déjà autorisées :
`http://localhost:3000`, `:3333`, `:5500`, `:8000`,
`https://mouknardine.github.io` et l'URL du Studio. **Il faudra y ajouter
l'adresse définitive du site** (ex. `https://www.zinema.ch`) le jour de la
mise en ligne, sinon le site affichera partout le message
« Le contenu du site n'a pas pu être chargé ».

## Mettre le site en ligne

Aucun build : il suffit d'envoyer `index.html`, `films/`, `agenda/`,
`evenements/`, `histoire/`, `membership/`, `contact/`, `film/`, `billet/`,
`api/` et `assets/` sur l'hébergement (pas `sanity/`, qui ne concerne que
l'édition).

- **Infomaniak** : par FTP, dans le répertoire du site.
- **GitHub Pages** : le workflow `.github/workflows/deploy-pages.yml` publie
  automatiquement à chaque envoi sur la branche.

Cet envoi n'est à refaire qu'en cas de changement de **code ou de design** —
**jamais** pour une mise à jour de contenu.
