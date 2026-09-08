/**
 * Onglet « Planification » du Studio : vue de la semaine, navigation,
 * assistants de programmation et de duplication, suppression de séances.
 */
import {AddIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, SyncIcon} from '@sanity/icons'
import {Box, Button, Card, Container, Dialog, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {useDonneesPlanning} from '../hooks/useDonneesPlanning'
import {API_VERSION, type SeancePlanning} from '../types'
import {
  ajouterJours,
  aujourdHui,
  debutDeSemaine,
  finDeSemaine,
  formatJourCourt,
  formatPeriodeSemaine,
} from '../utils/dates'
import {supprimerSeance} from '../utils/mutations'
import {DialogDupliquerSemaine} from './DialogDupliquerSemaine'
import {DialogProgrammerFilm} from './DialogProgrammerFilm'
import {GrilleSemaine} from './GrilleSemaine'

type DialogOuvert = 'programmer' | 'dupliquer' | null

export function PlanificationTool(): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  /* La semaine de cinéma va du mercredi au mardi : c'est ce mercredi-là. */
  const [debutSemaine, setDebutSemaine] = useState(() => debutDeSemaine(aujourdHui()))
  const [dialogOuvert, setDialogOuvert] = useState<DialogOuvert>(null)
  const [seanceASupprimer, setSeanceASupprimer] = useState<SeancePlanning | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  const finSemaine = useMemo(() => finDeSemaine(debutSemaine), [debutSemaine])
  const {films, seances, chargement, erreur, recharger} = useDonneesPlanning(debutSemaine, finSemaine)

  const semainePrecedente = useCallback(
    () => setDebutSemaine((jour: string) => ajouterJours(jour, -7)),
    [],
  )
  const semaineSuivante = useCallback(
    () => setDebutSemaine((jour: string) => ajouterJours(jour, 7)),
    [],
  )
  const semaineActuelle = useCallback(() => setDebutSemaine(debutDeSemaine(aujourdHui())), [])
  const fermerDialog = useCallback(() => setDialogOuvert(null), [])

  const confirmerSuppression = useCallback(async () => {
    if (!seanceASupprimer) return
    setSuppressionEnCours(true)
    try {
      await supprimerSeance(client, seanceASupprimer._id)
      toast.push({status: 'success', title: 'Séance supprimée.'})
      setSeanceASupprimer(null)
      recharger()
    } catch {
      toast.push({status: 'error', title: 'La suppression a échoué. Réessayez.'})
    } finally {
      setSuppressionEnCours(false)
    }
  }, [client, recharger, seanceASupprimer, toast])

  return (
    <Container width={5} padding={4}>
      <Stack space={4}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack space={2}>
            <Text size={3} weight="bold">
              Planification des séances
            </Text>
            <Text size={1} muted>
              {formatPeriodeSemaine(debutSemaine)} · {seances.length} séance{seances.length > 1 ? 's' : ''}
            </Text>
          </Stack>
          <Flex gap={2} wrap="wrap">
            <Button icon={ChevronLeftIcon} mode="ghost" onClick={semainePrecedente} aria-label="Semaine précédente" />
            <Button text="Aujourd'hui" mode="ghost" onClick={semaineActuelle} />
            <Button icon={ChevronRightIcon} mode="ghost" onClick={semaineSuivante} aria-label="Semaine suivante" />
            <Button icon={SyncIcon} mode="ghost" onClick={recharger} aria-label="Actualiser" />
            <Button
              icon={CopyIcon}
              text="Dupliquer la semaine"
              mode="ghost"
              onClick={() => setDialogOuvert('dupliquer')}
            />
            <Button
              icon={AddIcon}
              text="Programmer un film"
              tone="primary"
              onClick={() => setDialogOuvert('programmer')}
            />
          </Flex>
        </Flex>

        {erreur && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{erreur}</Text>
          </Card>
        )}

        <GrilleSemaine
          debutSemaine={debutSemaine}
          seances={seances}
          chargement={chargement}
          onSupprimer={setSeanceASupprimer}
        />

        <Text size={1} muted>
          La semaine de cinéma va du mercredi au mardi. Une salle est occupée de l'heure de début
          jusqu'à la minute exacte de fin du film : deux séances peuvent donc s'enchaîner sans
          battement, et seul un vrai chevauchement s'affiche en rouge. Tout ce qui est créé ici est
          publié immédiatement sur le site.
        </Text>
      </Stack>

      {dialogOuvert === 'programmer' && (
        <DialogProgrammerFilm
          films={films}
          debutSemaine={debutSemaine}
          onFermer={fermerDialog}
          onCree={recharger}
        />
      )}
      {dialogOuvert === 'dupliquer' && (
        <DialogDupliquerSemaine
          debutSemaine={debutSemaine}
          seancesSemaine={seances}
          onFermer={fermerDialog}
          onCree={recharger}
        />
      )}
      {seanceASupprimer && (
        <Dialog
          id="confirmer-suppression"
          header="Supprimer la séance ?"
          onClose={() => setSeanceASupprimer(null)}
          width={0}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1}>
                « {seanceASupprimer.filmTitre} » le {formatJourCourt(seanceASupprimer.date)} à{' '}
                {seanceASupprimer.heure} ({seanceASupprimer.salle}) sera retirée du site.
              </Text>
              <Flex gap={2} justify="flex-end">
                <Button text="Annuler" mode="ghost" onClick={() => setSeanceASupprimer(null)} />
                <Button
                  text={suppressionEnCours ? 'Suppression…' : 'Supprimer'}
                  tone="critical"
                  disabled={suppressionEnCours}
                  onClick={confirmerSuppression}
                />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Container>
  )
}
