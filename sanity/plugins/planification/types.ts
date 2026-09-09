/**
 * Types partagés de l'outil « Planification ».
 */

/** Version d'API Sanity utilisée par l'outil. */
export const API_VERSION = '2025-02-19'

/* Les salles du cinéma viennent de sanity/salles.ts, la source unique :
   les redéclarer ici les avait déjà fait diverger — l'outil ne
   proposait que deux salles quand le schéma en acceptait trois, et
   le Hall-Bar était donc impossible à programmer d'ici. */
export {SALLES, comparerSeances, rangDeSalle} from '../../salles'

/** Un film tel que chargé pour la planification. */
export interface FilmPlanning {
  _id: string
  titre: string
  duree: number | null
}

/** Une séance existante, enrichie des infos de son film. */
export interface SeancePlanning {
  _id: string
  date: string
  heure: string
  salle: string
  filmId: string
  filmTitre: string
  filmDuree: number | null
}

/** Une séance à créer (pas encore enregistrée). */
export interface NouvelleSeance {
  filmId: string
  date: string
  heure: string
  salle: string
}

/** Une séance candidate à la création, avec les infos du film pour vérifier les conflits. */
export interface SeanceCandidate extends NouvelleSeance {
  titre: string
  duree: number | null
}

/**
 * Un créneau hebdomadaire : jour, heure de début et salle.
 *
 * « jour » compte les jours depuis le mercredi qui ouvre la semaine de cinéma.
 * Mercredi vaut donc 0, jeudi 1… et mardi 6.
 */
export interface Creneau {
  jour: number
  heure: string
  salle: string
}

/** Bilan d'une création en masse, affiché à l'utilisateur. */
export interface RapportCreation {
  creees: number
  doublons: number
  conflits: string[]
}
