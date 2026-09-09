<?php
/* ============================================================
   Zinéma — un générateur de PDF minuscule, écrit à la main.

   Il ne sait faire que trois choses : des rectangles pleins, du
   texte, et mesurer un texte avant de l'écrire. C'est exactement
   ce qu'il faut pour un billet dessiné comme le site — des cases
   séparées par des traits noirs — et rien de plus.

   Pourquoi pas une bibliothèque ? Parce qu'il n'y a ni Composer ni
   dossier vendor sur cet hébergement : ajouter TCPDF ou Dompdf,
   c'est ajouter des milliers de fichiers à publier par FTP, et une
   mise à jour à surveiller, pour dessiner six rectangles.

   Les deux polices sont celles que tout lecteur de PDF possède
   d'origine (Helvetica normale et grasse) : rien à embarquer, le
   fichier pèse quelques kilo-octets. Le texte y est écrit en
   Windows-1252, le seul encodage que ces polices savent lire — les
   accents français y passent tous.

   Le repère est celui d'une page qu'on lit : l'origine est en HAUT
   à gauche, et y descend. Le PDF, lui, compte depuis le bas ; la
   conversion se fait ici, une fois pour toutes.
   ============================================================ */

declare(strict_types=1);

final class PdfSimple
{
    /** Largeurs des caractères, en millièmes de la taille du texte. */
    private const LARGEURS_NORMALE = [
        32 => 278, 33 => 278, 34 => 355, 35 => 556, 36 => 556, 37 => 889, 38 => 667,
        39 => 191, 40 => 333, 41 => 333, 42 => 389, 43 => 584, 44 => 278, 45 => 333,
        46 => 278, 47 => 278, 58 => 278, 59 => 278, 60 => 584, 61 => 584, 62 => 584,
        63 => 556, 64 => 1015, 65 => 667, 66 => 667, 67 => 722, 68 => 722, 69 => 667,
        70 => 611, 71 => 778, 72 => 722, 73 => 278, 74 => 500, 75 => 667, 76 => 556,
        77 => 833, 78 => 722, 79 => 778, 80 => 667, 81 => 778, 82 => 722, 83 => 667,
        84 => 611, 85 => 722, 86 => 667, 87 => 944, 88 => 667, 89 => 667, 90 => 611,
        91 => 278, 92 => 278, 93 => 278, 95 => 556, 97 => 556, 98 => 556, 99 => 500,
        100 => 556, 101 => 556, 102 => 278, 103 => 556, 104 => 556, 105 => 222,
        106 => 222, 107 => 500, 108 => 222, 109 => 833, 110 => 556, 111 => 556,
        112 => 556, 113 => 556, 114 => 333, 115 => 500, 116 => 278, 117 => 556,
        118 => 500, 119 => 722, 120 => 500, 121 => 500, 122 => 500,
    ];
    private const LARGEURS_GRASSE = [
        32 => 278, 33 => 333, 34 => 474, 35 => 556, 36 => 556, 37 => 889, 38 => 722,
        39 => 238, 40 => 333, 41 => 333, 42 => 389, 43 => 584, 44 => 278, 45 => 333,
        46 => 278, 47 => 278, 58 => 333, 59 => 333, 60 => 584, 61 => 584, 62 => 584,
        63 => 611, 64 => 975, 65 => 722, 66 => 722, 67 => 722, 68 => 722, 69 => 667,
        70 => 611, 71 => 778, 72 => 722, 73 => 278, 74 => 556, 75 => 722, 76 => 611,
        77 => 833, 78 => 722, 79 => 778, 80 => 667, 81 => 778, 82 => 722, 83 => 667,
        84 => 611, 85 => 722, 86 => 667, 87 => 944, 88 => 667, 89 => 667, 90 => 611,
        91 => 333, 92 => 278, 93 => 333, 95 => 556, 97 => 556, 98 => 611, 99 => 556,
        100 => 611, 101 => 556, 102 => 333, 103 => 611, 104 => 611, 105 => 278,
        106 => 278, 107 => 556, 108 => 278, 109 => 889, 110 => 611, 111 => 611,
        112 => 611, 113 => 611, 114 => 389, 115 => 556, 116 => 333, 117 => 611,
        118 => 556, 119 => 778, 120 => 556, 121 => 556, 122 => 500,
    ];
    /* Un chiffre pour les caractères absents des tables : les lettres
       accentuées ont la largeur de la lettre qu'elles accentuent. */
    private const LARGEUR_PAR_DEFAUT = [556, 611];

