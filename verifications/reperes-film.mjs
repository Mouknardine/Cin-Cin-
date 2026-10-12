/* ============================================================
   La durée et la version d'un film, vérifiées.

   Le cinéma a demandé le 12 octobre 2026 « 94' » plutôt que
   « 94 min », et « VOstFR » d'un seul tenant, pour que la ligne de
   repères des films tienne sur une ligne. La version reste lisible
   quand elle est écrite en mots (« VO italien st fr »).

   assets/js/reperes-film.js est chargé tel quel, comme dans le
   navigateur.

   Pour lancer :  npm test
   ============================================================ */

import { readFileSync } from "node:fs";
import vm from "node:vm";

const fenetre = vm.createContext({});
fenetre.window = fenetre;
vm.runInContext(readFileSync(new URL("../assets/js/reperes-film.js", import.meta.url), "utf8"), fenetre);
const Reperes = fenetre.ZinemaReperesFilm;
if (!Reperes || typeof Reperes.duree !== "function" || typeof Reperes.version !== "function") {
  throw new Error("assets/js/reperes-film.js n'expose plus ZinemaReperesFilm.duree / .version.");
}

let echecs = 0;
let reussites = 0;

function verifier(intitule, obtenu, attendu) {
  if (JSON.stringify(obtenu) === JSON.stringify(attendu)) {
    reussites += 1;
    console.log(`  ✓ ${intitule}`);
  } else {
    echecs += 1;
    console.log(`  ✗ ${intitule}`);
    console.log(`      attendu : ${JSON.stringify(attendu)}`);
    console.log(`      obtenu  : ${JSON.stringify(obtenu)}`);
  }
}

console.log("\nLa durée et la version d'un film");

verifier("la durée s'écrit 94'", [Reperes.duree(94), Reperes.duree("94")], ["94'", "94'"]);
verifier("sans durée, rien — ni « 0' » ni « NaN' »", [Reperes.duree(null), Reperes.duree(0), Reperes.duree("abc")], ["", "", ""]);
verifier(
  "des sous-titres abrégés se collent à la version : VOstFR",
  [Reperes.version("VO", "stFR"), Reperes.version("VO", "st fr "), Reperes.version("VO", "st fr/all")],
  ["VOstFR", "VOstfr", "VOstfr/all"],
);
verifier(
  "écrits en mots, ou après une version en mots, ils restent séparés",
  [Reperes.version("VO", "sous-titrée français"), Reperes.version("VO italien", "st fr")],
  ["VO sous-titrée français", "VO italien st fr"],
);
verifier(
  "une version ou des sous-titres seuls s'écrivent seuls",
  [Reperes.version("VF", null), Reperes.version("", "stFR"), Reperes.version(null, undefined)],
  ["VF", "stFR", ""],
);

console.log(
  `\n${reussites} vérification${reussites > 1 ? "s" : ""} passée${reussites > 1 ? "s" : ""}` +
    (echecs ? `, ${echecs} en échec.\n` : ".\n"),
);

if (echecs > 0) {
  console.error("La durée ou la version des films ne s'écrit plus comme le cinéma l'a demandé.\n");
  process.exit(1);
}
