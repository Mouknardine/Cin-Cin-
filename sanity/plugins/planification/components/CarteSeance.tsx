/**
 * Une séance dans la grille : heure, film, salle, alerte de conflit
 * et menu d'actions (ouvrir la fiche, changer le film, supprimer).
 *
 * La carte s'attrape à la souris : on la prend et on la pose sur une
 * autre case. Le navigateur s'en charge tout seul (glisser-déposer
 * natif), ce qui évite d'embarquer une librairie entière pour trois
 * gestes — et garde le clavier opérationnel, puisque le menu ⋮ propose
 * les mêmes déplacements.
 */
import {DragHandleIcon, EditIcon, EllipsisVerticalIcon, TransferIcon, TrashIcon, WarningOutlineIcon} from '@sanity/icons'
import {Badge, Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import type {ActionsPlanning, SeancePlanning} from '../types'
import {heureDeFin} from '../utils/conflits'

interface Props {
  seance: SeancePlanning
  enConflit: boolean
  /** Vrai pendant que cette carte est portée par la souris. */
  enCoursDeDeplacement: boolean
  actions: ActionsPlanning
  onDebutGlisser: (seance: SeancePlanning) => void
  onFinGlisser: () => void
}

export function CarteSeance({
  seance,
  enConflit,
  enCoursDeDeplacement,
  actions,
  onDebutGlisser,
  onFinGlisser,
}: Props): React.JSX.Element {
  const router = useRouter()

  /* L'heure de FIN décide de tout le reste de la soirée : c'est elle qui
     dit à quelle minute la salle se libère pour la séance suivante. */
  const fin = useMemo(
    () => heureDeFin(seance.heure, seance.filmDuree),
    [seance.filmDuree, seance.heure],
  )

  const ouvrirFiche = useCallback(() => {
    router.navigateIntent('edit', {id: seance._id.replace(/^drafts\./, ''), type: 'screening'})
  }, [router, seance._id])

  const demanderSuppression = useCallback(
    () => actions.onSupprimer(seance),
    [actions, seance],
  )
  const demanderChangementDeFilm = useCallback(
    () => actions.onChangerFilm(seance),
    [actions, seance],
  )

  const commencer = useCallback(
    (evenement: React.DragEvent<HTMLDivElement>) => {
      /* L'identifiant voyage aussi dans le presse-papier du glisser :
         sans donnée, Firefox refuse tout simplement de démarrer. */
      evenement.dataTransfer.setData('text/plain', seance._id)
      evenement.dataTransfer.effectAllowed = 'move'
      onDebutGlisser(seance)
    },
    [onDebutGlisser, seance],
  )

  return (
    <Card
      padding={2}
      radius={2}
      shadow={1}
      tone={enConflit ? 'critical' : 'default'}
      role="listitem"
      draggable
      onDragStart={commencer}
      onDragEnd={onFinGlisser}
      style={{cursor: 'grab', opacity: enCoursDeDeplacement ? 0.4 : 1}}
      title={`${seance.filmTitre} — glissez la carte pour déplacer cette séance`}
    >
      <Flex align="flex-start" gap={1}>
        <Box paddingTop={1}>
          <Text size={1} muted>
            <DragHandleIcon />
          </Text>
        </Box>
        <Stack space={2} flex={1}>
          <Text size={1} weight="semibold">
            {seance.heure} · {seance.filmTitre}
          </Text>
          <Flex gap={2} align="center" wrap="wrap">
            <Badge tone={seance.salle === 'Salle 1' ? 'primary' : 'positive'} fontSize={0}>
              {seance.salle}
            </Badge>
            {fin && (
              <Text size={0} muted>
                → {fin.heure}
                {fin.lendemain ? ' +1j' : ''}
              </Text>
            )}
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
              <MenuItem
                icon={TransferIcon}
                text="Changer le film…"
                onClick={demanderChangementDeFilm}
              />
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
