/* ============================================================
   L'ordre du programme, vérifié.

   Le cinéma lit une journée VAGUE PAR VAGUE : le tour de séances de
   19 h, salle par salle, puis le tour suivant. Cette règle existe en
   deux exemplaires — elle ne peut pas exister en un seul :

     - sanity/salles.ts   pour le Studio (planning, fiche du film) ;
     - assets/js/data.js  pour le site (agenda, fiche du film).

   Le site n'est fait que de HTML, de CSS et de JavaScript sans
   compilation : il ne peut pas importer un fichier TypeScript. Ce
   qu'on peut faire, c'est empêcher les deux copies de diverger — et
   c'est le travail de ce fichier. Chaque cas est passé dans les DEUX,
   et leurs réponses doivent être identiques.

   Le premier cas est celui que le cinéma a signalé le 14 septembre
   2026 : « tous les vendredis les films ne sont pas dans le bon
   ordre ».

   Pour lancer :  npm test
   ============================================================ */
import { readFileSync } from "node:fs";
import vm from "node:vm";

import { ECART_MEME_VAGUE_MIN, ordonnerSeances } from "../sanity/salles.ts";

/* ------------------------------------------------------------------
   La copie du site, chargée telle quelle.

   assets/js/data.js est un script de navigateur : il s'accroche à
   « window ». On lui en fabrique un, sans réseau ni page — au
   chargement, le fichier ne fait que déclarer ses fonctions.
   ------------------------------------------------------------------ */
function chargerLaCopieDuSite() {
  const code = readFileSync(new URL("../assets/js/data.js", import.meta.url), "utf8");
  const fenetre = { console };
  fenetre.window = fenetre;
  vm.createContext(fenetre);
  vm.runInContext(code, fenetre);
  if (!fenetre.ZinemaData || typeof fenetre.ZinemaData.trierSeances !== "function") {
    throw new Error("assets/js/data.js n'expose plus ZinemaData.trierSeances.");
  }
  return fenetre.ZinemaData.trierSeances;
}

const trierSeancesDuSite = chargerLaCopieDuSite();

/* ------------------------------------------------------------------
   Les deux copies ne nomment pas les champs pareil : le Studio parle
   français (heure, salle), le site reprend les noms du schéma Sanity
   (time, room). Les cas s'écrivent une fois, en français.
   ------------------------------------------------------------------ */
function versLeSite(seance) {
  return { nom: seance.nom, date: seance.date, time: seance.heure, room: seance.salle };
}

function noms(seances) {
  return seances.map((seance) => seance.nom);
}

/* ------------------------------------------------------------------
   Les vérifications.
   ------------------------------------------------------------------ */
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

/**
 * Passe un cas dans les deux copies : l'ordre doit être celui attendu,
 * et il doit être le même des deux côtés.
 */
function ordre(intitule, seances, attendu) {
  const cote = [...seances];
  const duStudio = noms(ordonnerSeances(seances));
  const duSite = noms(trierSeancesDuSite(seances.map(versLeSite)));

  verifier(`${intitule} — dans le Studio`, duStudio, attendu);
  verifier(`${intitule} — sur le site`, duSite, attendu);
  verifier(`${intitule} — la liste reçue n'est pas bousculée`, noms(seances), noms(cote));
}

const V = "2026-09-18"; // vendredi
const S = "2026-09-19"; // samedi

console.log("\nL'ordre du programme\n");

console.log("Le vendredi signalé par le cinéma (capture du 14 septembre 2026)");
/* Salle 1 enchaîne à 21:15 — elle attend la fin du long film de 19 h —
   quand la Salle 2 part à 21:00. Rangé à la minute près, le vendredi se
   lisait Salle 1, Salle 2, puis Salle 2, Salle 1. */
ordre(
  "les deux salles se lisent dans le même ordre aux deux tours",
  [
    { nom: "Notre argent", date: V, heure: "21:00", salle: "Salle 2" },
    { nom: "The North", date: V, heure: "19:00", salle: "Salle 1" },
    { nom: "Les Matins merveilleux", date: V, heure: "21:15", salle: "Salle 1" },
    { nom: "De la Comédie Française", date: V, heure: "19:00", salle: "Salle 2" },
  ],
  ["The North", "De la Comédie Française", "Les Matins merveilleux", "Notre argent"],
);

console.log("\nLe samedi, où les deux salles partent ensemble");
ordre(
  "rien ne bouge : c'était déjà l'ordre du programme",
  [
    { nom: "Les Matins merveilleux", date: S, heure: "19:00", salle: "Salle 1" },
    { nom: "Notre argent", date: S, heure: "19:00", salle: "Salle 2" },
    { nom: "The North", date: S, heure: "21:00", salle: "Salle 1" },
    { nom: "De la Comédie Française", date: S, heure: "21:00", salle: "Salle 2" },
  ],
  ["Les Matins merveilleux", "Notre argent", "The North", "De la Comédie Française"],
);

console.log("\nPlusieurs jours d'affilée");
ordre(
  "une vague ne franchit jamais un changement de date",
  [
    { nom: "sam 19:00 S1", date: S, heure: "19:00", salle: "Salle 1" },
    { nom: "ven 21:15 S1", date: V, heure: "21:15", salle: "Salle 1" },
    { nom: "ven 21:00 S2", date: V, heure: "21:00", salle: "Salle 2" },
    { nom: "sam 19:10 S2", date: S, heure: "19:10", salle: "Salle 2" },
  ],
  ["ven 21:15 S1", "ven 21:00 S2", "sam 19:00 S1", "sam 19:10 S2"],
);

