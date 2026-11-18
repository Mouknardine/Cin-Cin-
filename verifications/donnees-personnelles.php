<?php
/* ============================================================
   Vérification : les données des acheteurs ne sont jamais
   lisibles sans clé.

   Le site lit Sanity sans clé, depuis le navigateur des visiteurs :
   tout document y est public, SAUF ceux dont l'identifiant contient
   un point. Jusqu'au 18 novembre 2026, les commandes (e-mail de
   l'acheteur, référence du billet qui suffit à entrer en salle)
   étaient créées sans point, donc lisibles par n'importe qui.

   Ce fichier empêche d'y revenir :
   1. le préfixe des commandes est bien un dossier privé ;
   2. une commande créée passe toujours par ce dossier, quels que
      soient les champs reçus ;
   3. le serveur n'écrit dans Sanity qu'aux endroits connus, qui
      visent tous une commande ;
   4. la page du billet ne renvoie que ce qu'elle affiche, avec
      l'adresse masquée.

   Les règles 3 et 4 sont des listes fermées : une nouvelle écriture
   dans Sanity, ou une nouvelle donnée renvoyée au navigateur, les
   fait échouer exprès. Si elle porte des données personnelles, elle
   doit viser un document privé (identifiant à point) ; ensuite
   seulement, l'ajouter à la liste.

   Le contrôle en conditions réelles (zéro commande lisible sans
   clé) tourne chaque jour : .github/workflows/commandes-privees.yml.

   Rien ne sort d'ici : aucune requête n'est faite.

   Lancer :  php verifications/donnees-personnelles.php
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_lecture-du-code.php';
require_once __DIR__ . '/../api/_billetterie.php';
require_once __DIR__ . '/../api/_commande.php';

/* _socle.php transforme toute erreur en réponse JSON polie, utile en
   ligne, trompeur ici : une erreur doit faire échouer la
   vérification, pas passer inaperçue. */
restore_exception_handler();
ini_set('display_errors', '1');

$code = codeDuServeur(__DIR__ . '/../api');
verifier('le code du serveur est lu', isset($code['_sanity.php'], $code['creer-paiement.php']));

echo "\n1. Le préfixe des commandes est un dossier privé\n";
verifier(
    'un nom suivi d\'un point (« commandes. »)',
    preg_match('/^[a-z][a-z0-9-]*\.$/', PREFIXE_COMMANDE_PRIVEE) === 1,
    PREFIXE_COMMANDE_PRIVEE
);
verifier(
    'ni brouillon ni version (le Studio les traite à part)',
    !in_array(PREFIXE_COMMANDE_PRIVEE, ['drafts.', 'versions.'], true),
    PREFIXE_COMMANDE_PRIVEE
);

echo "\n2. Une commande créée va toujours dans le dossier privé\n";
$document = documentCommandePrivee(['email' => 'a@example.com', '_id' => 'public', '_type' => 'film']);
verifier('identifiant imposé, même si un champ reçu en propose un autre', $document['_id'] === PREFIXE_COMMANDE_PRIVEE);
verifier('type imposé', $document['_type'] === 'commande');
verifier('les autres champs sont gardés', $document['email'] === 'a@example.com');
verifier(
    'sanityCreer() transmet le document tel quel',
    preg_match(
        '/^function sanityCreer\(array \$document\): array\s*\{\s*return sanityMuter\(\[\[\'create\' => \$document\]\]\);\s*\}$/',
        corpsDeFonction('sanityCreer', $code['_sanity.php'] ?? '')
    ) === 1,
    corpsDeFonction('sanityCreer', $code['_sanity.php'] ?? '')
);

