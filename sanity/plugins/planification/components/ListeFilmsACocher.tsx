/**
 * La liste des films à cocher, pour dire lesquels doivent tourner
 * pendant la semaine qu'on demande à l'outil de remplir.
 *
 * Tous les films sont proposés, y compris ceux retirés de l'affiche :
 * une reprise, un ciné-club ou un cycle se programment comme le reste.
 * Seuls les films à l'affiche sont cochés d'avance.
 */
import {Box, Card, Checkbox, Flex, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'

import type {FilmPlanning} from '../types'

/** Ce que le Studio écrit à côté d'un film qui n'est pas simplement à l'affiche. */
const MENTION_DE_STATUT: Record<string, string> = {
  'avant-premiere': 'avant-première',
  prochainement: 'prochainement',
  cycle: 'cycle / ciné-club',
  passe: 'retiré de l’affiche',
}

interface Props {
  films: FilmPlanning[]
  selection: ReadonlySet<string>
  /** Nombre de séances prévues pour chaque film, une fois la répartition connue. */
  seancesPrevues?: ReadonlyMap<string, number>
  onBasculer: (filmId: string) => void
}

export function ListeFilmsACocher({
  films,
  selection,
  seancesPrevues,
  onBasculer,
}: Props): React.JSX.Element {
  const basculer = useCallback(
    (evenement: React.ChangeEvent<HTMLInputElement>) =>
      onBasculer(evenement.currentTarget.value),
    [onBasculer],
  )

  return (
    <Card padding={2} radius={2} border tone="transparent">
      <Box overflow="auto" style={{maxHeight: 260}}>
        <Stack space={1}>
          {films.length === 0 && (
            <Text size={1} muted>
              Aucun film dans le Studio pour l’instant.
            </Text>
          )}
          {films.map((film) => {
            const mention = film.statut ? MENTION_DE_STATUT[film.statut] : undefined
            const prevues = seancesPrevues?.get(film._id)
            return (
              <Card key={film._id} padding={2} radius={2} tone="inherit">
                <Flex align="center" gap={3}>
                  <Checkbox
                    id={`film-${film._id}`}
                    value={film._id}
                    checked={selection.has(film._id)}
                    onChange={basculer}
                  />
                  <Box flex={1}>
                    <Text size={1} as="label" htmlFor={`film-${film._id}`}>
                      {film.titre}
                      {mention ? ` — ${mention}` : ''}
                    </Text>
                  </Box>
                  {typeof prevues === 'number' && (
                    <Text size={0} muted>
                      {prevues} séance{prevues > 1 ? 's' : ''}
                    </Text>
                  )}
                </Flex>
              </Card>
            )
          })}
        </Stack>
      </Box>
    </Card>
  )
}
