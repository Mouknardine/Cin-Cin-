/**
 * La mécanique de l'assistant « Remplir la semaine au hasard » :
 * quels films sont retenus, quelle grille est proposée, et ce qu'on
 * finit par écrire dans Sanity.
 *
 * Séparée de l'écran pour que celui-ci n'ait plus qu'à afficher — et
 * pour que la composition de la semaine, elle, reste vérifiable sans
 * navigateur (utils/generation-semaine.ts).
 */
import {useCallback, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'

import {
  API_VERSION,
  type FilmPlanning,
  type RapportCreation,
  type SeanceCandidate,
  type SeancePlanning,
} from '../types'
import {verifierNouvellesSeances} from '../utils/conflits'
import {ajouterJours, finDeSemaine} from '../utils/dates'
import {compterParFilm, composerLaSemaine, creneauxLibres} from '../utils/generation-semaine'
import {chargerSeancesPeriode, compterSeancesParFilm, creerSeances} from '../utils/mutations'

/** Les statuts d'un film qu'on propose d'emblée : ceux qui sont à l'affiche. */
const STATUTS_COCHES_DAVANCE = ['a-laffiche', 'avant-premiere', 'cycle']

/** Sur combien de semaines alentour on regarde pour égaliser les films. */
export const SEMAINES_DE_RECUL = 4

interface Entree {
  films: FilmPlanning[]
  debutSemaine: string
  seancesSemaine: SeancePlanning[]
  onCree: () => void
}

interface Generation {
  selection: Set<string>
  equilibrer: boolean
  proposition: SeanceCandidate[] | null
  seancesPrevues: Map<string, number> | undefined
  creneauxLibres: number
  enCours: boolean
  rapport: RapportCreation | null
  basculerFilm: (filmId: string) => void
  changerEquilibrage: (actif: boolean) => void
  proposer: () => void
  creer: () => void
}

export function useGenerationSemaine({
  films,
  debutSemaine,
  seancesSemaine,
  onCree,
}: Entree): Generation {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const [selection, setSelection] = useState<Set<string>>(
    () =>
      new Set(
        films
          .filter((film) => STATUTS_COCHES_DAVANCE.includes(film.statut ?? ''))
          .map((film) => film._id),
      ),
  )
  const [equilibrer, setEquilibrer] = useState(true)
  const [proposition, setProposition] = useState<SeanceCandidate[] | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [rapport, setRapport] = useState<RapportCreation | null>(null)

  const libres = useMemo(
    () => creneauxLibres(debutSemaine, seancesSemaine).length,
    [debutSemaine, seancesSemaine],
  )
  const seancesPrevues = useMemo(
    () => (proposition ? compterParFilm(proposition) : undefined),
    [proposition],
  )

  /* Toute modification des réglages périme la proposition affichée :
     mieux vaut aucune grille qu'une grille qui ne correspond plus aux
     cases cochées. */
  const basculerFilm = useCallback((filmId: string) => {
    setProposition(null)
    setSelection((actuelle) => {
      const suivante = new Set(actuelle)
      if (suivante.has(filmId)) suivante.delete(filmId)
      else suivante.add(filmId)
      return suivante
    })
  }, [])

  const changerEquilibrage = useCallback((actif: boolean) => {
    setProposition(null)
    setEquilibrer(actif)
  }, [])

  const proposer = useCallback(async () => {
    setEnCours(true)
    try {
      const dejaProgrammees = equilibrer
        ? await compterSeancesParFilm(
            client,
            ajouterJours(debutSemaine, -7 * SEMAINES_DE_RECUL),
            finDeSemaine(ajouterJours(debutSemaine, 7 * SEMAINES_DE_RECUL)),
          )
        : {}
      setProposition(
        composerLaSemaine({
          debutSemaine,
          films: films.filter((film) => selection.has(film._id)),
          seancesExistantes: seancesSemaine,
          dejaProgrammees,
        }),
      )
    } catch {
      toast.push({status: 'error', title: 'Impossible de préparer la semaine. Réessayez.'})
    } finally {
      setEnCours(false)
    }
  }, [client, debutSemaine, equilibrer, films, seancesSemaine, selection, toast])

  const creer = useCallback(async () => {
    if (!proposition) return
    setEnCours(true)
    try {
      const existantes = await chargerSeancesPeriode(client, debutSemaine, finDeSemaine(debutSemaine))
      const {aCreer, doublons, conflits} = verifierNouvellesSeances(proposition, existantes)
      await creerSeances(client, aCreer)
      setRapport({creees: aCreer.length, doublons, conflits})
      if (aCreer.length > 0) onCree()
    } catch {
      toast.push({status: 'error', title: 'La création a échoué. Réessayez.'})
    } finally {
      setEnCours(false)
    }
  }, [client, debutSemaine, onCree, proposition, toast])

  return {
    selection,
    equilibrer,
    proposition,
    seancesPrevues,
    creneauxLibres: libres,
    enCours,
    rapport,
    basculerFilm,
    changerEquilibrage,
    proposer,
    creer,
  }
}
