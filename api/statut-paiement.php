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

require_once __DIR__ . '/_billetterie.php';
require_once __DIR__ . '/_sumup.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    echec('Requête invalide.', 405);
}

$reference = strtoupper(trim((string) ($_GET['ref'] ?? '')));
/* La référence est le seul secret qui protège un billet : on
   n'accepte que le format exact qu'on émet, jamais autre chose. */
if (!preg_match('/^ZIN-[A-Z2-9]{6}$/', $reference)) {
    echec('Référence de billet invalide.', 422);
}

$commande = sanityLire(
    '*[_type == "commande" && reference == $r][0]{
       _id, reference, statut, filmTitre, seanceDate, seanceHeure, seanceSalle,
       billetsPlein, billetsReduit, montant, email, sumupCheckoutId, payeeLe
     }',
    ['r' => $reference]
);

if (!is_array($commande)) {
    echec('Billet introuvable.', 404);
}

/* Tant que la commande n'est pas conclue, on redemande son sort à
   SumUp. Une fois payée (ou échouée), le verdict est définitif :
   inutile de rappeler SumUp à chaque affichage du billet. */
$statut = (string) ($commande['statut'] ?? 'en-attente');

if ($statut === 'en-attente' && !empty($commande['sumupCheckoutId'])) {
    $checkout = sumupLireCheckout((string) $commande['sumupCheckoutId']);
    $nouveau = sumupStatutVersCommande((string) ($checkout['status'] ?? ''));

    if ($nouveau !== $statut) {
        $champs = ['statut' => $nouveau];
        if ($nouveau === 'payee') {
            $champs['payeeLe'] = gmdate('Y-m-d\TH:i:s\Z');

            /* Garde-fou : le montant encaissé doit être celui qu'on a
               demandé. Si SumUp annonce autre chose, on ne délivre pas
               le billet et on laisse une trace bien visible. */
            $encaisse = round((float) ($checkout['amount'] ?? 0), 2);
            $attendu = round((float) ($commande['montant'] ?? 0), 2);
            if (abs($encaisse - $attendu) > 0.001) {
                echec(
                    'Ce paiement demande une vérification. Le cinéma vous recontacte au plus vite.',
                    409,
                    "Montant divergent pour $reference : encaissé $encaisse, attendu $attendu"
                );
            }
        }
        sanityModifier((string) $commande['_id'], $champs);
        $commande['statut'] = $nouveau;
        $commande['payeeLe'] = $champs['payeeLe'] ?? ($commande['payeeLe'] ?? null);
        $statut = $nouveau;
    }
}

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
    ],
]);