    private string $contenu = '';
    /** Les pages déjà terminées ; celle en cours vit dans $contenu. */
    private array $pages = [];

    public function __construct(
        private readonly float $largeur,
        private readonly float $hauteur
    ) {
    }

    /**
     * Termine la page en cours et en ouvre une nouvelle.
     *
     * Deux billets pour la même séance, c'est deux pages : on en
     * garde un et on donne l'autre, sans avoir à découper la feuille.
     */
    public function nouvellePage(): void
    {
        $this->pages[] = $this->contenu;
        $this->contenu = '';
    }

    /* ---------------- Dessiner ---------------- */

    /** Un rectangle plein. Couleur en composantes 0-255. */
    public function remplir(float $x, float $y, float $l, float $h, array $couleur): void
    {
        [$r, $v, $b] = $couleur;
        $this->contenu .= sprintf(
            "%.3F %.3F %.3F rg %.2F %.2F %.2F %.2F re f\n",
            $r / 255,
            $v / 255,
            $b / 255,
            $x,
            $this->hauteur - $y - $h,
            $l,
            $h
        );
    }

    /**
     * Une ligne de texte, posée sur sa ligne de base.
     *
     * $y est la distance entre le haut de la page et le bas des
     * lettres — la même chose que la ligne d'un cahier.
     */
    public function texte(
        string $texte,
        float $x,
        float $y,
        float $taille,
        bool $gras = false,
        array $couleur = [16, 15, 12]
    ): void {
        $encode = $this->encoder($texte);
        if ($encode === '') {
            return;
        }
        [$r, $v, $b] = $couleur;
        $this->contenu .= sprintf(
            "BT %.3F %.3F %.3F rg /%s %.2F Tf 1 0 0 1 %.2F %.2F Tm (%s) Tj ET\n",
            $r / 255,
            $v / 255,
            $b / 255,
            $gras ? 'F1' : 'F2',
            $taille,
            $x,
            $this->hauteur - $y,
            $this->echapper($encode)
        );
    }

    /* ---------------- Mesurer ---------------- */

    /** La largeur qu'occupera ce texte, à cette taille. */
    public function largeurTexte(string $texte, float $taille, bool $gras = false): float
    {
        $encode = $this->encoder($texte);
        $table = $gras ? self::LARGEURS_GRASSE : self::LARGEURS_NORMALE;
        $defaut = self::LARGEUR_PAR_DEFAUT[$gras ? 1 : 0];

        $total = 0;
        for ($i = 0, $n = strlen($encode); $i < $n; $i++) {
            $total += $table[ord($encode[$i])] ?? $defaut;
        }
        return $total * $taille / 1000;
    }

    /**
     * La plus grande taille à laquelle ce texte tient dans cette
     * largeur, sans jamais dépasser la taille demandée ni descendre
     * sous le plancher : un titre de film long se pose en plus petit
     * plutôt que de sortir de sa case.
     */
    public function taillePourTenir(
        string $texte,
        float $largeurDisponible,
        float $tailleMax,
        float $taillePlancher,
        bool $gras = false
    ): float {
        $largeur = $this->largeurTexte($texte, $tailleMax, $gras);
        if ($largeur <= $largeurDisponible || $largeur <= 0) {
            return $tailleMax;
        }
        return max($taillePlancher, $tailleMax * $largeurDisponible / $largeur);
    }