console.log("\nL'ordre des salles à l'intérieur d'une vague");
ordre(
  "le Hall-Bar passe après les deux salles, jamais devant",
  [
    { nom: "Hall-Bar", date: V, heure: "19:00", salle: "Hall-Bar" },
    { nom: "Salle 2", date: V, heure: "19:00", salle: "Salle 2" },
    { nom: "Salle 1", date: V, heure: "19:00", salle: "Salle 1" },
  ],
  ["Salle 1", "Salle 2", "Hall-Bar"],
);
ordre(
  "une salle inconnue se range après les autres, par ordre alphabétique",
  [
    { nom: "Véranda", date: V, heure: "19:00", salle: "Véranda" },
    { nom: "Atelier", date: V, heure: "19:00", salle: "Atelier" },
    { nom: "Salle 1", date: V, heure: "19:00", salle: "Salle 1" },
  ],
  ["Salle 1", "Atelier", "Véranda"],
);

console.log(`\nCe qui fait une vague (au plus ${ECART_MEME_VAGUE_MIN} minutes d'écart)`);
ordre(
  "une demi-heure pile, c'est encore la même vague",
  [
    { nom: "S2 19:00", date: V, heure: "19:00", salle: "Salle 2" },
    { nom: "S1 19:30", date: V, heure: "19:30", salle: "Salle 1" },
  ],
  ["S1 19:30", "S2 19:00"],
);
ordre(
  "au-delà, ce n'est plus le même tour : l'heure reprend la main",
  [
    { nom: "S2 19:00", date: V, heure: "19:00", salle: "Salle 2" },
    { nom: "S1 19:45", date: V, heure: "19:45", salle: "Salle 1" },
  ],
  ["S2 19:00", "S1 19:45"],
);
ordre(
  "une matinée ne se lit pas avec la soirée",
  [
    { nom: "S1 14:00", date: V, heure: "14:00", salle: "Salle 1" },
    { nom: "S1 16:30", date: V, heure: "16:30", salle: "Salle 1" },
    { nom: "S1 19:00", date: V, heure: "19:00", salle: "Salle 1" },
    { nom: "S2 21:00", date: V, heure: "21:00", salle: "Salle 2" },
  ],
  ["S1 14:00", "S1 16:30", "S1 19:00", "S2 21:00"],
);
ordre(
  "une vague ne s'étire pas de proche en proche",
  [
    /* 19:00, puis 19:25, puis 19:50 : la troisième est à 50 minutes de
       l'ouverture de la vague, elle en ouvre donc une nouvelle. */
    { nom: "S1 19:00", date: V, heure: "19:00", salle: "Salle 1" },
    { nom: "S2 19:25", date: V, heure: "19:25", salle: "Salle 2" },
    { nom: "Hall 19:50", date: V, heure: "19:50", salle: "Hall-Bar" },
  ],
  ["S1 19:00", "S2 19:25", "Hall 19:50"],
);
ordre(
  "une salle ne joue qu'une fois par vague",
  [
    { nom: "S1 19:00", date: V, heure: "19:00", salle: "Salle 1" },
    { nom: "S1 19:20", date: V, heure: "19:20", salle: "Salle 1" },
    { nom: "S2 19:25", date: V, heure: "19:25", salle: "Salle 2" },
  ],
  ["S1 19:00", "S1 19:20", "S2 19:25"],
);

console.log("\nCe qui ne doit jamais faire tomber la page");
ordre(
  "une heure illisible se range en fin de journée, sans rien emporter",
  [
    { nom: "sans heure", date: V, heure: "", salle: "Salle 1" },
    { nom: "S2 21:00", date: V, heure: "21:00", salle: "Salle 2" },
    { nom: "S1 19:00", date: V, heure: "19:00", salle: "Salle 1" },
  ],
  ["S1 19:00", "S2 21:00", "sans heure"],
);
ordre(
  "un zéro oublié devant l'heure ne renvoie pas la séance en fin de soirée",
  [
    { nom: "S2 21:00", date: V, heure: "21:00", salle: "Salle 2" },
    { nom: "S1 9:30", date: V, heure: "9:30", salle: "Salle 1" },
  ],
  ["S1 9:30", "S2 21:00"],
);
ordre("une journée vide", [], []);

console.log("\nLe rangement ne bouge plus une fois fait");
{
  const semaine = [
    { nom: "Notre argent", date: V, heure: "21:00", salle: "Salle 2" },
    { nom: "The North", date: V, heure: "19:00", salle: "Salle 1" },
    { nom: "Les Matins merveilleux", date: V, heure: "21:15", salle: "Salle 1" },
    { nom: "De la Comédie Française", date: V, heure: "19:00", salle: "Salle 2" },
    { nom: "sam 19:00 S1", date: S, heure: "19:00", salle: "Salle 1" },
  ];
  const uneFois = ordonnerSeances(semaine);
  verifier("ranger deux fois ne change rien", noms(ordonnerSeances(uneFois)), noms(uneFois));
  verifier(
    "aucune séance n'est perdue ni inventée",
    [...noms(uneFois)].sort(),
    [...noms(semaine)].sort(),
  );
}

console.log("\nCe que le site renvoie quand Sanity n'a pas répondu");
{
  const marqueurErreur = { __erreurReseau: true };
  verifier(
    "le marqueur d'erreur ressort tel quel, il n'est pas rangé",
    trierSeancesDuSite(marqueurErreur),
    marqueurErreur,
  );
}

console.log(
  `\n${reussites} vérification${reussites > 1 ? "s" : ""} passée${reussites > 1 ? "s" : ""}` +
    (echecs ? `, ${echecs} en échec.\n` : ".\n"),
);

if (echecs > 0) {
  console.error("L'ordre du programme n'est plus celui attendu. Rien n'est publié.\n");
  process.exit(1);
}
