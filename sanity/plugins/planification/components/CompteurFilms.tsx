/**
 * Le compteur de la semaine : chaque film, dans sa couleur, avec son
 * nombre de séances et sa salle.
 *
 * C'est la légende de la grille — la couleur d'un film ici est celle de
 * ses cartes en dessous — et le tableau de bord du programmateur : il
 * montre TOUS les films à l'affiche, y compris ceux qui n'ont encore
 * aucune séance cette semaine (« 0 »). Un film oublié se voit donc tout
 * de suite, comme un film qui passe bien plus souvent que les autres.
 */
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'

import type {FilmDeLaSemaine} from '../utils/films-de-la-semaine'

interface Props {
  /** Les films de la semaine, dans l'ordre (voir utils/films-de-la-semaine.ts). */
  lignes: readonly FilmDeLaSemaine[]
  couleurDe: (filmId: string) => string
}

function Pastille({nombre, couleur}: {nombre: number; couleur: string}): React.JSX.Element {
  return (
    <Box
      paddingX={2}
      paddingY={1}
      title={`${nombre} séance${nombre > 1 ? 's' : ''} cette semaine`}
      style={{
        borderRadius: 999,
        background: nombre > 0 ? couleur : 'transparent',
        border: `2px solid ${couleur}`,
        color: nombre > 0 ? '#fff' : 'inherit',
        minWidth: 26,
        textAlign: 'center',
      }}
    >
      <Text size={1} weight="bold" style={{color: 'inherit'}}>
        {nombre}
        <span
          style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)'}}
        >
          {nombre > 1 ? ' séances' : ' séance'}
        </span>
      </Text>
    </Box>
  )
}

export function CompteurFilms({lignes, couleurDe}: Props): React.JSX.Element | null {
  if (lignes.length === 0) return null

  return (
    <Stack space={2}>
      <Text size={1} weight="semibold">
        Séances de chaque film cette semaine
      </Text>
      <Flex gap={2} wrap="wrap" role="list" aria-label="Nombre de séances par film cette semaine">
        {lignes.map((ligne) => (
          <Card
            key={ligne.filmId}
            role="listitem"
            padding={2}
            radius={2}
            border
            style={{
              borderLeft: `6px solid ${couleurDe(ligne.filmId)}`,
              background: `${couleurDe(ligne.filmId)}42`,
            }}
          >
            <Flex align="center" gap={2}>
              <Pastille nombre={ligne.nombre} couleur={couleurDe(ligne.filmId)} />
              <Text size={1} weight="semibold">
                {ligne.titre}
              </Text>
              {ligne.salles.length > 0 && (
                <Text size={0} muted>
                  {ligne.salles.join(' + ')}
                </Text>
              )}
            </Flex>
          </Card>
        ))}
      </Flex>
    </Stack>
  )
}
