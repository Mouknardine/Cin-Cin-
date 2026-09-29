/* ============================================================
   Vider une semaine d'un coup.

   Pour repartir de zéro, ou pour effacer une semaine de test. Toutes
   les séances de la période partent, séances particulières comprises —
   SAUF celles pour lesquelles un billet existe : une commande désigne
   sa séance, et un spectateur qui a payé doit la retrouver. Celles-là
   restent, et l'outil dit combien.
   ============================================================ */
import type {SanityClient} from 'sanity'

import type {Periode} from './historique'

/** Ce qu'une semaine contient, avant de la vider. */
export interface InventaireSemaine {
  /** Les séances qui peuvent partir (identifiants publiés). */
  aSupprimer: string[]
  /** Les séances gardées parce qu'un billet les désigne. */
  avecBillets: string[]
}

function idPublie(id: string): string {
  return id.replace(/^drafts\./, '')
}

/** Fait l'inventaire d'une période : ce qui peut partir, ce qui doit rester. */
export async function inventorier(client: SanityClient, periode: Periode): Promise<InventaireSemaine> {
  const ids = await client
    .withConfig({perspective: 'raw'})
    .fetch<string[]>(
      `*[_type == "screening" && defined(date) && date >= $debut && date <= $fin]._id`,
      {...periode},
    )
  const seances = [...new Set((ids ?? []).map(idPublie))]
  if (seances.length === 0) return {aSupprimer: [], avecBillets: []}

  const reservees = await client.fetch<string[]>(
    `*[_type == "commande" && seance._ref in $seances].seance._ref`,
    {seances},
  )
  const avecBillets = new Set(reservees ?? [])
  return {
    aSupprimer: seances.filter((id) => !avecBillets.has(id)),
    avecBillets: seances.filter((id) => avecBillets.has(id)),
  }
}

/** Supprime ces séances, version publiée et brouillon, en une seule transaction. */
export async function supprimerSeances(client: SanityClient, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return
  const transaction = client.transaction()
  for (const id of ids) {
    transaction.delete(id).delete(`drafts.${id}`)
  }
  await transaction.commit()
}
