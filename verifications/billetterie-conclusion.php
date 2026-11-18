<?php
/* ============================================================
   Vérification : une commande payée reçoit son billet par e-mail,
   une fois et une seule, quel que soit le chemin qui la conclut.

   Le 17 novembre 2026, des acheteurs ont payé sans recevoir leur
   billet. Le mail ne partait que si le client revenait sur la page
   du billet après avoir payé. Désormais SumUp prévient aussi le
   serveur directement (notification-sumup.php), et les deux chemins
   passent par conclureCommande(). Ce fichier rejoue les cas qui
   comptent : client qui ne revient pas, deux chemins en même temps,
   serveur de courrier en panne, montant faux, séance passée.

   Rien ne sort d'ici : SumUp, Sanity et le courrier sont simulés.

   Lancer :  php verifications/billetterie-conclusion.php
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/../api/_conclusion.php';
require_once __DIR__ . '/../api/_sumup.php';

/* _socle.php (chargé par _sumup.php) transforme toute erreur en
   réponse JSON polie, utile en ligne, trompeur ici : une erreur doit
   faire échouer la vérification, pas passer inaperçue. */
restore_exception_handler();
ini_set('display_errors', '1');

const MAINTENANT = 1_795_000_000; /* une date fixe : le test ne dépend pas de l'heure */

/** Un faux Sanity, un faux SumUp, un faux serveur de courrier. */
class OutilsSimules implements OutilsCommande
{
    /** @var array<string, array<string, mixed>> */
    public array $base = [];
    public string $statutSumup = 'PAID';
    public float $montantSumup = 32.0;
    public bool $courrierEnPanne = false;
    /** @var list<string> */
    public array $courriels = [];
    public int $horloge = MAINTENANT;
    /** Appelé au milieu d'un envoi, pour simuler un second chemin qui arrive à ce moment-là. */
    public ?Closure $pendantEnvoi = null;
    private int $revision = 0;

    public function enregistrer(array $commande): array
    {
        $commande['_rev'] = 'r' . (++$this->revision);
        $this->base[$commande['_id']] = $commande;
        return $commande;
    }

    public function lirePaiement(string $checkoutId): array
    {
        return [
            'statut' => sumupStatutVersCommande($this->statutSumup),
            'montant' => $this->montantSumup,
        ];
    }

    public function modifierSiInchangee(string $id, string $revision, array $champs): bool
    {
        if ($this->base[$id]['_rev'] !== $revision) {
            return false;
        }
        $this->enregistrer(array_merge($this->base[$id], $champs));
        return true;
    }

    public function modifier(string $id, array $champs): void
    {
        $this->enregistrer(array_merge($this->base[$id], $champs));
    }

    public function relire(string $id): array
    {
        return $this->base[$id];
    }

    public function envoyerBillet(array $commande): bool
    {
        if ($this->pendantEnvoi !== null) {
            $suite = $this->pendantEnvoi;
            $this->pendantEnvoi = null;
            $suite();
        }
        if ($this->courrierEnPanne) {
            return false;
        }
        $this->courriels[] = (string) $commande['reference'];
        return true;
    }

    public function maintenant(): int
    {
        return $this->horloge;
    }
}

function nouvelleCommande(OutilsSimules $outils, array $champs = []): array
{
    return $outils->enregistrer(array_merge([
        '_id' => 'cmd-1',
        'reference' => 'ZIN-ABC234',
        'statut' => 'en-attente',
        'sumupCheckoutId' => 'chk-1',
        'montant' => 32,
        'email' => 'acheteur@example.ch',
        'seanceDate' => gmdate('Y-m-d', MAINTENANT + 86400),
    ], $champs));
}

$echecs = 0;
function verifier(string $cas, bool $vrai): void
{
    global $echecs;
    echo ($vrai ? '  ok   ' : '  ÉCHEC ') . $cas . "\n";
    if (!$vrai) {
        $echecs++;
    }
}

