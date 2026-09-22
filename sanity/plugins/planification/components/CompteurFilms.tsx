/**
 * Le compteur de la semaine : chaque film projeté, dans sa couleur,
 * avec son nombre de séances et sa salle.
 *
 * C'est la légende de la grille — la couleur d'un film ici est celle de
 * ses cartes en dessous — et le moyen de voir d'un coup d'œil si un film
 * a été oublié ou s'il passe bien plus souvent que les autres.
 */
import {Box, Card, Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'

import type {SeancePlanning} from '../types'

interface Props {
  seances: readonly SeancePlanning[]
  couleurDe: (filmId: string) => string
}

interface LigneCompteur {
  filmId: string
  titre: string
  nombre: number
  salles: string[]
}

function compterParFilm(seances: readonly SeancePlanning[]): LigneCompteur[] {
  const parFilm = new Map<string, LigneCompteur>()
  for (const seance of seances) {
    const ligne = parFilm.get(seance.filmId) ?? {
      filmId: seance.filmId,
      titre: seance.filmTitre,
      nombre: 0,
      salles: [],
    }
    ligne.nombre += 1
    if (!ligne.salles.includes(seance.salle)) ligne.salles.push(seance.salle)
    parFilm.set(seance.filmId, ligne)
  }
  return [...parFilm.values()].sort((a, b) => a.titre.localeCompare(b.titre, 'fr'))
}

export function CompteurFilms({seances, couleurDe}: Props): React.JSX.Element | null {
  const lignes = useMemo(() => compterParFilm(seances), [seances])
  if (lignes.length === 0) return null

  return (
    <Flex gap={2} wrap="wrap" role="list" aria-label="Nombre de séances par film cette semaine">
      {lignes.map((ligne) => (
        <Card
          key={ligne.filmId}
          role="listitem"
          padding={2}
          radius={2}
          border
          style={{borderLeft: `4px solid ${couleurDe(ligne.filmId)}`}}
        >
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              {ligne.titre}
            </Text>
            <Box
              paddingX={2}
              paddingY={1}
              title={`${ligne.nombre} séance${ligne.nombre > 1 ? 's' : ''} cette semaine`}
              style={{
                borderRadius: 999,
                background: couleurDe(ligne.filmId),
                color: '#fff',
                minWidth: 22,
                textAlign: 'center',
              }}
            >
              <Text size={0} weight="bold" style={{color: 'inherit'}}>
                {ligne.nombre}
                <span style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)'}}>
                  {ligne.nombre > 1 ? ' séances' : ' séance'}
                </span>
              </Text>
            </Box>
            <Text size={0} muted>
              {ligne.salles.join(' + ')}
            </Text>
          </Flex>
        </Card>
      ))}
    </Flex>
  )
}
