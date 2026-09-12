/* ============================================================
   L'ordre du programme.

   À heure égale, les séances se lisent salle par salle, dans
   l'ordre où les salles sont rangées dans la fiche du cinéma
   (« Cinémas → Tarifs & salles »). Trier sur le nom ne donnerait
   pas cet ordre : « Hall-Bar » passerait devant « Salle 1 ».

   Les noms des salles ne sont plus écrits dans le code. Chaque
   cinéma déclare les siennes dans sa fiche, et deux cinémas
   peuvent donc avoir chacun leur « Salle 1 » sans se mélanger,
   ou une « Grande salle » là où l'autre a un « Hall-Bar ».
   L'ordre voulu est devenu une donnée : il se transmet ici.

   Le site public applique la même règle, recopiée dans
   assets/js/data.js : il ne peut pas importer ce fichier, il
   n'est fait que de HTML, de CSS et de JavaScript sans
   compilation.
   ============================================================ */

/** Une séance, réduite à ce qui sert à la classer. */
export interface SeanceAClasser {
  date?: string | null;
  heure?: string | null;
  salle?: string | null;
}

/** Rang d'une salle dans l'ordre donné. Une salle inconnue passe en dernier. */
function rangDeSalle(
  nom: string | undefined | null,
  ordreDesSalles: readonly string[]
): number {
  const rang = ordreDesSalles.indexOf(String(nom ?? ""));
  return rang === -1 ? ordreDesSalles.length : rang;
}

/**
 * Un comparateur de séances pour un cinéma donné : d'abord la date,
 * puis l'heure, puis la salle dans l'ordre de sa fiche.
 */
export function comparerSeancesSelon(
  ordreDesSalles: readonly string[]
): (a: SeanceAClasser, b: SeanceAClasser) => number {
  return (a, b) => {
    const parDate = String(a.date ?? "").localeCompare(String(b.date ?? ""));
    if (parDate !== 0) return parDate;
    const parHeure = String(a.heure ?? "").localeCompare(String(b.heure ?? ""));
    if (parHeure !== 0) return parHeure;
    const rangA = rangDeSalle(a.salle, ordreDesSalles);
    const rangB = rangDeSalle(b.salle, ordreDesSalles);
    if (rangA !== rangB) return rangA - rangB;
    /* Deux salles hors liste : l'ordre alphabétique, pour que la
       grille reste la même d'un chargement à l'autre. */
    return String(a.salle ?? "").localeCompare(String(b.salle ?? ""));
  };
}

/**
 * Le même, là où l'ordre des salles n'est pas connu : les salles se
 * rangent alors par ordre alphabétique. Vaut pour les listes qui
 * mêlent plusieurs cinémas, où aucun ordre de salles ne s'applique.
 */
export const comparerSeances = comparerSeancesSelon([]);
