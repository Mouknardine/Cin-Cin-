/**
 * Retirer une case sans film (vacances, projection privée) depuis son
 * menu ⋮ : la case redevient libre, et l'agenda du site ne l'annonce
 * plus. Sans confirmation — « Annuler », dans la barre du haut, la remet.
 */
import {useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {useClient} from 'sanity'

import {API_VERSION, type CaseSansFilm} from '../types'
import {semainesDe} from '../utils/historique'
import {retirerCaseSansFilm} from '../utils/mutations'
import type {Historique} from './useHistorique'

export function useRetraitCaseSansFilm(
  rafraichir: () => void,
  historique: Historique,
): (caseSansFilm: CaseSansFilm) => Promise<void> {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  return useCallback(
    async (caseSansFilm: CaseSansFilm) => {
      try {
        await historique.avantDeModifier(`retirer « ${caseSansFilm.libelle} »`, semainesDe(caseSansFilm.date))
        await retirerCaseSansFilm(client, caseSansFilm._id)
        toast.push({status: 'success', title: `« ${caseSansFilm.libelle} » retiré. La case est libre.`})
        rafraichir()
      } catch {
        toast.push({status: 'error', title: 'Le retrait a échoué. Réessayez.'})
      }
    },
    [client, historique, rafraichir, toast],
  )
}
