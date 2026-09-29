/**
 * « Imprimer le programme » : l'aperçu de la feuille A4, et le bouton qui
 * l'envoie à l'imprimante.
 *
 * Rien à saisir : la feuille relit les mêmes séances que la newsletter, dans
 * le même ordre, sans les séances annulées. Pour un fichier PDF, on choisit
 * « Enregistrer au format PDF » dans la fenêtre d'impression.
 */
import {DocumentTextIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Spinner, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient} from 'sanity'

import logoZinema from '../../../../assets/img/zinema-logo.png'
import {chargerNewsletter, type DonneesNewsletter} from '../newsletter/donnees'
import {API_VERSION} from '../types'
import {formatPeriodeSemaine} from '../utils/dates'
import {construireFeuille, tientSurUnePage} from './feuille'

interface Props {
  /** Le mercredi qui ouvre la semaine à imprimer. */
  debutSemaine: string
  onFermer: () => void
}

/** L'adresse complète du logo : la feuille vit dans son propre cadre, elle ne connaît pas le Studio. */
function adresseDuLogo(): string {
  return new URL(logoZinema, window.location.href).href
}

export function DialogImpression({debutSemaine, onFermer}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const cadre = useRef<HTMLIFrameElement>(null)

  const [donnees, setDonnees] = useState<DonneesNewsletter | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  /* On n'imprime qu'une fois la feuille dessinée, logo compris : sinon
     l'imprimante partirait avec un trou à la place du logo. */
  const [prete, setPrete] = useState(false)

  useEffect(() => {
    let annule = false
    setDonnees(null)
    setErreur(null)
    setPrete(false)
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

  const feuille = useMemo(() => (donnees ? construireFeuille(donnees, adresseDuLogo()) : ''), [donnees])
  const tientSurUneFeuille = donnees ? tientSurUnePage(donnees.programme) : true

  const imprimer = useCallback(() => {
    const fenetre = cadre.current?.contentWindow
    if (!fenetre) {
      toast.push({status: 'error', title: "L'impression n'a pas pu démarrer. Réessayez."})
      return
    }
    fenetre.focus()
    fenetre.print()
  }, [toast])

  return (
    <Dialog
      id="impression-programme"
      header={`Programme à imprimer — ${formatPeriodeSemaine(debutSemaine).toLowerCase()}`}
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
              <Flex gap={3} align="center" wrap="wrap">
                <Button
                  icon={DocumentTextIcon}
                  text={prete ? 'Imprimer' : 'Préparation…'}
                  tone="primary"
                  disabled={!prete}
                  onClick={imprimer}
                />
                <Text size={1} muted>
                  Une page A4. Pour un fichier, choisissez « Enregistrer au format PDF » comme
                  imprimante.
                </Text>
              </Flex>

              {!tientSurUneFeuille && (
                <Card padding={3} radius={2} tone="caution">
                  <Text size={1}>
                    Cette semaine compte trop de séances pour une seule page : les dernières lignes
                    seront coupées. Vérifiez l'aperçu avant d'imprimer.
                  </Text>
                </Card>
              )}

              <Card radius={2} shadow={1} style={{overflow: 'hidden'}}>
                <iframe
                  ref={cadre}
                  title="Aperçu de la feuille à imprimer"
                  srcDoc={feuille}
                  onLoad={() => setPrete(true)}
                  style={{display: 'block', width: '100%', height: '70vh', border: 0, background: '#d9d9d9'}}
                />
              </Card>

              <Text size={1} muted>
                {donnees.programme.length} séance{donnees.programme.length > 1 ? 's' : ''} ·
                les séances annulées n'apparaissent pas.
              </Text>
            </>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
