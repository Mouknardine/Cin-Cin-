/* ============================================================
   L'enchaînement des séances dans une salle, à la minute près.

   La séance de 21 h ne part pas toujours à 21 h. Un film de 2 h 20
   commencé à 19 h libère la salle à 21 h 20 : la séance suivante
   commence alors au QUART D'HEURE SUIVANT, 21 h 30. Un programme se
   lit en 21:15, 21:30, 21:45 — jamais en 21:43 (demande du cinéma,
   22 septembre 2026). Un film qui finit pile sur un quart d'heure
   (21:15) laisse partir la suite à cette minute-là.

   Le dimanche, la même règle s'applique deux heures plus tôt : 17 h,
   puis 19 h au plus tôt (voir creneaux-standards.ts).

   La détection des conflits, elle, reste à la minute exacte de fin
   du film (voir conflits.ts, qui dit pourquoi) : l'arrondi ne sert
   qu'à choisir l'heure d'une séance, jamais à en refuser une.

   Deux services :

     - `heureDeDepart` : à quelle heure poser une NOUVELLE séance ;
     - `recalagesNecessaires` : quelles séances existantes ne sont
       plus à la bonne heure parce que le film d'avant a changé.

   Le recalage marche DANS LES DEUX SENS. Un film plus long repousse
   la séance suivante ; un film plus court la ramène à son heure
   habituelle. Sans ce retour, une séance gardait l'heure d'un film
   qui n'était plus là : après avoir dupliqué une semaine et échangé
   des films, « Kalari Kid » restait à 21:15 derrière un film fini à
   20:26 (signalé par le cinéma, 29 septembre 2026).
   ============================================================ */
import {heureEnMinutes} from '../../../salles'
import {DUREE_PAR_DEFAUT_MIN} from './conflits'
import {
  HORS_GRILLE,
  NOMBRE_DE_VAGUES,
  SALLES_STANDARD,
  heureDeLaVague,
  vagueDeLaSeance,
} from './creneaux-standards'
import {formatJourCourt} from './dates'

const MINUTES_PAR_JOUR = 24 * 60

/** Les séances partent sur un quart d'heure : 21:00, 21:15, 21:30, 21:45. */
const PAS_DES_HORAIRES_MIN = 15

/** Arrondit au quart d'heure suivant : 1283 (21:23) donne 1290 (21:30). */
function auQuartDHeureSuivant(minutes: number): number {
  return Math.ceil(minutes / PAS_DES_HORAIRES_MIN) * PAS_DES_HORAIRES_MIN
}

/** Ce qu'il faut savoir d'une séance pour l'enchaîner à la suivante. */
export interface SeanceEnGrille {
  _id: string
  date: string
  heure: string
  salle: string
  filmDuree: number | null
  filmTitre: string
}

