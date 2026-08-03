<?php
/* ============================================================
   Zinéma — clés secrètes de la billetterie.

   ⚠️  CE FICHIER NE DOIT JAMAIS ÊTRE ACCESSIBLE DEPUIS INTERNET.
   Sur Infomaniak, le site public est le dossier « web/ ». Ce
   fichier se dépose donc À CÔTÉ de « web/ », jamais dedans :

       /home/clients/xxxx/sites/zinema.ch/
       ├── config.php      ←  ce fichier, renommé (secret)
       └── web/            ←  le site public
           ├── index.html
           ├── api/
           └── assets/

   Marche à suivre :
     1. copier ce fichier en « config.php » au bon endroit ;
     2. remplir les quatre valeurs ci-dessous ;
     3. ne JAMAIS le mettre sur GitHub (il est déjà ignoré).

   Si une de ces clés fuite, quelqu'un peut encaisser ou rembourser
   des paiements à votre place. En cas de doute, régénérez-les
   depuis SumUp et Sanity : c'est gratuit et immédiat.
   ============================================================ */

return [
    /* ---------------- SumUp ----------------
       À créer sur https://developer.sumup.com → API keys.
       La clé secrète commence par « sup_sk_ ». */
    'sumup' => [
        'cle_api' => 'sup_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        /* Le code marchand du compte qui encaisse, visible dans
           SumUp → Profil → Paramètres (format « MXXXXXXX »). */
        'code_marchand' => 'MXXXXXXX',
    ],

    /* ---------------- Sanity ----------------
       Le jeton d'écriture sert à enregistrer les commandes.
       À créer sur sanity.io → votre projet → API → Tokens,
       avec les droits « Editor ». */
    'sanity' => [
        'projet' => 'g0k3smf3',
        'dataset' => 'production',
        'jeton_ecriture' => 'skXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    ],

    /* ---------------- Le site ----------------
       Adresse publique du site, SANS barre oblique finale.
       Elle sert à construire l'adresse de retour après paiement :
       SumUp y renvoie le client une fois la carte validée. */
    'site' => [
        'url' => 'https://www.zinema.ch',
    ],
];
