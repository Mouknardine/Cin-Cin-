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

### Charger d'un coup la programmation
Depuis l'onglet **Actions** du dépôt, workflow **« Mettre Sanity à
jour »** : il lit le Studio (`voir`), dit ce qui changerait
(`simulation`), ou verse le contenu réel du cinéma — films du programme
avec leurs affiches, tarifs, coordonnées, page Histoire — en retirant
de l'affiche les films qui n'y sont plus (`appliquer`).
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

Huit entrées, pas une de plus. Chacune porte le nom de la page du site
où son contenu apparaît, et **rien n'existe à deux endroits**.

```
Films                 les fiches de film — et, dans chaque fiche, ses horaires
Agenda                Séances à venir · Séances passées
Événements            cycles, brunchs, séances spéciales — et les films
                      qui sortent prochainement ou passent avec un invité
Location              les espaces à louer et l'adresse des demandes
Histoire              la phrase d'accueil et les étapes de la frise
Membership            phrase d'accueil, formules et paiement
─────
Réglages du cinéma    adresse, horaires, téléphones, e-mails, tarifs,
                      salles, réseaux sociaux
Billets vendus        les commandes de la billetterie en ligne
```

**Il n'y a pas de rubrique « horaires ».** Les séances d'un film se
règlent dans la fiche de ce film — c'est là qu'on se pose la question.
« Agenda » sert seulement à retrouver une séance quand on ne se souvient
plus de quel film il s'agit.

**La rubrique Événements montre tout ce que la page Événements du site
annonce**, en deux listes : **Événements** (ceux saisis à la main) et
**Films annoncés** (les films qui s'y affichent d'eux-mêmes — ceux qui
sortent prochainement et ceux qui passent en présence d'un invité),
rangés par date de sortie. Un clic ouvre la fiche du film ; un film se
crée dans « Films ».

**Il n'y a pas non plus de rubrique par statut** (à l'affiche, première,
prochainement, cycles). La liste « Films » les montre tous, et chaque
ligne affiche déjà l'affiche, le titre, l'état du film et sa réalisation.
Pour déplacer un film d'un onglet du site à l'autre, on ouvre sa fiche et
on change « Où en est ce film ? ».

**Le jour de sa sortie, un film « Prochainement » passe tout seul « À
l'affiche »** : dès que sa date de sortie est atteinte, le site le range
avec les films à l'affiche, le fait monter sur l'accueil et le retire de
la page Événements. Rien à changer ce jour-là. Dans la liste du Studio,
il s'affiche alors « À l'affiche — sorti le … ». Sans date de sortie,
c'est le choix fait dans la fiche qui compte.

**Le type du film** (Documentaire, Fiction, Animation…) s'écrit en
toutes lettres dans le champ « Type de film », tel qu'il doit se lire
sur le site.

## Où se modifie le texte d'une page

Le texte d'une page vit dans la rubrique qui porte son nom, avec ce
qu'il annonce : la phrase d'accueil de la page Histoire est dans
**Histoire**, celle de la page Abonnements dans **Membership**, celle
de la page Location dans **Location**. Il n'y a pas de rubrique
séparée pour les textes : chercher à deux endroits pour une page,
c'était en oublier un.

Les pages Films, Agenda et Événements n'ont pas de phrase d'accueil :
elles s'ouvrent directement sur leur contenu.

Le **titre de l'onglet du navigateur** et la **description qui apparaît
dans Google** ne se règlent pas dans le Studio. Ils sont écrits dans le
code du site, en tête de chaque page : ils ne changent qu'à de rares
occasions, et un réglage de plus dans le Studio ne servait qu'à les y
répéter. Pour les modifier, il faut passer par l'agence.

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
- **Un article de presse** est un simple lien collé dans la fiche du film :
  la page du film affiche alors une grande case « PRESSE », cliquable.

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
même salle. Une salle est prise de l'heure de début jusqu'à la minute exacte
de fin du film, et pas une minute de plus : **aucun battement n'est imposé**,
deux séances peuvent s'enchaîner directement. Le temps de nettoyage, de
publicité ou d'accueil relève du métier, pas de l'outil — c'est à vous de le
prévoir dans les horaires.

## L'onglet « Planification »

En haut du Studio, à côté de « Contenu ». C'est le tableau de bord de la
semaine : sept colonnes, du mercredi au mardi, et dans chaque colonne les deux
vagues du soir — **19 h et 21 h, Salle 1 et Salle 2**. Une case grise en
pointillés est un créneau libre.

