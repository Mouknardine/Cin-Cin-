/* ============================================================
   Les créneaux ordinaires du cinéma.

   Une semaine normale se joue en DEUX VAGUES par jour : celle de
   19 h et celle de 21 h, dans les deux salles. Soit quatre séances
   par jour, vingt-huit sur la semaine.

   « 19 h » et « 21 h » sont des NOMS DE VAGUE, pas des heures fixes.
   La première part bien à 19 h ; la seconde part à 21 h *au plus
   tôt*, et plus tard si le film de 19 h n'est pas fini — un film de
   2 h 20 libère la salle à 21 h 20, et la séance suivante commence à
   21 h 20 pile. L'heure réelle de chaque case se calcule dans
   enchainement.ts, à la minute près.

   Le Hall-Bar ne fait pas partie de cette grille : on n'y joue que
   pour un événement particulier, quelques fois par an. Ses séances
   apparaissent sous la grille du jour, mais aucun assistant ne va en
   inventer.
   ============================================================ */
import {heureEnMinutes} from '../../../salles'
import {type NomDeSalle, SALLES} from '../../../salles'
import {DUREE_SEMAINE_JOURS, ajouterJours} from './dates'

/**
 * Les deux vagues d'une journée ordinaire, et l'heure à laquelle
 * chacune part AU PLUS TÔT.
 */
export const VAGUES = [
  {titre: '19 h', heureAuPlusTot: '19:00'},
  {titre: '21 h', heureAuPlusTot: '21:00'},
] as const

/* Typées NomDeSalle : si une salle était renommée dans salles.ts, la
   vérification de types s'arrêterait ici plutôt que de laisser la
   grille se vider en silence. */
export const SALLES_STANDARD: readonly NomDeSalle[] = ['Salle 1', 'Salle 2']

/** La salle des séances particulières, affichée à part dans la grille. */
export const SALLE_EVENEMENT: NomDeSalle = 'Hall-Bar'

/** Une case de la grille : un jour, une salle, une vague — pas encore une heure. */
export interface CreneauOrdinaire {
  date: string
  salle: string
  /** 0 pour la vague de 19 h, 1 pour celle de 21 h. */
  vague: number
}

/** Une place précise, telle qu'elle sera enregistrée : jour, heure, salle. */
export interface CreneauDate {
  date: string
  heure: string
  salle: string
}

/** Nombre de séances d'une semaine entièrement remplie. */
export const CRENEAUX_PAR_SEMAINE = DUREE_SEMAINE_JOURS * VAGUES.length * SALLES_STANDARD.length

/** Une séance hors de la grille ordinaire : ni vague de 19 h, ni vague de 21 h. */
export const HORS_GRILLE = -1

/**
 * À quelle vague appartient une séance ?
 *
 * On ne compare pas à l'heure pile : une séance de seconde vague peut
 * partir à 21:15 parce que le film précédent était long, et elle n'en
 * reste pas moins la séance « de 21 h ». Ce qui compte, c'est la
 * tranche : à partir de 19 h la première, à partir de 21 h la seconde.
 * Avant 19 h — une avant-première à 18 h — on est hors grille.
 */
export function vagueDeLaSeance(seance: {heure: string; salle: string}): number {
  if (!SALLES_STANDARD.includes(seance.salle as NomDeSalle)) return HORS_GRILLE
  const minutes = heureEnMinutes(seance.heure)
  if (minutes === null) return HORS_GRILLE
  for (let vague = VAGUES.length - 1; vague >= 0; vague -= 1) {
    const depart = heureEnMinutes(VAGUES[vague].heureAuPlusTot)
    if (depart !== null && minutes >= depart) return vague
  }
  return HORS_GRILLE
}

/** Les quatre cases ordinaires d'une journée : la vague de 19 h, puis celle de 21 h. */
function creneauxOrdinairesDuJour(date: string): CreneauOrdinaire[] {
  return VAGUES.flatMap((_, vague) => SALLES_STANDARD.map((salle) => ({date, salle, vague})))
}

/** Les vingt-huit cases ordinaires d'une semaine, du mercredi au mardi. */
export function creneauxOrdinairesDeLaSemaine(debutSemaine: string): CreneauOrdinaire[] {
  return Array.from({length: DUREE_SEMAINE_JOURS}, (_, index) =>
    ajouterJours(debutSemaine, index),
  ).flatMap(creneauxOrdinairesDuJour)
}

/** L'identité d'une case, en une chaîne comparable. */
export function clefCreneau(creneau: CreneauOrdinaire): string {
  return `${creneau.date}|${creneau.salle}|${creneau.vague}`
}

/** La case sur laquelle tombe une séance existante. */
export function creneauDeLaSeance(seance: {
  date: string
  heure: string
  salle: string
}): CreneauOrdinaire {
  return {date: seance.date, salle: seance.salle, vague: vagueDeLaSeance(seance)}
}

/* Garde-fou : la liste des salles ordinaires doit rester un
   sous-ensemble des salles du cinéma. Un nom qui n'existe plus
   rendrait la grille inutilisable — autant s'en apercevoir au
   chargement du Studio. */
for (const salle of [...SALLES_STANDARD, SALLE_EVENEMENT]) {
  if (!(SALLES as readonly string[]).includes(salle)) {
    throw new Error(`Salle inconnue dans les créneaux ordinaires : « ${salle} ».`)
  }
}
