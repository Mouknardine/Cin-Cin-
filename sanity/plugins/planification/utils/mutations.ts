/**
 * Lectures et écritures Sanity de l'outil « Planification ».
 * Le schéma « screening » utilise des noms de champs anglais (time, room…) :
 * on les traduit ici vers les noms internes français de l'outil.
 * Les séances créées ici sont publiées immédiatement (visibles sur le site sans clic « Publish »).
 */
import type {SanityClient} from 'sanity'

import type {LibelleSansFilm} from '../../../casesSansFilm'
import {ordonnerSeances} from '../../../salles'
import type {CaseSansFilm, CreneauDate, FilmPlanning, NouvelleSeance, SeancePlanning} from '../types'

const CHAMPS_SEANCE = `{
  _id, date,
  "heure": time,
  "salle": room,
  "filmId": film._ref,
  "filmTitre": coalesce(film->title, "Film supprimé"),
  "filmDuree": film->duration,
  "evenement": evenementDuFilm
}`

/**
 * Une séance en cours d'édition existe en deux exemplaires : la version
 * publiée et son brouillon. La grille n'en montre qu'un — le brouillon,
 * qui porte l'intention la plus récente — sans quoi la même séance
 * apparaîtrait deux fois et occuperait deux cases.
 */
function sansDoublonDeBrouillon<T extends {_id: string}>(documents: T[]): T[] {
  const parIdentite = new Map<string, T>()
  for (const document of documents) {
    const identite = document._id.replace(/^drafts\./, '')
    const connu = parIdentite.get(identite)
    if (!connu || document._id.startsWith('drafts.')) parIdentite.set(identite, document)
  }
  return [...parIdentite.values()]
}

/**
 * Les séances programmées entre deux dates (incluses), dans l'ordre du
 * programme : les vagues de séances l'une après l'autre, et dans
 * chaque vague Salle 1, Salle 2, puis le Hall-Bar (voir
 * sanity/salles.ts). Ce rangement se fait ici et pas dans la requête :
 * Sanity ne sait trier qu'à la minute près, et « Hall-Bar » passerait
 * devant « Salle 1 » par ordre alphabétique.
 */
export async function chargerSeancesPeriode(
  client: SanityClient,
  debut: string,
  fin: string,
): Promise<SeancePlanning[]> {
  const seances = await client.fetch<SeancePlanning[]>(
    `*[_type == "screening" && defined(date) && date >= $debut && date <= $fin] ${CHAMPS_SEANCE}
      | order(date asc, heure asc)`,
    {debut, fin},
  )
  return ordonnerSeances(sansDoublonDeBrouillon(seances ?? []))
}

/**
 * Un film modifié mais pas encore republié existe en deux exemplaires :
 * la version publiée et son brouillon. Les listes déroulantes le
 * montraient deux fois (« MR. NOBODY AGAINST PUTIN », 18 novembre 2026),
 * et choisir le brouillon aurait fait désigner à la séance une fiche
 * qui n'est pas celle du site. On garde la version publiée — c'est elle
 * que les séances désignent. Un film jamais publié garde son brouillon.
 */
export function filmsSansDoublon(films: readonly FilmPlanning[]): FilmPlanning[] {
  const publies = new Set(films.filter((film) => !film._id.startsWith('drafts.')).map((film) => film._id))
  return films.filter(
    (film) => !film._id.startsWith('drafts.') || !publies.has(film._id.replace(/^drafts\./, '')),
  )
}

/** Tous les films, triés par titre (pour les listes déroulantes). */
export async function chargerFilms(client: SanityClient): Promise<FilmPlanning[]> {
  const films = await client.fetch<FilmPlanning[]>(
    `*[_type == "film"]{_id, "titre": title, "duree": duration, "statut": status}
      | order(lower(titre) asc)`,
  )
  return filmsSansDoublon(films ?? [])
}

/** Crée toutes les séances en une seule transaction (tout passe, ou rien). */
export async function creerSeances(
  client: SanityClient,
  seances: NouvelleSeance[],
): Promise<void> {
  if (seances.length === 0) return
  const transaction = client.transaction()
  for (const seance of seances) {
    transaction.create({
      _type: 'screening',
      film: {_type: 'reference', _ref: seance.filmId},
      date: seance.date,
      time: seance.heure,
      room: seance.salle,
      status: 'disponible',
    })
  }
  await transaction.commit()
}

/** Supprime une fiche, version publiée et brouillon éventuel. */
async function supprimerFiche(client: SanityClient, id: string): Promise<void> {
  const idPublie = id.replace(/^drafts\./, '')
  await client.transaction().delete(idPublie).delete(`drafts.${idPublie}`).commit()
}

/** Supprime une séance (version publiée et brouillon éventuel). */
export async function supprimerSeance(client: SanityClient, id: string): Promise<void> {
  await supprimerFiche(client, id)
}

/** Les cases sans film (vacances, projections privées) entre deux dates incluses. */
export async function chargerCasesSansFilm(
  client: SanityClient,
  debut: string,
  fin: string,
): Promise<CaseSansFilm[]> {
  const cases = await client.fetch<CaseSansFilm[]>(
    `*[_type == "sansFilm" && defined(date) && date >= $debut && date <= $fin]{
      _id, date,
      "heure": coalesce(time, ""),
      "salle": coalesce(room, ""),
      "libelle": coalesce(libelle, "Case sans film")
    } | order(date asc, heure asc)`,
    {debut, fin},
  )
  return sansDoublonDeBrouillon(cases ?? [])
}

/** Pose une case sans film sur une case libre, publiée aussitôt. */
export async function creerCaseSansFilm(
  client: SanityClient,
  creneau: CreneauDate,
  libelle: LibelleSansFilm,
): Promise<void> {
  await client.create({
    _type: 'sansFilm',
    libelle,
    date: creneau.date,
    time: creneau.heure,
    room: creneau.salle,
  })
}

/** Retire une case sans film : la case redevient libre. */
export async function retirerCaseSansFilm(client: SanityClient, id: string): Promise<void> {
  await supprimerFiche(client, id)
}

/**
 * Combien de séances chaque film a-t-il déjà, sur toute la période donnée ?
 *
 * C'est ce qui permet à la génération d'une semaine d'équilibrer les films
 * sur la durée plutôt que semaine par semaine.
 */
export async function compterSeancesParFilm(
  client: SanityClient,
  debut: string,
  fin: string,
): Promise<Record<string, number>> {
  const seances = await client.fetch<{filmId: string | null}[]>(
    `*[_type == "screening" && defined(date) && date >= $debut && date <= $fin]{"filmId": film._ref}`,
    {debut, fin},
  )
  const comptes: Record<string, number> = {}
  for (const {filmId} of seances ?? []) {
    if (!filmId) continue
    comptes[filmId] = (comptes[filmId] ?? 0) + 1
  }
  return comptes
}
