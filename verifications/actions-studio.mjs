/* ============================================================
   Les actions du Studio, vérifiées.

   Le 18 novembre 2026, les commandes de billets ont été rangées dans
   le dossier privé de Sanity (identifiant « commandes.… ») : sans
   clé, personne ne les lit. Mais le bouton « Dupliquer » du Studio
   donne à la copie un identifiant sans point. Publiée, elle serait
   lisible par n'importe qui, avec l'e-mail de l'acheteur et la
   référence de son billet. Ce fichier vérifie que ce bouton reste
   retiré des commandes, comme des fiches uniques.

   sanity/actionsRetirees.ts est lu tel quel, et l'on contrôle que
   sanity.config.ts s'en sert bien.

   Pour lancer :  npm test
   ============================================================ */

import { readFileSync } from "node:fs";

import { actionsRetirees } from "../sanity/actionsRetirees.ts";

let echecs = 0;
let reussites = 0;

function verifier(intitule, obtenu, attendu) {
  const memeChose = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (memeChose) {
    reussites += 1;
    console.log(`  ✓ ${intitule}`);
  } else {
    echecs += 1;
    console.log(`  ✗ ${intitule}`);
    console.log(`      attendu : ${JSON.stringify(attendu)}`);
    console.log(`      obtenu  : ${JSON.stringify(obtenu)}`);
  }
}

function lire(chemin) {
  return readFileSync(new URL(chemin, import.meta.url), "utf8");
}

const UNIQUES = ["siteSettings", "abonnements", "location", "histoire"];

console.log("\nUne commande ne se duplique pas, ne se dépublie pas");
verifier("« Dupliquer » retiré", actionsRetirees("commande", UNIQUES).includes("duplicate"), true);
verifier("« Dépublier » retiré", actionsRetirees("commande", UNIQUES).includes("unpublish"), true);
verifier(
  "« Supprimer » reste possible (commande de test à effacer)",
  actionsRetirees("commande", UNIQUES).includes("delete"),
  false,
);

console.log("\nLes fiches uniques gardent leurs protections");
for (const type of UNIQUES) {
  verifier(`${type} : ni copie, ni suppression, ni retrait`, [...actionsRetirees(type, UNIQUES)].sort(), [
    "delete",
    "duplicate",
    "unpublish",
  ]);
}

console.log("\nLes autres documents gardent toutes leurs actions");
for (const type of ["film", "screening", "evenement"]) {
  verifier(`${type} : rien de retiré`, actionsRetirees(type, UNIQUES), []);
}

console.log("\nLe Studio applique bien ces règles");
const config = lire("../sanity.config.ts");
verifier(
  "sanity.config.ts filtre les actions avec actionsRetirees()",
  /actions:\s*\(actions, \{ schemaType \}\) => \{\s*const retirees = actionsRetirees\(schemaType, typesUniques\);/.test(
    config,
  ),
  true,
);
verifier(
  "les commandes n'ont pas de bouton « + » (seul le serveur les crée)",
  /typesNonCreables = \[\.\.\.typesUniques, "commande"\]/.test(lire("../sanity/schemaTypes/index.ts")),
  true,
);
verifier(
  "la liste « Billets vendus » est triée par date d'achat",
  /S\.documentTypeList\("commande"\)[\s\S]*?\.defaultOrdering\(\[\{ field: "creeLe", direction: "desc" \}\]\)/.test(
    lire("../sanity/deskStructure.ts"),
  ),
  true,
);

console.log(
  `\n${reussites} vérification${reussites > 1 ? "s" : ""} passée${reussites > 1 ? "s" : ""}` +
    (echecs ? `, ${echecs} en échec.\n` : ".\n"),
);

if (echecs > 0) {
  console.error("Les actions du Studio ne protègent plus les commandes ou les fiches uniques.\n");
  process.exit(1);
}
