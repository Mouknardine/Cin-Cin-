/* ============================================================
   Le mur de l'accueil, vérifié.

   Le cinéma a signalé le 7 octobre 2026 : « Quand on arrête de
   programmer un film, il reste visible sur la page d'accueil : on
   est obligé de l'annuler manuellement sur Sanity » (De la Comédie
   Française). Un film sans séance à venir doit quitter le mur tout
   seul ; un film annoncé (« Prochainement ») y reste, lui, sans
   séance.

   assets/js/home-choix.js est chargé tel quel, comme dans le
   navigateur, et l'on regarde quels titres il fait monter.

   En second lieu, le type des événements (page Événements et liste
   du Studio). Le cinéma a demandé le 7 octobre 2026 de nommer
   lui-même ses types d'événements : le libellé affiché est le nom du
   type choisi, sinon l'ancien type, sinon rien — jamais
   « undefined » —, et ce nom, saisi librement, est échappé.

   Pour lancer :  npm test
   ============================================================ */
import { readFileSync } from "node:fs";
import vm from "node:vm";

import { libelleDuTypeEvenement } from "../sanity/typesEvenement.ts";

function chargerLeChoixDuSite() {
  const code = readFileSync(new URL("../assets/js/home-choix.js", import.meta.url), "utf8");
  /* Toute affiche présente est « vraie » ici : seul compte le tri
     des films, pas le dessin des affiches. */
  const fenetre = { ZinemaRender: { hasRealImage: (image) => Boolean(image) } };
  fenetre.window = fenetre;
  vm.createContext(fenetre);
  vm.runInContext(code, fenetre);
  if (!fenetre.ZinemaHomeChoix || typeof fenetre.ZinemaHomeChoix.selection !== "function") {
    throw new Error("assets/js/home-choix.js n'expose plus ZinemaHomeChoix.selection.");
  }
  return fenetre.ZinemaHomeChoix.selection;
}

const selection = chargerLeChoixDuSite();

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

function film(id, status) {
  return { _id: id, title: id, status, poster: {}, slug: id };
}

function seance(filmId, date, status = "disponible") {
  return { film: { _id: filmId }, date, time: "20:00", status };
}

function titres(films, seances) {
  return selection(films, [], seances).map((item) => item.title);
}

console.log("\nLes films qui montent sur le mur");

verifier(
  "un film à l'affiche sans séance à venir quitte le mur tout seul",
  titres([film("De la Comédie Française", "a-laffiche")], []),
  [],
);

verifier(
  "un film à l'affiche avec une séance à venir reste sur le mur",
  titres([film("The North", "a-laffiche")], [seance("The North", "2026-10-08")]),
  ["The North"],
);

verifier(
  "une séance annulée ne suffit pas à garder un film sur le mur",
  titres([film("Notre argent", "a-laffiche")], [seance("Notre argent", "2026-10-08", "annule")]),
  [],
);

verifier(
  "un film annoncé « Prochainement » reste sur le mur, même sans séance",
  titres([film("Les Matins merveilleux", "prochainement")], []),
  ["Les Matins merveilleux"],
);

verifier(
  "un film « Terminé » reste hors du mur, même s'il lui reste une séance",
  titres([film("Ancien", "passe")], [seance("Ancien", "2026-10-08")]),
  [],
);

verifier(
  "agenda injoignable : aucun film n'est retiré, le mur ne se vide pas sur une panne",
  titres([film("The North", "a-laffiche")], null),
  ["The North"],
);

console.log("\nLe visuel d'un événement sur le mur");

const vertical = { asset: { _ref: "image-vertical-1478x2048-jpg" } };
const paysage = { asset: { _ref: "image-paysage-2048x1478-jpg" } };
verifier(
  "un événement avec un visuel vertical le montre sur le mur",
  selection([], [{ title: "Cumbia", image: paysage, imageAccueil: vertical }], []).map((i) => i.poster),
  [vertical],
);
verifier(
  "sans visuel vertical, le mur reprend le visuel de l'événement",
  selection([], [{ title: "Cumbia", image: paysage }], []).map((i) => i.poster),
  [paysage],
);
verifier(
  "sans aucun visuel, l'événement ne monte pas sur le mur",
  selection([], [{ title: "Info" }], []).length,
  0,
);

/* ------------------------------------------------------------------
   Le type d'un événement. La page de détail est chargée telle quelle,
   avec ses deux scripts d'appui (couleurs, rendu) et une page vide.
   ------------------------------------------------------------------ */
function chargerLeDetailDUnEvenement() {
  const fenetre = {
    addEventListener: () => {},
    document: { body: { dataset: { root: "../" } }, querySelectorAll: () => [] },
  };
  fenetre.window = fenetre;
  vm.createContext(fenetre);
  for (const fichier of ["couleurs.js", "render.js", "texte-riche.js", "evenement-detail.js", "evenement-carte.js", "evenement-rangee.js"]) {
    const code = readFileSync(new URL(`../assets/js/${fichier}`, import.meta.url), "utf8");
    vm.runInContext(code, fenetre, { filename: fichier });
  }
  if (!fenetre.ZinemaEvenementDetail || typeof fenetre.ZinemaEvenementDetail.categorie !== "function") {
    throw new Error("assets/js/evenement-detail.js n'expose plus ZinemaEvenementDetail.categorie.");
  }
  if (!fenetre.ZinemaEvenementRangee || typeof fenetre.ZinemaEvenementRangee.bandes !== "function") {
    throw new Error("assets/js/evenement-rangee.js n'expose plus ZinemaEvenementRangee.bandes.");
  }
  return { Detail: fenetre.ZinemaEvenementDetail, Rangee: fenetre.ZinemaEvenementRangee };
}

