/**
 * Une séance dans la grille : heure, film, salle, alerte de conflit
 * et menu d'actions (ouvrir la fiche, supprimer).
 */
import {EllipsisVerticalIcon, EditIcon, TrashIcon, WarningOutlineIcon} from '@sanity/icons'
import {Badge, Button, Card, Flex, Menu, MenuButton, MenuItem, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import type {SeancePlanning} from '../types'

interface Props {
  seance: SeancePlanning
  enConflit: boolean
  onSupprimer: (seance: SeancePlanning) => void
}

export function CarteSeance({seance, enConflit, onSupprimer}: Props): React.JSX.Element {
  const router = useRouter()

  const ouvrirFiche = useCallback(() => {
    router.navigateIntent('edit', {id: seance._id.replace(/^drafts\./, ''), type: 'screening'})
  }, [router, seance._id])

  const demanderSuppression = useCallback(() => onSupprimer(seance), [onSupprimer, seance])

  return (
    <Card
      padding={2}
      radius={2}
      shadow={1}
      tone={enConflit ? 'critical' : 'default'}
      role="listitem"
    >
      <Flex align="flex-start" gap={2}>
        <Stack space={2} flex={1}>
          <Text size={1} weight="semibold">
            {seance.heure} · {seance.filmTitre}
          </Text>
          <Flex gap={2} align="center" wrap="wrap">
            <Badge tone={seance.salle === 'Salle 1' ? 'primary' : 'positive'} fontSize={0}>
              {seance.salle}
            </Badge>
            {enConflit && (
              <Badge tone="critical" fontSize={0}>
                <WarningOutlineIcon /> Conflit
              </Badge>
            )}
          </Flex>
        </Stack>
        <MenuButton
          id={`actions-${seance._id}`}
          button={<Button mode="bleed" icon={EllipsisVerticalIcon} aria-label="Actions" />}
          menu={
            <Menu>
              <MenuItem icon={EditIcon} text="Ouvrir la fiche" onClick={ouvrirFiche} />
              <MenuItem
                icon={TrashIcon}
                text="Supprimer"
                tone="critical"
                onClick={demanderSuppression}
              />
            </Menu>
          }
          popover={{portal: true}}
        />
      </Flex>
    </Card>
  )
}
