/**
 * La grille de la semaine : 7 colonnes (lundi → dimanche),
 * chaque colonne liste ses séances triées par heure.
 */
import {Box, Card, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'

import type {SeancePlanning} from '../types'
import {idsEnConflit} from '../utils/conflits'
import {ajouterJours, aujourdHui, formatJourCourt} from '../utils/dates'
import {CarteSeance} from './CarteSeance'

interface Props {
  lundi: string
  seances: SeancePlanning[]
  chargement: boolean
  onSupprimer: (seance: SeancePlanning) => void
}

export function GrilleSemaine({lundi, seances, chargement, onSupprimer}: Props): React.JSX.Element {
  const jours = useMemo(
    () => Array.from({length: 7}, (_, index) => ajouterJours(lundi, index)),
    [lundi],
  )
  const conflits = useMemo(() => idsEnConflit(seances), [seances])
  const dateDuJour = aujourdHui()

  if (chargement) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Box overflow="auto" paddingBottom={2}>
      <Grid columns={7} gap={2} style={{minWidth: 980}}>
        {jours.map((jour) => {
          const seancesDuJour = seances.filter((seance) => seance.date === jour)
          const estAujourdHui = jour === dateDuJour
          return (
            <Card
              key={jour}
              padding={2}
              radius={3}
              tone={estAujourdHui ? 'primary' : 'transparent'}
              border
            >
              <Stack space={3}>
                <Text size={1} weight={estAujourdHui ? 'bold' : 'semibold'} align="center">
                  {formatJourCourt(jour)}
                </Text>
                <Stack space={2} role="list" aria-label={`Séances du ${formatJourCourt(jour)}`}>
                  {seancesDuJour.length === 0 ? (
                    <Text size={1} muted align="center">
                      —
                    </Text>
                  ) : (
                    seancesDuJour.map((seance) => (
                      <CarteSeance
                        key={seance._id}
                        seance={seance}
                        enConflit={conflits.has(seance._id)}
                        onSupprimer={onSupprimer}
                      />
                    ))
                  )}
                </Stack>
              </Stack>
            </Card>
          )
        })}
      </Grid>
    </Box>
  )
}
