<?php
/* ============================================================
   Zinéma — étape 2 de l'achat : le billet.

   Appelé par la page /billet/ quand SumUp y a renvoyé le client.
   Le serveur NE CROIT PAS le navigateur : il redemande à SumUp où
   en est le paiement, puis met la commande à jour en conséquence.
   Sans quoi il suffirait d'ouvrir /billet/?ref=… à la main pour
   se fabriquer un billet gratuit.

   Cette page est aussi celle qu'on rouvre plus tard pour retrouver
   son billet : elle est donc consultable autant de fois qu'on veut.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_commande.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    echec('Requête invalide.', 405);
}

$reference = strtoupper(trim((string) ($_GET['ref'] ?? '')));
/* La référence est le seul secret qui protège un billet : on
   n'accepte que le format exact qu'on émet, jamais autre chose. */
if (!preg_match('/^ZIN-[A-Z2-9]{6}$/', $reference)) {
    echec('Référence de billet invalide.', 422);
}

$commande = commandeParReference($reference);
if ($commande === null) {
    echec('Billet introuvable.', 404);
}

/* Tant que la commande n'est pas conclue, on redemande son sort à
   SumUp ; une fois payée, on s'assure que le billet est parti. SumUp
   prévient aussi le serveur de son côté (notification-sumup.php) :
   les deux chemins passent par la même règle, qui garantit un seul
   mail. Voir _conclusion.php. */
try {
    $commande = conclureCommande($commande, new OutilsCommandeEnLigne());
} catch (MontantDivergent $e) {
    echec(
        'Ce paiement demande une vérification. Le cinéma vous recontacte au plus vite.',
        409,
        $e->getMessage()
    );
}
$statut = (string) ($commande['statut'] ?? 'en-attente');

$nombre = (int) ($commande['billetsPlein'] ?? 0) + (int) ($commande['billetsReduit'] ?? 0);

reussite([
    'statut' => $statut,
    'billet' => [
        'reference' => $commande['reference'],
        'film' => $commande['filmTitre'] ?? '',
        'date' => $commande['seanceDate'] ?? '',
        'heure' => $commande['seanceHeure'] ?? '',
        'salle' => $commande['seanceSalle'] ?? '',
        'plein' => (int) ($commande['billetsPlein'] ?? 0),
        'reduit' => (int) ($commande['billetsReduit'] ?? 0),
        'nombre' => $nombre,
        'montant' => (float) ($commande['montant'] ?? 0),
        'email' => $commande['email'] ?? '',
        /* Le site n'annonce l'envoi que si l'envoi a eu lieu. */
        'courrielEnvoye' => !empty($commande['billetEnvoyeLe']),
    ],
]);
