/**
 * Lectures et écritures Sanity de l'outil « Planification ».
 * Le schéma « screening » utilise des noms de champs anglais (time, room…) :
 * on les traduit ici vers les noms internes français de l'outil.
 * Les séances créées ici sont publiées immédiatement (visibles sur le site sans clic « Publish »).
 */
import type {SanityClient} from 'sanity'

import {comparerSeancesSelon} from '../../../ordreDesSeances'
import type {CinemaPlanning, FilmPlanning, NouvelleSeance, SeancePlanning} from '../types'

const CHAMPS_SEANCE = `{
  _id, date,
  "heure": time,
  "salle": room,
  "filmId": film._ref,
  "filmTitre": coalesce(film->title, "Film supprimé"),
  "filmDuree": film->duration
}`

/**
 * Les séances d'UN cinéma, publiées entre deux dates (incluses), dans
 * l'ordre du programme : la date, puis l'heure, puis la salle. Le
 * dernier tri se fait ici et pas dans la requête : trié par Sanity,
 * « Hall-Bar » passerait devant « Salle 1 » par ordre alphabétique.
 *
 * Le filtre par cinéma n'est pas un confort : sans lui, l'outil
 * mélangerait les semaines de deux villes et l'alerte de conflit
 * croirait que deux « Salle 1 » se gênent.
 */
export async function chargerSeancesPeriode(
  client: SanityClient,
  cinema: CinemaPlanning,
  debut: string,
  fin: string,
): Promise<SeancePlanning[]> {
  const seances = await client.fetch<SeancePlanning[]>(
    `*[_type == "screening" && cinema._ref == $cinemaId
      && defined(date) && date >= $debut && date <= $fin] ${CHAMPS_SEANCE}
      | order(date asc, heure asc)`,
    {cinemaId: cinema._id, debut, fin},
  )
  return [...(seances ?? [])].sort(comparerSeancesSelon(cinema.salles))
}

/** Tous les films, triés par titre (pour les listes déroulantes). */
export async function chargerFilms(client: SanityClient): Promise<FilmPlanning[]> {
  return client.fetch(
    `*[_type == "film"]{_id, "titre": title, "duree": duration} | order(lower(titre) asc)`,
  )
}

/**
 * Les cinémas, avec leurs salles dans l'ordre de leur fiche. Un cinéma
 * sans salle est renvoyé quand même : l'outil le dira plutôt que de le
 * faire disparaître sans explication.
 */
export async function chargerCinemas(client: SanityClient): Promise<CinemaPlanning[]> {
  const cinemas = await client.fetch<CinemaPlanning[]>(
    `*[_type == "siteSettings"]{_id, "nom": coalesce(nom, "Cinéma sans nom"),
      "salles": coalesce(salles[].nom, [])} | order(lower(nom) asc)`,
  )
  return cinemas ?? []
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
      cinema: {_type: 'reference', _ref: seance.cinemaId},
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
