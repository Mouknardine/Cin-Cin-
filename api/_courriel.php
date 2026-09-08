<?php
/* ============================================================
   Zinéma — l'envoi du billet par e-mail.

   Le billet, c'est la référence. Cet e-mail existe pour que le
   client la retrouve après avoir fermé la page : sans lui, fermer
   l'onglet revient à perdre sa place.

   L'envoi passe par la fonction d'envoi du serveur, sans mot de
   passe à stocker. En contrepartie, un message peut atterrir dans
   les indésirables : c'est pourquoi la page du billet continue
   d'afficher la référence en grand, et n'invite jamais à se fier
   au seul e-mail.

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

    /* Le cinquième argument fixe l'expéditeur d'enveloppe : sans lui,
       le serveur envoie sous une adresse technique et les filtres
       anti-spam s'en méfient. */
    $envoye = @mail(
        $destinataire,
        courrielSujetEncode($sujet),
        $message,
        $entetes,
        '-f' . $expediteur
    );

    if (!$envoye) {
        error_log('[zinema-billetterie] échec de l\'envoi du billet ' . $reference);
    }
    return $envoye;
}
