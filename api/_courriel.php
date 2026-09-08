<?php
/* ============================================================
   Zinéma — l'envoi du billet par e-mail.

   Le billet, c'est la référence. Cet e-mail existe pour que le
   client la retrouve après avoir fermé la page : sans lui, fermer
   l'onglet revient à perdre sa place.

   L'envoi passe par le serveur de courrier d'Infomaniak, avec les
   identifiants d'une boîte du domaine. La fonction mail() de PHP
   est désactivée sur cet hébergement — comme sur la plupart des
   mutualisés, pour endiguer le spam : il n'existe donc pas de
   solution « sans mot de passe ».

   Tant que ces identifiants ne sont pas renseignés, rien n'est
   envoyé et la page du billet n'annonce aucun envoi. Elle affiche
   la référence en grand, qui reste le vrai billet.

   Le message est en texte simple, volontairement. Un billet n'a
   besoin d'aucune mise en forme, et le texte simple passe partout
   — vieux logiciels compris — sans jamais être coupé.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_socle.php';

const COURRIEL_EXPEDITEUR_PAR_DEFAUT = 'admin@zinema.ch';
const COURRIEL_NOM_PAR_DEFAUT = 'Zinéma';

/* Les mois en toutes lettres. L'extension « intl » n'est pas
   garantie sur un hébergement mutualisé : douze mots coûtent moins
   cher qu'une dépendance qui peut manquer. */
