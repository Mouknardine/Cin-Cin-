/**
 * L'en-tête du planning : la semaine affichée, la navigation d'une
 * semaine à l'autre, et les assistants.
 */
import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  EnvelopeIcon,
  SparklesIcon,
  SyncIcon,
} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'

import {couleurDeLaSemaine} from '../utils/couleurs'
import {formatPeriodeSemaine} from '../utils/dates'

/** Les assistants ouvrables depuis la barre. */
export type DialogOuvert = 'programmer' | 'dupliquer' | 'generer' | 'newsletter' | null

interface Props {
  debutSemaine: string
  nbSeances: number
  onSemainePrecedente: () => void
  onSemaineActuelle: () => void
  onSemaineSuivante: () => void
  onActualiser: () => void
  onOuvrir: (dialog: DialogOuvert) => void
}

export function BarreSemaine({
  debutSemaine,
  nbSeances,
  onSemainePrecedente,
  onSemaineActuelle,
  onSemaineSuivante,
  onActualiser,
  onOuvrir,
}: Props): React.JSX.Element {
  return (
    <Flex align="center" justify="space-between" gap={3} wrap="wrap">
      <Stack space={2}>
        <Text size={3} weight="bold">
          Planification des séances
        </Text>
        {/* La pastille prend la couleur de la semaine : en changeant de
            semaine, on la voit changer de teinte. */}
        <Flex align="center" gap={2}>
          <Box
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: couleurDeLaSemaine(debutSemaine),
              flexShrink: 0,
            }}
          />
          <Text size={1} weight="semibold">
            {formatPeriodeSemaine(debutSemaine)}
          </Text>
          <Text size={1} muted>
            · {nbSeances} séance{nbSeances > 1 ? 's' : ''}
          </Text>
        </Flex>
      </Stack>
      <Flex gap={2} wrap="wrap">
        <Button
          icon={ChevronLeftIcon}
          mode="ghost"
          onClick={onSemainePrecedente}
          aria-label="Semaine précédente"
        />
        <Button text="Aujourd'hui" mode="ghost" onClick={onSemaineActuelle} />
        <Button
          icon={ChevronRightIcon}
          mode="ghost"
          onClick={onSemaineSuivante}
          aria-label="Semaine suivante"
        />
        <Button icon={SyncIcon} mode="ghost" onClick={onActualiser} aria-label="Actualiser" />
        <Button
          icon={CopyIcon}
          text="Dupliquer la semaine"
          mode="ghost"
          onClick={() => onOuvrir('dupliquer')}
        />
        <Button
          icon={EnvelopeIcon}
          text="Newsletter"
          mode="ghost"
          onClick={() => onOuvrir('newsletter')}
        />
        <Button
          icon={SparklesIcon}
          text="Remplir au hasard"
          mode="ghost"
          onClick={() => onOuvrir('generer')}
        />
        <Button
          icon={AddIcon}
          text="Programmer un film"
          tone="primary"
          onClick={() => onOuvrir('programmer')}
        />
      </Flex>
    </Flex>
  )
}
