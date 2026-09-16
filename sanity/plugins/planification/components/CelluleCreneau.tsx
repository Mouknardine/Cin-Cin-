/**
 * Une case de la grille : un jour, une heure, une salle.
 *
 * Occupée, elle porte la séance. Vide, elle propose de programmer un
 * film d'un clic. Dans les deux cas elle accepte qu'on lui dépose une
 * séance venue d'ailleurs :
 *
 *   - case vide     → la séance déménage ici ;
 *   - case occupée  → les deux séances échangent leurs places.
 */
import {AddIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import type {ActionsPlanning, CreneauDate, GlisserDeposer, SeancePlanning} from '../types'
import {CarteSeance} from './CarteSeance'

interface Props {
  creneau: CreneauDate
  /** La séance posée sur ce créneau, s'il y en a une. */
  seance: SeancePlanning | null
  enConflit: boolean
  actions: ActionsPlanning
  glisser: GlisserDeposer
}

export function CelluleCreneau({
  creneau,
  seance,
  enConflit,
  actions,
  glisser,
}: Props): React.JSX.Element {
  const [survolee, setSurvolee] = useState(false)
  const portee = glisser.seanceGlissee
  /* Une case n'accepte un dépôt que si une séance est en cours de
     déplacement, et que ce n'est pas celle qui s'y trouve déjà. */
  const accepte = Boolean(portee) && portee?._id !== seance?._id

  const survoler = useCallback(
    (evenement: React.DragEvent<HTMLDivElement>) => {
      if (!accepte) return
      /* Sans preventDefault, le navigateur refuse le dépôt : c'est ce
         qui distingue une zone d'accueil du reste de la page. */
      evenement.preventDefault()
      evenement.dataTransfer.dropEffect = 'move'
      setSurvolee(true)
    },
    [accepte],
  )

  const quitter = useCallback(() => setSurvolee(false), [])

  const deposer = useCallback(
    (evenement: React.DragEvent<HTMLDivElement>) => {
      evenement.preventDefault()
      setSurvolee(false)
      if (!accepte) return
      glisser.onDeposer(creneau, seance)
    },
    [accepte, creneau, glisser, seance],
  )

  const ajouter = useCallback(() => actions.onAjouter(creneau), [actions, creneau])

  return (
    <Box
      onDragOver={survoler}
      onDragEnter={survoler}
      onDragLeave={quitter}
      onDrop={deposer}
      style={survolee ? {outline: '2px solid var(--card-focus-ring-color)', borderRadius: 6} : undefined}
    >
      {seance ? (
        <CarteSeance
          seance={seance}
          enConflit={enConflit}
          enCoursDeDeplacement={portee?._id === seance._id}
          actions={actions}
          onDebutGlisser={glisser.onDebut}
          onFinGlisser={glisser.onFin}
        />
      ) : (
        <Card
          as="button"
          type="button"
          padding={2}
          radius={2}
          tone={survolee ? 'primary' : 'transparent'}
          onClick={ajouter}
          style={{
            width: '100%',
            border: '1px dashed var(--card-border-color)',
            cursor: 'pointer',
            minHeight: 54,
          }}
          aria-label={`Programmer un film à ${creneau.heure} en ${creneau.salle}`}
        >
          {/* L'heure est annoncée sur la case vide : derrière un long film,
              la séance de 21 h part plus tard, et il faut le voir avant de
              cliquer. */}
          <Flex align="center" justify="center" gap={2} style={{height: '100%'}}>
            <Text size={1} muted>
              <AddIcon />
            </Text>
            <Text size={0} muted>
              {creneau.heure} · {creneau.salle}
            </Text>
          </Flex>
        </Card>
      )}
    </Box>
  )
}
