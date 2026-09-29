/**
 * « Vider la semaine » : supprimer toutes ses séances d'un coup.
 *
 * La fenêtre fait d'abord l'inventaire, pour que la personne sache ce
 * qu'elle efface avant de cliquer. Les séances qui ont des billets
 * vendus restent. Et le geste s'annule, comme tous les autres, avec
 * « Annuler » dans la barre.
 */
import {TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Spinner, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {useHistorique} from '../hooks/useHistorique'
import {API_VERSION} from '../types'
import {finDeSemaine, formatPeriodeSemaine} from '../utils/dates'
import {type InventaireSemaine, inventorier, supprimerSeances} from '../utils/vider'

interface Props {
  debutSemaine: string
  onFermer: () => void
  onFait: () => void
}

function pluriel(nombre: number, mot: string): string {
  return `${nombre} ${mot}${nombre > 1 ? 's' : ''}`
}

export function DialogViderSemaine({debutSemaine, onFermer, onFait}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const historique = useHistorique()
  const [inventaire, setInventaire] = useState<InventaireSemaine | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const periode = useMemo(
    () => ({debut: debutSemaine, fin: finDeSemaine(debutSemaine)}),
    [debutSemaine],
  )

  useEffect(() => {
    let annule = false
    inventorier(client, periode)
      .then((resultat) => {
        if (!annule) setInventaire(resultat)
      })
      .catch(() => {
        if (!annule) setErreur('Impossible de lire la semaine. Vérifiez la connexion, puis réessayez.')
      })
    return () => {
      annule = true
    }
  }, [client, periode])

  const vider = useCallback(async () => {
    if (!inventaire || inventaire.aSupprimer.length === 0) return
    setEnCours(true)
    try {
      await historique.avantDeModifier('vider la semaine', periode)
      await supprimerSeances(client, inventaire.aSupprimer)
      toast.push({
        status: 'success',
        title: `${pluriel(inventaire.aSupprimer.length, 'séance')} supprimée${inventaire.aSupprimer.length > 1 ? 's' : ''}.`,
        description: 'En cas d’erreur, cliquez « Annuler » dans la barre du haut.',
      })
      onFait()
      onFermer()
    } catch {
      toast.push({status: 'error', title: 'La suppression a échoué. Rien n’a été effacé.'})
    } finally {
      setEnCours(false)
    }
  }, [client, historique, inventaire, onFait, onFermer, periode, toast])

  const aSupprimer = inventaire?.aSupprimer.length ?? 0
  const avecBillets = inventaire?.avecBillets.length ?? 0

  return (
    <Dialog id="vider-semaine" header="Vider la semaine" onClose={onFermer} width={1}>
      <Box padding={4}>
        <Stack space={4}>
          {erreur && (
            <Card padding={3} radius={2} tone="critical">
              <Text size={1}>{erreur}</Text>
            </Card>
          )}
          {!inventaire && !erreur && (
            <Flex align="center" justify="center" gap={3} padding={4}>
              <Spinner muted />
              <Text size={1} muted>
                Lecture de la semaine…
              </Text>
            </Flex>
          )}
          {inventaire && (
            <>
              <Text size={1}>
                {formatPeriodeSemaine(debutSemaine)} :{' '}
                {aSupprimer > 0 ? (
                  <strong>{pluriel(aSupprimer, 'séance')} ser{aSupprimer > 1 ? 'ont' : 'a'} supprimée{aSupprimer > 1 ? 's' : ''}</strong>
                ) : (
                  'aucune séance à supprimer'
                )}
                , séances particulières comprises. Elles disparaissent aussi du site.
              </Text>
              {avecBillets > 0 && (
                <Card padding={3} radius={2} tone="caution">
                  <Text size={1}>
                    {pluriel(avecBillets, 'séance')} {avecBillets > 1 ? 'restent' : 'reste'} : des billets y
                    sont déjà vendus. Pour {avecBillets > 1 ? 'les' : 'la'} retirer, annulez d’abord les
                    commandes.
                  </Text>
                </Card>
              )}
              <Text size={1} muted>
                En cas d’erreur, « Annuler » dans la barre du haut remet la semaine comme avant.
              </Text>
              <Flex gap={2} justify="flex-end">
                <Button text="Garder la semaine" mode="ghost" onClick={onFermer} disabled={enCours} />
                <Button
                  icon={TrashIcon}
                  text={enCours ? 'Suppression…' : `Supprimer ${pluriel(aSupprimer, 'séance')}`}
                  tone="critical"
                  onClick={vider}
                  disabled={enCours || aSupprimer === 0}
                />
              </Flex>
            </>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
