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
