/* ============================================================
   Les calculs de « Dupliquer la semaine » : recopier une séance
   quelques semaines plus loin, ou rebattre les cartes — les mêmes
   films, en même nombre, chacun dans SA salle, à d'autres jours et
   d'autres moments de la soirée.

   Rien n'est écrit ici : l'écran (components/DialogDupliquerSemaine.tsx)
   fait vérifier ces séances avant de les créer.
   ============================================================ */
import type {SeanceCandidate, SeancePlanning} from '../types'
import {HORS_GRILLE, SALLES_STANDARD, creneauDeLaSeance, vagueDeLaSeance} from './creneaux-standards'
import {ajouterJours} from './dates'
import {poserLesHeures} from './heures-de-la-grille'
import {type Place, affecterFilms} from './repartition'

/** Recopie une séance telle quelle, une ou plusieurs semaines plus loin. */
export function recopier(seance: SeancePlanning, decalage: number): SeanceCandidate {
  return {
    filmId: seance.filmId,
    titre: seance.filmTitre,
    duree: seance.filmDuree,
    date: ajouterJours(seance.date, decalage * 7),
    heure: seance.heure,
    salle: seance.salle,
  }
}

/** Une séance tombe-t-elle sur une case ordinaire de la grille ? */
export function estOrdinaire(seance: SeancePlanning): boolean {
  return vagueDeLaSeance(seance) !== HORS_GRILLE
}

/**
 * Les séances de la semaine d'arrivée, films redistribués au hasard sur les
 * mêmes cases, salle par salle : un film ne quitte pas sa salle. Les
 * séances particulières sont recopiées à l'identique.
 *
 * Les heures sont RECALCULÉES, pas recopiées : un film de 2 h 20 qui atterrit
 * à 19 h repousse la séance de 21 h de sa salle au quart d'heure suivant.
 */
export function rebattreLesCartes(
  seancesSemaine: SeancePlanning[],
  decalage: number,
  dejaPosees: readonly SeancePlanning[],
): SeanceCandidate[] {
  const ordinaires = seancesSemaine.filter(estOrdinaire)
  const particulieres = seancesSemaine.filter((seance) => !estOrdinaire(seance))
  const parFilm = new Map(ordinaires.map((seance) => [seance.filmId, seance]))

  const occupees: Place[] = dejaPosees
    .map((seance) => ({...creneauDeLaSeance(seance), filmId: seance.filmId}))
    .filter((place) => place.vague !== HORS_GRILLE)

  const affectations: Place[] = []
  for (const salle of SALLES_STANDARD) {
    const deLaSalle = ordinaires.filter((seance) => seance.salle === salle)
    const creneaux = deLaSalle.map((seance) => ({
      ...creneauDeLaSeance(seance),
      date: ajouterJours(seance.date, decalage * 7),
    }))
    const pool = deLaSalle.map((seance) => seance.filmId)
    affectations.push(
      ...affecterFilms(creneaux, pool, {dejaPosees: [...occupees, ...affectations]}),
    )
  }

  const melangees = poserLesHeures(
    affectations,
    (filmId) => parFilm.get(filmId)?.filmDuree ?? null,
    dejaPosees,
  ).map((place) => ({
    filmId: place.filmId,
    titre: parFilm.get(place.filmId)?.filmTitre ?? 'Film',
    duree: parFilm.get(place.filmId)?.filmDuree ?? null,
    date: place.date,
    heure: place.heure,
    salle: place.salle,
  }))

  return [...melangees, ...particulieres.map((seance) => recopier(seance, decalage))]
}