const { Detail, Rangee } = chargerLeDetailDUnEvenement();

/* Le même événement passe dans le site ET dans le Studio : les deux
   doivent écrire le même libellé. */
function libelles(evenement) {
  return [Detail.categorie(evenement), libelleDuTypeEvenement(evenement.typeNom, evenement.category)];
}

console.log("\nLe type d'un événement");

verifier(
  "le type choisi dans le Studio l'emporte sur l'ancien type",
  libelles({ typeNom: "Première", category: "festival" }),
  ["Première", "Première"],
);

verifier(
  "un événement saisi avant les types libres garde son ancien libellé",
  libelles({ category: "festival" }),
  ["Festival", "Festival"],
);

verifier(
  "un type sans nom (vide ou supprimé) laisse place à l'ancien libellé",
  libelles({ typeNom: "  ", category: "brunch" }),
  ["Brunch", "Brunch"],
);

verifier(
  "sans aucun type, aucun libellé — ni « Événement », ni « undefined »",
  libelles({ typeNom: null }),
  ["", ""],
);

verifier(
  "une ancienne valeur inconnue n'affiche rien",
  libelles({ category: "constructor" }),
  ["", ""],
);

const evenementPiege = {
  title: "Soirée",
  slug: "soiree",
  dateDebut: "2026-10-10",
  typeNom: '<img src=x onerror="alert(1)">',
};
const pageAvecPiege = Detail.html(evenementPiege);
verifier(
  "le nom du type est échappé sur la page de l'événement",
  [pageAvecPiege.includes("<img src=x"), pageAvecPiege.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")],
  [false, true],
);

const pageSansType = Detail.html({ title: "Soirée", slug: "soiree", dateDebut: "2026-10-10" });
verifier(
  "sans type, la case de la date n'a ni libellé vide ni « undefined »",
  [pageSansType.includes("undefined"), pageSansType.includes('<p class="m-cell__label"></p>')],
  [false, false],
);

/* Le « Texte complet » du Studio, écrit avec sa mise en forme
   (texte-riche.js), dans les rangées comme sur le détail. */
const morceau = (text, marks = []) => ({ _type: "span", text, marks });
const pageAvecTexte = Detail.html({
  title: "Soirée",
  slug: "soiree",
  dateDebut: "2026-10-16",
  body: [
    {
      _type: "block",
      style: "normal",
      markDefs: [
        { _key: "piege", _type: "link", href: "javascript:alert(1)" },
        { _key: "site", _type: "link", href: "raphaelverona.com" },
      ],
      children: [
        morceau("Entrée libre", ["strong"]),
        morceau(" <script>alert(1)</script>"),
        morceau(" piège", ["piege"]),
        morceau(" DJ", ["site"]),
      ],
    },
    { _type: "block", listItem: "bullet", level: 1, children: [morceau("22:00 - 02:00")] },
    { _type: "block", style: "normal", children: [morceau("   ")] },
  ],
});
verifier(
  "le texte complet garde son gras, ses listes et ses liens",
  [
    pageAvecTexte.includes("<strong>Entrée libre</strong>"),
    pageAvecTexte.includes("<ul><li>22:00 - 02:00</li></ul>"),
    pageAvecTexte.includes('href="https://raphaelverona.com"'),
    pageAvecTexte.includes("<p></p>"),
  ],
  [true, true, true, false],
);
verifier(
  "le texte complet est échappé, et un lien « javascript: » n'est jamais écrit",
  [pageAvecTexte.includes("<script>"), pageAvecTexte.includes("javascript:")],
  [false, false],
);

/* La page Événements : une rangée par événement, comme un film. */
const rangees = Rangee.bandes([
  { _id: "a1", slug: "cumbia", title: "Cumbia <b>del</b> Zinema", dateDebut: "2026-10-16", typeNom: "Soirée" },
  { _id: "a2", slug: "info", title: "", dateDebut: "2026-10-16" },
]);
verifier(
  "une rangée par événement titré, le titre échappé et menant à sa page",
  [
    (rangees.match(/m-bande--evenement/g) || []).length,
    rangees.includes("<b>del</b>"),
    rangees.includes('href="../evenements/?e=cumbia"'),
    rangees.includes("m-annonce__vignette"),
  ],
  [1, false, true, false],
);

console.log(
  `\n${reussites} vérification${reussites > 1 ? "s" : ""} passée${reussites > 1 ? "s" : ""}` +
    (echecs ? `, ${echecs} en échec.\n` : ".\n"),
);

if (echecs > 0) {
  console.error("Le mur de l'accueil ou le type des événements ne s'affiche plus comme prévu.\n");
  process.exit(1);
}
