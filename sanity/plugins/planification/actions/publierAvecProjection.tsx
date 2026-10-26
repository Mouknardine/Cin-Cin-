/**
 * Le bouton « Publish » d'une fiche de film, qui programme en plus la
 * séance de son avant-première ou de sa première.
 *
 * Le cinéma écrit le jour, l'heure et la salle dans la fiche, sous
 * « Où en est ce film ? », et publie : la séance apparaît d'elle-même
 * dans la Planification, sur l'agenda et en billetterie. Plus besoin
 * de la recréer à la main (demande du cinéma, 26 octobre 2026).
 *
 * La publication elle-même reste celle de Sanity, garde-fous compris :
 * un film qui ne peut pas être publié ne programme rien. La séance
 * n'est écrite qu'une fois la publication arrivée, puisqu'elle renvoie
 * vers la version publiée du film.
 */
import {useToast} from '@sanity/ui'
import {type DocumentActionComponent, useClient} from 'sanity'

import {API_VERSION} from '../types'
import {aujourdHui, formatJourLong} from '../utils/dates'
import {
  NOM_DE_LA_PROJECTION,
  type Operation,
  estUneProjection,
} from '../utils/projection-de-la-fiche'
import {
  type BilanProjection,
  attendrePublication,
  projectionDe,
  synchroniserProjection,
} from '../utils/synchroniser-projection'

/** Ce que le Studio annonce une fois la séance écrite. */
function message(bilan: BilanProjection, statut: string | null | undefined): string | null {
  const ecrite = bilan.operations.find(
    (operation): operation is Extract<Operation, {type: 'creer' | 'modifier'}> =>
      operation.type === 'creer' || operation.type === 'modifier',
  )
  if (ecrite && estUneProjection(statut)) {
    return `${NOM_DE_LA_PROJECTION[statut]} programmée le ${formatJourLong(ecrite.date)} à ${
      ecrite.heure
    }, ${ecrite.salle} : elle apparaît dans la Planification, sur l'agenda et en billetterie.`
  }
  if (bilan.operations.some((operation) => operation.type === 'supprimer')) {
    return 'Sans jour ni heure, la séance annoncée est retirée de la Planification et du site.'
  }
  if (bilan.gardeesAvecBillets > 0) {
    return 'Des billets ont déjà été vendus pour cette séance : elle reste programmée, en séance ordinaire. Supprimez-la depuis la Planification si elle n’a plus lieu.'
  }
  if (bilan.operations.length > 0) {
    return 'Ce film n’est plus une avant-première ni une première : sa séance reste programmée, comme une séance ordinaire.'
  }
  return null
}

export function publierAvecProjection(publier: DocumentActionComponent): DocumentActionComponent {
  const Action: DocumentActionComponent = (props) => {
    const client = useClient({apiVersion: API_VERSION})
    const toast = useToast()
    const original = publier(props)
    if (!original) return original

    return {
      ...original,
      onHandle: () => {
        /* Ce qu'on publie, lu AVANT de publier : ensuite, le brouillon
           n'existe plus. */
        const fiche = projectionDe((props.draft ?? props.published) as Record<string, unknown> | null)
        original.onHandle?.()

        void (async () => {
          const arrivee = await attendrePublication(client, props.id, fiche)
          if (!arrivee) return
          const bilan = await synchroniserProjection(client, props.id, fiche, aujourdHui())
          const texte = message(bilan, fiche.statut)
          if (texte) toast.push({status: 'success', title: texte, duration: 9000})
        })().catch(() => {
          toast.push({
            status: 'error',
            title:
              "La fiche est publiée, mais sa séance n'a pas pu être mise à jour dans la Planification. Republiez la fiche pour réessayer.",
            duration: 12000,
          })
        })
      },
    }
  }
  Action.action = publier.action
  Action.displayName = 'PublierAvecProjection'
  return Action
}
