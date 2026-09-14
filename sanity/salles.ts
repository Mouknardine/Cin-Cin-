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

   Une journée ne se lit pas comme une simple liste d'heures : elle
   se lit VAGUE PAR VAGUE. Une vague, c'est le tour de séances qui
   part à peu près en même temps — au plus une par salle. On lit
   toute la vague de 19 h, salle par salle, puis la vague suivante.

   À l'intérieur d'une vague, les séances suivent l'ordre des salles
   déclaré ci-dessus : Salle 1, Salle 2, puis le Hall-Bar. Trier sur
   le nom ne donnerait pas cet ordre — « Hall-Bar » passerait
   devant — d'où le rang explicite.

   POURQUOI UNE VAGUE, ET PAS L'HEURE EXACTE ?

   Parce qu'un tour de séances ne part pas toujours à la même minute
   dans les deux salles. Le vendredi, la Salle 1 enchaîne à 21:15,
   le temps que finisse le long film de 19 h, quand la Salle 2 part
   à 21:00. Trié à la minute près, le vendredi se lisait Salle 1,
   Salle 2, puis Salle 2, Salle 1 — l'inverse de tous les autres
   jours. Et comme le créneau du vendredi revient chaque semaine,
   l'inversion revenait chaque semaine elle aussi.

   Regroupées en vagues, les deux salles se lisent toujours dans le
   même ordre, que le tour parte à la même minute ou non.

   Le site public suit la même règle, recopiée dans
   assets/js/data.js (trierSeances) : il ne peut pas importer ce
   fichier, il n'est fait que de HTML, de CSS et de JavaScript sans
   compilation. verifications/ordre-des-seances.mjs compare les deux
   copies à chaque vérification, pour qu'elles ne puissent plus
   diverger sans qu'on le sache.
   ------------------------------------------------------------ */

/** Ce qu'il faut connaître d'une séance pour la ranger dans le programme. */
export interface SeanceOrdonnable {
  date?: string | null;
  heure?: string | null;
  salle?: string | null;
}

/**
 * Écart maximal entre la première séance d'une vague et les suivantes.
 *
 * Une demi-heure : c'est le décalage que l'on se permet entre deux
 * salles pour étaler l'arrivée du public et le service du bar. Au-delà,
 * ce n'est plus le même tour de séances — une matinée et une soirée ne
 * se lisent pas ensemble — et l'ordre redevient simplement l'heure.
 *
 * L'écart se mesure toujours depuis la PREMIÈRE séance de la vague :
 * une vague ne peut donc jamais s'étirer de proche en proche au-delà de
 * cette demi-heure.
 */
export const ECART_MEME_VAGUE_MIN = 30;

/** Rang d'une salle dans le programme. Une salle inconnue passe en dernier. */
export function rangDeSalle(nom: string | undefined | null): number {
  const rang = (SALLES as readonly string[]).indexOf(String(nom ?? ""));
  return rang === -1 ? SALLES.length : rang;
}

/**
 * « 21:15 » → 1275, le nombre de minutes depuis minuit.
 * Renvoie null si l'heure est illisible ou absente.
 *
 * C'est la seule lecture d'heure du Studio : l'ordre du programme et
 * la détection des conflits de salle doivent comprendre « 21:15 »
 * exactement de la même façon.
 */
export function heureEnMinutes(heure: string | undefined | null): number | null {
  const correspondance = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(heure ?? ""));
  if (!correspondance) return null;
  return Number(correspondance[1]) * 60 + Number(correspondance[2]);
}

/** Compare deux séances à la minute près : la date, puis l'heure, puis la salle. */
function comparerParHeure(a: SeanceOrdonnable, b: SeanceOrdonnable): number {
  const parDate = String(a.date ?? "").localeCompare(String(b.date ?? ""));
  if (parDate !== 0) return parDate;
  /* Les heures se comparent en minutes, pas en texte : « 9:30 »
     écrit sans son zéro passerait sinon après « 21:00 ». Une heure
     illisible se range en fin de journée plutôt que de jeter la
     liste entière par terre. */
  const minutesA = heureEnMinutes(a.heure) ?? Number.MAX_SAFE_INTEGER;
  const minutesB = heureEnMinutes(b.heure) ?? Number.MAX_SAFE_INTEGER;
  if (minutesA !== minutesB) return minutesA - minutesB;
  const rangA = rangDeSalle(a.salle);
  const rangB = rangDeSalle(b.salle);
  if (rangA !== rangB) return rangA - rangB;
  /* Deux salles hors liste : l'ordre alphabétique, pour que la
     grille reste la même d'un chargement à l'autre. */
  return String(a.salle ?? "").localeCompare(String(b.salle ?? ""));
}

/**
 * Range des séances dans l'ordre du programme : les vagues l'une après
 * l'autre, et dans chaque vague Salle 1, Salle 2, puis le Hall-Bar.
 *
 * La liste reçue n'est jamais modifiée : une copie rangée est renvoyée.
 * Les séances peuvent couvrir plusieurs jours — les vagues ne
 * franchissent jamais un changement de date.
 */
export function ordonnerSeances<T extends SeanceOrdonnable>(seances: readonly T[]): T[] {
  const parHeure = [...seances].sort(comparerParHeure);

  const vagues: T[][] = [];
  let vague: T[] = [];
  let dateDeLaVague = "";
  let debutDeLaVague: number | null = null;
  let sallesDeLaVague: string[] = [];

  for (const seance of parHeure) {
    const minutes = heureEnMinutes(seance.heure);
    const salle = String(seance.salle ?? "");
    /* La séance rejoint la vague en cours si c'est le même jour, si sa
       salle n'y joue pas déjà, et si elle part dans la demi-heure qui
       suit l'ouverture de la vague. Une heure illisible ne rejoint
       jamais rien : on ne sait pas où elle tombe. */
    const memeVague =
      vague.length > 0 &&
      minutes !== null &&
      debutDeLaVague !== null &&
      String(seance.date ?? "") === dateDeLaVague &&
      minutes - debutDeLaVague <= ECART_MEME_VAGUE_MIN &&
      !sallesDeLaVague.includes(salle);

    if (memeVague) {
      vague.push(seance);
      sallesDeLaVague.push(salle);
    } else {
      vague = [seance];
      vagues.push(vague);
      dateDeLaVague = String(seance.date ?? "");
      debutDeLaVague = minutes;
      sallesDeLaVague = [salle];
    }
  }

  const rangees: T[] = [];
  for (const groupe of vagues) {
    groupe.sort(
      (a, b) => rangDeSalle(a.salle) - rangDeSalle(b.salle) || comparerParHeure(a, b)
    );
    for (const seance of groupe) rangees.push(seance);
  }
  return rangees;
}
