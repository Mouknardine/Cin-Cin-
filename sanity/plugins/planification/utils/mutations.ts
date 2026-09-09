/**
 * Lectures et écritures Sanity de l'outil « Planification ».
 * Le schéma « screening » utilise des noms de champs anglais (time, room…) :
 * on les traduit ici vers les noms internes français de l'outil.
 * Les séances créées ici sont publiées immédiatement (visibles sur le site sans clic « Publish »).
 */
import type {SanityClient} from 'sanity'

import {comparerSeances} from '../../../salles'
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
 * Les séances publiées entre deux dates (incluses), dans l'ordre du
 * programme : la date, puis l'heure, puis la salle. Le dernier tri se
 * fait ici et pas dans la requête : trié par Sanity, « Hall-Bar »
 * passerait devant « Salle 1 » par ordre alphabétique.
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
  return [...(seances ?? [])].sort(comparerSeances)
}

/** Tous les films, triés par titre (pour les listes déroulantes). */
export async function chargerFilms(client: SanityClient): Promise<FilmPlanning[]> {
  return client.fetch(
    `*[_type == "film"]{_id, "titre": title, "duree": duration} | order(lower(titre) asc)`,
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
