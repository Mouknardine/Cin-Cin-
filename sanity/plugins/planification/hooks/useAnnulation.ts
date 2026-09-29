/**
 * Le bouton « Annuler » : remettre en place la photo du dernier geste,
 * dire ce qui a été annulé, puis relire la semaine.
 */
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import type {Historique} from './useHistorique'

export interface Annulation {
  enCours: boolean
  annuler: () => Promise<void>
}

export function useAnnulation(historique: Historique, recharger: () => void): Annulation {
  const toast = useToast()
  const [enCours, setEnCours] = useState(false)

  const annuler = useCallback(async () => {
    setEnCours(true)
    try {
      const geste = await historique.annuler()
      if (geste) toast.push({status: 'success', title: `Annulé : ${geste}.`})
      /* Relire sans recaler : l'état d'avant est déjà un état juste, et
         le recalage le transformerait au lieu de le rendre. */
      recharger()
    } catch {
      toast.push({
        status: 'error',
        title: "L'annulation a échoué. Rien n'a bougé : réessayez.",
        description: 'Si une place a été vendue entre-temps sur une séance à retirer, elle ne peut plus être supprimée.',
      })
    } finally {
      setEnCours(false)
    }
  }, [historique, recharger, toast])

  return {enCours, annuler}
}
