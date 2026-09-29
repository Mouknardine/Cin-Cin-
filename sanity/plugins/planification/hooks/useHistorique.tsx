/**
 * L'historique de la planification : les photos prises avant chaque geste,
 * et le bouton « Annuler » qui remet la dernière en place.
 *
 * Il est partagé par tous les gestes de l'onglet à travers un contexte :
 * chaque geste appelle `avantDeModifier` avant d'écrire, sans avoir à
 * connaître le reste. L'historique vit le temps de la visite : recharger
 * la page le vide. Il garde les vingt derniers gestes.
 */
import {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION} from '../types'
import {type Periode, type Photo, photographier, restaurer} from '../utils/historique'

const GESTES_RETENUS = 20

export interface Historique {
  /** Photographie la période avant un geste. Échoue si la photo n'a pas pu être prise : le geste ne doit alors pas avoir lieu. */
  avantDeModifier: (geste: string, periode: Periode) => Promise<void>
  /** Le geste que « Annuler » déferait, s'il y en a un. */
  dernierGeste: string | null
  /** Remet la période du dernier geste dans son état d'avant. Renvoie le geste annulé. */
  annuler: () => Promise<string | null>
}

const ContexteHistorique = createContext<Historique | null>(null)

/** Crée l'historique de l'onglet. À n'appeler qu'une fois, dans l'onglet lui-même. */
export function useHistoriqueDeLOnglet(): Historique {
  const client = useClient({apiVersion: API_VERSION})
  const pile = useRef<Photo[]>([])
  const [dernierGeste, setDernierGeste] = useState<string | null>(null)

  const synchroniser = useCallback(() => {
    setDernierGeste(pile.current[pile.current.length - 1]?.geste ?? null)
  }, [])

  const avantDeModifier = useCallback(
    async (geste: string, periode: Periode) => {
      const photo = await photographier(client, geste, periode)
      pile.current = [...pile.current, photo].slice(-GESTES_RETENUS)
      synchroniser()
    },
    [client, synchroniser],
  )

  const annuler = useCallback(async () => {
    const photo = pile.current[pile.current.length - 1]
    if (!photo) return null
    await restaurer(client, photo)
    /* Retirée seulement une fois remise en place : si la remise échoue,
       on peut réessayer. */
    pile.current = pile.current.slice(0, -1)
    synchroniser()
    return photo.geste
  }, [client, synchroniser])

  return useMemo(() => ({avantDeModifier, dernierGeste, annuler}), [annuler, avantDeModifier, dernierGeste])
}

export const FournisseurHistorique = ContexteHistorique.Provider

/* Hors de l'onglet — l'assistant « Programmer un film » s'ouvre aussi
   depuis la fiche d'un film — il n'y a pas de bouton « Annuler » : le
   geste a lieu normalement, sans photo. */
const SANS_HISTORIQUE: Historique = {
  avantDeModifier: async () => undefined,
  dernierGeste: null,
  annuler: async () => null,
}

/** L'historique de l'onglet, pour un geste qui s'apprête à écrire. */
export function useHistorique(): Historique {
  return useContext(ContexteHistorique) ?? SANS_HISTORIQUE
}
