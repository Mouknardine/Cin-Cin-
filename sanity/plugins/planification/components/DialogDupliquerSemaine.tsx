/**
 * Assistant « Dupliquer la semaine » : recopie toutes les séances de la semaine affichée
 * vers une semaine suivante, en écartant doublons et conflits de salle.
 */
import {Box, Button, Dialog, Select, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION, type RapportCreation, type SeanceCandidate, type SeancePlanning} from '../types'
import {verifierNouvellesSeances} from '../utils/conflits'
import {ajouterJours, formatPeriodeSemaine} from '../utils/dates'
import {chargerSeancesPeriode, creerSeances} from '../utils/mutations'
import {RapportResultat} from './RapportResultat'

interface Props {
  lundi: string
  seancesSemaine: SeancePlanning[]
  onFermer: () => void
  onCree: () => void
}

export function DialogDupliquerSemaine({
  lundi,
  seancesSemaine,
  onFermer,
  onCree,
}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const [decalage, setDecalage] = useState(1)
  const [enCours, setEnCours] = useState(false)
  const [rapport, setRapport] = useState<RapportCreation | null>(null)

  const lundiCible = useMemo(() => ajouterJours(lundi, decalage * 7), [decalage, lundi])

  const dupliquer = useCallback(async () => {
    setEnCours(true)
    try {
      const candidates: SeanceCandidate[] = seancesSemaine.map((seance) => ({
        filmId: seance.filmId,
        titre: seance.filmTitre,
        duree: seance.filmDuree,
        date: ajouterJours(seance.date, decalage * 7),
        heure: seance.heure,
        salle: seance.salle,
      }))
      const existantes = await chargerSeancesPeriode(client, lundiCible, ajouterJours(lundiCible, 6))
      const {aCreer, doublons, conflits} = verifierNouvellesSeances(candidates, existantes)
      await creerSeances(client, aCreer)
      setRapport({creees: aCreer.length, doublons, conflits})
      if (aCreer.length > 0) onCree()
    } catch {
      toast.push({status: 'error', title: 'La duplication a échoué. Réessayez.'})
    } finally {
      setEnCours(false)
    }
  }, [client, decalage, lundiCible, onCree, seancesSemaine, toast])

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
              {formatPeriodeSemaine(lundi).toLowerCase()}) vers :
            </Text>
            <Select value={decalage} onChange={(e) => setDecalage(Number(e.currentTarget.value))}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {formatPeriodeSemaine(ajouterJours(lundi, n * 7))}
                  {n === 1 ? ' (semaine suivante)' : ''}
                </option>
              ))}
            </Select>
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
