<?php
/* ============================================================
   Zinéma — le billet en PDF, dessiné comme le site.

   Le même tableau que partout ailleurs : des cases séparées par
   des traits noirs, une couleur franche par-ci par-là, et la
   référence posée en très grand — c'est elle, le billet.

     ┌──────────────────────────────┬──────────────────┐
     │ ZINÉMA                       │  (aplat rouge)   │
     ├──────────────────────────────┴──────────────────┤
     │ LE DERNIER POUR LA ROUTE                        │
     ├──────────────┬───────────────┬──────────────────┤
     │ DATE         │ HEURE         │ SALLE            │
     │ mer. 9 sept. │ 19:00         │ Salle 1          │
     ├──────────────┴───────────────┴──────────────────┤
     │ VOTRE BILLET                                    │
     │ ZIN-A4K2P9                                      │
     ├────────────────────────┬────────────────────────┤
     │ BILLETS                │ PAYÉ                   │
     └────────────────────────┴────────────────────────┘

   Le trait noir n'est pas dessiné trait par trait : la page est
   noire, et chaque case est un rectangle clair posé dessus. Le
   quadrillage est donc exactement celui du site — ce qui reste du
   fond entre deux cases.

   Format A5 paysage : lisible sur un téléphone, imprimable sur
   une A4 sans réglage.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_pdf.php';

/* La date en toutes lettres et le détail des billets sont écrits
   une seule fois, dans _courriel.php : ce fichier les emprunte au
   moment de dessiner, jamais au chargement. Il se charge donc
   toujours depuis l'envoi du courriel, qui a déjà tout en main. */

/* Les couleurs du site, à l'identique (voir style.css). */
const BILLET_ENCRE = [16, 15, 12];
const BILLET_PAPIER = [237, 237, 237];
const BILLET_ROUGE = [194, 42, 29];
const BILLET_BLANC = [255, 255, 255];

const BILLET_LARGEUR = 595.28;
const BILLET_HAUTEUR = 419.53;
const BILLET_TRAIT = 3.0;
const BILLET_MARGE = 22.0;

/**
 * Dessine une case claire et rend ses coordonnées intérieures.
 *
 * @return array{0: float, 1: float} le coin haut-gauche du texte
 */
function billetCase(PdfSimple $pdf, float $x, float $y, float $l, float $h, array $couleur = BILLET_PAPIER): array
{
    $pdf->remplir($x, $y, $l, $h, $couleur);
    return [$x + BILLET_MARGE, $y + BILLET_MARGE];
}

/** L'intitulé d'une case : petit, en majuscules, comme sur le site. */
function billetIntitule(PdfSimple $pdf, string $texte, float $x, float $y, array $couleur = BILLET_ENCRE): void
{
    $pdf->texte(mb_strtoupper($texte, 'UTF-8'), $x, $y + 9, 9.5, true, $couleur);
}

/**
 * Le billet complet, prêt à être joint à un courriel.
 *
 * Aucune donnée n'est inventée : une valeur absente laisse sa case
 * avec son seul intitulé, jamais un tiret ni un texte de
 * remplacement.
 */
