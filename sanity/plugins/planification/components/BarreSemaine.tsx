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
import {Button, Flex, Stack, Text} from '@sanity/ui'

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
        <Text size={1} muted>
          {formatPeriodeSemaine(debutSemaine)} · {nbSeances} séance{nbSeances > 1 ? 's' : ''}
        </Text>
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
