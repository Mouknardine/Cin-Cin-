/**
 * Charge la liste des cinémas, avec leurs salles.
 *
 * L'outil programme un cinéma à la fois : c'est cette liste qui
 * alimente le choix en haut de l'écran, et les salles du cinéma choisi
 * qui alimentent les créneaux.
 */
import {useCallback, useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION, type CinemaPlanning} from '../types'
import {chargerCinemas} from '../utils/mutations'

interface DonneesCinemas {
  cinemas: CinemaPlanning[]
  chargement: boolean
  erreur: string | null
  recharger: () => void
}

/**
 * @param actif Faux quand le cinéma est déjà connu de l'appelant : la
 *   liste n'est alors pas chargée du tout, plutôt que d'aller chercher
 *   une donnée dont personne ne se servira.
 */
export function useCinemas(actif = true): DonneesCinemas {
  const client = useClient({apiVersion: API_VERSION})
  const [cinemas, setCinemas] = useState<CinemaPlanning[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const recharger = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let annule = false
    if (!actif) {
      setCinemas([])
      setErreur(null)
      setChargement(false)
      return
    }
    setChargement(true)
    chargerCinemas(client)
      .then((liste) => {
        if (annule) return
        setCinemas(liste)
        setErreur(null)
      })
      .catch(() => {
        if (annule) return
        setErreur('Impossible de charger les cinémas. Vérifiez la connexion, puis réessayez.')
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [actif, client, version])

  return {cinemas, chargement, erreur, recharger}
}
