/* ============================================================
   Les créneaux ordinaires du cinéma.

   Une semaine normale se joue en DEUX VAGUES par jour : celle de
   19 h et celle de 21 h, dans les deux salles. Soit quatre séances
   par jour, vingt-huit sur la semaine.

   LE DIMANCHE, tout avance de deux heures : les vagues partent à
   17 h et à 19 h (demande du cinéma, 29 septembre 2026). Les vagues
   gardent leur numéro — 0 la première, 1 la seconde — seule leur
   heure change ; tout ce qui raisonne en vagues (le tirage, les
   échanges de salle) n'a donc pas à savoir quel jour on est.

   « 19 h » et « 21 h » sont des NOMS DE VAGUE, pas des heures fixes.
   La première part bien à 19 h ; la seconde part à 21 h *au plus
   tôt*, et plus tard si le film de 19 h n'est pas fini — un film de
   2 h 20 libère la salle à 21 h 20, et la séance suivante commence au
   quart d'heure suivant, 21 h 30. L'heure réelle de chaque case se
   calcule dans enchainement.ts.

   Le Hall-Bar ne fait pas partie de cette grille : on n'y joue que
   pour un événement particulier, quelques fois par an. Ses séances
   apparaissent sous la grille du jour, mais aucun assistant ne va en
   inventer.
   ============================================================ */
import {heureEnMinutes} from '../../../salles'
import {type NomDeSalle, SALLES} from '../../../salles'
import {DUREE_SEMAINE_JOURS, ajouterJours, estUnDimanche} from './dates'

/** Une vague de la soirée, et l'heure à laquelle elle part AU PLUS TÔT. */
export interface Vague {
  titre: string
  heureAuPlusTot: string
}

/** Du lundi au samedi : 19 h, puis 21 h. */
const VAGUES_EN_SEMAINE: readonly Vague[] = [
  {titre: '19 h', heureAuPlusTot: '19:00'},
  {titre: '21 h', heureAuPlusTot: '21:00'},
]

/** Le dimanche : 17 h, puis 19 h. */
const VAGUES_DU_DIMANCHE: readonly Vague[] = [
  {titre: '17 h', heureAuPlusTot: '17:00'},
  {titre: '19 h', heureAuPlusTot: '19:00'},
]

/** Le nombre de vagues d'une journée, le même tous les jours. */
export const NOMBRE_DE_VAGUES = VAGUES_EN_SEMAINE.length

/** Les vagues de ce jour-là, dans l'ordre de la soirée. */
export function vaguesDuJour(date: string): readonly Vague[] {
  return estUnDimanche(date) ? VAGUES_DU_DIMANCHE : VAGUES_EN_SEMAINE
}

/** L'heure à laquelle cette vague part au plus tôt, ce jour-là. */
export function heureDeLaVague(vague: number, date: string): string {
  const vagues = vaguesDuJour(date)
  return (vagues[vague] ?? vagues[0]).heureAuPlusTot
}

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
  /** 0 pour la première vague (19 h, 17 h le dimanche), 1 pour la seconde. */
  vague: number
}

/** Une place précise, telle qu'elle sera enregistrée : jour, heure, salle. */
export interface CreneauDate {
  date: string
  heure: string
  salle: string
}

/** Nombre de séances d'une semaine entièrement remplie. */
export const CRENEAUX_PAR_SEMAINE = DUREE_SEMAINE_JOURS * NOMBRE_DE_VAGUES * SALLES_STANDARD.length

/** Une séance hors de la grille ordinaire : ni première, ni seconde vague. */
export const HORS_GRILLE = -1

/**
 * À quelle vague appartient une séance ?
 *
 * On ne compare pas à l'heure pile : une séance de seconde vague peut
 * partir à 21:15 parce que le film précédent était long, et elle n'en
 * reste pas moins la séance « de 21 h ». Ce qui compte, c'est la
 * tranche : à partir de 19 h la première, à partir de 21 h la seconde
 * (17 h et 19 h le dimanche). Avant la première — une avant-première à
 * 18 h en semaine — on est hors grille.
 */
export function vagueDeLaSeance(seance: {date: string; heure: string; salle: string}): number {
  if (!SALLES_STANDARD.includes(seance.salle as NomDeSalle)) return HORS_GRILLE
  const minutes = heureEnMinutes(seance.heure)
  if (minutes === null) return HORS_GRILLE
  const vagues = vaguesDuJour(seance.date)
  for (let vague = vagues.length - 1; vague >= 0; vague -= 1) {
    const depart = heureEnMinutes(vagues[vague].heureAuPlusTot)
    if (depart !== null && minutes >= depart) return vague
  }
  return HORS_GRILLE
}

/** Les quatre cases ordinaires d'une journée : la première vague, puis la seconde. */
function creneauxOrdinairesDuJour(date: string): CreneauOrdinaire[] {
  return vaguesDuJour(date).flatMap((_, vague) => SALLES_STANDARD.map((salle) => ({date, salle, vague})))
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
