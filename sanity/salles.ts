/* ============================================================
   Les salles du cinéma — source unique.

   Le nom d'une salle sert de clé partout : dans les séances, dans
   l'outil Planification, et surtout côté serveur pour ne jamais
   vendre plus de billets qu'il n'y a de sièges (api/_billetterie.php
   retrouve la salle par son nom). Une salle renommée ou mal
   orthographiée à un seul endroit casserait ce comptage : c'est
   pourquoi les NOMS sont fixés ici, dans le code, et pas dans le
   Studio. Le nombre de places, lui, reste modifiable librement
   dans « Réglages du cinéma → Tarifs & salles ».
   ============================================================ */

/* Les trois espaces du cinéma, tels qu'ils apparaissent sur le
   programme :
     Salle 1  — parrainée Thierry Jobin (ex-Le Temps, fiff.ch)
     Salle 2  — parrainée Norbert Creutz (Le Temps)
     Hall-Bar — le bar, où se tiennent les séances particulières
   Seul le nom court sert de clé : c'est lui qu'on retrouve dans les
   séances et dans le comptage des places. */
export const SALLES = ["Salle 1", "Salle 2", "Hall-Bar"] as const;

export type NomDeSalle = (typeof SALLES)[number];

/** Nombre de places par défaut, repris à la création des réglages. */
export const PLACES_PAR_DEFAUT: Record<NomDeSalle, number> = {
  "Salle 1": 18,
  "Salle 2": 14,
  "Hall-Bar": 50,
};

/** Liste prête à l'emploi pour un champ `options.list` du Studio. */
export const listeDesSalles = SALLES.map((nom) => ({ title: nom, value: nom }));

/* ------------------------------------------------------------
   L'ordre du programme.

   À heure égale, les séances se lisent salle par salle, dans
   l'ordre déclaré ci-dessus : Salle 1, Salle 2, puis le Hall-Bar.
   Trier sur le nom ne donnerait pas cet ordre — « Hall-Bar »
   passerait devant — d'où ce rang explicite.

   Le site public a la même règle, recopiée dans assets/js/data.js :
   il ne peut pas importer ce fichier, il n'est fait que de HTML,
   de CSS et de JavaScript sans compilation.
   ------------------------------------------------------------ */

/** Rang d'une salle dans le programme. Une salle inconnue passe en dernier. */
export function rangDeSalle(nom: string | undefined | null): number {
  const rang = (SALLES as readonly string[]).indexOf(String(nom ?? ""));
  return rang === -1 ? SALLES.length : rang;
}

/** Compare deux séances : d'abord la date, puis l'heure, puis la salle. */
export function comparerSeances(
  a: { date?: string | null; heure?: string | null; salle?: string | null },
  b: { date?: string | null; heure?: string | null; salle?: string | null }
): number {
  const parDate = String(a.date ?? "").localeCompare(String(b.date ?? ""));
  if (parDate !== 0) return parDate;
  const parHeure = String(a.heure ?? "").localeCompare(String(b.heure ?? ""));
  if (parHeure !== 0) return parHeure;
  const rangA = rangDeSalle(a.salle);
  const rangB = rangDeSalle(b.salle);
  if (rangA !== rangB) return rangA - rangB;
  /* Deux salles hors liste : l'ordre alphabétique, pour que la
     grille reste la même d'un chargement à l'autre. */
  return String(a.salle ?? "").localeCompare(String(b.salle ?? ""));
}
