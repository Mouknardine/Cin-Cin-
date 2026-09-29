/**
 * Les séances qu'un film recevrait : ses créneaux hebdomadaires, répétés
 * sur le nombre de semaines voulu, à partir d'une date. Les créneaux déjà
 * passés à cette date sont écartés.
 */
import type {Creneau, FilmPlanning, SeanceCandidate} from '../types'
import {ajouterJours, debutDeSemaine} from './dates'

export function genererCandidates(
  film: FilmPlanning,
  creneaux: Creneau[],
  dateDebut: string,
  nbSemaines: number,
): SeanceCandidate[] {
  const premierMercredi = debutDeSemaine(dateDebut)
  const candidates: SeanceCandidate[] = []
  for (let semaine = 0; semaine < nbSemaines; semaine += 1) {
    for (const creneau of creneaux) {
      const date = ajouterJours(premierMercredi, semaine * 7 + creneau.jour)
      if (date < dateDebut) continue
      candidates.push({
        filmId: film._id,
        titre: film.titre,
        duree: film.duree,
        date,
        heure: creneau.heure,
        salle: creneau.salle,
      })
    }
  }
  return candidates
}
