/**
 * Une case sans film dans la grille : « Projection privée » ou
 * « Vacances », posée à la place d'un film.
 *
 * Elle se distingue d'une séance au premier coup d'œil — fond hachuré,
 * aucun liseré ni couleur de film — et ne s'attrape pas à la souris :
 * on ne déplace pas des vacances, on les retire et on les repose.
 */
import {EditIcon, EllipsisVerticalIcon, RemoveCircleIcon, TrashIcon} from '@sanity/icons'
import {Badge, Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {prendToutLeJour} from '../../../casesSansFilm'
import type {ActionsPlanning, CaseSansFilm} from '../types'

/** Des hachures discrètes : la case est prise, mais pas par un film. */
const HACHURES =
  'repeating-linear-gradient(135deg, transparent 0 6px, var(--card-border-color) 6px 7px)'

interface Props {
  caseSansFilm: CaseSansFilm
  actions: ActionsPlanning
}

export function CarteSansFilm({caseSansFilm, actions}: Props): React.JSX.Element {
  const router = useRouter()
  const toutLeJour = prendToutLeJour(caseSansFilm.libelle)

  const ouvrirFiche = useCallback(() => {
    router.navigateIntent('edit', {id: caseSansFilm._id.replace(/^drafts\./, ''), type: 'sansFilm'})
  }, [caseSansFilm._id, router])
  const retirer = useCallback(
    () => actions.onRetirerCaseSansFilm(caseSansFilm),
    [actions, caseSansFilm],
  )

  return (
    <Card
      padding={2}
      radius={2}
      shadow={1}
      role="listitem"
      style={{backgroundImage: HACHURES}}
      title={
        toutLeJour
          ? `${caseSansFilm.libelle} — toute la journée, aucun film ne s'y programme`
          : `${caseSansFilm.libelle} — la salle est prise, aucun film ne s'y programme`
      }
    >
      <Flex align="flex-start" gap={1}>
        <Box paddingTop={1}>
          <Text size={1} muted>
            <RemoveCircleIcon />
          </Text>
        </Box>
        <Stack space={2} flex={1}>
          <Text size={1} weight="semibold">
            {toutLeJour ? caseSansFilm.libelle : `${caseSansFilm.heure} · ${caseSansFilm.libelle}`}
          </Text>
          {toutLeJour ? (
            <Text size={0} muted>
              Toute la journée
            </Text>
          ) : (
            <Flex>
              <Badge fontSize={0}>{caseSansFilm.salle}</Badge>
            </Flex>
          )}
        </Stack>
        <MenuButton
          id={`actions-sans-film-${caseSansFilm._id}`}
          button={<Button mode="bleed" icon={EllipsisVerticalIcon} aria-label="Actions" />}
          menu={
            <Menu>
              <MenuItem icon={EditIcon} text="Ouvrir la fiche" onClick={ouvrirFiche} />
              <MenuItem icon={TrashIcon} text="Retirer" tone="critical" onClick={retirer} />
            </Menu>
          }
          popover={{portal: true}}
        />
      </Flex>
    </Card>
  )
}
