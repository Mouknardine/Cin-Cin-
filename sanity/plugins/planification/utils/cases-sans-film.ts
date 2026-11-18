/* ============================================================
   Ce qu'une case sans film empêche.

   Les assistants — remplir au hasard, dupliquer, programmer un
   film — ne posent jamais de film sur une case sans film :

     - « Vacances » ferme toute la journée, dans toutes les salles ;
     - « Projection privée » tient sa salle à son heure, comme un
       film dont on ignore la durée (deux heures, voir conflits.ts).

   Rien n'est écrit ici, rien n'est lu dans Sanity : ces fonctions se
   vérifient hors du Studio (verifications/cases-sans-film.mjs).
   ============================================================ */
import {prendToutLeJour} from '../../../casesSansFilm'
import type {CaseSansFilm, SeanceCandidate, SeancePlanning} from '../types'
import {type ResultatVerification, intervallesSeChevauchent, verifierNouvellesSeances} from './conflits'
import {type CreneauOrdinaire, HORS_GRILLE, vagueDeLaSeance} from './creneaux-standards'
import {formatJourCourt} from './dates'

/** Une place à réserver : un jour, une heure, une salle, une durée connue ou non. */
interface PlaceVoulue {
  date: string
  heure: string
  salle: string
  duree: number | null
}

/** La case sans film qui interdit cette place, s'il y en a une. */
export function caseQuiBloque(
  place: PlaceVoulue,
  cases: readonly CaseSansFilm[],
): CaseSansFilm | undefined {
  return cases.find(
    (caseSansFilm) =>
      caseSansFilm.date === place.date &&
      (prendToutLeJour(caseSansFilm.libelle) ||
        (caseSansFilm.salle === place.salle &&
          intervallesSeChevauchent(place.heure, place.duree, caseSansFilm.heure, null))),
  )
}

/** Une case ordinaire de la grille est-elle prise par une case sans film ? */
export function creneauBloque(creneau: CreneauOrdinaire, cases: readonly CaseSansFilm[]): boolean {
  return cases.some(
    (caseSansFilm) =>
      caseSansFilm.date === creneau.date &&
      (prendToutLeJour(caseSansFilm.libelle) ||
        (caseSansFilm.salle === creneau.salle &&
          creneau.vague !== HORS_GRILLE &&
          vagueDeLaSeance(caseSansFilm) === creneau.vague)),
  )
}

function raisonDuBlocage(candidate: SeanceCandidate, gene: CaseSansFilm): string {
  const raison = prendToutLeJour(gene.libelle)
    ? `jour de « ${gene.libelle} »`
    : `chevauche « ${gene.libelle} » (${gene.heure})`
  return `${formatJourCourt(candidate.date)} ${candidate.heure} · ${candidate.salle} — ${raison}`
}

/**
 * Le tri des séances candidates avant création, cases sans film
 * comprises : celles qui tombent sur une case sans film rejoignent les
 * conflits, avec leur raison ; les autres passent la vérification
 * ordinaire (doublons, chevauchements de salle).
 */
export function verifierAvantCreation(
  candidates: readonly SeanceCandidate[],
  existantes: SeancePlanning[],
  cases: readonly CaseSansFilm[],
): ResultatVerification {
  const libres: SeanceCandidate[] = []
  const bloquees: string[] = []
  for (const candidate of candidates) {
    const gene = caseQuiBloque(candidate, cases)
    if (gene) bloquees.push(raisonDuBlocage(candidate, gene))
    else libres.push(candidate)
  }
  const verification = verifierNouvellesSeances(libres, existantes)
  return {...verification, conflits: [...bloquees, ...verification.conflits]}
}