### « 21 h » veut dire « après le film de 19 h »

**19 h et 21 h sont des noms de vagues, pas des heures fixes.** La première part
bien à 19 h. La seconde part à 21 h **au plus tôt**, et plus tard si le film de
19 h n'est pas fini — **à la minute près** :

| Film de 19 h | Fin | Séance suivante |
|---|---|---|
| 1 h 30 | 20:30 | **21:00** |
| 2 h 00 | 21:00 | **21:00** |
| 2 h 15 | 21:15 | **21:15** |
| 2 h 20 | 21:20 | **21:30** |
| 2 h 43 | 21:43 | **21:45** |

La séance suivante part au **quart d'heure qui suit** la fin du film :
21:00, 21:15, 21:30 ou 21:45 — jamais 21:43. Chaque carte de séance affiche son heure de fin (`19:00 · Titre → 21:20`),
et chaque case libre affiche l'heure à laquelle elle partira.

Concrètement :

- **Tout ce qui est créé ici part à la bonne heure** — clic sur une case libre,
  duplication, remplissage au hasard.
- **Quand un changement rallonge la soirée**, l'outil **décale tout seul** la
  séance de 21 h de cette salle et vous le dit (« *Le Grand Bleu* passe de 21:00
  à 21:30, le temps que finisse *Ceci est mon corps* »).
- **Une séance n'est jamais avancée.** Si vous avez volontairement laissé un
  battement — 21:30 derrière un film qui finit à 21:15 — il vous appartient et
  l'outil n'y touche pas.
- **Un long film n'écrase pas une séance déjà fixée** : si une séance est déjà
  calée à 21 h, le tirage au sort ne mettra pas un film de 2 h 20 à 19 h dans
  cette salle — il en choisira un qui rentre.

### Se repérer d'un coup d'œil

- **La semaine affichée est retenue** : on peut ouvrir la fiche d'un film et
  revenir, le planning reste sur la semaine qu'on préparait. Une semaine déjà
  terminée n'est jamais rouverte d'office.
- **Chaque semaine a sa couleur** (pastille à côté des dates, trait en haut de
  chaque journée) : en changeant de semaine, la couleur change.
- **Chaque film a sa couleur**, sur ses cartes, et un **compteur** au-dessus de
  la grille indique pour chaque film son nombre de séances de la semaine et sa
  salle.

### Chaque film garde sa salle

Un film reste dans la salle où il joue : celle où il est déjà programmé cette
semaine, sinon celle de la semaine d'avant. Un nouveau film va dans la salle
qui a le moins de films. Le remplissage au hasard et « Rebattre les cartes »
changent le jour et le moment de la soirée, **jamais la salle**.

Pour faire changer un film de salle : menu ⋮ d'une de ses séances →
**« Passer ce film en Salle 2 (toute la semaine) »**. Toutes ses séances de la
semaine déménagent au même jour et au même moment ; les films qui occupaient
ces places font le chemin inverse — personne n'est supprimé.

### Déplacer une séance à la souris

- **Attraper une séance et la déposer ailleurs.** Sur une **case libre**, elle
  déménage. Sur une **case occupée**, les deux films **échangent leurs
  places** — d'un seul geste, sans rien supprimer ni ressaisir.
- **Cliquer une case libre** pour y programmer un film tout de suite.
- **Remplacer le film d'une séance** sans toucher à son horaire : menu ⋮ →
  *Changer le film…*
- Un déplacement fait à la main n'est jamais refusé. Si le film déplacé est plus
  long, la séance suivante de la salle est **décalée automatiquement**. Si un
  chevauchement subsiste malgré tout, un bandeau orange l'annonce et les séances
  concernées passent en rouge — c'est vous qui décidez comment le régler.

### Programmer une semaine en quelques clics

- **Programmer un film** : choisir un film, ses créneaux habituels (ex. mercredi
  19 h Salle 1 + samedi 21 h Salle 2) et un nombre de semaines → toutes les
  séances sont créées et publiées d'un coup.
- **Dupliquer la semaine** : recopie toutes les séances de la semaine affichée
  vers la suivante, en un clic. Avec l'option **« Rebattre les cartes »**, les
  **mêmes films reviennent en même nombre mais changent de jour et de moment de
  la soirée**, chacun dans sa salle : c'est la façon la plus rapide de faire une semaine de
  plus avec les films déjà à l'affiche. Les horaires sont **recalculés**, pas
  recopiés.
