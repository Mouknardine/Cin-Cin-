/**
 * « Newsletter de la semaine » : l'aperçu, et le bouton qui la copie.
 *
 * Le geste complet tient en trois temps : on ouvre, on regarde, on copie.
 * Ensuite on colle dans son logiciel de messagerie et on envoie. Il n'y a
 * rien à saisir : tout vient des fiches films et des séances déjà posées
 * dans le Studio.
 */
import {ClipboardIcon, DownloadIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Spinner, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION} from '../types'
import {formatPeriodeSemaine} from '../utils/dates'
import {chargerNewsletter, type DonneesNewsletter} from './donnees'
import {construireNewsletter, objetDeLaNewsletter} from './gabarit'

interface Props {
  /** Le mercredi qui ouvre la semaine à publier. */
  debutSemaine: string
  onFermer: () => void
}

/**
 * Une version texte, pour les messageries qui refusent le HTML — et pour
 * que le presse-papier ne soit jamais vide si le collage riche échoue.
 */
function enTexteBrut(html: string): string {
  return html
    .replace(/<\/(tr|div|p|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Copie en conservant la mise en forme.
 *
 * On passe par l'API presse-papier quand elle existe : c'est la seule qui
 * sache déposer du HTML ET du texte, et laisser la messagerie choisir. Sinon
 * on retombe sur la vieille méthode — un bloc invisible qu'on sélectionne et
 * qu'on copie —, qui garde elle aussi la mise en forme.
 */
async function copierEnRiche(html: string): Promise<void> {
  const texte = enTexteBrut(html)

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], {type: 'text/html'}),
        'text/plain': new Blob([texte], {type: 'text/plain'}),
      }),
    ])
    return
  }

  const support = document.createElement('div')
  support.innerHTML = html
  /* Hors de l'écran mais dans la page : une sélection ne porte que sur ce
     qui est rendu. `position:fixed` évite de faire sauter le défilement. */
  support.setAttribute(
    'style',
    'position:fixed;left:-99999px;top:0;white-space:normal;',
  )
  document.body.appendChild(support)
  try {
    const selection = window.getSelection()
    const plage = document.createRange()
    plage.selectNodeContents(support)
    selection?.removeAllRanges()
    selection?.addRange(plage)
    const copie = document.execCommand('copy')
    selection?.removeAllRanges()
    if (!copie) throw new Error('copie refusée')
  } finally {
    support.remove()
  }
}

export function DialogNewsletter({debutSemaine, onFermer}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const [donnees, setDonnees] = useState<DonneesNewsletter | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const lienTelechargement = useRef<string | null>(null)

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

  /* L'aperçu vit dans un cadre isolé : les styles de l'e-mail ne doivent pas
     déteindre sur le Studio, ni le Studio sur l'e-mail. On voit donc
     exactement ce que l'abonné recevra. */
  const apercu = useMemo(
    () =>
      html
        ? `<!doctype html><meta charset="utf-8">` +
          `<body style="margin:0;padding:16px;background:#100f0c;">` +
          `<div style="margin:0 auto;max-width:600px;">${html}</div></body>`
        : '',
    [html],
  )

  const copier = useCallback(async () => {
    try {
      await copierEnRiche(html)
      toast.push({
        status: 'success',
        title: 'Newsletter copiée.',
        description: 'Collez-la dans votre message, la mise en page suit.',
      })
    } catch {
      toast.push({
        status: 'error',
        title: 'La copie a échoué.',
        description: 'Utilisez « Télécharger », puis ouvrez le fichier et copiez-le.',
      })
    }
  }, [html, toast])

  const copierObjet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(objet)
      toast.push({status: 'success', title: "Objet copié."})
    } catch {
      toast.push({status: 'error', title: "La copie de l'objet a échoué."})
    }
  }, [objet, toast])

  const telecharger = useCallback(() => {
    const fichier = new Blob(
      [`<!doctype html><meta charset="utf-8"><title>${objet}</title>${html}`],
      {type: 'text/html;charset=utf-8'},
    )
    if (lienTelechargement.current) URL.revokeObjectURL(lienTelechargement.current)
    lienTelechargement.current = URL.createObjectURL(fichier)
    const lien = document.createElement('a')
    lien.href = lienTelechargement.current
    lien.download = `zinema-${debutSemaine}.html`
    lien.click()
  }, [debutSemaine, html, objet])

  useEffect(
    () => () => {
      if (lienTelechargement.current) URL.revokeObjectURL(lienTelechargement.current)
    },
    [],
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
                    <Button
                      mode="ghost"
                      fontSize={1}
                      icon={ClipboardIcon}
                      text="Copier l'objet"
                      onClick={copierObjet}
                    />
                  </Flex>
                </Stack>
              </Card>

              <Flex gap={2} wrap="wrap">
                <Button
                  icon={ClipboardIcon}
                  text="Copier la newsletter"
                  tone="primary"
                  onClick={copier}
                />
                <Button
                  icon={DownloadIcon}
                  mode="ghost"
                  text="Télécharger"
                  onClick={telecharger}
                />
              </Flex>

              <Text size={1} muted>
                Cliquez sur « Copier la newsletter », puis collez dans votre message
                (Cmd+V ou Ctrl+V) : la mise en page et les affiches suivent. Tout ce que
                vous voyez ici vient du Studio — le programme de la semaine, les fiches
                films, les tarifs. Rien n'est à saisir à la main.
              </Text>

              <Card radius={2} shadow={1} style={{overflow: 'hidden'}}>
                <iframe
                  title="Aperçu de la newsletter"
                  srcDoc={apercu}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '62vh',
                    border: 0,
                    background: '#100f0c',
                  }}
                />
              </Card>

              <Text size={1} muted>
                {donnees.filmsDeLaSemaine.length} film
                {donnees.filmsDeLaSemaine.length > 1 ? 's' : ''} à l'affiche ·{' '}
                {donnees.programme.length} séance{donnees.programme.length > 1 ? 's' : ''} ·{' '}
                {donnees.filmsAVenir.length} à venir
              </Text>
            </>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
