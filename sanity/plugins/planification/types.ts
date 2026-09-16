/**
 * Types partagés de l'outil « Planification ».
 */

/** Version d'API Sanity utilisée par l'outil. */
export const API_VERSION = '2025-02-19'

/* Les salles du cinéma viennent de sanity/salles.ts, la source unique :
   les redéclarer ici les avait déjà fait diverger — l'outil ne
   proposait que deux salles quand le schéma en acceptait trois, et
   le Hall-Bar était donc impossible à programmer d'ici. */
export {SALLES, ordonnerSeances, rangDeSalle} from '../../salles'

export type {CreneauDate} from './utils/creneaux-standards'

/** Un film tel que chargé pour la planification. */
export interface FilmPlanning {
  _id: string
  titre: string
  duree: number | null
  /* « a-laffiche », « cycle », « passe »… — voir schemaTypes/film.ts.
     Sert à proposer d'emblée les bons films quand on demande à
     l'outil de remplir une semaine tout seul. */
  statut: string | null
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

/* ------------------------------------------------------------------
   Ce que la grille sait faire, et comment on y glisse une séance.

   Ces deux objets voyagent de l'outil jusqu'aux cases de la grille.
   Les regrouper évite de faire descendre une dizaine de fonctions une
   par une à travers trois composants.
   ------------------------------------------------------------------ */

/** Les actions proposées sur une séance ou sur une case vide. */
import type {CreneauDate} from './utils/creneaux-standards'

export interface ActionsPlanning {
  onSupprimer: (seance: SeancePlanning) => void
  onChangerFilm: (seance: SeancePlanning) => void
  onAjouter: (creneau: CreneauDate) => void
}

/**
 * L'état du glisser-déposer, partagé par toute la grille.
 *
 * `onDeposer` reçoit la case visée et, si elle est déjà occupée, la
 * séance qui s'y trouve : c'est ce qui distingue un déplacement d'un
 * échange.
 */
export interface GlisserDeposer {
  seanceGlissee: SeancePlanning | null
  onDebut: (seance: SeancePlanning) => void
  onFin: () => void
  onDeposer: (creneau: CreneauDate, occupant: SeancePlanning | null) => void
}
