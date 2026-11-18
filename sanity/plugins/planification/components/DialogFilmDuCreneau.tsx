/**
 * Le choix d'un film pour une case précise de la grille.
 *
 * Deux usages, le même geste : programmer un film sur une case libre,
 * ou remplacer celui d'une séance existante sans toucher à son
 * horaire. C'est le « remplacer simplement une séance par une autre »
 * du quotidien — l'échange de deux séances, lui, se fait à la souris.
 *
 * Sur une case libre, la liste propose aussi « Pas de film » : une
 * projection privée, des vacances (demande du cinéma, 18 novembre 2026).
 * La case est alors marquée, et l'agenda du site l'annonce. Pas sur une
 * séance existante : la remplacer par une case sans film, ce serait la
 * supprimer sans le dire — on la supprime d'abord, par son menu ⋮.
 */
import {Box, Button, Dialog, Select, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useClient} from 'sanity'

import {LIBELLES_SANS_FILM, type LibelleSansFilm, estUnLibelleSansFilm} from '../../../casesSansFilm'
import {API_VERSION, type CreneauDate, type FilmPlanning, type SeancePlanning} from '../types'
import {formatJourCourt} from '../utils/dates'
import {changerFilmDeSeance} from '../utils/deplacements'
import {useHistorique} from '../hooks/useHistorique'
import {semainesDe} from '../utils/historique'
import {creerCaseSansFilm, creerSeances} from '../utils/mutations'

interface Props {
  films: FilmPlanning[]
  /** Une case libre à remplir, ou la séance dont on change le film. */
  cible: {creneau: CreneauDate} | {seance: SeancePlanning}
  onFermer: () => void
  onFait: () => void
}

/** Dans la liste, une case sans film se distingue d'un film par ce préfixe. */
const PREFIXE_SANS_FILM = 'sans-film:'

function libelleDuChoix(choix: string): LibelleSansFilm | null {
  if (!choix.startsWith(PREFIXE_SANS_FILM)) return null
  const libelle = choix.slice(PREFIXE_SANS_FILM.length)
  return estUnLibelleSansFilm(libelle) ? libelle : null
}

function creneauDeLaCible(cible: Props['cible']): CreneauDate {
  return 'seance' in cible
    ? {date: cible.seance.date, heure: cible.seance.heure, salle: cible.seance.salle}
    : cible.creneau
}

export function DialogFilmDuCreneau({films, cible, onFermer, onFait}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const historique = useHistorique()
  const remplacement = 'seance' in cible
  const creneau = creneauDeLaCible(cible)

  const [choix, setChoix] = useState(remplacement ? cible.seance.filmId : '')
  const [enCours, setEnCours] = useState(false)
  const sansFilm = libelleDuChoix(choix)

  const valider = useCallback(async () => {
    if (!choix || (choix.startsWith(PREFIXE_SANS_FILM) && !sansFilm)) return
    setEnCours(true)
    try {
      const geste = remplacement
        ? 'changer le film d’une séance'
        : sansFilm
          ? `poser « ${sansFilm} »`
          : 'créer une séance'
      await historique.avantDeModifier(geste, semainesDe(creneau.date))
      if ('seance' in cible) {
        await changerFilmDeSeance(client, cible.seance._id, choix)
      } else if (sansFilm) {
        await creerCaseSansFilm(client, cible.creneau, sansFilm)
      } else {
        await creerSeances(client, [{filmId: choix, ...cible.creneau}])
      }
      toast.push({
        status: 'success',
        title: remplacement
          ? 'Film remplacé.'
          : sansFilm
            ? `« ${sansFilm} » posé, et annoncé sur l’agenda.`
            : 'Séance créée et publiée.',
      })
      onFait()
      onFermer()
    } catch {
      toast.push({status: 'error', title: "L'enregistrement a échoué. Réessayez."})
    } finally {
      setEnCours(false)
    }
  }, [choix, cible, client, creneau.date, historique, onFait, onFermer, remplacement, sansFilm, toast])

  return (
    <Dialog
      id="film-du-creneau"
      header={remplacement ? 'Changer le film de cette séance' : 'Remplir cette case'}
      onClose={onFermer}
      width={0}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1} muted>
            {formatJourCourt(creneau.date)} à {creneau.heure} · {creneau.salle}
          </Text>
          <Select
            value={choix}
            onChange={(evenement) => setChoix(evenement.currentTarget.value)}
            aria-label={remplacement ? 'Film' : 'Film, ou pas de film'}
          >
            <option value="">— Choisir un film —</option>
            {!remplacement && (
              <optgroup label="Pas de film">
                {LIBELLES_SANS_FILM.map((libelle) => (
                  <option key={libelle} value={`${PREFIXE_SANS_FILM}${libelle}`}>
                    {libelle}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Films">
              {films.map((film) => (
                <option key={film._id} value={film._id}>
                  {film.titre}
                  {film.duree ? ` (${film.duree} min)` : ''}
                </option>
              ))}
            </optgroup>
          </Select>
          <Button
            text={
              enCours ? 'Enregistrement…' : remplacement ? 'Remplacer' : sansFilm ? 'Marquer la case' : 'Programmer'
            }
            tone="primary"
            disabled={!choix || enCours || (remplacement && choix === cible.seance.filmId)}
            onClick={valider}
          />
          <Text size={1} muted>
            La modification est publiée immédiatement sur le site.
          </Text>
        </Stack>
      </Box>
    </Dialog>
  )
}
