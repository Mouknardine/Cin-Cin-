/* ============================================================
   Le nom du type d'un événement, tel que le Studio l'affiche dans
   la liste des événements.

   Le cinéma nomme lui-même ses types (fiches « Type d'événement »).
   Avant cela, le type se choisissait dans une liste fermée : les
   événements saisis à cette époque gardent ce choix tant que
   personne ne leur a donné un nouveau type. D'où l'ordre :

     1. le nom du type choisi ;
     2. sinon, l'ancien type, avec son ancien libellé ;
     3. sinon, rien — jamais « undefined ».

   La même règle existe côté site, dans assets/js/evenement-detail.js
   (fonction categorie) ; verifications/accueil.mjs vérifie les deux.
   ============================================================ */

/** Les libellés de l'ancienne liste fermée, valeur par valeur. */
export const ANCIENS_TYPES: Readonly<Record<string, string>> = {
  cycle: "Cycle",
  "cine-club": "Ciné-club",
  brunch: "Brunch",
  "seance-speciale": "Séance spéciale",
  festival: "Festival",
  info: "Information",
};

function texte(valeur: unknown): string {
  return typeof valeur === "string" ? valeur.trim() : "";
}

/** Le libellé à afficher, ou "" si l'événement n'a aucun type. */
export function libelleDuTypeEvenement(nomDuType: unknown, ancienType: unknown): string {
  const nom = texte(nomDuType);
  if (nom) return nom;
  const ancien = texte(ancienType);
  return Object.prototype.hasOwnProperty.call(ANCIENS_TYPES, ancien) ? ANCIENS_TYPES[ancien] : "";
}