echo "\n3. Le serveur n'écrit dans Sanity qu'aux endroits connus\n";
$ecritures = passages(
    '/(?<!function )\b(sanityEnvoyerMutations|sanityMuter|sanityModifierSiInchangee|sanityModifier|sanityCreer)\(\s*[^,)\s]*/',
    $code
);
$ecrituresConnues = [
    '_billetterie.php : sanityCreer(documentCommandePrivee($champs', /* la création des commandes */
    '_commande.php : sanityModifierSiInchangee($id',                 /* conclusion d'une commande */
    '_commande.php : sanityModifier($id',                            /* conclusion d'une commande */
    '_sanity.php : sanityEnvoyerMutations($mutations',               /* sanityMuter() */
    '_sanity.php : sanityEnvoyerMutations([',                        /* sanityModifierSiInchangee() */
    '_sanity.php : sanityMuter([[\'create\'',                        /* sanityCreer() */
    '_sanity.php : sanityMuter([[\'patch\'',                         /* sanityModifier() */
    'creer-paiement.php : sanityModifier($idCommande',               /* le paiement SumUp de la commande */
];
verifier('chaque écriture est connue, et vise une commande', $ecritures === $ecrituresConnues, ecart($ecritures, $ecrituresConnues));
verifier(
    'une seule mutation de création, celle de sanityCreer()',
    passages('/[\'"]create(OrReplace|IfNotExists|Version)?[\'"]\s*=>/', $code) === ['_sanity.php : \'create\' =>'],
    enClair(passages('/[\'"]create(OrReplace|IfNotExists|Version)?[\'"]\s*=>/', $code))
);
verifier(
    'une seule adresse d\'écriture vers Sanity, celle de _sanity.php',
    passages('/[\'"]mutate[\'"]/', $code) === ['_sanity.php : \'mutate\''],
    enClair(passages('/[\'"]mutate[\'"]/', $code))
);
verifier(
    'aucun autre endroit n\'écrit de document de type commande',
    passages('/[\'"]_type[\'"]\s*=>\s*[\'"]commande[\'"]/', $code) === ['_billetterie.php : \'_type\' => \'commande\'']
        && str_contains(corpsDeFonction('documentCommandePrivee', $code['_billetterie.php'] ?? ''), "'_type' => 'commande'"),
    enClair(passages('/[\'"]_type[\'"]\s*=>\s*[\'"]commande[\'"]/', $code))
);
verifier(
    'creer-paiement.php crée sa commande avec creerCommandePrivee()',
    str_contains($code['creer-paiement.php'] ?? '', 'creerCommandePrivee([')
);

echo "\n4. La page du billet ne renvoie que ce qu'elle affiche\n";
verifier('marie.dupont@example.com → m•••@example.com', masquerEmail('marie.dupont@example.com') === 'm•••@example.com');
verifier('une lettre avant l\'arobase', masquerEmail('a@example.net') === 'a•••@example.net');
verifier('une première lettre accentuée reste entière', masquerEmail('élodie@example.org') === 'é•••@example.org');
verifier('sans arobase → rien', masquerEmail('pas-une-adresse') === '');
verifier('arobase au début ou à la fin → rien', masquerEmail('@example.com') === '' && masquerEmail('a@') === '');
verifier('vide → rien', masquerEmail('') === '');

$pageBillet = $code['statut-paiement.php'] ?? '';
$nombreReponses = preg_match_all('/\breussite\(/', $pageBillet);
verifier('une seule réponse réussie, celle qui est contrôlée ci-dessous', $nombreReponses === 1, $nombreReponses . ' réponse(s)');
verifier(
    'rien n\'est écrit au navigateur en dehors de cette réponse',
    preg_match('/\b(echo|print|printf|print_r|var_dump|var_export|json_encode)\b/', $pageBillet) === 0
);
$reponse = preg_match('/reussite\(\[(.*?)\]\);/s', $pageBillet, $m) === 1 ? $m[1] : '';
preg_match_all('/[\'"](\w+)[\'"]\s*=>/', $reponse, $cles);
$clesConnues = ['statut', 'billet', 'reference', 'film', 'date', 'heure', 'salle', 'plein', 'reduit', 'nombre', 'montant', 'email', 'courrielEnvoye'];
verifier('statut-paiement.php ne renvoie que les champs connus', $cles[1] === $clesConnues, ecart($cles[1], $clesConnues));
verifier(
    'jamais la commande entière, seulement des champs choisis',
    $reponse !== '' && preg_match('/\$commande(?!\[)/', $reponse) === 0
);
verifier(
    'l\'adresse renvoyée est masquée',
    preg_match("/'email' => masquerEmail\(\(string\) \(\\\$commande\['email'\]/", $reponse) === 1
);

echo $echecs === 0 ? "\nTout est bon.\n" : "\n$echecs vérification(s) en échec.\n";
exit($echecs === 0 ? 0 : 1);
