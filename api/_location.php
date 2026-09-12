<?php
/* ============================================================
   Zinéma — les demandes de location.

   Le formulaire de la page Location envoie ici. Le serveur relit
   tout ce qui arrive, retrouve dans Sanity l'adresse qui doit
   recevoir les demandes, et remet le message au serveur de
   courrier — la même voie que les billets.

   L'adresse du cinéma n'apparaît nulle part dans la page : elle
   ne quitte jamais le serveur, hors de portée des robots qui
   ramassent les adresses e-mail sur le web.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_courriel.php';
require_once __DIR__ . '/_sanity.php';

/* Un formulaire n'a pas besoin de plus, et une valeur plus longue
   n'est jamais une vraie demande. */
const LOCATION_MAX_COURT = 160;
const LOCATION_MAX_MESSAGE = 4000;

/* Une demande par quart d'heure et par adresse e-mail : de quoi se
   reprendre après une faute de frappe, pas de quoi inonder une
   boîte aux lettres. */
const LOCATION_DELAI_ENTRE_DEMANDES_S = 450;

/**
 * L'adresse qui reçoit les demandes.
 *
 * Celle de la fiche « Location » si elle est remplie, sinon l'e-mail
 * du cinéma. Aucune des deux : on ne peut rien envoyer, et on le dit.
 *
 * Le cinéma est nommé explicitement : un seul Studio alimente
 * plusieurs cinémas, et « le premier de la liste » aurait pu être
 * celui d'une autre ville. C'est le même identifiant que CINEMA_ID
 * dans assets/js/data.js — un site, un cinéma.
 */
function locationDestinataire(): string
{
    $lu = sanityLire(
        '{"location": *[_type == "location"][0].emailDemandes,'
        . ' "cinema": *[_id == "siteSettings"][0].email}'
    );

    foreach ([$lu['location'] ?? '', $lu['cinema'] ?? ''] as $piste) {
        $adresse = trim((string) $piste);
        if ($adresse !== '' && filter_var($adresse, FILTER_VALIDATE_EMAIL)) {
            return $adresse;
        }
    }

    throw new RuntimeException(
        'Aucune adresse de réception : « Location → Adresse qui reçoit les demandes » '
        . 'et « Réglages du cinéma → E-mail » sont vides tous les deux.'
    );
}

/**
 * Cette adresse a-t-elle déjà écrit il y a moins d'un quart d'heure ?
 *
 * Le repère est l'adresse e-mail saisie, et non l'adresse IP du
 * visiteur : sur un hébergement mutualisé, le serveur voit souvent
 * la même IP pour tout le monde, et une seule demande aurait fermé
 * le formulaire à tous les autres pendant un quart d'heure. C'est
 * arrivé au premier essai.
 *
 * Ce n'est pas une serrure — quelqu'un qui change d'adresse repasse.
 * C'est un garde-fou contre le double envoi par impatience ; les
 * robots, eux, sont arrêtés par le champ piège.
 *
 * On ne garde que l'empreinte de l'adresse et la date du dernier
 * envoi, dans un fichier temporaire : rien de lisible, et rien qui
 * survive au ménage du serveur. Un serveur qui ne sait pas écrire
 * son fichier temporaire laisse passer — mieux vaut une demande de
 * trop qu'un formulaire cassé.
 */
function locationTropRapide(string $email): bool
{
    $email = mb_strtolower(trim($email));
    if ($email === '') {
        return false;
    }
    $fichier = sys_get_temp_dir() . '/zinema-location-' . hash('sha256', $email) . '.txt';

    $dernier = is_readable($fichier) ? (int) @file_get_contents($fichier) : 0;
    if ($dernier > 0 && (time() - $dernier) < LOCATION_DELAI_ENTRE_DEMANDES_S) {
        return true;
    }

    @file_put_contents($fichier, (string) time());
    return false;
}

/**
 * Les coordonnées de la demande, une par ligne.
 *
 * Un champ vide ne laisse pas de ligne vide : le téléphone et la
 * date sont facultatifs, et une demande sans eux se lit aussi bien.
 */
function locationCoordonnees(array $d): array
{
    $lignes = [];
    foreach ([
        'Nom' => $d['nom'],
        'E-mail' => $d['email'],
        'Téléphone' => $d['telephone'],
        'Espace' => $d['espace'],
        'Date' => $d['date'],
        'Personnes' => $d['personnes'],
    ] as $intitule => $valeur) {
        $valeur = trim((string) $valeur);
        if ($valeur !== '') {
            $lignes[] = $intitule . ' : ' . $valeur;
        }
    }
    return $lignes;
}

/**
 * Écrit et remet le message au cinéma.
 *
 * Le message répond directement au visiteur : « Répondre » dans la
 * boîte du cinéma écrit à la personne qui a rempli le formulaire,
 * pas au serveur.
 */
function locationEnvoyerDemande(array $d): bool
{
    $config = config();
    $expediteur = (string) ($config['courriel']['expediteur'] ?? COURRIEL_EXPEDITEUR_PAR_DEFAUT);
    $nomExpediteur = (string) ($config['courriel']['nom'] ?? COURRIEL_NOM_PAR_DEFAUT);

    $sujet = 'Demande de location — ' . $d['nom'];

    $lignes = array_merge(
        ['ZINÉMA — DEMANDE DE LOCATION', ''],
        locationCoordonnees($d),
        [
            '',
            'Son projet :',
            $d['message'],
            '',
            '—',
            'Envoyé depuis le formulaire de la page Location.',
            'Répondre à ce message écrit directement à ' . $d['email'] . '.',
        ]
    );

    $entetes = implode("\r\n", [
        'From: ' . courrielSujetEncode($nomExpediteur) . ' <' . $expediteur . '>',
        'Reply-To: ' . $d['email'],
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'X-Mailer: zinema-location',
    ]);

    return courrielExpedier(
        locationDestinataire(),
        courrielSujetEncode($sujet),
        implode("\r\n", $lignes) . "\r\n",
        $entetes,
        $expediteur
    );
}
