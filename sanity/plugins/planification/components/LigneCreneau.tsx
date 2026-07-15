/**
 * Une ligne de créneau hebdomadaire dans l'assistant « Programmer un film » :
 * jour de la semaine + heure + salle + bouton de suppression.
 */
import {TrashIcon} from '@sanity/icons'
import {Button, Flex, Select, TextInput} from '@sanity/ui'
import {useCallback} from 'react'

import {SALLES, type Creneau} from '../types'
import {JOURS_SEMAINE} from '../utils/dates'

interface Props {
  creneau: Creneau
  index: number
  suppressionPossible: boolean
  onModifier: (index: number, creneau: Creneau) => void
  onSupprimer: (index: number) => void
}

export function LigneCreneau({
  creneau,
  index,
  suppressionPossible,
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

  return (
    <Flex gap={2} align="center">
      <Select value={creneau.jour} onChange={changerJour} aria-label="Jour de la semaine">
        {JOURS_SEMAINE.map((jour) => (
          <option key={jour.valeur} value={jour.valeur}>
            {jour.titre}
          </option>
        ))}
      </Select>
      <TextInput
        type="time"
        value={creneau.heure}
        onChange={changerHeure}
        aria-label="Heure de la séance"
      />
      <Select value={creneau.salle} onChange={changerSalle} aria-label="Salle">
        {SALLES.map((salle) => (
          <option key={salle} value={salle}>
            {salle}
          </option>
        ))}
      </Select>
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
