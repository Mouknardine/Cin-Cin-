/* ============================================================
   Écrire la séance d'une avant-première ou d'une première, d'après la
   fiche du film qu'on vient de publier.

   projection-de-la-fiche.ts décide QUOI écrire ; ce fichier l'écrit.
   ============================================================ */
import type {SanityClient} from 'sanity'

import {
  type Operation,
  type ProjectionDeLaFiche,
  type SeanceDuFilm,
  operationsPourLaFiche,
} from './projection-de-la-fiche'

/** Ce qui a été fait, pour pouvoir le dire. */
export interface BilanProjection {
  operations: Operation[]
  /* Séances que la fiche voulait retirer, gardées parce qu'un billet
     les désigne : un spectateur qui a payé doit retrouver sa séance. */
  gardeesAvecBillets: number
}

/* Les brouillons comptent autant que les versions publiées : une
   séance déplacée dans l'une et pas dans l'autre afficherait deux
   horaires. */
function lecteurComplet(client: SanityClient): SanityClient {
  return client.withConfig({perspective: 'raw'})
}

function valeur(texte: unknown): string | null {
  return typeof texte === 'string' && texte.trim() ? texte.trim() : null
}

/** La projection telle que la fiche (brouillon ou publiée) la décrit. */
export function projectionDe(document: Record<string, unknown> | null | undefined): ProjectionDeLaFiche {
  return {
    statut: valeur(document?.status),
    date: valeur(document?.projectionDate),
    heure: valeur(document?.projectionHeure),
    salle: valeur(document?.projectionSalle),
  }
}

function memeProjection(a: ProjectionDeLaFiche, b: ProjectionDeLaFiche): boolean {
  return a.statut === b.statut && a.date === b.date && a.heure === b.heure && a.salle === b.salle
}

const ATTENTE_MAX_MS = 30_000
const INTERVALLE_MS = 500

/**
 * Attend que la publication soit arrivée : la séance renvoie vers la
 * version PUBLIÉE du film, qui doit donc exister — et dire ce qu'on
 * s'apprête à programmer. Vrai si c'est le cas, faux après trente
 * secondes sans nouvelles (publication refusée, réseau coupé) : on ne
 * programme alors rien plutôt qu'un horaire que la fiche n'a pas.
 */
export async function attendrePublication(
  client: SanityClient,
  filmId: string,
  attendue: ProjectionDeLaFiche,
): Promise<boolean> {
  const limite = Date.now() + ATTENTE_MAX_MS
  while (Date.now() < limite) {
    const publie = await client.getDocument(filmId).catch(() => undefined)
    if (publie && memeProjection(projectionDe(publie), attendue)) return true
    await new Promise((fin) => setTimeout(fin, INTERVALLE_MS))
  }
  return false
}

async function versionsExistantes(client: SanityClient, ids: string[]): Promise<string[]> {
  const toutes = ids.flatMap((id) => [id, `drafts.${id}`])
  return lecteurComplet(client).fetch<string[]>(`*[_id in $ids]._id`, {ids: toutes})
}

/** Met les séances du film d'accord avec sa fiche, en une seule transaction. */
export async function synchroniserProjection(
  client: SanityClient,
  filmId: string,
  fiche: ProjectionDeLaFiche,
  aujourdhui: string,
): Promise<BilanProjection> {
  const seances = await lecteurComplet(client).fetch<SeanceDuFilm[]>(
    `*[_type == "screening" && film._ref == $filmId && defined(date)
        && !(_id in path("drafts.**"))]{
      _id, date, "heure": time, "salle": room, "evenement": evenementDuFilm
    }`,
    {filmId},
  )
  const prevues = operationsPourLaFiche(fiche, seances ?? [], aujourdhui)
  if (prevues.length === 0) return {operations: [], gardeesAvecBillets: 0}

  const aRetirer = prevues.flatMap((operation) =>
    operation.type === 'supprimer' ? [operation.id] : [],
  )
  const reservees = aRetirer.length
    ? await client.fetch<string[]>(`*[_type == "commande" && seance._ref in $ids].seance._ref`, {
        ids: aRetirer,
      })
    : []
  /* Une séance qui a vendu des billets ne disparaît pas : elle reste,
     en séance ordinaire, et le cinéma décide de son sort. */
  const operations: Operation[] = prevues.map((operation) =>
    operation.type === 'supprimer' && (reservees ?? []).includes(operation.id)
      ? {type: 'detacher', id: operation.id}
      : operation,
  )

  const existants = await versionsExistantes(
    client,
    operations.flatMap((operation) => (operation.type === 'creer' ? [] : [operation.id])),
  )
  const versionsDe = (id: string) => [id, `drafts.${id}`].filter((v) => existants.includes(v))

  const transaction = client.transaction()
  for (const operation of operations) {
    if (operation.type === 'creer') {
      transaction.create({
        _type: 'screening',
        film: {_type: 'reference', _ref: filmId},
        date: operation.date,
        time: operation.heure,
        room: operation.salle,
        status: 'disponible',
        evenementDuFilm: operation.evenement,
      })
    } else if (operation.type === 'modifier') {
      for (const version of versionsDe(operation.id)) {
        transaction.patch(version, (patch) =>
          patch.set({
            date: operation.date,
            time: operation.heure,
            room: operation.salle,
            evenementDuFilm: operation.evenement,
          }),
        )
      }
    } else if (operation.type === 'supprimer') {
      for (const version of versionsDe(operation.id)) transaction.delete(version)
    } else {
      for (const version of versionsDe(operation.id)) {
        transaction.patch(version, (patch) => patch.unset(['evenementDuFilm']))
      }
    }
  }
  await transaction.commit()

  return {
    operations,
    gardeesAvecBillets: operations.filter(
      (operation, index) => operation.type === 'detacher' && prevues[index].type === 'supprimer',
    ).length,
  }
}
