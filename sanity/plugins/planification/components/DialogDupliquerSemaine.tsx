/**
 * Assistant « Dupliquer la semaine » : recopie toutes les séances de la
 * semaine affichée vers une semaine suivante, en écartant doublons et
 * conflits de salle.
 *
 * Avec l'option « rebattre les cartes », les mêmes films reviennent en
 * même nombre, mais changent de jour et de moment de la soirée — chacun
 * dans SA salle : un film reste dans la salle où il jouait. C'est la
 * façon la plus rapide de programmer une semaine de plus avec les films
 * déjà à l'affiche : on garde le volume, on renouvelle la grille.
 * Les séances particulières — Hall-Bar, horaires inhabituels — ne sont
 * jamais déplacées par le hasard : elles se recopient telles quelles.
 */
import {Box, Button, Dialog, Select, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION, type RapportCreation, type SeanceCandidate, type SeancePlanning} from '../types'
import {verifierNouvellesSeances} from '../utils/conflits'
import {
  HORS_GRILLE,
  SALLES_STANDARD,
  creneauDeLaSeance,
  vagueDeLaSeance,
} from '../utils/creneaux-standards'
import {ajouterJours, finDeSemaine, formatPeriodeSemaine} from '../utils/dates'
import {chargerSeancesPeriode, creerSeances} from '../utils/mutations'
import {poserLesHeures} from '../utils/heures-de-la-grille'
import {type Place, affecterFilms} from '../utils/repartition'
import {OptionACocher} from './OptionACocher'
import {RapportResultat} from './RapportResultat'

interface Props {
  /** Le mercredi qui ouvre la semaine à recopier. */
  debutSemaine: string
  seancesSemaine: SeancePlanning[]
  onFermer: () => void
  onCree: () => void
}

/** Recopie une séance telle quelle, une ou plusieurs semaines plus loin. */
function recopier(seance: SeancePlanning, decalage: number): SeanceCandidate {
  return {
    filmId: seance.filmId,
    titre: seance.filmTitre,
    duree: seance.filmDuree,
    date: ajouterJours(seance.date, decalage * 7),
    heure: seance.heure,
    salle: seance.salle,
  }
}

/** Une séance tombe-t-elle sur une case ordinaire de la grille ? */
function estOrdinaire(seance: SeancePlanning): boolean {
  return vagueDeLaSeance(seance) !== HORS_GRILLE
}

/**
 * Les séances de la semaine d'arrivée, films redistribués au hasard sur les
 * mêmes cases, salle par salle : un film ne quitte pas sa salle. Les
 * séances particulières sont recopiées à l'identique.
 *
 * Les heures sont RECALCULÉES, pas recopiées : un film de 2 h 20 qui atterrit
 * à 19 h repousse la séance de 21 h de sa salle au quart d'heure suivant.
 */
function rebattreLesCartes(
  seancesSemaine: SeancePlanning[],
  decalage: number,
  dejaPosees: readonly SeancePlanning[],
): SeanceCandidate[] {
  const ordinaires = seancesSemaine.filter(estOrdinaire)
  const particulieres = seancesSemaine.filter((seance) => !estOrdinaire(seance))
  const parFilm = new Map(ordinaires.map((seance) => [seance.filmId, seance]))

  const occupees: Place[] = dejaPosees
    .map((seance) => ({...creneauDeLaSeance(seance), filmId: seance.filmId}))
    .filter((place) => place.vague !== HORS_GRILLE)

  const affectations: Place[] = []
  for (const salle of SALLES_STANDARD) {
    const deLaSalle = ordinaires.filter((seance) => seance.salle === salle)
    const creneaux = deLaSalle.map((seance) => ({
      ...creneauDeLaSeance(seance),
      date: ajouterJours(seance.date, decalage * 7),
    }))
    const pool = deLaSalle.map((seance) => seance.filmId)
    affectations.push(
      ...affecterFilms(creneaux, pool, {dejaPosees: [...occupees, ...affectations]}),
    )
  }

  const melangees = poserLesHeures(
    affectations,
    (filmId) => parFilm.get(filmId)?.filmDuree ?? null,
    dejaPosees,
  ).map((place) => ({
    filmId: place.filmId,
    titre: parFilm.get(place.filmId)?.filmTitre ?? 'Film',
    duree: parFilm.get(place.filmId)?.filmDuree ?? null,
    date: place.date,
    heure: place.heure,
    salle: place.salle,
  }))

  return [...melangees, ...particulieres.map((seance) => recopier(seance, decalage))]
}

