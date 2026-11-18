/**
 * Les trois boutons qui font sortir le message, et la phrase qui dit lequel
 * choisir. Communs à la newsletter du lundi et à la piqûre de rappel.
 */
import {ClipboardIcon, CodeIcon, DownloadIcon} from '@sanity/icons'
import {Button, Flex, Stack, Text} from '@sanity/ui'

import type {Sortie} from './useSortie'

interface Props {
  sortie: Sortie
  /** Rien à copier tant que le message est vide. */
  desactives?: boolean
  /** Une précision propre à l'envoi, à la suite du mode d'emploi. */
  children?: React.ReactNode
}

export function BoutonsDeSortie({sortie, desactives = false, children}: Props): React.JSX.Element {
  return (
    <Stack space={3}>
      <Flex gap={2} wrap="wrap">
        <Button
          icon={ClipboardIcon}
          text="Copier la newsletter"
          tone="primary"
          disabled={desactives}
          onClick={sortie.copier}
        />
        <Button icon={CodeIcon} mode="ghost" text="Copier le code HTML" disabled={desactives} onClick={sortie.copierCode} />
        <Button icon={DownloadIcon} mode="ghost" text="Télécharger" disabled={desactives} onClick={sortie.telecharger} />
      </Flex>
      <Text size={1} muted>
        Cliquez sur « Copier la newsletter », puis collez dans votre message (Cmd+V ou Ctrl+V) : la
        mise en page et les affiches suivent. Si votre outil d’envoi propose un bloc « HTML » ou
        « code », préférez « Copier le code HTML » : c’est la version la plus fidèle. {children}
      </Text>
    </Stack>
  )
}