/** « 21:15 » depuis 1275 minutes. Renvoie null si la séance déborde sur le lendemain. */
export function heureDepuisMinutes(minutes: number): string | null {
  if (minutes >= MINUTES_PAR_JOUR || minutes < 0) return null
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** La minute exacte à laquelle une séance libère sa salle. */
function finEnMinutes(seance: {heure: string; filmDuree: number | null}): number | null {
  const debut = heureEnMinutes(seance.heure)
  if (debut === null) return null
  return debut + (seance.filmDuree ?? DUREE_PAR_DEFAUT_MIN)
}

/**
 * À quelle heure poser une séance sur cette vague, ce jour-là.
 *
 * `precedente` est la séance qui occupe déjà la salle plus tôt dans la
 * soirée, s'il y en a une. La vague part à son heure habituelle, ou au
 * quart d'heure qui suit la fin du film précédent si celui-ci déborde.
 */
export function heureDeDepart(
  vague: number,
  date: string,
  precedente: {heure: string; filmDuree: number | null} | null,
): string {
  const habituelle = heureDeLaVague(vague, date)
  if (!precedente) return habituelle
  const fin = finEnMinutes(precedente)
  const depart = heureEnMinutes(habituelle)
  if (fin === null || depart === null || fin <= depart) return habituelle
  /* Un film qui déborderait sur le lendemain n'a pas d'heure de suite
     représentable : on laisse l'heure habituelle, et le chevauchement
     s'affichera en rouge plutôt que d'inventer une heure fausse. */
  return heureDepuisMinutes(auQuartDHeureSuivant(fin)) ?? habituelle
}

/** Les séances d'une journée dans une salle, rangées par vague. */
function parVague(seances: readonly SeanceEnGrille[]): Map<number, SeanceEnGrille> {
  const index = new Map<number, SeanceEnGrille>()
  for (const seance of seances) {
    const vague = vagueDeLaSeance(seance)
    if (vague === HORS_GRILLE) continue
    const connue = index.get(vague)
    /* Deux séances sur la même vague : c'est un doublon ou un conflit
       en cours de correction. On retient la plus matinale, celle qui
       occupe vraiment la case. */
    if (!connue || seance.heure < connue.heure) index.set(vague, seance)
  }
  return index
}

/** Une séance à remettre à la bonne heure. */
export interface Recalage {
  id: string
  titre: string
  date: string
  /** L'heure qu'elle a aujourd'hui. */
  de: string
  /** L'heure à laquelle elle doit passer. */
  vers: string
  /** Le film d'avant, qui décide de son heure. */
  cause: string
}

/**
 * Les séances qui ne sont plus à la bonne heure.
 *
 * On ne regarde que la seconde vague : elle part à son heure habituelle,
 * ou au quart d'heure qui suit la fin du film de la première vague dans
 * la même salle s'il déborde. Toute autre heure est un reste d'un ancien
 * film, et se corrige — plus tard comme plus tôt.
 */
export function recalagesNecessaires(seances: readonly SeanceEnGrille[]): Recalage[] {
  const recalages: Recalage[] = []
  const parSalleEtJour = new Map<string, SeanceEnGrille[]>()
  for (const seance of seances) {
    if (!SALLES_STANDARD.includes(seance.salle as (typeof SALLES_STANDARD)[number])) continue
    const clef = `${seance.date}|${seance.salle}`
    parSalleEtJour.set(clef, [...(parSalleEtJour.get(clef) ?? []), seance])
  }

  for (const soiree of parSalleEtJour.values()) {
    const vagues = parVague(soiree)
    for (let vague = 1; vague < NOMBRE_DE_VAGUES; vague += 1) {
      const suivante = vagues.get(vague)
      const precedente = vagues.get(vague - 1)
      if (!suivante || !precedente) continue
      const attendue = heureDeDepart(vague, suivante.date, precedente)
      const actuelle = heureEnMinutes(suivante.heure)
      const voulue = heureEnMinutes(attendue)
      if (actuelle === null || voulue === null || actuelle === voulue) continue
      recalages.push({
        id: suivante._id,
        titre: suivante.filmTitre,
        date: suivante.date,
        de: suivante.heure,
        vers: attendue,
        cause: precedente.filmTitre,
      })
    }
  }
  return recalages
}

/** Une séance ramenée plus tôt, ou repoussée plus tard ? */
function estAvancee(recalage: Recalage): boolean {
  return (heureEnMinutes(recalage.vers) ?? 0) < (heureEnMinutes(recalage.de) ?? 0)
}

/** Une phrase par séance recalée, qui dit pourquoi. */
function resumerUnRecalage(recalage: Recalage): string {
  const debut = `${formatJourCourt(recalage.date)} : « ${recalage.titre} » passe de ${recalage.de} à ${recalage.vers}`
  return estAvancee(recalage)
    ? `${debut}, « ${recalage.cause} » finissant plus tôt.`
    : `${debut}, le temps que finisse « ${recalage.cause} ».`
}

/** Ce que l'outil annonce après avoir remis des séances à l'heure. */
export function resumerRecalages(recalages: readonly Recalage[]): string {
  return recalages.map(resumerUnRecalage).join(' ')
}
