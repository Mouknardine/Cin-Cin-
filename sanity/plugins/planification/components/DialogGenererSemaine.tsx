/**
 * Assistant « Remplir la semaine au hasard ».
 *
 * On coche les films, l'outil compose la semaine : il répartit les
 * séances à peu près également entre les films, sans jamais mettre le
 * même film deux fois dans la même vague ni, si possible, deux fois le
 * même jour.
 *
 * Rien n'est créé avant d'avoir été vu : l'outil PROPOSE d'abord une
 * grille, on regarde combien de séances chaque film obtient, on relance
 * le tirage autant de fois qu'on veut, et on ne valide que lorsqu'elle
 * convient. Toute la mécanique est dans useGenerationSemaine.
 */
import {SparklesIcon, SyncIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Stack, Text} from '@sanity/ui'

import {SEMAINES_DE_RECUL, useGenerationSemaine} from '../hooks/useGenerationSemaine'
import type {FilmPlanning, SeancePlanning} from '../types'
import {formatPeriodeSemaine} from '../utils/dates'
import {ListeFilmsACocher} from './ListeFilmsACocher'
import {OptionACocher} from './OptionACocher'
import {RapportResultat} from './RapportResultat'

interface Props {
  films: FilmPlanning[]
  /** Le mercredi qui ouvre la semaine à remplir. */
  debutSemaine: string
  seancesSemaine: SeancePlanning[]
  onFermer: () => void
  onCree: () => void
}

export function DialogGenererSemaine({
  films,
  debutSemaine,
  seancesSemaine,
  onFermer,
  onCree,
}: Props): React.JSX.Element {
  const generation = useGenerationSemaine({films, debutSemaine, seancesSemaine, onCree})
  const {proposition, creneauxLibres: libres} = generation

  return (
    <Dialog id="generer-semaine" header="Remplir la semaine au hasard" onClose={onFermer} width={1}>
      <Box padding={4}>
        {generation.rapport ? (
          <Stack space={4}>
            <RapportResultat rapport={generation.rapport} />
            <Button text="Fermer" tone="primary" onClick={onFermer} />
          </Stack>
        ) : (
          <Stack space={4}>
            <Text size={1}>
              {formatPeriodeSemaine(debutSemaine)} — <strong>{libres}</strong> créneau
              {libres > 1 ? 'x' : ''} libre{libres > 1 ? 's' : ''} à remplir (19 h et 21 h, Salle 1
              et Salle 2). La séance de 21 h attend la fin du film de 19 h : derrière un film de
              2 h 20 elle partira à 21:20 pile. Les séances déjà programmées ne sont pas touchées.
            </Text>

            <Stack space={2}>
              <Text size={1} weight="semibold">
                Quels films faire tourner ?
              </Text>
              <ListeFilmsACocher
                films={films}
                selection={generation.selection}
                seancesPrevues={generation.seancesPrevues}
                onBasculer={generation.basculerFilm}
              />
            </Stack>

            <OptionACocher
              id="equilibrer-sur-la-duree"
              titre="Tenir compte des semaines voisines"
              cochee={generation.equilibrer}
              onChanger={generation.changerEquilibrage}
            >
              Les films déjà beaucoup projetés dans les {SEMAINES_DE_RECUL} semaines qui précèdent
              et qui suivent en reçoivent moins ici, pour que les totaux s’égalisent sur la durée
              plutôt que semaine par semaine.
            </OptionACocher>

            {proposition && (
              <Card padding={3} radius={2} tone="positive">
                <Text size={1}>
                  Proposition prête : <strong>{proposition.length}</strong> séance
                  {proposition.length > 1 ? 's' : ''}. Le nombre de séances de chaque film est
                  indiqué en face de son titre.
                </Text>
              </Card>
            )}

            <Flex gap={2}>
              <Button
                style={{flex: 1}}
                icon={proposition ? SyncIcon : SparklesIcon}
                text={
                  generation.enCours
                    ? 'Un instant…'
                    : proposition
                      ? 'Relancer le tirage'
                      : 'Proposer une grille'
                }
                mode={proposition ? 'ghost' : 'default'}
                tone={proposition ? 'default' : 'primary'}
                disabled={generation.enCours || generation.selection.size === 0 || libres === 0}
                onClick={generation.proposer}
              />
              {proposition && (
                <Button
                  style={{flex: 1}}
                  text={`Créer ces ${proposition.length} séances`}
                  tone="primary"
                  disabled={generation.enCours || proposition.length === 0}
                  onClick={generation.creer}
                />
              )}
            </Flex>

            {libres === 0 && (
              <Text size={1} muted>
                La semaine est déjà complète : tous les créneaux ordinaires sont pris.
              </Text>
            )}
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}
