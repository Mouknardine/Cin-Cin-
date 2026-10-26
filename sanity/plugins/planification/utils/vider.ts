/* ============================================================
   Vider une semaine d'un coup.

   Pour repartir de zéro, ou pour effacer une semaine de test. Toutes
   les séances de la période partent, séances particulières comprises —
   SAUF celles pour lesquelles un billet existe : une commande désigne
   sa séance, et un spectateur qui a payé doit la retrouver. Celles-là
   restent, et l'outil dit combien. Restent aussi les avant-premières
   et les premières : elles se règlent dans la fiche de leur film, et
   la prochaine publication de la fiche les remettrait en place.
   ============================================================ */
import type {SanityClient} from 'sanity'

import type {Periode} from './historique'

/** Ce qu'une semaine contient, avant de la vider. */
export interface InventaireSemaine {
  /** Les séances qui peuvent partir (identifiants publiés). */
  aSupprimer: string[]
  /** Les séances gardées parce qu'un billet les désigne. */
  avecBillets: string[]
  /** Les avant-premières et premières, tenues par la fiche de leur film. */
  tenuesParLaFiche: string[]
}

function idPublie(id: string): string {
  return id.replace(/^drafts\./, '')
}

/** Fait l'inventaire d'une période : ce qui peut partir, ce qui doit rester. */
export async function inventorier(client: SanityClient, periode: Periode): Promise<InventaireSemaine> {
  const trouvees = await client
    .withConfig({perspective: 'raw'})
    .fetch<{_id: string; tenue: boolean}[]>(
      `*[_type == "screening" && defined(date) && date >= $debut && date <= $fin]{
        _id, "tenue": defined(evenementDuFilm)
      }`,
      {...periode},
    )
  const tenues = new Set(
    (trouvees ?? []).filter((seance) => seance.tenue).map((seance) => idPublie(seance._id)),
  )
  const toutes = [...new Set((trouvees ?? []).map((seance) => idPublie(seance._id)))]
  const tenuesParLaFiche = toutes.filter((id) => tenues.has(id))
  const seances = toutes.filter((id) => !tenues.has(id))
  if (seances.length === 0) return {aSupprimer: [], avecBillets: [], tenuesParLaFiche}

  const reservees = await client.fetch<string[]>(
    `*[_type == "commande" && seance._ref in $seances].seance._ref`,
    {seances},
  )
  const avecBillets = new Set(reservees ?? [])
  return {
    aSupprimer: seances.filter((id) => !avecBillets.has(id)),
    avecBillets: seances.filter((id) => avecBillets.has(id)),
    tenuesParLaFiche,
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
