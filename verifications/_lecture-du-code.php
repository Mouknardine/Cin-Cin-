<?php
/* ============================================================
   Outils de verifications/donnees-personnelles.php : lire le code
   du serveur (dossier api/, sous-dossiers compris, puisque le
   déploiement les publie tous) sans ses commentaires, et y
   chercher des passages.

   Sans les commentaires : une phrase comme « ne jamais appeler
   sanityCreer() ici » ne doit ni compter comme un appel, ni
   bloquer la mise en ligne.
   ============================================================ */

declare(strict_types=1);

$echecs = 0;

/* Affiche le résultat d'un contrôle. En cas d'échec, le détail dit
   ce qui a été trouvé, pour ne pas avoir à le deviner. */
function verifier(string $cas, bool $vrai, string $detail = ''): void
{
    global $echecs;
    echo ($vrai ? '  ok   ' : '  ÉCHEC ') . $cas . "\n";
    if (!$vrai) {
        $echecs++;
        if ($detail !== '') {
            echo '         trouvé : ' . $detail . "\n";
        }
    }
}

/* Le code PHP, sans ses commentaires. */
function sansCommentaires(string $code): string
{
    $texte = '';
    foreach (token_get_all($code) as $jeton) {
        if (is_array($jeton) && in_array($jeton[0], [T_COMMENT, T_DOC_COMMENT], true)) {
            continue;
        }
        $texte .= is_array($jeton) ? $jeton[1] : $jeton;
    }
    return $texte;
}

/** @return array<string, string> le code de chaque fichier du serveur, sans commentaires, par chemin depuis api/ */
function codeDuServeur(string $dossier): array
{
    $code = [];
    $fichiers = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dossier, FilesystemIterator::SKIP_DOTS));
    foreach ($fichiers as $fichier) {
        if ($fichier->isFile() && $fichier->getExtension() === 'php') {
            $chemin = substr($fichier->getPathname(), strlen($dossier) + 1);
            $code[$chemin] = sansCommentaires((string) file_get_contents($fichier->getPathname()));
        }
    }
    ksort($code);
    return $code;
}

/**
 * Chaque passage qui correspond au motif, sous la forme
 * « fichier : passage », dans l'ordre des fichiers.
 *
 * @param array<string, string> $code
 * @return list<string>
 */
function passages(string $motif, array $code): array
{
    $trouves = [];
    foreach ($code as $chemin => $texte) {
        preg_match_all($motif, $texte, $m);
        foreach ($m[0] as $passage) {
            $trouves[] = $chemin . ' : ' . preg_replace('/\s+/', ' ', $passage);
        }
    }
    return $trouves;
}

/** Le corps d'une fonction, de sa déclaration à l'accolade qui la ferme en début de ligne. */
function corpsDeFonction(string $nom, string $texte): string
{
    return preg_match('/function ' . $nom . '\(.*?\n\}/s', $texte, $m) === 1 ? $m[0] : '';
}

/** @param list<string> $liste */
function enClair(array $liste): string
{
    return $liste === [] ? '(rien)' : implode(' | ', $liste);
}

/**
 * Ce qui sépare ce qu'on a trouvé de ce qu'on attendait.
 *
 * @param list<string> $trouve
 * @param list<string> $attendu
 */
function ecart(array $trouve, array $attendu): string
{
    $enTrop = array_values(array_diff($trouve, $attendu));
    $manquant = array_values(array_diff($attendu, $trouve));
    return 'en trop : ' . enClair($enTrop) . ' ; manquant : ' . enClair($manquant)
        . (count($trouve) !== count(array_unique($trouve)) ? ' ; un passage apparaît plusieurs fois' : '');
}
