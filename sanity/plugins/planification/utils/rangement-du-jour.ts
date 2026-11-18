/* ============================================================
   Ce que chaque case d'une journée de la grille porte.

   Une case (salle + vague) reçoit au plus une chose : une séance, ou
   à défaut une case sans film. Ce qui ne trouve pas de case — une
   séance hors des vagues, au Hall-Bar, ou une seconde séance sur une
   case déjà prise — n'est pas escamoté : il rejoint les « séances
   particulières », sous la journée, où il reste visible. Une séance
   cachée serait une séance oubliée.
   ============================================================ */
import type {CaseSansFilm, SeancePlanning} from '../types'
import {HORS_GRILLE, vagueDeLaSeance} from './creneaux-standards'

export interface RangementDuJour {
  seances: Map<string, SeancePlanning>
  casesSansFilm: Map<string, CaseSansFilm>
  horsGrille: SeancePlanning[]
  casesHorsGrille: CaseSansFilm[]
}

/** L'identité d'une case de la grille, pour une salle et une vague. */
export function clefDeCase(salle: string, vague: number): string {
  return `${salle}|${vague}`
}

export function rangerLaJournee(
  seancesDuJour: readonly SeancePlanning[],
  casesDuJour: readonly CaseSansFilm[],
): RangementDuJour {
  const seances = new Map<string, SeancePlanning>()
  const horsGrille: SeancePlanning[] = []
  for (const seance of seancesDuJour) {
    const vague = vagueDeLaSeance(seance)
    const clef = clefDeCase(seance.salle, vague)
    if (vague !== HORS_GRILLE && !seances.has(clef)) seances.set(clef, seance)
    else horsGrille.push(seance)
  }

  const casesSansFilm = new Map<string, CaseSansFilm>()
  const casesHorsGrille: CaseSansFilm[] = []
  for (const caseSansFilm of casesDuJour) {
    const vague = vagueDeLaSeance(caseSansFilm)
    const clef = clefDeCase(caseSansFilm.salle, vague)
    if (vague !== HORS_GRILLE && !seances.has(clef) && !casesSansFilm.has(clef)) {
      casesSansFilm.set(clef, caseSansFilm)
    } else {
      casesHorsGrille.push(caseSansFilm)
    }
  }

  return {seances, casesSansFilm, horsGrille, casesHorsGrille}
}