export function DialogDupliquerSemaine({
  debutSemaine,
  seancesSemaine,
  onFermer,
  onCree,
}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const [decalage, setDecalage] = useState(1)
  const [rebattre, setRebattre] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [rapport, setRapport] = useState<RapportCreation | null>(null)

  const debutCible = useMemo(
    () => ajouterJours(debutSemaine, decalage * 7),
    [decalage, debutSemaine],
  )
  const nbOrdinaires = useMemo(() => seancesSemaine.filter(estOrdinaire).length, [seancesSemaine])

  const dupliquer = useCallback(async () => {
    setEnCours(true)
    try {
      /* La semaine d'arrivée est lue AVANT le tirage : ce qui s'y trouve
         déjà pèse sur le hasard, plutôt que d'être découvert après coup. */
      const existantes = await chargerSeancesPeriode(client, debutCible, finDeSemaine(debutCible))
      const candidates = rebattre
        ? rebattreLesCartes(seancesSemaine, decalage, existantes)
        : seancesSemaine.map((seance) => recopier(seance, decalage))
      const {aCreer, doublons, conflits} = verifierNouvellesSeances(candidates, existantes)
      await creerSeances(client, aCreer)
      setRapport({creees: aCreer.length, doublons, conflits})
      if (aCreer.length > 0) onCree()
    } catch {
      toast.push({status: 'error', title: 'La duplication a échoué. Réessayez.'})
    } finally {
      setEnCours(false)
    }
  }, [client, debutCible, decalage, onCree, rebattre, seancesSemaine, toast])

  return (
    <Dialog id="dupliquer-semaine" header="Dupliquer la semaine" onClose={onFermer} width={1}>
      <Box padding={4}>
        {rapport ? (
          <Stack space={4}>
            <RapportResultat rapport={rapport} />
            <Button text="Fermer" tone="primary" onClick={onFermer} />
          </Stack>
        ) : (
          <Stack space={4}>
            <Text size={1}>
              Recopie les <strong>{seancesSemaine.length}</strong> séances de la semaine affichée (
              {formatPeriodeSemaine(debutSemaine).toLowerCase()}) vers :
            </Text>
            <Select value={decalage} onChange={(e) => setDecalage(Number(e.currentTarget.value))}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {formatPeriodeSemaine(ajouterJours(debutSemaine, n * 7))}
                  {n === 1 ? ' (semaine suivante)' : ''}
                </option>
              ))}
            </Select>

            <OptionACocher
              id="rebattre-les-cartes"
              titre="Rebattre les cartes"
              cochee={rebattre}
              onChanger={setRebattre}
            >
              Les mêmes films, en même nombre, mais à d'autres jours et moments de la soirée —
              chacun reste dans sa salle. Un film ne se retrouve jamais deux fois dans la même vague, ni deux fois le
              même jour tant qu'on peut l'éviter. Les horaires sont recalculés : un long film posé
              à 19 h repousse la séance de 21 h de sa salle. Les {nbOrdinaires} séances de 19 h et
              21 h sont concernées ; les séances particulières sont recopiées telles quelles.
            </OptionACocher>

            <Button
              text={enCours ? 'Duplication en cours…' : 'Dupliquer'}
              tone="primary"
              disabled={enCours || seancesSemaine.length === 0}
              onClick={dupliquer}
            />
            {seancesSemaine.length === 0 && (
              <Text size={1} muted>
                La semaine affichée ne contient aucune séance à dupliquer.
              </Text>
            )}
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}
