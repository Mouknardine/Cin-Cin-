<?php
/* ============================================================
   Zinéma — dialogue avec SumUp (Hosted Checkout).

   Le principe, tel que décrit par SumUp :
     1. le serveur crée un « checkout » (une intention de paiement) ;
     2. SumUp renvoie l'adresse d'une page de paiement sécurisée ;
     3. le client y saisit sa carte, chez SumUp, jamais chez nous —
        aucune donnée bancaire ne transite par ce site ;
     4. SumUp le renvoie ici, et le serveur redemande à SumUp si le
        paiement est bien passé.

   L'étape 4 est capitale : on ne croit JAMAIS le navigateur sur
   parole quand il annonce « c'est payé ». On redemande à SumUp.

   Référence : https://developer.sumup.com — POST /v0.1/checkouts
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_socle.php';

const SUMUP_BASE = 'https://api.sumup.com/v0.1';

function sumupEntetes(): array
{
    return ['Authorization: Bearer ' . config()['sumup']['cle_api']];
}

/* Crée le paiement et renvoie [identifiant, adresse de la page de
   paiement]. Le montant est en francs (unité principale), tel que
   l'attend SumUp. */
function sumupCreerCheckout(string $reference, float $montant, string $description, string $urlRetour): array
{
    $r = appelHttp('POST', SUMUP_BASE . '/checkouts', sumupEntetes(), [
        'checkout_reference' => $reference,
        'amount' => round($montant, 2),
        'currency' => 'CHF',
        'merchant_code' => config()['sumup']['code_marchand'],
        'description' => $description,
        /* Demande la page de paiement hébergée par SumUp. */
        'hosted_checkout' => ['enabled' => true],
        /* Où SumUp renvoie le client une fois la carte validée. */
        'redirect_url' => $urlRetour,
    ]);

    if ($r['statut'] < 200 || $r['statut'] >= 300) {
        throw new RuntimeException('SumUp création ' . $r['statut'] . ' : ' . $r['brut']);
    }

    $id = $r['corps']['id'] ?? '';
    $page = $r['corps']['hosted_checkout_url'] ?? '';
    if ($id === '' || $page === '') {
        throw new RuntimeException('SumUp : réponse sans id ou sans page de paiement — ' . $r['brut']);
    }

    return ['id' => $id, 'page' => $page];
}

/* Demande à SumUp où en est un paiement.
   Statuts possibles : PENDING, PAID, FAILED, EXPIRED. */
function sumupLireCheckout(string $id): array
{
    $r = appelHttp('GET', SUMUP_BASE . '/checkouts/' . rawurlencode($id), sumupEntetes());
    if ($r['statut'] !== 200) {
        throw new RuntimeException('SumUp lecture ' . $r['statut'] . ' : ' . $r['brut']);
    }
    return $r['corps'];
}

/* Traduit le statut SumUp en statut de commande Zinéma. */
function sumupStatutVersCommande(string $statutSumUp): string
{
    return match (strtoupper($statutSumUp)) {
        'PAID' => 'payee',
        'FAILED' => 'echouee',
        'EXPIRED' => 'expiree',
        default => 'en-attente',
    };
}
