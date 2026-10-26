/**
 * Une séance dans la grille : heure, film, salle, alerte de conflit
 * et menu d'actions (ouvrir la fiche, changer le film, supprimer).
 *
 * La carte s'attrape à la souris : on la prend et on la pose sur une
 * autre case. Le navigateur s'en charge tout seul (glisser-déposer
 * natif), ce qui évite d'embarquer une librairie entière pour trois
 * gestes — et garde le clavier opérationnel, puisque le menu ⋮ propose
 * les mêmes déplacements.
 *
 * Une avant-première ou une première est ÉPINGLÉE : elle porte son nom,
 * ne s'attrape pas, et son menu mène à la fiche du film, où elle se
 * règle (jour, heure, salle). Une seule source pour son horaire.
 */
import {
  DragHandleIcon,
  EditIcon,
  EllipsisVerticalIcon,
  PinFilledIcon,
  SortIcon,
  TransferIcon,
  TrashIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {Badge, Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import type {ActionsPlanning, SeancePlanning} from '../types'
import {heureDeFin} from '../utils/conflits'
import {NOM_DE_LA_PROJECTION, estUneProjection} from '../utils/projection-de-la-fiche'
import {autreSalle} from '../utils/salles-attitrees'

/** Une couleur « #RRGGBB » à 26 % : assez franche pour distinguer les films,
    assez pâle pour que le titre reste lisible. */
function teinte(couleur: string): string {
  return `${couleur}42`
}

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
  const ouvrirFicheDuFilm = useCallback(() => {
    router.navigateIntent('edit', {id: seance.filmId, type: 'film'})
  }, [router, seance.filmId])

  /* L'avant-première ou la première du film, tenue par sa fiche. */
  const projection = estUneProjection(seance.evenement)
    ? NOM_DE_LA_PROJECTION[seance.evenement]
    : null

  const demanderSuppression = useCallback(
    () => actions.onSupprimer(seance),
    [actions, seance],
  )
  const demanderChangementDeFilm = useCallback(
    () => actions.onChangerFilm(seance),
    [actions, seance],
  )
  const demanderChangementDeSalle = useCallback(
    () => actions.onChangerDeSalle(seance),
    [actions, seance],
  )
  /* Le Hall-Bar n'a pas d'« autre salle » : ses séances ne déménagent
     qu'à la main. */
  const salleVoisine = autreSalle(seance.salle)
  const couleur = actions.couleurDe(seance.filmId)

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
      draggable={!projection}
      onDragStart={projection ? undefined : commencer}
      onDragEnd={projection ? undefined : onFinGlisser}
      style={{
        cursor: projection ? 'default' : 'grab',
        opacity: enCoursDeDeplacement ? 0.4 : 1,
        /* La couleur du film, la même que dans le compteur au-dessus :
           un liseré franc et toute la carte légèrement teintée, pour que
           la semaine se lise film par film. Une séance en conflit garde
           son fond rouge : l'alerte passe avant la couleur. */
        borderLeft: `6px solid ${couleur}`,
        ...(enConflit ? {} : {background: teinte(couleur)}),
      }}
      title={
        projection
          ? `${projection} de « ${seance.filmTitre} » — elle se règle dans la fiche du film`
          : `${seance.filmTitre} — glissez la carte pour déplacer cette séance`
      }
    >
      <Flex align="flex-start" gap={1}>
        <Box paddingTop={1}>
          <Text size={1} muted>
            {projection ? <PinFilledIcon /> : <DragHandleIcon />}
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
            {projection && (
              <Badge tone="caution" fontSize={0}>
                {projection}
              </Badge>
            )}
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
            projection ? (
              <Menu>
                <MenuItem
                  icon={EditIcon}
                  text="Régler dans la fiche du film"
                  onClick={ouvrirFicheDuFilm}
                />
                <MenuItem icon={EditIcon} text="Ouvrir la fiche de la séance" onClick={ouvrirFiche} />
              </Menu>
            ) : (
              <Menu>
                <MenuItem
                  icon={TransferIcon}
                  text="Changer le film…"
                  onClick={demanderChangementDeFilm}
                />
                {salleVoisine && (
                  <MenuItem
                    icon={SortIcon}
                    text={`Passer ce film en ${salleVoisine} (toute la semaine)`}
                    onClick={demanderChangementDeSalle}
                  />
                )}
                <MenuItem icon={EditIcon} text="Ouvrir la fiche" onClick={ouvrirFiche} />
                <MenuItem
                  icon={TrashIcon}
                  text="Supprimer"
                  tone="critical"
                  onClick={demanderSuppression}
                />
              </Menu>
            )
          }
          popover={{portal: true}}
        />
      </Flex>
    </Card>
  )
}
