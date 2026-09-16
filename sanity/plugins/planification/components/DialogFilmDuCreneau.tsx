/**
 * Le choix d'un film pour une case précise de la grille.
 *
 * Deux usages, le même geste : programmer un film sur une case libre,
 * ou remplacer celui d'une séance existante sans toucher à son
 * horaire. C'est le « remplacer simplement une séance par une autre »
 * du quotidien — l'échange de deux séances, lui, se fait à la souris.
 */
import {Box, Button, Dialog, Select, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION, type CreneauDate, type FilmPlanning, type SeancePlanning} from '../types'
import {formatJourCourt} from '../utils/dates'
import {changerFilmDeSeance} from '../utils/deplacements'
import {creerSeances} from '../utils/mutations'

interface Props {
  films: FilmPlanning[]
  /** Une case libre à remplir, ou la séance dont on change le film. */
  cible: {creneau: CreneauDate} | {seance: SeancePlanning}
  onFermer: () => void
  onFait: () => void
}

function creneauDeLaCible(cible: Props['cible']): CreneauDate {
  return 'seance' in cible
    ? {date: cible.seance.date, heure: cible.seance.heure, salle: cible.seance.salle}
    : cible.creneau
}

export function DialogFilmDuCreneau({films, cible, onFermer, onFait}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const remplacement = 'seance' in cible
  const creneau = creneauDeLaCible(cible)

  const [filmId, setFilmId] = useState(remplacement ? cible.seance.filmId : '')
  const [enCours, setEnCours] = useState(false)

  const valider = useCallback(async () => {
    if (!filmId) return
    setEnCours(true)
    try {
      if ('seance' in cible) {
        await changerFilmDeSeance(client, cible.seance._id, filmId)
      } else {
        await creerSeances(client, [{filmId, ...cible.creneau}])
      }
      toast.push({
        status: 'success',
        title: remplacement ? 'Film remplacé.' : 'Séance créée et publiée.',
      })
      onFait()
      onFermer()
    } catch {
      toast.push({status: 'error', title: "L'enregistrement a échoué. Réessayez."})
    } finally {
      setEnCours(false)
    }
  }, [cible, client, filmId, onFait, onFermer, remplacement, toast])

  return (
    <Dialog
      id="film-du-creneau"
      header={remplacement ? 'Changer le film de cette séance' : 'Programmer un film'}
      onClose={onFermer}
      width={0}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1} muted>
            {formatJourCourt(creneau.date)} à {creneau.heure} · {creneau.salle}
          </Text>
          <Select
            value={filmId}
            onChange={(evenement) => setFilmId(evenement.currentTarget.value)}
            aria-label="Film"
          >
            <option value="">— Choisir un film —</option>
            {films.map((film) => (
              <option key={film._id} value={film._id}>
                {film.titre}
                {film.duree ? ` (${film.duree} min)` : ''}
              </option>
            ))}
          </Select>
          <Button
            text={enCours ? 'Enregistrement…' : remplacement ? 'Remplacer' : 'Programmer'}
            tone="primary"
            disabled={!filmId || enCours || (remplacement && filmId === cible.seance.filmId)}
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
