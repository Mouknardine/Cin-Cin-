/**
 * La semaine affichée dans le planning — et le souvenir de celle-ci.
 *
 * Sans mémoire, l'onglet revenait sur la semaine en cours à chaque
 * retour : on préparait la semaine prochaine, on ouvrait la fiche d'un
 * film pour vérifier sa durée, et au retour le planning était revenu en
 * arrière d'une semaine, sans prévenir. La semaine choisie est donc
 * retenue par ce navigateur.
 *
 * Une semaine déjà terminée n'est jamais rouverte d'office : le
 * lendemain de sa fin, on repart de la semaine en cours.
 */
import {useCallback, useEffect, useState} from 'react'

import {ajouterJours, aujourdHui, debutDeSemaine} from '../utils/dates'

const CLEF = 'zinema.planification.semaine'
const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/

interface SemaineAffichee {
  debutSemaine: string
  semainePrecedente: () => void
  semaineSuivante: () => void
  semaineActuelle: () => void
}

/* Le stockage du navigateur peut être refusé (navigation privée,
   réglages stricts) : le planning marche alors comme avant, sans
   mémoire, plutôt que de planter. */
function lireSemaineRetenue(): string | null {
  try {
    const valeur = window.localStorage.getItem(CLEF)
    return valeur && FORMAT_DATE.test(valeur) ? debutDeSemaine(valeur) : null
  } catch {
    return null
  }
}

function retenirSemaine(debutSemaine: string): void {
  try {
    window.localStorage.setItem(CLEF, debutSemaine)
  } catch {
    /* Sans stockage, la semaine n'est simplement pas retenue. */
  }
}

function semaineDeDepart(): string {
  const actuelle = debutDeSemaine(aujourdHui())
  const retenue = lireSemaineRetenue()
  return retenue && retenue >= actuelle ? retenue : actuelle
}

export function useSemaineAffichee(): SemaineAffichee {
  const [debutSemaine, setDebutSemaine] = useState(semaineDeDepart)

  useEffect(() => retenirSemaine(debutSemaine), [debutSemaine])

  const semainePrecedente = useCallback(
    () => setDebutSemaine((jour: string) => ajouterJours(jour, -7)),
    [],
  )
  const semaineSuivante = useCallback(
    () => setDebutSemaine((jour: string) => ajouterJours(jour, 7)),
    [],
  )
  const semaineActuelle = useCallback(() => setDebutSemaine(debutDeSemaine(aujourdHui())), [])

  return {debutSemaine, semainePrecedente, semaineSuivante, semaineActuelle}
}
