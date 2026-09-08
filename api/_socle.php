<?php
/* ============================================================
   Zinéma — socle commun à tous les points d'entrée de l'API.

   Charge la configuration secrète, pose les garde-fous, et donne
   deux façons de répondre : « reussite() » et « echec() ».

   Règle absolue de ce dossier : aucune clé, aucun message
   d'erreur technique ne doit jamais sortir vers le navigateur.
   Les détails partent dans le journal du serveur, le client ne
   reçoit qu'une phrase compréhensible.
   ============================================================ */

declare(strict_types=1);

/* Les erreurs PHP s'écrivent dans le journal du serveur, jamais
   dans la page : un message d'erreur peut contenir un chemin de
   fichier ou une clé. */
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
/* Une réponse de paiement ne se met jamais en cache. */
header('Cache-Control: no-store, no-cache, must-revalidate');

/* ---------------- Répondre ---------------- */

function reussite(array $donnees): never
{
    echo json_encode(['ok' => true] + $donnees, JSON_UNESCAPED_UNICODE);
    exit;
}

/* $interne n'est JAMAIS envoyé au client : il part dans le journal
   du serveur, consultable depuis le Manager Infomaniak. */
function echec(string $message, int $code = 400, string $interne = ''): never
{
    if ($interne !== '') {
        error_log('[zinema-billetterie] ' . $interne);
    }
    http_response_code($code);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/* Toute erreur imprévue devient une panne propre : le client voit
   une phrase neutre, le détail va dans le journal. */
set_exception_handler(static function (Throwable $e): void {
    echec(
        "La billetterie est momentanément indisponible. Merci de réessayer dans un instant.",
        500,
        $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine()
    );
});

/* ---------------- Configuration secrète ---------------- */

function config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    /* Le fichier vit HORS du dossier public (voir
       serveur/config.exemple.php).

       On ne peut pas se contenter de compter les niveaux au-dessus
       de /api : le site ne vit pas forcément à la racine du dossier
       servi par le web. Sur cet hébergement il est dans un
       sous-dossier, aux côtés de l'ancien système qui sert les
       autres cinémas — deux niveaux plus haut tombaient donc encore
       en plein dedans.

       On remonte donc jusqu'à quatre niveaux, et on ÉCARTE toute
       piste située à l'intérieur du dossier public. Y déposer les
       clés reviendrait à les publier au premier hoquet de PHP : une
       version mal configurée, et le serveur livre le fichier tel
       quel, clé SumUp comprise. */
    $racinePublique = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');

    $pistes = [];
    for ($niveau = 1; $niveau <= 4; $niveau++) {
        $pistes[] = dirname(__DIR__, $niveau) . '/config.php';
    }

    foreach ($pistes as $piste) {
        if (!is_readable($piste)) {
            continue;
        }
        $reel = realpath($piste);
        if ($racinePublique !== false && $reel !== false
            && str_starts_with($reel, $racinePublique . DIRECTORY_SEPARATOR)) {
            error_log(
                '[zinema-billetterie] config.php ignoré : il se trouve dans le '
                . 'dossier public, où il ne doit jamais être. Chemin : ' . $reel
            );
            continue;
        }
        $config = require $piste;
        break;
    }

    if (!is_array($config)) {
        echec(
            "La billetterie n'est pas encore configurée.",
            503,
            'config.php introuvable. Cherché dans : ' . implode(' | ', $pistes)
        );
    }

    foreach (['sumup.cle_api', 'sumup.code_marchand', 'sanity.projet', 'sanity.jeton_ecriture', 'site.url'] as $chemin) {
        [$a, $b] = explode('.', $chemin);
        if (empty($config[$a][$b])) {
            echec(
                "La billetterie n'est pas encore configurée.",
                503,
                "config.php : valeur manquante « $chemin »"
            );
        }
    }

    return $config;
}

/* ---------------- Lire la demande ---------------- */

/* Le corps JSON envoyé par le site, ou un échec si la méthode
   n'est pas la bonne. */
function corpsJson(string $methodeAttendue = 'POST'): array
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $methodeAttendue) {
        echec('Requête invalide.', 405);
    }
    $brut = file_get_contents('php://input') ?: '';
    $donnees = json_decode($brut, true);
    return is_array($donnees) ? $donnees : [];
}

/* ---------------- Appels HTTP sortants ---------------- */

/* Un seul endroit pour parler au monde extérieur (SumUp, Sanity) :
   les réglages de sécurité et de délai y sont posés une fois. */
function appelHttp(string $methode, string $url, array $entetes = [], ?array $corps = null): array
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $methode,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => array_merge(['Accept: application/json'], $entetes),
    ]);
    if ($corps !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($corps, JSON_UNESCAPED_UNICODE));
        curl_setopt($curl, CURLOPT_HTTPHEADER, array_merge(
            ['Accept: application/json', 'Content-Type: application/json'],
            $entetes
        ));
    }

    $reponse = curl_exec($curl);
    $statut = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $erreur = curl_error($curl);
    curl_close($curl);

    if ($reponse === false) {
        throw new RuntimeException("Appel $methode $url impossible : $erreur");
    }

    return [
        'statut' => $statut,
        'corps' => json_decode((string) $reponse, true) ?: [],
        'brut' => (string) $reponse,
    ];
}
