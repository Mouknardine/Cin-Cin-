/* ============================================================
   Déplacer, échanger, remplacer une séance.

   Une séance peut exister en deux exemplaires : la version publiée,
   celle que lit le site, et un brouillon en cours d'édition. Un
   déplacement doit toucher les DEUX — sinon le planning montrerait un
   horaire et le site un autre. On demande donc d'abord lesquels
   existent, puis on les corrige ensemble : soit tout passe, soit rien.
   ============================================================ */
import type {SanityClient} from 'sanity'

import {type Recalage, recalagesNecessaires} from './enchainement'
import {chargerSeancesPeriode} from './mutations'

/** Où poser une séance : un jour, une heure, une salle. */
export interface Destination {
  date: string
  heure: string
  salle: string
}

/** Une séance et sa nouvelle place. */
export interface Deplacement {
  id: string
  vers: Destination
}

/** Les versions (publiée, brouillon) réellement enregistrées pour ces séances. */
async function versionsExistantes(client: SanityClient, ids: string[]): Promise<string[]> {
  const toutes = ids.flatMap((id) => {
    const publie = id.replace(/^drafts\./, '')
    return [publie, `drafts.${publie}`]
  })
  return client.fetch<string[]>(`*[_id in $ids]._id`, {ids: toutes})
}

/**
 * Déplace une ou plusieurs séances d'un seul mouvement.
 *
 * Échanger deux séances, c'est simplement les déplacer toutes les deux
 * dans la même opération : elles passent par le même instant où leurs
 * horaires se croisent, sans jamais rester à moitié permutées.
 */
export async function deplacerSeances(
  client: SanityClient,
  deplacements: Deplacement[],
): Promise<void> {
  if (deplacements.length === 0) return
  const existants = await versionsExistantes(
    client,
    deplacements.map((deplacement) => deplacement.id),
  )

  const transaction = client.transaction()
  for (const {id, vers} of deplacements) {
    const publie = id.replace(/^drafts\./, '')
    for (const version of [publie, `drafts.${publie}`]) {
      if (!existants.includes(version)) continue
      transaction.patch(version, (patch) =>
        patch.set({date: vers.date, time: vers.heure, room: vers.salle}),
      )
    }
  }
  await transaction.commit()
}

/** Remplace le film d'une séance, sans toucher à son horaire ni à sa salle. */
export async function changerFilmDeSeance(
  client: SanityClient,
  id: string,
  filmId: string,
): Promise<void> {
  const existants = await versionsExistantes(client, [id])
  const transaction = client.transaction()
  for (const version of existants) {
    transaction.patch(version, (patch) =>
      patch.set({film: {_type: 'reference', _ref: filmId}}),
    )
  }
  await transaction.commit()
}

/**
 * Remet les soirées d'aplomb après un changement.
 *
 * Un film plus long posé à 19 h repousse la séance de 21 h de sa salle,
 * au quart d'heure qui suit la fin du premier. Plutôt que de prévoir ce
 * décalage dans chacun des gestes possibles — déplacer, échanger,
 * remplacer un film, créer une séance — on relit la semaine après coup
 * et on corrige ce qui doit l'être. La règle ne peut ainsi pas être
 * oubliée par un chemin.
 *
 * Une séance n'est JAMAIS avancée : si le cinéma a laissé un battement
 * volontaire, il lui appartient. Renvoie ce qui a été décalé, pour
 * pouvoir le dire.
 */
export async function recalerLesSoirees(
  client: SanityClient,
  debut: string,
  fin: string,
): Promise<Recalage[]> {
  const seances = await chargerSeancesPeriode(client, debut, fin)
  const recalages = recalagesNecessaires(seances)
  if (recalages.length === 0) return []

  const existants = await versionsExistantes(
    client,
    recalages.map((recalage) => recalage.id),
  )
  const transaction = client.transaction()
  for (const recalage of recalages) {
    const publie = recalage.id.replace(/^drafts\./, '')
    for (const version of [publie, `drafts.${publie}`]) {
      if (!existants.includes(version)) continue
      transaction.patch(version, (patch) => patch.set({time: recalage.vers}))
    }
  }
  await transaction.commit()
  return recalages
}
