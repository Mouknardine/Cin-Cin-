/**
 * Onglet « Planification » du Studio.
 *
 * La semaine de cinéma, du mercredi au mardi, affichée comme une
 * grille de créneaux : 19 h et 21 h, Salle 1 et Salle 2. On y déplace
 * une séance à la souris, on clique une case libre pour y poser un
 * film, et trois assistants font le gros du travail — programmer un
 * film sur plusieurs semaines, dupliquer une semaine (au besoin en
 * rebattant les cartes), ou remplir la semaine au hasard.
 */
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {useChangementDeSalle} from '../hooks/useChangementDeSalle'
import {useDeplacementSeances} from '../hooks/useDeplacementSeances'
import {useDonneesPlanning} from '../hooks/useDonneesPlanning'
import {useSemaineAffichee} from '../hooks/useSemaineAffichee'
import {useSoireesAJour} from '../hooks/useSoireesAJour'
import {
  API_VERSION,
  type ActionsPlanning,
  type CreneauDate,
  type SeancePlanning,
} from '../types'
import {idsEnConflit} from '../utils/conflits'
import {couleurDeLaSemaine, couleursDesFilms} from '../utils/couleurs'
import {finDeSemaine} from '../utils/dates'
import {DialogNewsletter} from '../newsletter/DialogNewsletter'
import {supprimerSeance} from '../utils/mutations'
import {BarreSemaine, type DialogOuvert} from './BarreSemaine'
import {CompteurFilms} from './CompteurFilms'
import {DialogDupliquerSemaine} from './DialogDupliquerSemaine'
import {DialogFilmDuCreneau} from './DialogFilmDuCreneau'
import {DialogGenererSemaine} from './DialogGenererSemaine'
import {DialogProgrammerFilm} from './DialogProgrammerFilm'
import {DialogSupprimerSeance} from './DialogSupprimerSeance'
import {GrilleSemaine} from './GrilleSemaine'

/** La case ou la séance dont on est en train de choisir le film. */
type ChoixDeFilm = {creneau: CreneauDate} | {seance: SeancePlanning} | null

