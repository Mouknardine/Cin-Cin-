/**
 * Onglet « Planification » du Studio : vue de la semaine, navigation,
 * assistants de programmation et de duplication, suppression de séances.
 */
import {AddIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, SyncIcon} from '@sanity/icons'
import {Box, Button, Card, Container, Dialog, Flex, Select, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {useCinemas} from '../hooks/useCinemas'
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

  /* On programme un cinéma à la fois : mélanger deux villes dans la
     même grille rendrait l'alerte de conflit fausse, et la semaine
     illisible. */
  const {cinemas, chargement: chargementCinemas, erreur: erreurCinemas} = useCinemas()
  const [cinemaId, setCinemaId] = useState<string>('')
  useEffect(() => {
    /* Le premier cinéma est choisi tout seul : là où il n'y en a qu'un,
       l'outil se comporte exactement comme avant. */
    setCinemaId((actuel) =>
      actuel && cinemas.some((c) => c._id === actuel) ? actuel : (cinemas[0]?._id ?? ''),
    )
  }, [cinemas])
  const cinema = useMemo(
    () => cinemas.find((c) => c._id === cinemaId) ?? null,
    [cinemaId, cinemas],
  )

  const finSemaine = useMemo(() => finDeSemaine(debutSemaine), [debutSemaine])
  const {films, seances, chargement, erreur, recharger} = useDonneesPlanning(
    cinema,
    debutSemaine,
    finSemaine,
  )

  /* Sans salle, il n'y a nulle part où poser une séance : les deux
     assistants restent fermés et on dit pourquoi. */
  const cinemaPret = Boolean(cinema && cinema.salles.length > 0)

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
          <Stack space={3}>
            <Text size={3} weight="bold">
              Planification des séances
            </Text>
            {cinemas.length > 1 && (
              <Box style={{maxWidth: 280}}>
                <Select
                  value={cinemaId}
                  onChange={(e) => setCinemaId(e.currentTarget.value)}
                  aria-label="Cinéma à programmer"
                >
                  {cinemas.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nom}
                    </option>
                  ))}
                </Select>
              </Box>
            )}
            <Text size={1} muted>
              {[
                cinemas.length === 1 ? cinema?.nom : null,
                formatPeriodeSemaine(debutSemaine),
                `${seances.length} séance${seances.length > 1 ? 's' : ''}`,
              ]
                .filter(Boolean)
                .join(' · ')}
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
              disabled={!cinemaPret}
              onClick={() => setDialogOuvert('dupliquer')}
            />
            <Button
              icon={AddIcon}
              text="Programmer un film"
              tone="primary"
              disabled={!cinemaPret}
              onClick={() => setDialogOuvert('programmer')}
            />
          </Flex>
        </Flex>

        {(erreur || erreurCinemas) && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{erreur ?? erreurCinemas}</Text>
          </Card>
        )}

        {!chargementCinemas && cinemas.length === 0 && (
          <Card padding={3} radius={2} tone="caution" border>
            <Text size={1}>
              Aucun cinéma n'est encore enregistré. Créez-en un dans « Cinémas » : une séance a
              besoin de savoir où elle a lieu, et dans quelle salle.
            </Text>
          </Card>
        )}

        {cinema && cinema.salles.length === 0 && (
          <Card padding={3} radius={2} tone="caution" border>
            <Text size={1}>
              {cinema.nom} n'a encore aucune salle. Ajoutez-les dans sa fiche, sous « Tarifs &
              salles », puis revenez ici.
            </Text>
          </Card>
        )}

        <GrilleSemaine
          debutSemaine={debutSemaine}
          seances={seances}
          chargement={chargement || chargementCinemas}
          onSupprimer={setSeanceASupprimer}
        />

        <Text size={1} muted>
          La semaine de cinéma va du mercredi au mardi. Une salle est occupée de l'heure de début
          jusqu'à la minute exacte de fin du film : deux séances peuvent donc s'enchaîner sans
          battement, et seul un vrai chevauchement s'affiche en rouge. Tout ce qui est créé ici est
          publié immédiatement sur le site.
        </Text>
      </Stack>

      {dialogOuvert === 'programmer' && cinema && (
        <DialogProgrammerFilm
          cinema={cinema}
          films={films}
          debutSemaine={debutSemaine}
          onFermer={fermerDialog}
          onCree={recharger}
        />
      )}
      {dialogOuvert === 'dupliquer' && cinema && (
        <DialogDupliquerSemaine
          cinema={cinema}
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
