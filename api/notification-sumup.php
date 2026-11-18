<?php
/* ============================================================
   Zinéma — SumUp prévient le serveur qu'un paiement a changé.

   C'est SumUp qui appelle cette adresse, pas un visiteur : elle
   est donnée à chaque paiement créé (« return_url », voir
   _sumup.php). Elle garantit que le billet part par e-mail même si
   le client ne revient jamais sur le site après avoir payé.

   Ce que SumUp envoie ne prouve rien (le message n'est pas signé) :
   on n'en garde que l'identifiant du paiement, et on redemande son
   état à SumUp avec la clé du cinéma. Un faux message ne peut donc
   que déclencher une vérification de plus.

   Ce que SumUp attend en retour : une réponse vide, code 2xx. Toute
   autre réponse le fait rappeler 1 min, 5 min, 20 min puis 2 h plus
   tard. On s'en sert : tant qu'un billet payé n'a pas pu partir, on
   répond par une erreur, et SumUp revient le relancer.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_commande.php';

/* « Bien reçu » : réponse vide, comme SumUp le demande. */
function accuserReception(): never
{
    http_response_code(200);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    echec('Requête invalide.', 405);
}

/* SumUp prévient que d'autres sortes d'événements pourront arriver
   sans préavis : tout ce qu'on ne connaît pas est ignoré en silence. */
$checkoutId = sumupLireNotification(file_get_contents('php://input') ?: '');
if ($checkoutId === null) {
    accuserReception();
}

$commande = commandeParPaiement($checkoutId);
if ($commande === null) {
    error_log("[zinema-billetterie] notification SumUp pour un paiement inconnu : $checkoutId");
    accuserReception();
}

try {
    $commande = conclureCommande($commande, new OutilsCommandeEnLigne());
} catch (MontantDivergent $e) {
    /* Réessayer n'y changera rien : c'est à un humain de regarder.
       La commande reste « en attente », l'alerte est au journal. */
    error_log('[zinema-billetterie] ' . $e->getMessage());
    accuserReception();
}

if (billetEstDu($commande, time()) || ($commande['statut'] ?? '') === 'en-attente') {
    /* Payé mais billet pas parti (courrier en panne, envoi en cours
       ailleurs), ou SumUp prévient d'un changement qu'il n'affiche
       pas encore : on répond par une erreur pour qu'il rappelle. */
    http_response_code(503);
    exit;
}

accuserReception();
