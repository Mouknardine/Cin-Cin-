/**
 * « Passer ce film en Salle 2 » : déménage toutes les séances ordinaires
 * du film pour la semaine affichée, en un seul mouvement.
 *
 * Les films qui occupaient les places visées font le chemin inverse (voir
 * utils/changement-de-salle.ts). Ensuite `onFait` remet les soirées
 * d'aplomb : un long film arrivé à 19 h repousse la séance de 21 h de sa
 * nouvelle salle au quart d'heure suivant.
 */
import {useCallback} from 'react'
import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'

import {API_VERSION, type SeancePlanning} from '../types'
import {deplacementsPourChangerDeSalle} from '../utils/changement-de-salle'
import {deplacerSeances} from '../utils/deplacements'
import {autreSalle} from '../utils/salles-attitrees'

export function useChangementDeSalle(
  seancesSemaine: readonly SeancePlanning[],
  onFait: () => void,
): (seance: SeancePlanning) => Promise<void> {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  return useCallback(
    async (seance: SeancePlanning) => {
      const versSalle = autreSalle(seance.salle)
      if (!versSalle) return
      const deplacements = deplacementsPourChangerDeSalle(seancesSemaine, seance.filmId, versSalle)
      if (deplacements.length === 0) {
        toast.push({status: 'info', title: `« ${seance.filmTitre} » est déjà en ${versSalle}.`})
        return
      }

      const echanges = deplacements.filter((deplacement) => {
        const deplacee = seancesSemaine.find((autre) => autre._id === deplacement.id)
        return deplacee !== undefined && deplacee.filmId !== seance.filmId
      }).length
      try {
        await deplacerSeances(client, deplacements)
        const nombre = deplacements.length - echanges
        toast.push({
          status: 'success',
          title: `« ${seance.filmTitre} » passe en ${versSalle} pour la semaine (${nombre} séance${
            nombre > 1 ? 's' : ''
          }).`,
          description:
            echanges > 0
              ? `${echanges} séance${echanges > 1 ? 's' : ''} d'autres films prennent sa place en ${seance.salle}.`
              : undefined,
        })
        onFait()
      } catch {
        toast.push({status: 'error', title: 'Le changement de salle a échoué. Réessayez.'})
      }
    },
    [client, onFait, seancesSemaine, toast],
  )
}
