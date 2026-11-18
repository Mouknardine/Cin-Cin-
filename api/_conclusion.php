<?php
/* ============================================================
   Zinéma — conclure une commande : savoir si elle est payée, puis
   envoyer le billet par e-mail, une fois et une seule.

   Deux chemins mènent ici :
     · la page du billet, quand le client revient sur le site après
       avoir payé (statut-paiement.php) ;
     · SumUp lui-même, qui prévient le serveur dès que le paiement
       change d'état (notification-sumup.php), même si le client a
       fermé sa page, validé dans l'app de sa banque, ou payé depuis
       Instagram.

   Avant le 18 novembre 2026, seul le premier chemin existait : un
   client qui ne revenait pas sur le site payait sans recevoir son
   billet, et sa commande restait « en attente ».

   Les deux chemins peuvent arriver à la même seconde. Pour qu'un
   client ne reçoive jamais deux mails, chaque écriture dans Sanity
   n'a lieu que si la commande n'a pas bougé depuis qu'on l'a lue :
   le premier qui écrit gagne, l'autre relit et s'efface.

   Ce fichier ne parle ni à SumUp, ni à Sanity, ni au serveur de
   courrier : il reçoit des « outils » qui le font. C'est ce qui
   permet de rejouer tous les cas sans rien envoyer
   (verifications/billetterie-conclusion.php).
   ============================================================ */

declare(strict_types=1);

/* Si un envoi a échoué, on attend avant de réessayer : assez pour
   qu'un envoi encore en cours ailleurs ait fini, assez peu pour que
   le nouvel essai de SumUp (5 minutes plus tard) le relance. */
const MINUTES_AVANT_NOUVEL_ENVOI = 4;

/** SumUp annonce un autre montant que celui demandé : un humain doit regarder. */
final class MontantDivergent extends RuntimeException
{
}

/** Ce dont la conclusion a besoin pour agir sur le monde. */
interface OutilsCommande
{
    /** @return array{statut: string, montant: float} statut traduit en vocabulaire Zinéma */
    public function lirePaiement(string $checkoutId): array;

    /** Écrit les champs seulement si la commande est encore à cette révision. */
    public function modifierSiInchangee(string $id, string $revision, array $champs): bool;

    public function modifier(string $id, array $champs): void;

    public function relire(string $id): array;

    /** Vrai si le serveur de courrier a accepté le message. */
    public function envoyerBillet(array $commande): bool;

    public function maintenant(): int;
}

/**
 * Tranche le sort du paiement si besoin, puis envoie le billet s'il
 * est dû. Renvoie la commande telle qu'elle est désormais.
 *
 * @throws MontantDivergent
 */
function conclureCommande(array $commande, OutilsCommande $outils): array
{
    [$commande, $envoiReserve] = trancherPaiement($commande, $outils);
    return envoyerBilletSiDu($commande, $outils, $envoiReserve);
}

/**
 * Demande à SumUp où en est une commande « en attente », et l'écrit.
 *
 * Celui qui fait passer la commande à « payée » réserve l'envoi du
 * billet dans la même écriture : personne d'autre ne peut l'envoyer
 * pendant ce temps.
 *
 * @return array{0: array, 1: bool} la commande, et vrai si l'envoi nous revient
 */
function trancherPaiement(array $commande, OutilsCommande $outils): array
{
    if (($commande['statut'] ?? 'en-attente') !== 'en-attente' || empty($commande['sumupCheckoutId'])) {
        return [$commande, false];
    }

    $paiement = $outils->lirePaiement((string) $commande['sumupCheckoutId']);
    if ($paiement['statut'] === 'en-attente') {
        return [$commande, false];
    }

    $champs = ['statut' => $paiement['statut']];
    if ($paiement['statut'] === 'payee') {
        verifierMontant($commande, $paiement['montant']);
        $champs['payeeLe'] = horodatage($outils->maintenant());
        $champs['envoiTenteLe'] = $champs['payeeLe'];
    }

    if (!$outils->modifierSiInchangee((string) $commande['_id'], revision($commande), $champs)) {
        return [$outils->relire((string) $commande['_id']), false];
    }
    return [array_merge($commande, $champs), $paiement['statut'] === 'payee'];
}

/* Le montant encaissé doit être celui qu'on a demandé. Sinon, pas de
   billet : la commande reste en attente et l'alerte part au journal. */
function verifierMontant(array $commande, float $encaisse): void
{
    $attendu = round((float) ($commande['montant'] ?? 0), 2);
    if (abs(round($encaisse, 2) - $attendu) > 0.001) {
        throw new MontantDivergent(
            'Montant divergent pour ' . ($commande['reference'] ?? '?')
            . " : encaissé $encaisse, attendu $attendu"
        );
    }
}

/**
 * Envoie le billet s'il est dû et que personne d'autre n'est en train
 * de le faire. Un échec d'envoi n'est jamais fatal : le billet est
 * payé, la page l'affiche, et un prochain passage réessaiera.
 */
function envoyerBilletSiDu(array $commande, OutilsCommande $outils, bool $envoiReserve): array
{
    $maintenant = $outils->maintenant();
    if (!billetEstDu($commande, $maintenant)) {
        return $commande;
    }

    if (!$envoiReserve) {
        if (!envoiPeutReprendre($commande, $maintenant)) {
            return $commande;
        }
        $tente = ['envoiTenteLe' => horodatage($maintenant)];
        if (!$outils->modifierSiInchangee((string) $commande['_id'], revision($commande), $tente)) {
            return $outils->relire((string) $commande['_id']);
        }
        $commande = array_merge($commande, $tente);
    }

    if (!$outils->envoyerBillet($commande)) {
        return $commande;
    }

    $envoye = ['billetEnvoyeLe' => horodatage($outils->maintenant())];
    $outils->modifier((string) $commande['_id'], $envoye);
    return array_merge($commande, $envoye);
}

/* Payée, pas encore envoyée, et la séance n'est pas passée. */
function billetEstDu(array $commande, int $maintenant): bool
{
    return ($commande['statut'] ?? '') === 'payee'
        && empty($commande['billetEnvoyeLe'])
        && (string) ($commande['seanceDate'] ?? '') >= dateAZurich($maintenant);
}

/* Aucun essai encore, ou le dernier est assez ancien pour être fini. */
function envoiPeutReprendre(array $commande, int $maintenant): bool
{
    $dernier = strtotime((string) ($commande['envoiTenteLe'] ?? ''));
    return $dernier === false || $dernier <= $maintenant - MINUTES_AVANT_NOUVEL_ENVOI * 60;
}

function revision(array $commande): string
{
    $revision = (string) ($commande['_rev'] ?? '');
    if ($revision === '') {
        throw new RuntimeException('Commande lue sans sa révision : impossible de la modifier sans risque.');
    }
    return $revision;
}

function horodatage(int $instant): string
{
    return gmdate('Y-m-d\TH:i:s\Z', $instant);
}

function dateAZurich(int $instant): string
{
    return (new DateTimeImmutable('@' . $instant))
        ->setTimezone(new DateTimeZone('Europe/Zurich'))
        ->format('Y-m-d');
}
