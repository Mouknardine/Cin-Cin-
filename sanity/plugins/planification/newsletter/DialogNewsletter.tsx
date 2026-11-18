/**
 * « Newsletter de la semaine » : l'aperçu, et les boutons qui la font sortir.
 *
 * Le geste complet tient en trois temps : on ouvre, on regarde, on copie.
 * Ensuite on colle dans son outil d'envoi et on envoie. Il n'y a rien à
 * saisir : tout vient des fiches films et des séances déjà posées dans le
 * Studio.
 */
import {ClipboardIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION} from '../types'
import {formatPeriodeSemaine} from '../utils/dates'
import {ApercuNewsletter} from './ApercuNewsletter'
import {BoutonsDeSortie} from './BoutonsDeSortie'
import {chargerNewsletter} from './donnees'
import {construireNewsletter, objetDeLaNewsletter} from './gabarit'
import type {DonneesNewsletter} from './types'
import {useSortie} from './useSortie'

interface Props {
  /** Le mercredi qui ouvre la semaine à publier. */
  debutSemaine: string
  onFermer: () => void
}

export function DialogNewsletter({debutSemaine, onFermer}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})

  const [donnees, setDonnees] = useState<DonneesNewsletter | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let annule = false
    setDonnees(null)
    setErreur(null)
    chargerNewsletter(client, debutSemaine)
      .then((resultat) => {
        if (!annule) setDonnees(resultat)
      })
      .catch(() => {
        if (!annule) {
          setErreur('Impossible de lire le programme. Vérifiez la connexion, puis réessayez.')
        }
      })
    return () => {
      annule = true
    }
  }, [client, debutSemaine])

  const {projectId, dataset} = client.config()

  const html = useMemo(() => {
    if (!donnees) return ''
    return construireNewsletter(donnees, {
      projectId: projectId ?? '',
      dataset: dataset ?? 'production',
    })
  }, [dataset, donnees, projectId])

  const objet = donnees ? objetDeLaNewsletter(donnees) : ''
  const sortie = useSortie(html, objet, `zinema-${debutSemaine}.html`)

  return (
    <Dialog
      id="newsletter-semaine"
      header={`Newsletter — ${formatPeriodeSemaine(debutSemaine).toLowerCase()}`}
      onClose={onFermer}
      width={3}
    >
      <Box padding={4}>
        <Stack space={4}>
          {erreur && (
            <Card padding={3} radius={2} tone="critical">
              <Text size={1}>{erreur}</Text>
            </Card>
          )}

          {!donnees && !erreur && (
            <Flex align="center" justify="center" gap={3} padding={5}>
              <Spinner muted />
              <Text size={1} muted>
                Lecture du programme…
              </Text>
            </Flex>
          )}

          {donnees && (
            <>
              <Card padding={3} radius={2} tone="transparent" border>
                <Stack space={3}>
                  <Text size={1} weight="semibold">
                    Objet du message
                  </Text>
                  <Flex gap={2} align="center" wrap="wrap">
                    <Box flex={1} style={{minWidth: '16rem'}}>
                      <Text size={1} muted>
                        {objet}
                      </Text>
                    </Box>
                    <Button mode="ghost" fontSize={1} icon={ClipboardIcon} text="Copier l'objet" onClick={sortie.copierObjet} />
                  </Flex>
                </Stack>
              </Card>

              <BoutonsDeSortie sortie={sortie}>
                Tout ce que vous voyez ici vient du Studio — rien n’est à saisir à la main.
              </BoutonsDeSortie>

              <ApercuNewsletter page={sortie.page} titre="Aperçu de la newsletter" />

              <Text size={1} muted>
                {donnees.filmsDeLaSemaine.length} film
                {donnees.filmsDeLaSemaine.length > 1 ? 's' : ''} à l'affiche ·{' '}
                {donnees.programme.length} séance{donnees.programme.length > 1 ? 's' : ''} ·{' '}
                {donnees.filmsAVenir.length} prochainement
              </Text>
            </>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