export function PlanificationTool(): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  /* La semaine de cinéma va du mercredi au mardi : c'est ce mercredi-là.
     Elle est retenue d'une visite de l'onglet à l'autre. */
  const {debutSemaine, semainePrecedente, semaineSuivante, semaineActuelle} = useSemaineAffichee()
  const [dialogOuvert, setDialogOuvert] = useState<DialogOuvert>(null)
  const [choixDeFilm, setChoixDeFilm] = useState<ChoixDeFilm>(null)
  const [seanceASupprimer, setSeanceASupprimer] = useState<SeancePlanning | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  const finSemaine = useMemo(() => finDeSemaine(debutSemaine), [debutSemaine])
  const {films, seances, chargement, erreur, recharger} = useDonneesPlanning(debutSemaine, finSemaine)
  const conflits = useMemo(() => idsEnConflit(seances), [seances])

  const rafraichir = useSoireesAJour(debutSemaine, finSemaine, recharger)
  const glisser = useDeplacementSeances(rafraichir)
  const changerDeSalle = useChangementDeSalle(seances, rafraichir)
  const couleurDe = useMemo(() => couleursDesFilms(films), [films])
  const fermerDialog = useCallback(() => setDialogOuvert(null), [])
  const fermerChoixDeFilm = useCallback(() => setChoixDeFilm(null), [])

  const actions: ActionsPlanning = useMemo(
    () => ({
      onSupprimer: setSeanceASupprimer,
      onChangerFilm: (seance) => setChoixDeFilm({seance}),
      onChangerDeSalle: (seance) => void changerDeSalle(seance),
      onAjouter: (creneau) => setChoixDeFilm({creneau}),
      couleurDe,
    }),
    [changerDeSalle, couleurDe],
  )

  const confirmerSuppression = useCallback(async () => {
    if (!seanceASupprimer) return
    setSuppressionEnCours(true)
    try {
      await supprimerSeance(client, seanceASupprimer._id)
      toast.push({status: 'success', title: 'Séance supprimée.'})
      setSeanceASupprimer(null)
      rafraichir()
    } catch {
      toast.push({status: 'error', title: 'La suppression a échoué. Réessayez.'})
    } finally {
      setSuppressionEnCours(false)
    }
  }, [client, rafraichir, seanceASupprimer, toast])

  return (
    <Container width={5} padding={4}>
      <Stack space={4}>
        <BarreSemaine
          debutSemaine={debutSemaine}
          nbSeances={seances.length}
          onSemainePrecedente={semainePrecedente}
          onSemaineActuelle={semaineActuelle}
          onSemaineSuivante={semaineSuivante}
          onActualiser={recharger}
          onOuvrir={setDialogOuvert}
        />

        {erreur && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{erreur}</Text>
          </Card>
        )}

        {conflits.size > 0 && (
          <Card padding={3} radius={2} tone="caution">
            <Flex gap={2} align="center">
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
              <Text size={1}>
                {conflits.size} séance{conflits.size > 1 ? 's' : ''} se chevauche
                {conflits.size > 1 ? 'nt' : ''} dans une même salle — elles apparaissent en rouge
                ci-dessous. Déplacez-en une, ou corrigez son heure.
              </Text>
            </Flex>
          </Card>
        )}

        <CompteurFilms films={films} seances={seances} couleurDe={couleurDe} />

        <GrilleSemaine
          debutSemaine={debutSemaine}
          couleurSemaine={couleurDeLaSemaine(debutSemaine)}
          seances={seances}
          conflits={conflits}
          chargement={chargement}
          actions={actions}
          glisser={glisser}
        />

        <Box>
          <Text size={1} muted>
            Attrapez une séance et déposez-la ailleurs : sur une case libre elle déménage, sur une
            case occupée les deux films échangent leurs places. Une case vide se remplit d'un clic.
            Chaque film garde sa salle ; pour le faire changer de salle toute la semaine, menu ⋮
            d'une de ses séances → « Passer ce film en Salle 2 ».
            La séance de 21 h part à 21 h au plus tôt et attend la fin du film de 19 h : derrière
            un film de 2 h 20, elle commence au quart d'heure suivant (21:30), et l'outil la décale
            tout seul quand il le faut. La semaine de cinéma va du mercredi au mardi. Tout ce qui se fait ici est
            publié immédiatement sur le site.
          </Text>
        </Box>
      </Stack>

      {dialogOuvert === 'programmer' && (
        <DialogProgrammerFilm
          films={films}
          debutSemaine={debutSemaine}
          onFermer={fermerDialog}
          onCree={rafraichir}
        />
      )}
      {dialogOuvert === 'dupliquer' && (
        <DialogDupliquerSemaine
          debutSemaine={debutSemaine}
          seancesSemaine={seances}
          onFermer={fermerDialog}
          onCree={rafraichir}
        />
      )}
      {dialogOuvert === 'generer' && (
        <DialogGenererSemaine
          films={films}
          debutSemaine={debutSemaine}
          seancesSemaine={seances}
          onFermer={fermerDialog}
          onCree={rafraichir}
        />
      )}
      {dialogOuvert === 'newsletter' && (
        <DialogNewsletter debutSemaine={debutSemaine} onFermer={fermerDialog} />
      )}
      {choixDeFilm && (
        <DialogFilmDuCreneau
          films={films}
          cible={choixDeFilm}
          onFermer={fermerChoixDeFilm}
          onFait={rafraichir}
        />
      )}
      {seanceASupprimer && (
        <DialogSupprimerSeance
          seance={seanceASupprimer}
          enCours={suppressionEnCours}
          onConfirmer={confirmerSuppression}
          onAnnuler={() => setSeanceASupprimer(null)}
        />
      )}
    </Container>
  )
}
