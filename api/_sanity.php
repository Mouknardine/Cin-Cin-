<?php
/* ============================================================
   Zinéma — lecture et écriture dans Sanity depuis le serveur.

   La lecture est publique (le site l'utilise déjà depuis le
   navigateur). L'écriture, elle, exige le jeton secret : c'est
   pour ça qu'elle ne peut se faire que d'ici.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_socle.php';

const SANITY_VERSION_API = '2024-01-01';

function sanityBase(string $usage): string
{
    $c = config()['sanity'];
    return "https://{$c['projet']}.api.sanity.io/v" . SANITY_VERSION_API . "/data/$usage/{$c['dataset']}";
}

/* Interroger Sanity (GROQ). Les paramètres sont passés séparément :
   ils ne sont jamais collés dans la requête, donc rien de ce que
   tape un visiteur ne peut détourner la requête. */
function sanityLire(string $groq, array $parametres = []): mixed
{
    $url = sanityBase('query') . '?query=' . rawurlencode($groq);
    foreach ($parametres as $nom => $valeur) {
        $url .= '&$' . rawurlencode($nom) . '=' . rawurlencode(json_encode($valeur, JSON_UNESCAPED_UNICODE));
    }

    $r = appelHttp('GET', $url, ['Authorization: Bearer ' . config()['sanity']['jeton_ecriture']]);
    if ($r['statut'] !== 200) {
        throw new RuntimeException('Sanity lecture ' . $r['statut'] . ' : ' . $r['brut']);
    }
    return $r['corps']['result'] ?? null;
}

/* Appliquer des modifications (créer, corriger). */
function sanityMuter(array $mutations): array
{
    $r = appelHttp(
        'POST',
        sanityBase('mutate') . '?returnIds=true',
        ['Authorization: Bearer ' . config()['sanity']['jeton_ecriture']],
        ['mutations' => $mutations]
    );
    if ($r['statut'] < 200 || $r['statut'] >= 300) {
        throw new RuntimeException('Sanity écriture ' . $r['statut'] . ' : ' . $r['brut']);
    }
    return $r['corps'];
}

function sanityCreer(array $document): array
{
    return sanityMuter([['create' => $document]]);
}

function sanityModifier(string $id, array $champs): array
{
    return sanityMuter([['patch' => ['id' => $id, 'set' => $champs]]]);
}