- **Remplir au hasard** : cocher les films (aucun n'est coché d'avance), l'outil
  compose la semaine en donnant, dans chaque salle, **à peu près le même nombre
  de séances à chaque film**. Il propose d'abord
  une grille — le nombre de séances de chaque film s'affiche en face de son
  titre — on peut **relancer le tirage** autant de fois qu'on veut, et on ne
  valide que lorsqu'elle convient.
- **Supprimer une séance** : menu ⋮ sur la séance.

### Ce que le hasard ne fait jamais

- Un film ne passe **jamais deux fois en même temps** dans les deux salles.
- Il évite de passer **deux fois le même jour**, tant qu'il y a assez de films
  pour l'éviter.
- Il change de vague d'une séance à l'autre plutôt que de toujours tomber à
  19 h — mais il ne change **jamais** un film de salle.
- Il ne propose **jamais un horaire impossible** : chaque séance de 21 h part
  après la fin du film de 19 h de sa salle.
- **Rien de ce qui est déjà programmé n'est touché** : ni déplacé, ni recouvert.
  Le tirage se contente des cases libres. Les séances particulières — le
  **Hall-Bar** d'un soir d'événement, une avant-première à 18 h — s'affichent
  sous la grille de leur journée et ne sont jamais déplacées par le hasard.
- L'option **« Tenir compte des semaines voisines »** regarde les 4 semaines
  avant et après : un film déjà beaucoup projeté en reçoit moins, pour que les
  totaux s'égalisent **sur la durée** plutôt que semaine par semaine.

- **Conflits de salle** : les chevauchements existants apparaissent en rouge,
  les assistants refusent d'en créer de nouveaux, et les doublons sont ignorés.

### Dans quel ordre la grille se lit

Une journée se lit **vague par vague** : le tour de séances de 19 h, salle par
salle — Salle 1, Salle 2, puis le Hall-Bar —, puis le tour suivant.

Un tour ne part pas toujours à la même minute dans les deux salles : la Salle 1
peut enchaîner à 21:15, le temps que finisse un long film de 19 h, quand la
Salle 2 part à 21:00. Les deux séances appartiennent au même tour et se lisent
donc dans l'ordre des salles, pas à la minute près. Au-delà d'une demi-heure
d'écart, ce n'est plus le même tour — une matinée ne se lit pas avec la
soirée — et l'heure reprend la main.

C'est l'ordre du **programme papier**, et c'est le même partout : la grille de
la semaine, la liste des séances sur la fiche d'un film, et l'agenda du site.

## Travailler sur le Studio (côté technique)

```
npm install
npm run studio:dev      # Studio local sur http://localhost:3333
npm run studio:deploy   # Met en ligne https://cincin-zinema.sanity.studio
npm run typecheck       # Vérifie les schémas
npm test                # Vérifie l'ordre du programme, la newsletter
                        # et le tirage au sort d'une semaine
```

`npm test` lit `verifications/ordre-des-seances.mjs`. L'ordre du programme
existe forcément en deux exemplaires — `sanity/salles.ts` pour le Studio,
`assets/js/data.js` pour le site, qui ne peut pas importer de TypeScript. Le
fichier passe chaque cas dans les deux copies et refuse qu'elles diffèrent.
Le workflow **Vérifier** lance `npm run typecheck` et `npm test` à chaque
envoi, sur toutes les branches.

### Le Studio se publie tout seul

**`npm run studio:deploy` n'est plus à lancer à la main.** Dès qu'un fichier
du Studio (`sanity/`, `sanity.config.ts`, `sanity.cli.ts`, `package.json`)
arrive sur la branche de publication, le workflow **Déploiement du Studio
Sanity** vérifie puis republie <https://cincin-zinema.sanity.studio>.

Il lui faut un secret, à créer une seule fois dans **Settings → Secrets and
variables → Actions** :

| Nom du secret       | Où le prendre                                         |
| ------------------- | ----------------------------------------------------- |
| `SANITY_AUTH_TOKEN` | [sanity.io/manage](https://www.sanity.io/manage) → projet `vle63mzm` → API → Tokens → **Deploy Studio** |

Prendre les droits **Deploy Studio**, pas « Editor » : ce jeton publie l'outil,
il n'a aucune raison de pouvoir modifier le contenu du cinéma. Tant que le
secret n'existe pas, le workflow ne casse rien — il passe son tour avec un
avertissement, et `npm run studio:deploy` reste disponible à la main.

Le CONTENU, lui, n'a jamais eu besoin d'être déployé : un film ajouté dans le
Studio apparaît tout seul sur le site.

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
