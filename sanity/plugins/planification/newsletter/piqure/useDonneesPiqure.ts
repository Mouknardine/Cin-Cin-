/**
 * Lit ce que la piqûre de rappel peut mettre en avant, et le relit quand le
 * jour de l'envoi change. Une lecture partie pour un ancien jour ne peut pas
 * écraser celle du jour choisi.
 */
import {useEffect, useState} from 'react'
import type {SanityClient} from 'sanity'

import {chargerPiqure, type DonneesPiqure} from './candidats'

export interface EtatPiqure {
  donnees: DonneesPiqure | null
  erreur: string | null
}

export function useDonneesPiqure(client: SanityClient, envoi: string): EtatPiqure {
  const [etat, setEtat] = useState<EtatPiqure>({donnees: null, erreur: null})

  useEffect(() => {
    let annule = false
    setEtat({donnees: null, erreur: null})
    chargerPiqure(client, envoi)
      .then((donnees) => {
        if (!annule) setEtat({donnees, erreur: null})
      })
      .catch(() => {
        if (!annule) {
          setEtat({donnees: null, erreur: 'Impossible de lire les films et les événements. Vérifiez la connexion, puis réessayez.'})
        }
      })
    return () => {
      annule = true
    }
  }, [client, envoi])

  return etat
}