echo "Billetterie — conclusion d'une commande\n";

/* 1. Le client paie et ne revient jamais : SumUp prévient le serveur. */
$o = new OutilsSimules();
$c = conclureCommande(nouvelleCommande($o), $o);
verifier('payée chez SumUp → commande payée', $o->base['cmd-1']['statut'] === 'payee');
verifier('payée chez SumUp → un billet envoyé', $o->courriels === ['ZIN-ABC234']);
verifier("payée chez SumUp → l'envoi est noté", !empty($o->base['cmd-1']['billetEnvoyeLe']));
verifier('la page reçoit la commande à jour', ($c['billetEnvoyeLe'] ?? null) !== null);

/* 2. SumUp prévient, puis le client revient sur la page : pas de second mail. */
conclureCommande($o->relire('cmd-1'), $o);
conclureCommande($o->relire('cmd-1'), $o);
verifier('chemins successifs → toujours un seul billet', count($o->courriels) === 1);

/* 3. Les deux chemins lisent la commande au même instant. */
$o = new OutilsSimules();
$lueParLaPage = nouvelleCommande($o);
$lueParSumup = $lueParLaPage;
conclureCommande($lueParSumup, $o);
$c = conclureCommande($lueParLaPage, $o);
verifier('chemins simultanés → un seul billet', count($o->courriels) === 1);
verifier('chemins simultanés → la page voit le billet envoyé', ($c['billetEnvoyeLe'] ?? null) !== null);

/* 4. Le second chemin arrive pendant que le premier envoie encore. */
$o = new OutilsSimules();
$copie = nouvelleCommande($o);
$o->pendantEnvoi = static function () use ($o, $copie): void {
    conclureCommande($copie, $o);
    conclureCommande($o->relire('cmd-1'), $o);
};
conclureCommande($copie, $o);
verifier('envoi en cours → pas de doublon', count($o->courriels) === 1);

/* 5. Le serveur de courrier est en panne, puis revient. */
$o = new OutilsSimules();
$o->courrierEnPanne = true;
conclureCommande(nouvelleCommande($o), $o);
verifier('courrier en panne → commande payée quand même', $o->base['cmd-1']['statut'] === 'payee');
verifier("courrier en panne → l'envoi n'est pas noté", empty($o->base['cmd-1']['billetEnvoyeLe']));
$o->courrierEnPanne = false;
$o->horloge += 60;
conclureCommande($o->relire('cmd-1'), $o);
verifier("une minute après → on n'insiste pas encore", $o->courriels === []);
$o->horloge += 10 * 60;
conclureCommande($o->relire('cmd-1'), $o);
verifier('plus tard → le billet repart', $o->courriels === ['ZIN-ABC234']);

/* 6. Une commande déjà payée dont le mail n'est jamais parti (le cas du 17 novembre). */
$o = new OutilsSimules();
conclureCommande(nouvelleCommande($o, ['statut' => 'payee', 'payeeLe' => '2026-11-17T18:00:00Z']), $o);
verifier('payée sans mail → le billet part enfin', $o->courriels === ['ZIN-ABC234']);

/* 7. SumUp annonce un autre montant que celui demandé. */
$o = new OutilsSimules();
$o->montantSumup = 1.0;
$alerte = false;
try {
    conclureCommande(nouvelleCommande($o), $o);
} catch (MontantDivergent) {
    $alerte = true;
}
verifier('montant faux → alerte', $alerte);
verifier('montant faux → ni billet ni « payée »', $o->courriels === [] && $o->base['cmd-1']['statut'] === 'en-attente');

/* 8. Paiement refusé, ou pas encore conclu. */
$o = new OutilsSimules();
$o->statutSumup = 'FAILED';
conclureCommande(nouvelleCommande($o), $o);
verifier('paiement refusé → commande échouée, aucun billet', $o->base['cmd-1']['statut'] === 'echouee' && $o->courriels === []);
$o = new OutilsSimules();
$o->statutSumup = 'PENDING';
conclureCommande(nouvelleCommande($o), $o);
verifier('paiement en cours → rien ne bouge', $o->base['cmd-1']['statut'] === 'en-attente' && $o->courriels === []);