const COURRIEL_MOIS = [
    1 => 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const COURRIEL_JOURS = [
    'Sunday' => 'dimanche', 'Monday' => 'lundi', 'Tuesday' => 'mardi',
    'Wednesday' => 'mercredi', 'Thursday' => 'jeudi',
    'Friday' => 'vendredi', 'Saturday' => 'samedi',
];

/* « 2026-09-09 » → « mercredi 9 septembre 2026 ». */
function courrielDateEnToutesLettres(string $dateISO): string
{
    $t = strtotime($dateISO . ' 12:00:00 UTC');
    if ($t === false) {
        return $dateISO;
    }
    $jour = COURRIEL_JOURS[gmdate('l', $t)] ?? '';
    $mois = COURRIEL_MOIS[(int) gmdate('n', $t)] ?? '';
    return trim($jour . ' ' . (int) gmdate('j', $t) . ' ' . $mois . ' ' . gmdate('Y', $t));
}

/* Un sujet d'e-mail contenant des accents doit être encodé, sinon
   certains logiciels affichent des caractères illisibles. */
function courrielSujetEncode(string $sujet): string
{
    return '=?UTF-8?B?' . base64_encode($sujet) . '?=';
}

function courrielDetailBillets(int $plein, int $reduit): string
{
    $morceaux = [];
    if ($plein > 0) {
        $morceaux[] = $plein . ' plein tarif';
    }
    if ($reduit > 0) {
        $morceaux[] = $reduit . ' tarif réduit';
    }
    return $morceaux ? implode(' et ', $morceaux) : '—';
}

/**
 * Envoie le billet. Renvoie vrai si le serveur a accepté le message.
 *
 * Un échec n'est jamais fatal : le client a déjà payé et son billet
 * s'affiche à l'écran. On le consigne, on continue.
 */
function courrielEnvoyerBillet(array $commande): bool
{
    $destinataire = trim((string) ($commande['email'] ?? ''));
    if ($destinataire === '' || !filter_var($destinataire, FILTER_VALIDATE_EMAIL)) {
        error_log('[zinema-billetterie] billet non envoyé : adresse e-mail inexploitable');
        return false;
    }

    $config = config();
    $expediteur = (string) ($config['courriel']['expediteur'] ?? COURRIEL_EXPEDITEUR_PAR_DEFAUT);
    $nomExpediteur = (string) ($config['courriel']['nom'] ?? COURRIEL_NOM_PAR_DEFAUT);
    $adresseSite = rtrim((string) ($config['site']['url'] ?? 'https://www.zinema.ch'), '/');

    $reference = (string) ($commande['reference'] ?? '');
    $montant = (float) ($commande['montant'] ?? 0);
    $montantEcrit = rtrim(rtrim(number_format($montant, 2, '.', ''), '0'), '.') . '.-';

    $sujet = 'Votre billet ' . $reference . ' — ' . ($commande['filmTitre'] ?? 'Zinéma');

    $lignes = [
        'ZINÉMA — VOTRE BILLET',
        '',
        'Référence : ' . $reference,
        'À présenter à l\'entrée. Cette référence est votre billet.',
        '',
        'Film     : ' . ($commande['filmTitre'] ?? '—'),
        'Séance   : ' . courrielDateEnToutesLettres((string) ($commande['seanceDate'] ?? ''))
            . ' à ' . ($commande['seanceHeure'] ?? '—'),
        'Salle    : ' . ($commande['seanceSalle'] ?? '—'),
        'Billets  : ' . courrielDetailBillets(
            (int) ($commande['billetsPlein'] ?? 0),
            (int) ($commande['billetsReduit'] ?? 0)
        ),
        'Payé     : ' . $montantEcrit,
        '',
        'Retrouver ce billet à tout moment :',
        $adresseSite . '/billet/?ref=' . rawurlencode($reference),
        '',
        '—',
        'Zinéma — Rue du Maupas 4, 1004 Lausanne',
        $adresseSite,
    ];
    $message = implode("\r\n", $lignes) . "\r\n";

    $entetes = implode("\r\n", [
        'From: ' . courrielSujetEncode($nomExpediteur) . ' <' . $expediteur . '>',
        'Reply-To: ' . $expediteur,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'X-Mailer: zinema-billetterie',
    ]);

    try {
        $envoye = courrielExpedier(
            $destinataire,
            courrielSujetEncode($sujet),
            $message,
            $entetes,
            $expediteur
        );
    } catch (Throwable $e) {
        /* Un billet payé ne doit JAMAIS tomber sur une page d'erreur
           parce que son e-mail n'est pas parti. On consigne, on rend
           la main, la page affiche le billet. */
        error_log('[zinema-billetterie] envoi impossible : ' . $e->getMessage());
        return false;
    }

    if (!$envoye) {
        error_log('[zinema-billetterie] échec de l\'envoi du billet ' . $reference);
    }
    return $envoye;
}

/**
 * Remet le message au serveur de courrier.
 *
 * Deux chemins, dans cet ordre :
 *   1. le serveur SMTP du domaine, si ses identifiants sont dans
 *      config.php — c'est la voie normale, et la seule fiable ;
 *   2. la fonction mail() de PHP, si l'hébergeur la laisse active.
 *
 * Aucun des deux disponible : on renvoie faux, sans rien casser.
 */
function courrielExpedier(
    string $destinataire,
    string $sujetEncode,
    string $message,
    string $entetes,
    string $expediteur
): bool {
    $smtp = config()['courriel']['smtp'] ?? null;
    if (is_array($smtp) && !empty($smtp['hote']) && !empty($smtp['utilisateur'])) {
        return courrielViaSmtp($smtp, $destinataire, $sujetEncode, $message, $entetes, $expediteur);
    }

    if (!function_exists('mail')) {
        error_log(
            '[zinema-billetterie] aucun moyen d\'envoi : mail() est désactivé sur cet '
            . 'hébergement et aucun serveur SMTP n\'est configuré dans config.php.'
        );
        return false;
    }

    /* Le cinquième argument fixe l'expéditeur d'enveloppe : sans lui,
       le serveur envoie sous une adresse technique et les filtres
       anti-spam s'en méfient. */
    return @mail($destinataire, $sujetEncode, $message, $entetes, '-f' . $expediteur);
}

/**
 * Envoi par le serveur de courrier du domaine.
 *
 * Un dialogue SMTP tient en quelques lignes ; y ajouter une
 * bibliothèque entière pour un message par billet coûterait plus
 * cher à maintenir. Rien d'exotique ici : on se présente, on
 * chiffre, on s'authentifie, on remet le message.
 */
function courrielViaSmtp(
    array $smtp,
    string $destinataire,
    string $sujetEncode,
    string $message,
    string $entetes,
    string $expediteur
): bool {
    $hote = (string) $smtp['hote'];
    $port = (int) ($smtp['port'] ?? 587);
    $utilisateur = (string) $smtp['utilisateur'];
    $motDePasse = (string) ($smtp['mot_de_passe'] ?? '');

    $flux = @stream_socket_client("tcp://$hote:$port", $err, $errMsg, 15);
    if (!$flux) {
        error_log("[zinema-billetterie] SMTP injoignable ($hote:$port) : $errMsg");
        return false;
    }
    stream_set_timeout($flux, 20);

    /* Une réponse SMTP peut tenir sur plusieurs lignes : « 250-… »
       annonce une suite, « 250 … » la termine. */
    $lire = static function () use ($flux): string {
        $tout = '';
        while (($ligne = fgets($flux, 2048)) !== false) {
            $tout .= $ligne;
            if (strlen($ligne) < 4 || $ligne[3] !== '-') {
                break;
            }
        }
        return $tout;
    };
    $dire = static function (string $commande) use ($flux): void {
        fwrite($flux, $commande . "\r\n");
    };
    $attendu = static function (string $reponse, string $code, string $etape) use ($flux): bool {
        if (str_starts_with($reponse, $code)) {
            return true;
        }
        error_log("[zinema-billetterie] SMTP a refusé à l'étape « $etape » : " . trim($reponse));
        fclose($flux);
        return false;
    };

    $nomLocal = $_SERVER['SERVER_NAME'] ?? 'zinema.ch';

    if (!$attendu($lire(), '220', 'accueil')) return false;
    $dire('EHLO ' . $nomLocal);
    if (!$attendu($lire(), '250', 'présentation')) return false;

    /* Le chiffrement n'est pas négociable : sans lui, le mot de passe
       de la boîte traverserait le réseau en clair. */
    $dire('STARTTLS');
    if (!$attendu($lire(), '220', 'demande de chiffrement')) return false;
    if (!@stream_socket_enable_crypto($flux, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
        error_log('[zinema-billetterie] SMTP : le chiffrement a échoué');
        fclose($flux);
        return false;
    }
    $dire('EHLO ' . $nomLocal);
    if (!$attendu($lire(), '250', 'présentation chiffrée')) return false;

    $dire('AUTH LOGIN');
    if (!$attendu($lire(), '334', 'ouverture de session')) return false;
    $dire(base64_encode($utilisateur));
    if (!$attendu($lire(), '334', 'identifiant')) return false;
    $dire(base64_encode($motDePasse));
    if (!$attendu($lire(), '235', 'mot de passe')) return false;

    $dire('MAIL FROM:<' . $expediteur . '>');
    if (!$attendu($lire(), '250', 'expéditeur')) return false;
    $dire('RCPT TO:<' . $destinataire . '>');
    if (!$attendu($lire(), '250', 'destinataire')) return false;
    $dire('DATA');
    if (!$attendu($lire(), '354', 'début du message')) return false;

    /* Une ligne réduite à un point termine le message : si le texte en
       contenait une, elle couperait tout. On la neutralise. */
    $corps = preg_replace('/^\./m', '..', $message);
    $dire("To: $destinataire\r\nSubject: $sujetEncode\r\n$entetes\r\n\r\n$corps\r\n.");
    if (!$attendu($lire(), '250', 'remise du message')) return false;

    $dire('QUIT');
    fclose($flux);
    return true;
}
