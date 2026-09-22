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
import {useMemo} from 'react'

import type {FilmPlanning, SeancePlanning} from '../types'

/** Les films qu'on s'attend à voir programmés, même sans séance encore. */
const STATUTS_A_PROGRAMMER = ['a-laffiche', 'avant-premiere', 'cycle']

interface Props {
  films: readonly FilmPlanning[]
  seances: readonly SeancePlanning[]
  couleurDe: (filmId: string) => string
}

interface LigneCompteur {
  filmId: string
  titre: string
  nombre: number
  salles: string[]
}

function lignesDuCompteur(
  films: readonly FilmPlanning[],
  seances: readonly SeancePlanning[],
): LigneCompteur[] {
  const parFilm = new Map<string, LigneCompteur>()
  for (const film of films) {
    if (!STATUTS_A_PROGRAMMER.includes(film.statut ?? '')) continue
    parFilm.set(film._id, {filmId: film._id, titre: film.titre, nombre: 0, salles: []})
  }
  /* Un film programmé cette semaine compte toujours, même s'il n'est
     plus « à l'affiche » (une reprise, un film terminé). */
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

export function CompteurFilms({films, seances, couleurDe}: Props): React.JSX.Element | null {
  const lignes = useMemo(() => lignesDuCompteur(films, seances), [films, seances])
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
              background: `${couleurDe(ligne.filmId)}2E`,
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