    /** Le texte raccourci pour tenir dans cette largeur, suivi de « … ». */
    public function tronquer(string $texte, float $largeurDisponible, float $taille, bool $gras = false): string
    {
        if ($this->largeurTexte($texte, $taille, $gras) <= $largeurDisponible) {
            return $texte;
        }
        $mots = preg_split('/\s+/u', $texte) ?: [];
        $garde = '';
        foreach ($mots as $mot) {
            $essai = $garde === '' ? $mot : $garde . ' ' . $mot;
            if ($this->largeurTexte($essai . ' ...', $taille, $gras) > $largeurDisponible) {
                break;
            }
            $garde = $essai;
        }
        return ($garde === '' ? mb_substr($texte, 0, 12) : $garde) . ' ...';
    }

    /* ---------------- Écrire le fichier ---------------- */

    public function rendu(): string
    {
        $pages = $this->pages;
        $pages[] = $this->contenu;

        /* Quatre objets fixes (le catalogue, la liste des pages, les
           deux polices), puis deux objets par page : la page et son
           dessin. La cinquième place est donc celle de la première
           page. */
        $premierePage = 5;
        $renvois = [];
        for ($i = 0, $n = count($pages); $i < $n; $i++) {
            $renvois[] = ($premierePage + 2 * $i) . ' 0 R';
        }

        $objets = [
            "<</Type/Catalog/Pages 2 0 R>>",
            sprintf("<</Type/Pages/Kids[%s]/Count %d>>", implode(' ', $renvois), count($pages)),
            "<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>",
            "<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>",
        ];
        foreach ($pages as $index => $dessin) {
            $objets[] = sprintf(
                "<</Type/Page/Parent 2 0 R/MediaBox[0 0 %.2F %.2F]"
                . "/Resources<</Font<</F1 3 0 R/F2 4 0 R>>>>/Contents %d 0 R>>",
                $this->largeur,
                $this->hauteur,
                $premierePage + 2 * $index + 1
            );
            $objets[] = sprintf("<</Length %d>>\nstream\n%s\nendstream", strlen($dessin), $dessin);
        }

        $pdf = "%PDF-1.4\n";
        $positions = [];
        foreach ($objets as $index => $corps) {
            $positions[] = strlen($pdf);
            $pdf .= ($index + 1) . " 0 obj\n" . $corps . "\nendobj\n";
        }

        /* La table des positions : elle dit à quel octet commence
           chaque objet. Un lecteur de PDF s'y réfère pour n'ouvrir
           que ce dont il a besoin — d'où sa présence à la fin. */
        $debutTable = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objets) + 1) . "\n0000000000 65535 f \n";
        foreach ($positions as $position) {
            $pdf .= sprintf("%010d 00000 n \n", $position);
        }
        $pdf .= sprintf(
            "trailer\n<</Size %d/Root 1 0 R>>\nstartxref\n%d\n%%%%EOF",
            count($objets) + 1,
            $debutTable
        );

        return $pdf;
    }

    /* ---------------- Le texte, tel que le PDF l'attend ---------------- */

    /* Helvetica ne connaît pas l'UTF-8 : on repasse en Windows-1252,
       qui contient tous les accents français. Ce qui n'y figure pas
       (une flèche, un emoji collé dans un titre de film) devient un
       point d'interrogation plutôt que de casser le fichier. */
    private function encoder(string $texte): string
    {
        $converti = @iconv('UTF-8', 'Windows-1252//TRANSLIT', $texte);
        if ($converti === false) {
            $converti = preg_replace('/[^\x20-\x7E]/', '?', $texte) ?? '';
        }
        return $converti;
    }

    /* Dans un PDF, une parenthèse ferme une chaîne : les trois
       caractères qui ont un sens doivent être annoncés. */
    private function echapper(string $texte): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $texte);
    }
}
