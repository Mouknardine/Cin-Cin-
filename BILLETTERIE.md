# Billetterie en ligne — SumUp Hosted Checkout

Ce document explique comment mettre la caisse en ligne en service.
Il s'adresse à quelqu'un qui n'écrit pas de code : chaque étape est
une manipulation, pas une ligne à programmer.

---

## 1. Comment ça marche, en une phrase

Quand un client achète un billet, **le serveur du cinéma** parle à
SumUp — jamais le navigateur du client. Le client est envoyé sur une
page de paiement hébergée par SumUp, y saisit sa carte, puis revient
sur le site avec son billet.

**Aucune donnée bancaire ne passe par le site du Zinéma.** C'est le
principal intérêt de cette solution : le cinéma n'a rien à sécuriser
de ce côté-là.

Le parcours complet :

| # | Ce qui se passe | Où |
|---|---|---|
| 1 | Le client choisit un horaire et un nombre de billets | Site |
| 2 | Le serveur vérifie la séance, les places libres, **calcule le prix** | Serveur |
| 3 | Le serveur enregistre la commande en « en attente » | Sanity |
| 4 | Le serveur demande une page de paiement à SumUp | SumUp |
| 5 | Le client paie par carte | **Page SumUp** |
| 6 | SumUp le renvoie sur `/billet/` | Site |
| 7 | Le serveur **redemande à SumUp** si c'est bien payé | Serveur |
| 8 | La commande passe « payée », le billet s'affiche | Sanity + Site |

L'étape 7 est la clé : le site ne croit jamais le navigateur sur
parole. Ouvrir l'adresse d'un billet à la main ne fabrique donc pas
de billet gratuit.

---

## 2. Pourquoi il faut un vrai hébergement

Le site est aujourd'hui sur **GitHub Pages**, qui sait uniquement
afficher des fichiers. Or SumUp l'écrit noir sur blanc : *« les
appels doivent être effectués côté serveur afin de ne pas exposer
les identifiants sensibles »*.

La clé secrète SumUp doit donc vivre sur un serveur capable
d'exécuter du code — **Infomaniak**, dans notre cas. Si cette clé se
retrouvait dans le navigateur, n'importe qui pourrait encaisser ou
rembourser des paiements à la place du cinéma.

Le code serveur est écrit en **PHP 8.1 ou plus**, qui fonctionne sur
tous les hébergements web Infomaniak sans réglage particulier.

---

## 3. Mise en service — la marche à suivre

### a. Déposer les fichiers

Sur Infomaniak, le site public est le dossier `web/`. La
configuration secrète se dépose **à côté**, jamais dedans :

```
/home/clients/xxxx/sites/zinema.ch/
├── config.php          ←  les clés secrètes (voir b.)
└── web/                ←  le site public
    ├── index.html
    ├── api/            ←  la billetterie
    ├── billet/
    ├── films/  film/  agenda/  …
    └── assets/
```

> ⚠️ Si `config.php` se retrouvait dans `web/`, n'importe qui
> pourrait le télécharger. Il doit rester **un cran au-dessus**.

### b. Remplir les clés

Copier `serveur/config.exemple.php` en `config.php` au bon endroit,
puis y renseigner quatre valeurs :

| Valeur | Où la trouver |
|---|---|
| Clé API SumUp (`sup_sk_…`) | developer.sumup.com → **API keys** |
| Code marchand (`MXXXXXXX`) | SumUp → Profil → Paramètres |
| Jeton Sanity | sanity.io → projet → API → **Tokens**, droits *Editor* |
| Adresse du site | `https://www.zinema.ch` (sans barre finale) |

### c. Régler la salle et les tarifs

Dans le Studio Sanity → **Réglages du site** → onglet
**Billetterie** :

- **Plein tarif** et **Tarif réduit**, en francs ;
- **Salles et nombre de places** — le nom doit être écrit
  *exactement* comme dans les séances du même cinéma. Les salles sont
  déclarées dans la fiche du cinéma, et chaque cinéma a les siennes.

Ces valeurs sont celles que le serveur utilise réellement pour
facturer et pour compter les places. Une salle absente de cette
liste ne vend rien : c'est volontaire, mieux vaut une caisse fermée
qu'une salle vendue deux fois.

### d. Allumer la caisse

Dans `assets/js/data.js`, passer :

```js
var BILLETTERIE_EN_LIGNE = false;   →   true
```

Tant que c'est `false`, le site garde le comportement actuel (les
liens de paiement SumUp collés à la main dans Sanity). Le site
fonctionne donc normalement pendant toute la migration.

---

## 4. Ce qui est déjà en place

- Base de données des commandes (Sanity → **Commande**), en lecture
  seule : on consulte tout, on ne modifie rien à la main.
- Serveur : création du paiement, vérification du paiement,
  comptage des places, calcul du montant, référence de billet.
- Site : panneau d'achat sur la fiche film, page `/billet/`.
- Garde-fous : montant recalculé côté serveur, montant encaissé
  recontrôlé, places limitées, référence au format vérifié,
  10 billets maximum par commande, panier abandonné qui libère ses
  places au bout de 30 minutes.

## 5. Ce qu'il reste à faire

1. **Tester en conditions réelles** avec les vraies clés SumUp.
   Rien n'a pu être essayé pour l'instant : il faut un serveur PHP
   et un compte SumUp.
2. **L'envoi du billet par e-mail.** La page du billet annonce déjà
   « un exemplaire a été envoyé à… », mais l'envoi lui-même n'est
   pas encore branché.
3. **Le contrôle à l'entrée** : une page simple où saisir une
   référence pour vérifier un billet et le marquer comme utilisé
   (le champ existe déjà dans la commande).
4. **Remboursements** : ils se font aujourd'hui depuis le compte
   SumUp. Le statut « remboursée » existe dans la commande mais
   n'est pas encore mis à jour automatiquement.
