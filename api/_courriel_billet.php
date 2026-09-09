<?php
/* ============================================================
   Zinéma — ce que contient l'e-mail du billet.

   Trois formes du même billet, dans le même message :

     1. du texte simple, pour les logiciels qui ne lisent que ça,
        et pour les listes de courrier qui coupent le reste ;
     2. une version dessinée comme le site — mêmes cases, mêmes
        traits noirs, même rouge ;
     3. le billet en PDF, joint au message : c'est celui qu'on
        garde, qu'on imprime, ou qu'on montre à l'entrée sans
        réseau.

   Un client de messagerie n'est pas un navigateur : pas de feuille
   de style externe, pas de flex, pas de grille. Le quadrillage est
   donc fait de tableaux imbriqués, comme en 2003 — c'est la seule
   mise en page qui tienne debout d'Outlook à Gmail.

   Tout est encodé en base64, texte compris : une ligne de courriel
   ne peut pas dépasser mille signes, et un titre de film accentué
   suffirait à en faire une plus longue.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_billet_pdf.php';

/* Les couleurs du site (voir style.css). */
const BILLET_HTML_ENCRE = '#100f0c';
const BILLET_HTML_PAPIER = '#ededed';
const BILLET_HTML_ROUGE = '#c22a1d';
const BILLET_HTML_POLICE = 'Helvetica, Arial, sans-serif';

/**
 * La phrase qui annonce la pièce jointe.
 *
 * Le PDF porte une page par place achetée : on le dit au pluriel
 * quand il y en a plusieurs, pour que personne ne cherche un second
 * fichier qui n'existe pas.
 */
function billetCourrielMentionPdf(array $commande): string
{
    $places = (int) ($commande['billetsPlein'] ?? 0) + (int) ($commande['billetsReduit'] ?? 0);
    if ($places > 1) {
        return 'Les ' . $places . ' billets sont joints à ce message, un par page, en PDF.';
    }
    return 'Le billet est aussi joint à ce message, en PDF.';
}

