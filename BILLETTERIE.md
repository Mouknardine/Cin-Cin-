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
| 6 | SumUp prévient le serveur **et** renvoie le client sur `/billet/` | SumUp |
| 7 | Le serveur **redemande à SumUp** si c'est bien payé | Serveur |
| 8 | La commande passe « payée », le billet part par e-mail et s'affiche | Sanity + Site |

L'étape 7 est la clé : le site ne croit jamais le navigateur sur
parole. Ouvrir l'adresse d'un billet à la main ne fabrique donc pas
de billet gratuit.

À l'étape 6, SumUp prévient **directement le serveur**
(`api/notification-sumup.php`), même si le client ne revient jamais
sur le site : onglet fermé, paiement validé dans l'app de sa banque,
achat depuis Instagram. Avant le 18 novembre 2026, seul le retour du
client déclenchait l'envoi du billet, et des acheteurs ont payé sans
le recevoir. Les deux chemins passent par la même règle
(`api/_conclusion.php`), qui garantit **un seul** mail.

Si le serveur de courrier refuse le message, SumUp rappelle 1 min,
5 min, 20 min puis 2 h plus tard, et l'envoi est retenté dès que dix
minutes ont passé depuis l'essai précédent (ce délai évite qu'un
client reçoive deux mails). Ouvrir la page du billet le relance aussi.

Une carte refusée ne clôt pas la commande : le client peut payer
avec une autre sur la même page SumUp. La commande « échouée » garde
donc ses places et reste surveillée jusqu'au paiement ou à
l'expiration.

Le client a **20 minutes** pour payer sur la page SumUp ; ses places
restent réservées **30 minutes**. Les dix minutes d'écart laissent à
SumUp le temps de prévenir le serveur : une place payée n'est jamais
rendue à la vente.

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
  *exactement* comme dans les séances (« Salle 1 », « Salle 2 »).

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
- Billet par e-mail : envoyé dès que SumUp confirme le paiement, une
  seule fois, retenté tout seul si le serveur de courrier refuse.
  Vérifié par `php verifications/billetterie-conclusion.php`.

## 5. Ce qu'il reste à faire

1. **Tester en conditions réelles** avec les vraies clés SumUp.
   Rien n'a pu être essayé pour l'instant : il faut un serveur PHP
   et un compte SumUp.
2. **Le contrôle à l'entrée** : une page simple où saisir une
   référence pour vérifier un billet et le marquer comme utilisé
   (le champ existe déjà dans la commande).
3. **Remboursements** : ils se font aujourd'hui depuis le compte
   SumUp. Le statut « remboursée » existe dans la commande mais
   n'est pas encore mis à jour automatiquement.
