/**
 * « Newsletter de la semaine » : l'aperçu, et les boutons qui la font sortir.
 *
 * Le geste complet tient en trois temps : on ouvre, on regarde, on copie.
 * Ensuite on colle dans son outil d'envoi et on envoie. Il n'y a rien à
 * saisir : tout vient des fiches films et des séances déjà posées dans le
 * Studio.
 */
import {ClipboardIcon, CodeIcon, DownloadIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Spinner, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION} from '../types'
import {formatPeriodeSemaine} from '../utils/dates'
import {chargerNewsletter, type DonneesNewsletter} from './donnees'
import {construireNewsletter, objetDeLaNewsletter} from './gabarit'
import {copierEnRiche, copierTexte, documentComplet, telechargerHtml} from './presse-papier'

interface Props {
  /** Le mercredi qui ouvre la semaine à publier. */
  debutSemaine: string
  onFermer: () => void
}

export function DialogNewsletter({debutSemaine, onFermer}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

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
  /* La page complète sert trois fois : l'aperçu, le code HTML, le fichier.
     On voit donc exactement ce que l'abonné recevra. */
  const pageComplete = useMemo(() => (html ? documentComplet(objet, html) : ''), [html, objet])

  const signaler = useCallback(
    async (geste: () => Promise<void>, reussite: string, echec: string, detail?: string) => {
      try {
        await geste()
        toast.push({status: 'success', title: reussite, description: detail})
      } catch {
        toast.push({status: 'error', title: echec})
      }
    },
    [toast],
  )

  const copier = useCallback(
    () =>
      signaler(
        () => copierEnRiche(html),
        'Newsletter copiée.',
        'La copie a échoué. Utilisez « Télécharger », puis ouvrez le fichier et copiez-le.',
        'Collez-la dans votre message, la mise en page suit.',
      ),
    [html, signaler],
  )
  const copierCode = useCallback(
    () =>
      signaler(
        () => copierTexte(pageComplete),
        'Code HTML copié.',
        'La copie du code a échoué. Utilisez « Télécharger ».',
        'Collez-le dans le bloc « HTML » de votre outil d’envoi.',
      ),
    [pageComplete, signaler],
  )
  const copierObjet = useCallback(
    () => signaler(() => copierTexte(objet), 'Objet copié.', "La copie de l'objet a échoué."),
    [objet, signaler],
  )
  const telecharger = useCallback(
    () => telechargerHtml(`zinema-${debutSemaine}.html`, pageComplete),
    [debutSemaine, pageComplete],
  )

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
                    <Button mode="ghost" fontSize={1} icon={ClipboardIcon} text="Copier l'objet" onClick={copierObjet} />
                  </Flex>
                </Stack>
              </Card>

              <Flex gap={2} wrap="wrap">
                <Button icon={ClipboardIcon} text="Copier la newsletter" tone="primary" onClick={copier} />
                <Button icon={CodeIcon} mode="ghost" text="Copier le code HTML" onClick={copierCode} />
                <Button icon={DownloadIcon} mode="ghost" text="Télécharger" onClick={telecharger} />
              </Flex>

              <Text size={1} muted>
                Cliquez sur « Copier la newsletter », puis collez dans votre message (Cmd+V ou
                Ctrl+V) : la mise en page et les affiches suivent. Si votre outil d’envoi propose un
                bloc « HTML » ou « code », préférez « Copier le code HTML » : c’est la version la plus
                fidèle. Tout ce que vous voyez ici vient du Studio — rien n’est à saisir à la main.
              </Text>

              <Card radius={2} shadow={1} style={{overflow: 'hidden'}}>
                <iframe
                  title="Aperçu de la newsletter"
                  srcDoc={pageComplete}
                  style={{display: 'block', width: '100%', height: '62vh', border: 0, background: '#ffffff'}}
                />
              </Card>

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