/** Une case du tableau : son intitulé au-dessus, sa valeur dessous. */
function billetHtmlCase(string $intitule, string $valeur, string $taille = '20px'): string
{
    $police = BILLET_HTML_POLICE;
    return '<p style="margin:0 0 6px;font:700 11px/1.2 ' . $police
        . ';letter-spacing:0.06em;text-transform:uppercase;color:#5a5952;">'
        . htmlspecialchars($intitule, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p style="margin:0;font:700 ' . $taille . '/1.15 ' . $police
        . ';color:' . BILLET_HTML_ENCRE . ';">'
        . htmlspecialchars($valeur, ENT_QUOTES, 'UTF-8') . '</p>';
}

/** Le billet dessiné comme le site. */
function billetCourrielHtml(array $commande): string
{
    $police = BILLET_HTML_POLICE;
    $papier = BILLET_HTML_PAPIER;
    $encre = BILLET_HTML_ENCRE;

    $reference = htmlspecialchars((string) ($commande['reference'] ?? ''), ENT_QUOTES, 'UTF-8');
    $montant = (float) ($commande['montant'] ?? 0);
    $montantEcrit = rtrim(rtrim(number_format($montant, 2, '.', ''), '0'), '.') . '.-';

    $cellule = 'bgcolor="' . $papier . '" style="padding:18px 20px;"';

    $corps = '<tr><td ' . $cellule . '>'
        . '<p style="margin:0;font:700 26px/1 ' . $police . ';color:' . $encre . ';">ZINÉMA</p>'
        . '<p style="margin:4px 0 0;font:400 13px/1.3 ' . $police . ';color:' . $encre . ';">'
        . 'Rue du Maupas 4, 1004 Lausanne</p></td>'
        . '<td width="70" bgcolor="' . BILLET_HTML_ROUGE . '">&nbsp;</td></tr>';

    /* Le titre en majuscules, comme partout sur le site. La mise en
       majuscules se fait ici et pas en CSS : tous les logiciels de
       messagerie ne suivent pas « text-transform ». */
    $corps .= '<tr><td colspan="2" ' . $cellule . '>'
        . billetHtmlCase(
            'Film',
            mb_strtoupper((string) ($commande['filmTitre'] ?? ''), 'UTF-8'),
            '26px'
        )
        . '</td></tr>';

    $corps .= '<tr><td colspan="2" ' . $cellule . '>'
        . billetHtmlCase(
            'Séance',
            courrielDateEnToutesLettres((string) ($commande['seanceDate'] ?? ''))
                . ' à ' . ($commande['seanceHeure'] ?? '')
        )
        . '</td></tr>';

    $corps .= '<tr><td ' . $cellule . '>'
        . billetHtmlCase('Salle', (string) ($commande['seanceSalle'] ?? ''), '18px')
        . '</td><td ' . $cellule . '>'
        . billetHtmlCase('Payé', $montantEcrit, '18px')
        . '</td></tr>';

    /* La référence : la seule case blanche, la plus grande, celle
       que l'œil trouve avant d'avoir lu le reste. */
    $corps .= '<tr><td colspan="2" bgcolor="#ffffff" style="padding:24px 20px;">'
        . '<p style="margin:0 0 8px;font:700 11px/1.2 ' . $police
        . ';letter-spacing:0.06em;text-transform:uppercase;color:#5a5952;">Votre billet</p>'
        . '<p style="margin:0;font:700 38px/1 ' . $police . ';color:' . $encre . ';">'
        . $reference . '</p>'
        . '<p style="margin:10px 0 0;font:400 13px/1.4 ' . $police . ';color:' . $encre . ';">'
        . htmlspecialchars(billetCourrielMentionPdf($commande), ENT_QUOTES, 'UTF-8') . '</p>'
        . '</td></tr>';

    $corps .= '<tr><td colspan="2" ' . $cellule . '>'
        . '<p style="margin:0;font:400 13px/1.5 ' . $police . ';color:' . $encre . ';">'
        . 'Billets : ' . htmlspecialchars(
            courrielDetailBillets(
                (int) ($commande['billetsPlein'] ?? 0),
                (int) ($commande['billetsReduit'] ?? 0)
            ),
            ENT_QUOTES,
            'UTF-8'
        )
        . '</p></td></tr>';

    return '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<title>Votre billet — Zinéma</title></head>'
        . '<body style="margin:0;padding:24px 12px;background:' . $papier . ';">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
        . '<td align="center">'
        . '<table role="presentation" width="560" cellpadding="0" cellspacing="3" border="0"'
        . ' bgcolor="' . $encre . '" style="width:560px;max-width:100%;">'
        . $corps
        . '</table></td></tr></table></body></html>';
}

/** Le même billet en texte simple, pour les logiciels qui s'en tiennent là. */
function billetCourrielTexte(array $commande, string $adresseSite): string
{
    $montant = (float) ($commande['montant'] ?? 0);
    $lignes = [
        'ZINÉMA — VOTRE BILLET',
        '',
        'Référence : ' . ($commande['reference'] ?? ''),
        'À présenter à l\'entrée. Cette référence est votre billet.',
        'Le billet est aussi joint à ce message, en PDF.',
        '',
        'Film     : ' . ($commande['filmTitre'] ?? '—'),
        'Séance   : ' . courrielDateEnToutesLettres((string) ($commande['seanceDate'] ?? ''))
            . ' à ' . ($commande['seanceHeure'] ?? '—'),
        'Salle    : ' . ($commande['seanceSalle'] ?? '—'),
        'Billets  : ' . courrielDetailBillets(
            (int) ($commande['billetsPlein'] ?? 0),
            (int) ($commande['billetsReduit'] ?? 0)
        ),
        'Payé     : ' . rtrim(rtrim(number_format($montant, 2, '.', ''), '0'), '.') . '.-',
        '',
        '—',
        'Zinéma — Rue du Maupas 4, 1004 Lausanne',
        $adresseSite,
    ];
    return implode("\r\n", $lignes) . "\r\n";
}

/**
 * Assemble le message : les deux versions du texte, et le PDF joint.
 *
 * @return array{0: string, 1: string} les en-têtes de contenu, puis le corps
 */
function billetCourrielMessage(string $texte, string $html, ?string $pdf, string $nomPdf): array
{
    $limiteExterne = 'zin-' . bin2hex(random_bytes(8));
    $limiteTexte = 'alt-' . bin2hex(random_bytes(8));

    $partiesTexte = "--$limiteTexte\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($texte), 76, "\r\n")
        . "--$limiteTexte\r\n"
        . "Content-Type: text/html; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html), 76, "\r\n")
        . "--$limiteTexte--\r\n";

    /* Sans PDF — sa fabrication a échoué — le message reste un
       message : on ne renonce jamais à envoyer le billet. */
    if ($pdf === null) {
        return ["Content-Type: multipart/alternative; boundary=\"$limiteTexte\"", $partiesTexte];
    }

    $corps = "--$limiteExterne\r\n"
        . "Content-Type: multipart/alternative; boundary=\"$limiteTexte\"\r\n\r\n"
        . $partiesTexte
        . "--$limiteExterne\r\n"
        . "Content-Type: application/pdf; name=\"$nomPdf\"\r\n"
        . "Content-Transfer-Encoding: base64\r\n"
        . "Content-Disposition: attachment; filename=\"$nomPdf\"\r\n\r\n"
        . chunk_split(base64_encode($pdf), 76, "\r\n")
        . "--$limiteExterne--\r\n";

    return ["Content-Type: multipart/mixed; boundary=\"$limiteExterne\"", $corps];
}
