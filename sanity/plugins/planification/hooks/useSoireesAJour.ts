/**
 * Après chaque modification : remettre les soirées d'aplomb, puis relire
 * la semaine.
 *
 * Un film plus long posé à 19 h repousse la séance de 21 h de sa salle,
 * au quart d'heure qui suit la fin du premier. Plutôt que de prévoir ce
 * décalage dans chacun des gestes possibles — déplacer, échanger,
 * remplacer un film, en créer une, en générer vingt-huit — on relit la
 * semaine après coup et on corrige ce qui doit l'être. La règle ne peut
 * ainsi pas être oubliée par un chemin.
 */
import {useCallback} from 'react'
import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'

import {API_VERSION} from '../types'
import {recalerLesSoirees} from '../utils/deplacements'
import {resumerRecalages} from '../utils/enchainement'

export function useSoireesAJour(
  debutSemaine: string,
  finSemaine: string,
  recharger: () => void,
): () => void {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  return useCallback(async () => {
    try {
      const recalages = await recalerLesSoirees(client, debutSemaine, finSemaine)
      if (recalages.length > 0) {
        const nombre = recalages.length
        toast.push({
          status: 'info',
          title: `${nombre} séance${nombre > 1 ? 's' : ''} décalée${
            nombre > 1 ? 's' : ''
          } pour laisser finir le film d'avant.`,
          description: resumerRecalages(recalages),
          duration: 9000,
        })
      }
    } catch {
      toast.push({
        status: 'warning',
        title: "Les horaires n'ont pas pu être réajustés : vérifiez les séances en rouge.",
      })
    }
    recharger()
  }, [client, debutSemaine, finSemaine, recharger, toast])
}