function billetPdf(array $commande): string
{
    $pdf = new PdfSimple(BILLET_LARGEUR, BILLET_HAUTEUR);
    $t = BILLET_TRAIT;

    /* Le fond noir : tout ce qui restera visible entre les cases. */
    $pdf->remplir(0, 0, BILLET_LARGEUR, BILLET_HAUTEUR, BILLET_ENCRE);

    $gauche = $t;
    $largeurUtile = BILLET_LARGEUR - 2 * $t;
    $y = $t;

    /* ---------------- L'en-tête ---------------- */
    $hauteurEntete = 70;
    $largeurAplat = 96;
    [$tx, $ty] = billetCase($pdf, $gauche, $y, $largeurUtile - $largeurAplat - $t, $hauteurEntete);
    $pdf->texte('ZINÉMA', $tx, $ty + 20, 28, true);
    $pdf->texte('Rue du Maupas 4, 1004 Lausanne', $tx, $ty + 36, 10.5);
    $pdf->remplir(
        BILLET_LARGEUR - $t - $largeurAplat,
        $y,
        $largeurAplat,
        $hauteurEntete,
        BILLET_ROUGE
    );
    $y += $hauteurEntete + $t;

    /* ---------------- Le film ---------------- */
    $hauteurFilm = 92;
    [$tx, $ty] = billetCase($pdf, $gauche, $y, $largeurUtile, $hauteurFilm);
    $titre = mb_strtoupper(trim((string) ($commande['filmTitre'] ?? '')), 'UTF-8');
    if ($titre !== '') {
        $largeurTexte = $largeurUtile - 2 * BILLET_MARGE;
        /* Un titre long se pose plus petit ; au-delà du raisonnable,
           il est raccourci plutôt que de sortir de sa case. */
        $taille = $pdf->taillePourTenir($titre, $largeurTexte, 38, 20, true);
        $titre = $pdf->tronquer($titre, $largeurTexte, $taille, true);
        $pdf->texte($titre, $tx, $ty + 34, $taille, true);
    }
    billetIntitule($pdf, 'Film', $tx, $ty + 44);
    $y += $hauteurFilm + $t;

    /* ---------------- Date, heure, salle ---------------- */
    $hauteurSeance = 78;
    /* Les trois colonnes ne sont pas égales : une date en toutes
       lettres demande deux fois la place d'une heure. Découpées en
       tiers, elle s'y retrouvait raccourcie. */
    $disponible = $largeurUtile - 2 * $t;
    $seance = [
        ['Date', courrielDateEnToutesLettres((string) ($commande['seanceDate'] ?? '')), 0.46],
        ['Heure', (string) ($commande['seanceHeure'] ?? ''), 0.22],
        ['Salle', (string) ($commande['seanceSalle'] ?? ''), 0.32],
    ];
    $x = $gauche;
    foreach ($seance as [$intitule, $valeur, $part]) {
        $colonne = $disponible * $part;
        [$tx, $ty] = billetCase($pdf, $x, $y, $colonne, $hauteurSeance);
        billetIntitule($pdf, $intitule, $tx, $ty);
        $largeurTexte = $colonne - 2 * BILLET_MARGE;
        $taille = $pdf->taillePourTenir($valeur, $largeurTexte, 17, 9.5, true);
        $pdf->texte($pdf->tronquer($valeur, $largeurTexte, $taille, true), $tx, $ty + 38, $taille, true);
        $x += $colonne + $t;
    }
    $y += $hauteurSeance + $t;

    /* ---------------- La référence ----------------
       La seule chose qu'on présente à l'entrée : elle prend la
       place qu'elle mérite, dans la seule case franchement blanche
       du billet — celle que l'œil trouve en premier. */
    $hauteurReference = BILLET_HAUTEUR - $y - $t;
    $largeurBillets = 200;
    [$tx, $ty] = billetCase(
        $pdf,
        $gauche,
        $y,
        $largeurUtile - $largeurBillets - $t,
        $hauteurReference,
        BILLET_BLANC
    );
    billetIntitule($pdf, 'Votre billet', $tx, $ty);
    $reference = (string) ($commande['reference'] ?? '');
    $largeurTexte = $largeurUtile - $largeurBillets - $t - 2 * BILLET_MARGE;
    $taille = $pdf->taillePourTenir($reference, $largeurTexte, 46, 22, true);
    $pdf->texte($reference, $tx, $ty + 62, $taille, true);
    $pdf->texte('À présenter à l\'entrée.', $tx, $ty + 84, 10.5);

    /* ---------------- Billets et montant ---------------- */
    $x = BILLET_LARGEUR - $t - $largeurBillets;
    $hauteurBillets = ($hauteurReference - $t) / 2;
    [$tx, $ty] = billetCase($pdf, $x, $y, $largeurBillets, $hauteurBillets);
    billetIntitule($pdf, 'Billets', $tx, $ty);
    $detail = courrielDetailBillets(
        (int) ($commande['billetsPlein'] ?? 0),
        (int) ($commande['billetsReduit'] ?? 0)
    );
    $largeurTexte = $largeurBillets - 2 * BILLET_MARGE;
    $taille = $pdf->taillePourTenir($detail, $largeurTexte, 14, 9, false);
    $pdf->texte($detail, $tx, $ty + 32, $taille);

    [$tx, $ty] = billetCase($pdf, $x, $y + $hauteurBillets + $t, $largeurBillets, $hauteurBillets);
    billetIntitule($pdf, 'Payé', $tx, $ty);
    $montant = (float) ($commande['montant'] ?? 0);
    $pdf->texte(
        rtrim(rtrim(number_format($montant, 2, '.', ''), '0'), '.') . '.-',
        $tx,
        $ty + 36,
        22,
        true
    );

    return $pdf->rendu();
}
