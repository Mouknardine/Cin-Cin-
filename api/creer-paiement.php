<?php
/* ============================================================
   Zinéma — étape 1 de l'achat : créer le paiement.

   Le site envoie ici : la séance voulue, le nombre de billets et
   l'e-mail de l'acheteur. Le serveur vérifie tout, calcule
   lui-même le montant, enregistre la commande, puis demande à
   SumUp une page de paiement et en renvoie l'adresse.

   Le navigateur n'a plus qu'à y emmener le client. Il n'a jamais
   vu la clé SumUp, et n'a jamais eu son mot à dire sur le prix.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_billetterie.php';
require_once __DIR__ . '/_sumup.php';

$corps = corpsJson('POST');

/* ---------------- Ce que demande le client ---------------- */

$idSeance = trim((string) ($corps['seance'] ?? ''));
if ($idSeance === '' || strlen($idSeance) > 100) {
    echec('Séance manquante.', 422);
}

$plein = nombreDemande($corps, 'plein');
$reduit = nombreDemande($corps, 'reduit');
$total = $plein + $reduit;

if ($total < 1) {
    echec('Choisissez au moins un billet.', 422);
}
if ($total > MAX_BILLETS_PAR_COMMANDE) {
    echec(
        'Au-delà de ' . MAX_BILLETS_PAR_COMMANDE . ' billets, merci de contacter directement le cinéma.',
        422
    );
}

$email = emailValide($corps);

/* ---------------- Ce que dit le serveur ---------------- */

$contexte = chargerContexte($idSeance);

if ($contexte['restantes'] < $total) {
    echec(
        $contexte['restantes'] === 0
            ? 'Cette séance est complète.'
            : 'Il ne reste que ' . $contexte['restantes'] . ' place(s) pour cette séance.',
        409
    );
}

/* Le montant est calculé ici, à partir des tarifs enregistrés dans
   les réglages du site — jamais à partir de ce qu'annonce la page. */
$montant = $plein * $contexte['tarifPlein'] + $reduit * $contexte['tarifReduit'];
if ($montant <= 0) {
    echec('Montant invalide.', 422, 'Tarifs à zéro dans les réglages du site ?');
}

/* ---------------- Enregistrer, puis encaisser ---------------- */

$seance = $contexte['seance'];
$reference = nouvelleReference();
$maintenant = gmdate('Y-m-d\TH:i:s\Z');

/* La commande est écrite AVANT le paiement : si SumUp ou le réseau
   flanche ensuite, il reste une trace de ce qui a été tenté. Elle
   restera « en attente » et libérera ses places au bout de
   MINUTES_RESERVATION. */
$creation = sanityCreer([
    '_type' => 'commande',
    'reference' => $reference,
    'statut' => 'en-attente',
    'seance' => ['_type' => 'reference', '_ref' => $seance['_id']],
    'filmTitre' => (string) ($seance['filmTitre'] ?? 'Séance'),
    'seanceDate' => (string) ($seance['date'] ?? ''),
    'seanceHeure' => (string) ($seance['time'] ?? ''),
    'seanceSalle' => (string) ($seance['room'] ?? ''),
    'billetsPlein' => $plein,
    'billetsReduit' => $reduit,
    'montant' => round($montant, 2),
    'email' => $email,
    'creeLe' => $maintenant,
]);

$idCommande = $creation['results'][0]['id'] ?? '';
if ($idCommande === '') {
    throw new RuntimeException('Commande créée sans identifiant : ' . json_encode($creation));
}

$description = $total . ' billet' . ($total > 1 ? 's' : '') . ' — '
    . ($seance['filmTitre'] ?? 'Séance') . ', ' . libelleSeance($seance);

$urlRetour = rtrim(config()['site']['url'], '/') . '/billet/?ref=' . rawurlencode($reference);

$checkout = sumupCreerCheckout($reference, $montant, $description, $urlRetour);

sanityModifier($idCommande, ['sumupCheckoutId' => $checkout['id']]);

reussite([
    'reference' => $reference,
    'montant' => round($montant, 2),
    'pagePaiement' => $checkout['page'],
]);
