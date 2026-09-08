/**
 * Une ligne de créneau hebdomadaire dans l'assistant « Programmer un film » :
 * jour de la semaine, heure de début, heure de fin, salle, et suppression.
 *
 * Les trois champs reçoivent une largeur explicite. Sans elle, le champ
 * d'heure — le plus étroit des trois pour le navigateur — se retrouvait
 * comprimé au point d'être illisible, alors que c'est l'information la plus
 * importante de la ligne.
 */
import {TrashIcon} from '@sanity/icons'
import {Box, Button, Flex, Select, Text, TextInput} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {SALLES, type Creneau} from '../types'
import {heureDeFin} from '../utils/conflits'
import {JOURS_SEMAINE} from '../utils/dates'

interface Props {
  creneau: Creneau
  index: number
  suppressionPossible: boolean
  /** Durée du film choisi, pour annoncer l'heure de fin. Null tant qu'aucun film n'est choisi. */
  dureeFilm: number | null
  /** Faux tant qu'aucun film n'est choisi : on n'annonce alors aucune heure de fin. */
  filmChoisi: boolean
  onModifier: (index: number, creneau: Creneau) => void
  onSupprimer: (index: number) => void
}

export function LigneCreneau({
  creneau,
  index,
  suppressionPossible,
  dureeFilm,
  filmChoisi,
  onModifier,
  onSupprimer,
}: Props): React.JSX.Element {
  const changerJour = useCallback(
    (evenement: React.ChangeEvent<HTMLSelectElement>) =>
      onModifier(index, {...creneau, jour: Number(evenement.currentTarget.value)}),
    [creneau, index, onModifier],
  )
  const changerHeure = useCallback(
    (evenement: React.ChangeEvent<HTMLInputElement>) =>
      onModifier(index, {...creneau, heure: evenement.currentTarget.value}),
    [creneau, index, onModifier],
  )
  const changerSalle = useCallback(
    (evenement: React.ChangeEvent<HTMLSelectElement>) =>
      onModifier(index, {...creneau, salle: evenement.currentTarget.value}),
    [creneau, index, onModifier],
  )
  const supprimer = useCallback(() => onSupprimer(index), [index, onSupprimer])

  const fin = useMemo(
    () => (filmChoisi ? heureDeFin(creneau.heure, dureeFilm) : null),
    [creneau.heure, dureeFilm, filmChoisi],
  )

  return (
    <Flex gap={2} align="center">
      <Box flex={3}>
        <Select value={creneau.jour} onChange={changerJour} aria-label="Jour de la semaine">
          {JOURS_SEMAINE.map((jour) => (
            <option key={jour.valeur} value={jour.valeur}>
              {jour.titre}
            </option>
          ))}
        </Select>
      </Box>

      <Box flex={2} style={{minWidth: 110}}>
        <TextInput
          type="time"
          value={creneau.heure}
          onChange={changerHeure}
          aria-label="Heure de début de la séance"
        />
      </Box>

      {/* L'heure de fin sert à enchaîner : la séance suivante peut commencer
          à cette minute précise, dans la même salle. */}
      <Box flex={2} style={{minWidth: 96}}>
        <Text size={1} muted align="center">
          {fin ? `→ ${fin.heure}${fin.lendemain ? ' +1j' : ''}` : '→ —'}
        </Text>
      </Box>

      <Box flex={3}>
        <Select value={creneau.salle} onChange={changerSalle} aria-label="Salle">
          {SALLES.map((salle) => (
            <option key={salle} value={salle}>
              {salle}
            </option>
          ))}
        </Select>
      </Box>

      <Button
        mode="bleed"
        tone="critical"
        icon={TrashIcon}
        onClick={supprimer}
        disabled={!suppressionPossible}
        aria-label="Retirer ce créneau"
      />
    </Flex>
  )
}