/* 8 bis. Carte refusée, puis une autre carte acceptée sur la même page SumUp. */
$o = new OutilsSimules();
$o->statutSumup = 'FAILED';
conclureCommande(nouvelleCommande($o), $o);
verifier('carte refusée → commande échouée pour l\'instant', $o->base['cmd-1']['statut'] === 'echouee');
$o->statutSumup = 'PAID';
conclureCommande($o->relire('cmd-1'), $o);
conclureCommande($o->relire('cmd-1'), $o);
verifier('seconde carte acceptée → commande payée', $o->base['cmd-1']['statut'] === 'payee');
verifier('seconde carte acceptée → un seul billet', $o->courriels === ['ZIN-ABC234']);

/* 8 ter. Le mail est parti, mais Sanity ne répond pas au moment de le noter. */
$o = new class extends OutilsSimules {
    public function modifier(string $id, array $champs): void
    {
        throw new RuntimeException('Sanity injoignable');
    }
};
$plantage = false;
try {
    $c = conclureCommande(nouvelleCommande($o), $o);
} catch (Throwable) {
    $plantage = true;
}
verifier('note d\'envoi impossible → pas de page en erreur', !$plantage && $o->courriels === ['ZIN-ABC234']);
verifier('note d\'envoi impossible → la page annonce quand même le mail', !$plantage && !empty($c['billetEnvoyeLe']));

/* 9. Un billet pour une séance passée n'a plus de sens. */
$o = new OutilsSimules();
conclureCommande(nouvelleCommande($o, ['statut' => 'payee', 'seanceDate' => '2026-01-01']), $o);
verifier('séance passée → pas de billet envoyé', $o->courriels === []);

/* 10. Ce que SumUp envoie au serveur. */
verifier('notification lisible', sumupLireNotification('{"event_type":"CHECKOUT_STATUS_CHANGED","id":"4e425463-3e1b-431d-83fa-1e51c2925e99"}') === '4e425463-3e1b-431d-83fa-1e51c2925e99');
verifier('autre événement → ignoré', sumupLireNotification('{"event_type":"AUTRE","id":"abc"}') === null);
verifier('identifiant suspect → ignoré', sumupLireNotification('{"event_type":"CHECKOUT_STATUS_CHANGED","id":"x\' or 1"}') === null);
verifier('corps illisible → ignoré', sumupLireNotification('pas du json') === null);
verifier('identifiant qui n\'est pas du texte → ignoré', sumupLireNotification('{"event_type":"CHECKOUT_STATUS_CHANGED","id":["a"]}') === null);

/* 11. Une commande n'est jamais lisible sans clé. Le site lit Sanity
   sans clé : seul un identifiant à point (« commandes.… ») protège
   l'e-mail de l'acheteur et la référence de son billet. */
require_once __DIR__ . '/../api/_billetterie.php';
verifier(
    'les commandes vont dans le dossier privé de Sanity',
    str_contains(PREFIXE_COMMANDE_PRIVEE, '.') && str_ends_with(PREFIXE_COMMANDE_PRIVEE, '.')
        && !str_starts_with(PREFIXE_COMMANDE_PRIVEE, 'drafts.')
        && !str_starts_with(PREFIXE_COMMANDE_PRIVEE, 'versions.')
);
$creationCommande = (string) file_get_contents(__DIR__ . '/../api/creer-paiement.php');
verifier(
    'la création de commande utilise ce dossier privé',
    preg_match("/sanityCreer\(\[\s*'_id' => PREFIXE_COMMANDE_PRIVEE,\s*'_type' => 'commande'/", $creationCommande) === 1
);

echo $echecs === 0 ? "Tout est bon.\n" : "$echecs vérification(s) en échec.\n";
exit($echecs === 0 ? 0 : 1);
