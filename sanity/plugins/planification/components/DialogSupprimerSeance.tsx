/**
 * La confirmation avant de retirer une séance du site.
 */
import {Box, Button, Dialog, Flex, Stack, Text} from '@sanity/ui'

import type {SeancePlanning} from '../types'
import {formatJourCourt} from '../utils/dates'

interface Props {
  seance: SeancePlanning
  enCours: boolean
  onConfirmer: () => void
  onAnnuler: () => void
}

export function DialogSupprimerSeance({
  seance,
  enCours,
  onConfirmer,
  onAnnuler,
}: Props): React.JSX.Element {
  return (
    <Dialog id="confirmer-suppression" header="Supprimer la séance ?" onClose={onAnnuler} width={0}>
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1}>
            « {seance.filmTitre} » le {formatJourCourt(seance.date)} à {seance.heure} (
            {seance.salle}) sera retirée du site.
          </Text>
          <Flex gap={2} justify="flex-end">
            <Button text="Annuler" mode="ghost" onClick={onAnnuler} />
            <Button
              text={enCours ? 'Suppression…' : 'Supprimer'}
              tone="critical"
              disabled={enCours}
              onClick={onConfirmer}
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
