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

### Ajouter des séances — 2 minutes pour plusieurs semaines
1. Onglet **Planification**, en haut du Studio (à côté de « Contenu »)
2. **Programmer un film** → choisir le film, ses créneaux habituels
   (ex. mercredi 19:00 Salle 1, samedi 21:00 Salle 2) et le nombre de
   semaines
3. Toutes les séances sont créées **et publiées** d'un coup

Pour une séance isolée : **Séances → Les 7 prochains jours → +**, puis
quatre champs seulement — le film, la date, l'heure, la salle. Le titre,
l'affiche, la durée, la version et le prix viennent du film.

### Modifier une page
**Pages du site → *le nom de la page***. Voir « Modifier une page du
site » plus bas.

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

## Ce que contient le Studio

Le menu de gauche suit l'ordre du travail réel, pas l'ordre technique :

| Rubrique | À quoi ça sert |
|---|---|
| **Les 7 prochains jours** | Les séances de la semaine, pour vérifier le programme d'un coup d'œil. |
| **Toutes les séances à venir** | La liste complète, de la plus proche à la plus lointaine. |
| **Séances passées** | L'archive. Elle se remplit toute seule : une séance dont la date est passée quitte le site et atterrit ici. Rien à supprimer. |
| **Films** | Rangés par état : à l'affiche · avant-premières & prochainement · cycles & ciné-club · terminés. Un film passé sur « Terminé » disparaît des pages publiques mais reste consultable. |
| **Événements** | Cycles, brunchs, ciné-club, séances spéciales. Séparés en « en cours & à venir » et « terminés » — là aussi, automatiquement, par les dates. |
| **Critiques presse** | Les citations de journaux, à rattacher à un film. |
| **Pages du site** | Une fiche par page, dans l'ordre de la navigation du site : Accueil, Films, Agenda, Événements, Histoire, Abonnements, Infos pratiques. |
| **Réglages du cinéma** | Adresse, téléphones, e-mails, horaires, tarifs, places par salle, réseaux sociaux, logo. |
| **Billets vendus** | Les commandes de la billetterie en ligne, créées automatiquement par le serveur. |

## Modifier une page du site

Dans **Pages du site**, chaque page du site a sa fiche, rangée dans
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

Deux pages ont, en plus de leurs textes, un contenu qui leur est propre —
on le trouve juste à côté de leur fiche :

- **Histoire** → « Les étapes de la frise » ;
- **Abonnements** → « Formules & paiement ».

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
