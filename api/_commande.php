<?php
/* ============================================================
   Zinéma — retrouver une commande, et les vrais outils de la
   conclusion (le vrai SumUp, le vrai Sanity, le vrai courrier).

   La logique elle-même est dans _conclusion.php ; ici, on ne fait
   que la brancher sur le monde réel.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_sanity.php';
require_once __DIR__ . '/_conclusion.php';
require_once __DIR__ . '/_courriel.php';
require_once __DIR__ . '/_sumup.php';

/* Tout ce que la conclusion et la page du billet lisent d'une
   commande. « _rev » est indispensable : sans lui, impossible
   d'écrire « seulement si personne n'est passé avant ». */
const COMMANDE_CHAMPS = '_id, _rev, reference, statut, filmTitre, seanceDate, seanceHeure,
    seanceSalle, billetsPlein, billetsReduit, montant, email, sumupCheckoutId, payeeLe,
    billetEnvoyeLe, envoiTenteLe';

function commandeParReference(string $reference): ?array
{
    $commande = sanityLire(
        '*[_type == "commande" && reference == $r][0]{' . COMMANDE_CHAMPS . '}',
        ['r' => $reference]
    );
    return is_array($commande) ? $commande : null;
}

function commandeParPaiement(string $checkoutId): ?array
{
    $commande = sanityLire(
        '*[_type == "commande" && sumupCheckoutId == $c][0]{' . COMMANDE_CHAMPS . '}',
        ['c' => $checkoutId]
    );
    return is_array($commande) ? $commande : null;
}

/* L'adresse de l'acheteur telle que la page du billet l'affiche :
   « marie@example.com » devient « m•••@example.com ». Le client y
   reconnaît son adresse, mais quiconque reçoit le lien du billet
   (un ami à qui on l'a transféré, par exemple) ne la lit pas en
   entier. Une adresse illisible donne une chaîne vide. */
function masquerEmail(string $email): string
{
    $arobase = strrpos($email, '@');
    if ($arobase === false || $arobase === 0 || $arobase === strlen($email) - 1) {
        return '';
    }
    return mb_substr($email, 0, 1, 'UTF-8') . '•••' . substr($email, $arobase);
}

final class OutilsCommandeEnLigne implements OutilsCommande
{
    public function lirePaiement(string $checkoutId): array
    {
        $checkout = sumupLireCheckout($checkoutId);
        return [
            'statut' => sumupStatutVersCommande((string) ($checkout['status'] ?? '')),
            'montant' => (float) ($checkout['amount'] ?? 0),
        ];
    }

    public function modifierSiInchangee(string $id, string $revision, array $champs): bool
    {
        return sanityModifierSiInchangee($id, $revision, $champs);
    }

    public function modifier(string $id, array $champs): void
    {
        sanityModifier($id, $champs);
    }

    public function relire(string $id): array
    {
        $commande = sanityLire('*[_id == $id][0]{' . COMMANDE_CHAMPS . '}', ['id' => $id]);
        if (!is_array($commande)) {
            throw new RuntimeException("Commande $id disparue entre deux lectures.");
        }
        return $commande;
    }

    public function envoyerBillet(array $commande): bool
    {
        return courrielEnvoyerBillet($commande);
    }

    public function maintenant(): int
    {
        return time();
    }
}
