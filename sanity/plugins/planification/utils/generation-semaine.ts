/* ============================================================
   Composer une semaine entière, tout seul.

   On donne des films et une semaine ; l'outil remplit les cases
   ordinaires encore libres en donnant à peu près le même nombre de
   séances à chaque film, puis donne à chacune son heure exacte : 19 h
   pour la première vague, 21 h pour la seconde — ou plus tard si le
   film de 19 h déborde (voir enchainement.ts).

   Ce qui est DÉJÀ programmé n'est jamais touché : ni remplacé, ni
   déplacé. Une séance particulière posée au Hall-Bar, une
   avant-première calée à 18 h, un film qu'on tenait à mettre le
   samedi soir — tout cela reste, et le hasard se contente des cases
   qui restent.

   Comme repartition.ts, ce fichier ne fait que des calculs : il se
   vérifie tout seul dans verifications/repartition.mjs.
   ============================================================ */
import type {FilmPlanning, SeanceCandidate, SeancePlanning} from '../types'
import {
  type CreneauOrdinaire,
  HORS_GRILLE,
  clefCreneau,
  creneauDeLaSeance,
  creneauxOrdinairesDeLaSemaine,
} from './creneaux-standards'
import {poserLesHeures, tientDansLaCase} from './heures-de-la-grille'
import {intervallesSeChevauchent} from './conflits'
import {type Alea, affecterFilms, repartirEquitablement} from './repartition'

/** Les cases ordinaires de la semaine sur lesquelles rien n'est encore posé. */
export function creneauxLibres(
  debutSemaine: string,
  seancesExistantes: readonly SeancePlanning[],
): CreneauOrdinaire[] {
  const occupees = new Set(
    seancesExistantes
      .map(creneauDeLaSeance)
      .filter((creneau) => creneau.vague !== HORS_GRILLE)
      .map(clefCreneau),
  )
  return creneauxOrdinairesDeLaSemaine(debutSemaine).filter(
    (creneau) => !occupees.has(clefCreneau(creneau)),
  )
}

/** Ce qu'il faut savoir pour composer une semaine. */
export interface DemandeDeSemaine {
  debutSemaine: string
  /** Les films retenus, dans l'ordre où ils sont proposés. */
  films: readonly FilmPlanning[]
  /** Les séances déjà posées cette semaine-là : elles restent en place. */
  seancesExistantes: readonly SeancePlanning[]
  /**
   * Combien de séances chaque film a déjà, sur une période plus large.
   * C'est ce qui égalise les films SUR LA DURÉE et pas seulement sur la
   * semaine. Vide, l'égalité ne porte que sur la semaine demandée.
   */
  dejaProgrammees?: Readonly<Record<string, number>>
}

/**
 * Les séances à créer pour remplir la semaine.
 *
 * Rien n'est écrit dans Sanity ici : la liste passe encore par la
 * vérification des doublons et des conflits de salle avant création.
 */
export function composerLaSemaine(
  demande: DemandeDeSemaine,
  alea: Alea = Math.random,
): SeanceCandidate[] {
  const {debutSemaine, films, seancesExistantes, dejaProgrammees = {}} = demande
  if (films.length === 0) return []

  const creneaux = creneauxLibres(debutSemaine, seancesExistantes)
  if (creneaux.length === 0) return []

  const pool = repartirEquitablement(
    films.map((film) => film._id),
    creneaux.length,
    dejaProgrammees,
    alea,
  )
  const parFilm = new Map(films.map((film) => [film._id, film]))

  /* Les séances déjà en place sont passées telles quelles : le tirage
     s'arrange pour ne pas venir se poser à côté d'elles, et leurs
     durées décident de l'heure des séances qui les suivent. */
  const dejaPosees = seancesExistantes
    .map((seance) => ({...creneauDeLaSeance(seance), filmId: seance.filmId}))
    .filter((place) => place.vague !== HORS_GRILLE)
  const affectations = affecterFilms(creneaux, pool, {
    alea,
    dejaPosees,
    /* Un film de 2 h 20 ne peut pas être posé à 19 h si une séance est
       déjà calée à 21 h : elle, on n'y touche pas. */
    convient: (filmId, creneau) =>
      tientDansLaCase(parFilm.get(filmId)?.duree ?? null, creneau, seancesExistantes),
  })

  const candidates = poserLesHeures(
    affectations,
    (filmId) => parFilm.get(filmId)?.duree ?? null,
    seancesExistantes,
  ).map((place) => ({
    filmId: place.filmId,
    titre: parFilm.get(place.filmId)?.titre ?? 'Film',
    duree: parFilm.get(place.filmId)?.duree ?? null,
    date: place.date,
    heure: place.heure,
    salle: place.salle,
  }))

  /* Dernier filet : si malgré tout un film empiète sur une séance déjà
     programmée, on renonce à cette case plutôt que de proposer une
     séance impossible. Mieux vaut une case vide qu'un conflit. */
  return candidates.filter(
    (candidate) =>
      !seancesExistantes.some(
        (existante) =>
          existante.date === candidate.date &&
          existante.salle === candidate.salle &&
          intervallesSeChevauchent(
            candidate.heure,
            candidate.duree,
            existante.heure,
            existante.filmDuree,
          ),
      ),
  )
}

/** Combien de séances chaque film reçoit dans cette proposition. */
export function compterParFilm(candidates: readonly SeanceCandidate[]): Map<string, number> {
  const comptes = new Map<string, number>()
  for (const candidate of candidates) {
    comptes.set(candidate.filmId, (comptes.get(candidate.filmId) ?? 0) + 1)
  }
  return comptes
}
