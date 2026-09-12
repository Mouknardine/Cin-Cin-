<?php
/* ============================================================
   Zinéma — les règles de la billetterie.

   Tout ce qui décide de quelque chose est ici, et tout est décidé
   CÔTÉ SERVEUR : le prix, le nombre de places restantes, la
   validité de la séance. Le navigateur ne fait que demander « je
   veux 2 billets pour cette séance » — il ne dit jamais combien ça
   coûte. Sans quoi n'importe qui pourrait s'acheter un billet à
   1 franc en trafiquant la page.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_sanity.php';

/* Nombre maximum de billets par commande : au-delà, on préfère que
   le groupe appelle le cinéma (une salle fait 14 ou 18 places). */
const MAX_BILLETS_PAR_COMMANDE = 10;

/* Une commande non payée retient ses places pendant ce délai, puis
   les rend : sans ça, un panier abandonné bloquerait des sièges
   pour toujours. */
const MINUTES_RESERVATION = 30;

/* ---------------- La séance et son état ---------------- */

/* Rassemble en une seule requête tout ce dont dépend un achat :
   la séance, les tarifs, la salle, et les billets déjà pris. */
function chargerContexte(string $idSeance): array
{
    $limite = gmdate('Y-m-d\TH:i:s\Z', time() - MINUTES_RESERVATION * 60);

    $donnees = sanityLire(
        '{
          "seance": *[_type == "screening" && _id == $id][0]{
            _id, date, time, room, status,
            "filmTitre": film->title
          },
          "cinemaDeLaSeance": *[_type == "screening" && _id == $id][0]
             .cinema->{tarifPlein, tarifReduit, salles},
          "cinemaHistorique": *[_id == "siteSettings"][0]{tarifPlein, tarifReduit, salles},
          "prises": *[_type == "commande" && seance._ref == $id
             && (statut == "payee" || (statut == "en-attente" && creeLe > $limite))
          ]{billetsPlein, billetsReduit}
        }',
        ['id' => $idSeance, 'limite' => $limite]
    );

    $seance = $donnees['seance'] ?? null;
    if (!is_array($seance)) {
        echec("Cette séance n'existe pas ou n'est plus programmée.", 404);
    }
    if (($seance['status'] ?? '') !== 'disponible') {
        echec("Cette séance n'est plus en vente.", 409);
    }
    if (($seance['date'] ?? '') < date('Y-m-d')) {
        echec('Cette séance est passée.', 409);
    }

    /* Le prix et le nombre de sièges viennent du cinéma OÙ A LIEU LA
       SÉANCE : un seul Studio alimente plusieurs cinémas, et deux
       cinémas n'ont ni les mêmes tarifs ni les mêmes salles.

       La seconde piste ne sert qu'aux séances enregistrées avant que
       le Studio ne connaisse plusieurs cinémas : elles ne disent pas
       encore où elles ont lieu. Le script
       sanity/import/reprendre-les-cinemas.mjs les rattache à Zinéma,
       après quoi cette piste peut disparaître. */
    $reglages = $donnees['cinemaDeLaSeance'] ?? null;
    if (!is_array($reglages)) {
        $reglages = $donnees['cinemaHistorique'] ?? [];
    }
    $places = placesDeLaSalle($reglages['salles'] ?? [], (string) ($seance['room'] ?? ''));

    $dejaPris = 0;
    foreach (($donnees['prises'] ?? []) as $commande) {
        $dejaPris += (int) ($commande['billetsPlein'] ?? 0) + (int) ($commande['billetsReduit'] ?? 0);
    }

    return [
        'seance' => $seance,
        'tarifPlein' => (float) ($reglages['tarifPlein'] ?? 16),
        'tarifReduit' => (float) ($reglages['tarifReduit'] ?? 10),
        'places' => $places,
        'restantes' => max(0, $places - $dejaPris),
    ];
}

/* Le nombre de sièges d'une salle, tel que renseigné dans la fiche
   du cinéma. Salle inconnue : on refuse la vente plutôt que de
   deviner — mieux vaut une caisse fermée qu'une salle vendue deux
   fois. C'est ce qui arrive si une salle est renommée dans sa fiche
   sans que ses séances suivent. */
function placesDeLaSalle(array $salles, string $nom): int
{
    foreach ($salles as $salle) {
        if (($salle['nom'] ?? '') === $nom) {
            return max(0, (int) ($salle['places'] ?? 0));
        }
    }
    echec(
        "La billetterie en ligne n'est pas ouverte pour cette salle.",
        503,
        "Salle « $nom » absente des réglages du site (champ « Salles et nombre de places »)."
    );
}

/* ---------------- Vérifier la demande du client ---------------- */

function nombreDemande(array $corps, string $champ): int
{
    $valeur = $corps[$champ] ?? 0;
    if (!is_int($valeur) && !(is_string($valeur) && ctype_digit($valeur))) {
        echec('Nombre de billets invalide.', 422);
    }
    return (int) $valeur;
}

function emailValide(array $corps): string
{
    $email = trim((string) ($corps['email'] ?? ''));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 160) {
        echec('Merci d\'indiquer une adresse e-mail valide : le billet y sera envoyé.', 422);
    }
    return $email;
}

/* ---------------- La référence du billet ---------------- */

/* Un code court, lisible à voix haute et sans ambiguïté : ni O ni 0,
   ni I ni 1. Vérifié comme inutilisé avant d'être attribué. */
function nouvelleReference(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for ($essai = 0; $essai < 5; $essai++) {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        $reference = 'ZIN-' . $code;
        $existe = sanityLire('count(*[_type == "commande" && reference == $r])', ['r' => $reference]);
        if ((int) $existe === 0) {
            return $reference;
        }
    }
    throw new RuntimeException('Impossible de tirer une référence de billet libre après 5 essais.');
}

/* ---------------- Mise en forme ---------------- */

function libelleSeance(array $seance): string
{
    $jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    $mois = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
             'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    $t = strtotime((string) ($seance['date'] ?? '') . ' 12:00:00');
    if ($t === false) {
        return (string) ($seance['time'] ?? '');
    }
    return $jours[(int) date('w', $t)] . ' ' . (int) date('j', $t) . ' ' . $mois[(int) date('n', $t)]
        . ' à ' . ($seance['time'] ?? '');
}
