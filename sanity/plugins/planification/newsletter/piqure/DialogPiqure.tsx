/**
 * « Piqûre de rappel » : la petite newsletter du milieu de semaine, qui met
 * en avant un film ou un événement (demande du cinéma, 18 novembre 2026).
 *
 * À gauche, on choisit : le jour de l'envoi, ce qu'on met en avant, le
 * titre et un mot si on veut. À droite, la piqûre se compose au fur et à
 * mesure, avec les mêmes boutons que la newsletter du lundi pour la sortir.
 */
import {Box, Card, Dialog, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION} from '../../types'
import {aujourdHui} from '../../utils/dates'
import {ApercuNewsletter} from '../ApercuNewsletter'
import {BoutonsDeSortie} from '../BoutonsDeSortie'
import {useSortie} from '../useSortie'
import {envoiParDefaut} from './candidats'
import {ChampJourDEnvoi, ChampsDuMessage} from './ChampsDeLaPiqure'
import {construirePiqure, objetDeLaPiqure, titreParDefaut} from './gabarit'
import {ListeAMettreEnAvant} from './ListeAMettreEnAvant'
import {useDonneesPiqure} from './useDonneesPiqure'

interface Props {
  /** Le mercredi de la semaine affichée dans le planning. */
  debutSemaine: string
  onFermer: () => void
}

export function DialogPiqure({debutSemaine, onFermer}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const [envoi, setEnvoi] = useState(() => envoiParDefaut(debutSemaine, aujourdHui()))
  const {donnees, erreur} = useDonneesPiqure(client, envoi)
  const [coches, setCoches] = useState<ReadonlySet<string>>(() => new Set())
  const [titre, setTitre] = useState('')
  const [mot, setMot] = useState('')

  const basculer = useCallback((cle: string) => {
    setCoches((avant) => {
      const apres = new Set(avant)
      if (apres.has(cle)) apres.delete(cle)
      else apres.add(cle)
      return apres
    })
  }, [])

  /* Ce qui est coché et existe encore au jour choisi : changer de jour
     retire d'elles-mêmes les séances qui ne tombent plus dans la période. */
  const choix = useMemo(
    () => (donnees ? [...donnees.films, ...donnees.evenements].filter((candidat) => coches.has(candidat.cle)) : []),
    [coches, donnees],
  )

  const {projectId, dataset} = client.config()
  const html = useMemo(
    () =>
      donnees
        ? construirePiqure(
            {envoi: donnees.envoi, titre, mot, choix, reglages: donnees.reglages},
            {projectId: projectId ?? '', dataset: dataset ?? 'production'},
          )
        : '',
    [choix, dataset, donnees, mot, projectId, titre],
  )
  const objet = objetDeLaPiqure(titre, choix)
  const sortie = useSortie(html, objet, `zinema-piqure-${envoi}.html`)

  return (
    <Dialog id="piqure-de-rappel" header="Piqûre de rappel" onClose={onFermer} width={3}>
      <Box padding={4}>
        <Flex gap={5} wrap="wrap" align="flex-start">
          <Box style={{flex: '1 1 20rem', minWidth: 0}}>
            <Stack space={5}>
              <ChampJourDEnvoi envoi={envoi} onChanger={setEnvoi} />

              {erreur && (
                <Card padding={3} radius={2} tone="critical">
                  <Text size={1}>{erreur}</Text>
                </Card>
              )}
              {!donnees && !erreur && (
                <Flex align="center" gap={3} paddingY={4}>
                  <Spinner muted />
                  <Text size={1} muted>
                    Lecture des films et des événements…
                  </Text>
                </Flex>
              )}
              {donnees && (
                <ListeAMettreEnAvant
                  envoi={donnees.envoi}
                  films={donnees.films}
                  evenements={donnees.evenements}
                  coches={coches}
                  onBasculer={basculer}
                />
              )}

              <ChampsDuMessage
                titre={titre}
                titreParDefaut={titreParDefaut(choix) || 'Cochez d’abord un film ou un événement'}
                onTitre={setTitre}
                mot={mot}
                onMot={setMot}
                onCopierObjet={sortie.copierObjet}
                objetVide={!objet}
              />
            </Stack>
          </Box>

          {/* L'aperçu reste en vue pendant qu'on fait défiler la liste. */}
          <Box style={{flex: '2 1 26rem', minWidth: 0, position: 'sticky', top: 0}}>
            <Stack space={4}>
              <BoutonsDeSortie sortie={sortie} desactives={!html} />
              {html ? (
                <ApercuNewsletter page={sortie.page} titre="Aperçu de la piqûre de rappel" hauteur="70vh" />
              ) : (
                <Card padding={5} radius={2} border tone="transparent">
                  <Text size={1} muted align="center">
                    Cochez un film ou un événement : la piqûre de rappel se compose ici.
                  </Text>
                </Card>
              )}
            </Stack>
          </Box>
        </Flex>
      </Box>
    </Dialog>
  )
}
