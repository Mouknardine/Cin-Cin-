/**
 * Lectures et écritures Sanity de l'outil « Planification ».
 * Le schéma « screening » utilise des noms de champs anglais (time, room…) :
 * on les traduit ici vers les noms internes français de l'outil.
 * Les séances créées ici sont publiées immédiatement (visibles sur le site sans clic « Publish »).
 */
import type {SanityClient} from 'sanity'

import {ordonnerSeances} from '../../../salles'
import type {FilmPlanning, NouvelleSeance, SeancePlanning} from '../types'

const CHAMPS_SEANCE = `{
  _id, date,
  "heure": time,
  "salle": room,
  "filmId": film._ref,
  "filmTitre": coalesce(film->title, "Film supprimé"),
  "filmDuree": film->duration
}`

/**
 * Une séance en cours d'édition existe en deux exemplaires : la version
 * publiée et son brouillon. La grille n'en montre qu'un — le brouillon,
 * qui porte l'intention la plus récente — sans quoi la même séance
 * apparaîtrait deux fois et occuperait deux cases.
 */
function sansDoublonDeBrouillon(seances: SeancePlanning[]): SeancePlanning[] {
  const parIdentite = new Map<string, SeancePlanning>()
  for (const seance of seances) {
    const identite = seance._id.replace(/^drafts\./, '')
    const connue = parIdentite.get(identite)
    if (!connue || seance._id.startsWith('drafts.')) parIdentite.set(identite, seance)
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

/** Tous les films, triés par titre (pour les listes déroulantes). */
export async function chargerFilms(client: SanityClient): Promise<FilmPlanning[]> {
  return client.fetch(
    `*[_type == "film"]{_id, "titre": title, "duree": duration, "statut": status}
      | order(lower(titre) asc)`,
  )
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

/** Supprime une séance (version publiée et brouillon éventuel). */
export async function supprimerSeance(client: SanityClient, id: string): Promise<void> {
  const idPublie = id.replace(/^drafts\./, '')
  await client.transaction().delete(idPublie).delete(`drafts.${idPublie}`).commit()
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
