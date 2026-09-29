/**
 * Les créneaux hebdomadaires d'un film, dans l'assistant « Programmer un
 * film » : une ligne par créneau, sous des intitulés alignés sur les champs.
 */
import {AddIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'

import type {Creneau} from '../types'
import {LigneCreneau} from './LigneCreneau'

interface Props {
  creneaux: Creneau[]
  dureeFilm: number | null
  filmChoisi: boolean
  onModifier: (index: number, creneau: Creneau) => void
  onSupprimer: (index: number) => void
  onAjouter: () => void
}

export function ListeCreneaux({
  creneaux,
  dureeFilm,
  filmChoisi,
  onModifier,
  onSupprimer,
  onAjouter,
}: Props): React.JSX.Element {
  return (
    <Stack space={2}>
      <Text size={1} weight="semibold">
        Créneaux chaque semaine
      </Text>
      {/* Les largeurs reprennent exactement celles de LigneCreneau,
          pour que chaque intitulé tombe au-dessus de son champ. */}
      <Flex gap={2} align="center">
        <Box flex={3}>
          <Text size={0} muted>
            Jour
          </Text>
        </Box>
        <Box flex={2} style={{minWidth: 110}}>
          <Text size={0} muted>
            Début
          </Text>
        </Box>
        <Box flex={2} style={{minWidth: 96}}>
          <Text size={0} muted align="center">
            Fin
          </Text>
        </Box>
        <Box flex={3}>
          <Text size={0} muted>
            Salle
          </Text>
        </Box>
        {/* Réserve la place du bouton « retirer » des lignes en dessous. */}
        <Box style={{width: 35}} />
      </Flex>
      {creneaux.map((creneau, index) => (
        <LigneCreneau
          key={index}
          creneau={creneau}
          index={index}
          suppressionPossible={creneaux.length > 1}
          dureeFilm={dureeFilm}
          filmChoisi={filmChoisi}
          onModifier={onModifier}
          onSupprimer={onSupprimer}
        />
      ))}
      <Button mode="ghost" icon={AddIcon} text="Ajouter un créneau" onClick={onAjouter} />
    </Stack>
  )
}
