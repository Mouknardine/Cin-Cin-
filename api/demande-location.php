<?php
/* ============================================================
   Zinéma — recevoir une demande de location.

   Le formulaire de la page Location envoie ici : qui demande,
   comment le joindre, pour quel espace et pour quoi faire. Le
   serveur relit tout, refuse ce qui n'est pas une vraie demande,
   puis remet le message au cinéma par courriel.

   Le navigateur ne connaît jamais l'adresse du cinéma : elle est
   lue ici, dans Sanity, au moment de l'envoi.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_location.php';

$corps = corpsJson('POST');

/* ---------------- Le piège à robots ----------------
   Le champ « site » est invisible dans la page : un visiteur ne le
   remplit jamais, un robot remplit tout. On répond comme si tout
   s'était bien passé — expliquer la ruse à un robot revient à lui
   apprendre à la contourner. */
if (trim((string) ($corps['site'] ?? '')) !== '') {
    reussite(['envoye' => true]);
}

/* ---------------- Ce qu'a écrit le visiteur ---------------- */

function demandeTexte(array $corps, string $champ, int $maximum): string
{
    $valeur = trim((string) ($corps[$champ] ?? ''));
    /* Les retours à la ligne sont conservés dans le message, jamais
       ailleurs : glissés dans un intitulé, ils permettraient
       d'ajouter des en-têtes au courriel. */
    if ($champ !== 'message') {
        $valeur = str_replace(["\r", "\n"], ' ', $valeur);
    }
    return mb_substr($valeur, 0, $maximum);
}

$demande = [
    'nom' => demandeTexte($corps, 'nom', LOCATION_MAX_COURT),
    'email' => demandeTexte($corps, 'email', LOCATION_MAX_COURT),
    'telephone' => demandeTexte($corps, 'telephone', LOCATION_MAX_COURT),
    'espace' => demandeTexte($corps, 'espace', LOCATION_MAX_COURT),
    'date' => demandeTexte($corps, 'date', LOCATION_MAX_COURT),
    'personnes' => demandeTexte($corps, 'personnes', 10),
    'message' => demandeTexte($corps, 'message', LOCATION_MAX_MESSAGE),
];

/* ---------------- Ce que le serveur exige ----------------
   Les trois mêmes champs que la page annonce comme obligatoires :
   une page peut être contournée, pas le serveur. */

if ($demande['nom'] === '') {
    echec("Indiquez votre nom, pour qu'on sache à qui répondre.", 422);
}
if (!filter_var($demande['email'], FILTER_VALIDATE_EMAIL)) {
    echec("Vérifiez votre adresse e-mail : c'est par là que la réponse arrivera.", 422);
}
if ($demande['message'] === '') {
    echec("Dites-nous en deux mots ce que vous aimeriez organiser.", 422);
}

if (locationTropRapide($demande['email'])) {
    echec(
        'Votre demande vient de partir. Laissez-nous le temps de la lire avant d\'en envoyer une autre.',
        429
    );
}

/* ---------------- L'envoi ---------------- */

if (!locationEnvoyerDemande($demande)) {
    echec(
        "L'envoi n'a pas abouti. Réessayez dans un instant, ou appelez le cinéma.",
        502,
        'demande de location non remise au serveur de courrier'
    );
}

reussite(['envoye' => true]);
