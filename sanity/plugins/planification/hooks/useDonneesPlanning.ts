/**
 * Charge les films, les séances et les cases sans film de la semaine
 * affichée, et se met à jour tout seul quand le contenu change dans Sanity.
 */
import {useCallback, useEffect, useRef, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION, type CaseSansFilm, type FilmPlanning, type SeancePlanning} from '../types'
import {chargerCasesSansFilm, chargerFilms, chargerSeancesPeriode} from '../utils/mutations'

interface DonneesPlanning {
  films: FilmPlanning[]
  seances: SeancePlanning[]
  casesSansFilm: CaseSansFilm[]
  chargement: boolean
  erreur: string | null
  recharger: () => void
}

const DELAI_RAFRAICHISSEMENT_MS = 1200

export function useDonneesPlanning(debut: string, fin: string): DonneesPlanning {
  const client = useClient({apiVersion: API_VERSION})
  const [films, setFilms] = useState<FilmPlanning[]>([])
  const [seances, setSeances] = useState<SeancePlanning[]>([])
  const [casesSansFilm, setCasesSansFilm] = useState<CaseSansFilm[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const recharger = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let annule = false
    setChargement(true)

    Promise.all([
      chargerFilms(client),
      chargerSeancesPeriode(client, debut, fin),
      chargerCasesSansFilm(client, debut, fin),
    ])
      .then(([listeFilms, listeSeances, listeCases]) => {
        if (annule) return
        setFilms(listeFilms)
        setSeances(listeSeances)
        setCasesSansFilm(listeCases)
        setErreur(null)
      })
      .catch(() => {
        if (annule) return
        setErreur('Impossible de charger le planning. Vérifiez la connexion, puis réessayez.')
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })

    return () => {
      annule = true
    }
  }, [client, debut, fin, version])

  /* Écoute les changements (autre onglet, autre personne) et recharge avec un léger délai. */
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const abonnement = client
      .listen(`*[_type in ["screening", "film", "sansFilm"]]`, {}, {visibility: 'query', events: ['mutation']})
      .subscribe({
        next: () => {
          if (minuteur.current) clearTimeout(minuteur.current)
          minuteur.current = setTimeout(recharger, DELAI_RAFRAICHISSEMENT_MS)
        },
        error: () => {
          /* L'écoute temps réel est un confort : en cas d'échec, le bouton Actualiser reste disponible. */
        },
      })
    return () => {
      abonnement.unsubscribe()
      if (minuteur.current) clearTimeout(minuteur.current)
    }
  }, [client, recharger])

  return {films, seances, casesSansFilm, chargement, erreur, recharger}
}
