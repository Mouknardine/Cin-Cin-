/**
 * Assistant « Programmer un film » : on choisit un cinéma, un film, ses
 * créneaux hebdomadaires et la période — toutes les séances sont créées
 * d'un coup, sans les conflits de salle.
 *
 * Le cinéma est parfois déjà connu : ouvert depuis l'onglet
 * Planification, il programme le cinéma affiché. Ouvert depuis la fiche
 * d'un film, il ne l'est pas, et l'assistant le demande — c'est la seule
 * chose qu'un film ne peut pas savoir de lui-même, puisqu'il passe
 * potentiellement dans plusieurs cinémas.
 */
import {AddIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Select, Stack, Text, TextInput, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {useCinemas} from '../hooks/useCinemas'
import {
  API_VERSION,
  type CinemaPlanning,
  type Creneau,
  type FilmPlanning,
  type RapportCreation,
  type SeanceCandidate,
} from '../types'
import {verifierNouvellesSeances} from '../utils/conflits'
import {ajouterJours, debutDeSemaine} from '../utils/dates'
import {chargerSeancesPeriode, creerSeances} from '../utils/mutations'
import {LigneCreneau} from './LigneCreneau'
import {RapportResultat} from './RapportResultat'

interface Props {
  /**
   * Le cinéma à programmer, quand l'appelant le connaît. Sans lui,
   * l'assistant propose la liste des cinémas.
   */
  cinema?: CinemaPlanning
  films: FilmPlanning[]
  /** Le mercredi qui ouvre la semaine affichée : date de départ proposée. */
  debutSemaine: string
  onFermer: () => void
  onCree: () => void
  /**
   * Quand l'assistant est ouvert depuis la fiche d'un film, le film est
   * déjà connu : on masque la liste déroulante et on programme celui-là.
   */
  filmImpose?: FilmPlanning
}

/* Mercredi : le premier jour de la semaine de cinéma, donc le décalage 0.
   La salle reste vide jusqu'à ce qu'un cinéma soit connu : ce sont ses
   salles, et elles ne sont plus les mêmes partout. */
const CRENEAU_INITIAL: Creneau = {jour: 0, heure: '19:00', salle: ''}

function genererCandidates(
  cinema: CinemaPlanning,
  film: FilmPlanning,
  creneaux: Creneau[],
  dateDebut: string,
  nbSemaines: number,
): SeanceCandidate[] {
  const premierMercredi = debutDeSemaine(dateDebut)
  const candidates: SeanceCandidate[] = []
  for (let semaine = 0; semaine < nbSemaines; semaine += 1) {
    for (const creneau of creneaux) {
      const date = ajouterJours(premierMercredi, semaine * 7 + creneau.jour)
      if (date < dateDebut) continue
      candidates.push({
        cinemaId: cinema._id,
        filmId: film._id,
        titre: film.titre,
        duree: film.duree,
        date,
        heure: creneau.heure,
        salle: creneau.salle,
      })
    }
  }
  return candidates
}

export function DialogProgrammerFilm({
  cinema: cinemaImpose,
  films,
  debutSemaine,
  onFermer,
  onCree,
  filmImpose,
}: Props): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  /* La liste des cinémas n'est chargée que si l'appelant ne sait pas
     lequel programmer. */
  const {cinemas, chargement: chargementCinemas} = useCinemas(!cinemaImpose)
  const [cinemaId, setCinemaId] = useState(cinemaImpose?._id ?? '')
  useEffect(() => {
    if (cinemaImpose) return
    setCinemaId((actuel) =>
      actuel && cinemas.some((c) => c._id === actuel) ? actuel : (cinemas[0]?._id ?? ''),
    )
  }, [cinemaImpose, cinemas])

  const cinema = useMemo(
    () => cinemaImpose ?? cinemas.find((c) => c._id === cinemaId) ?? null,
    [cinemaImpose, cinemaId, cinemas],
  )
  const salles = cinema?.salles ?? []

  const [filmId, setFilmId] = useState(filmImpose?._id ?? '')
  const [creneaux, setCreneaux] = useState<Creneau[]>([CRENEAU_INITIAL])
  const [dateDebut, setDateDebut] = useState(debutSemaine)
  /* Une semaine par défaut : c'est l'unité de la programmation, et
     l'erreur d'un film posé une semaine de trop se rattrape moins
     vite que l'oubli d'une semaine qu'on ajoute. */
  const [nbSemaines, setNbSemaines] = useState(1)
  const [enCours, setEnCours] = useState(false)
  const [rapport, setRapport] = useState<RapportCreation | null>(null)

  /* Changer de cinéma change les salles : un créneau qui pointait vers
     une salle de l'autre cinéma est ramené sur la première de celui-ci,
     plutôt que de rester sur un nom que la caisse ne saurait pas
     compter. */
  useEffect(() => {
    if (salles.length === 0) return
    setCreneaux((liste) =>
      liste.map((creneau) =>
        salles.includes(creneau.salle) ? creneau : {...creneau, salle: salles[0]},
      ),
    )
    /* `salles` est un tableau reconstruit à chaque rendu : c'est le
       cinéma qui compte, et lui seul. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinema])

  const film = useMemo(
    () => filmImpose ?? films.find((f) => f._id === filmId),
    [filmImpose, films, filmId],
  )
  const formulaireValide = Boolean(
    cinema && film && dateDebut && creneaux.every((c) => c.heure && c.salle),
  )

  const modifierCreneau = useCallback((index: number, creneau: Creneau) => {
    setCreneaux((liste) => liste.map((c, i) => (i === index ? creneau : c)))
  }, [])
  const supprimerCreneau = useCallback((index: number) => {
    setCreneaux((liste) => liste.filter((_, i) => i !== index))
  }, [])
  const ajouterCreneau = useCallback(() => {
    setCreneaux((liste) => {
      const modele = {...CRENEAU_INITIAL, salle: salles[0] ?? ''}
      const dernierJour = liste[liste.length - 1]?.jour ?? modele.jour
      return [...liste, {...modele, jour: Math.min(dernierJour + 1, 6)}]
    })
  }, [salles])

  const creer = useCallback(async () => {
    if (!cinema || !film) return
    setEnCours(true)
    try {
      const candidates = genererCandidates(cinema, film, creneaux, dateDebut, nbSemaines)
      const dates = candidates.map((c) => c.date)
      const existantes = await chargerSeancesPeriode(
        client,
        cinema,
        dates.reduce((min, d) => (d < min ? d : min), dates[0]),
        dates.reduce((max, d) => (d > max ? d : max), dates[0]),
      )
      const {aCreer, doublons, conflits} = verifierNouvellesSeances(candidates, existantes)
      await creerSeances(client, aCreer)
      setRapport({creees: aCreer.length, doublons, conflits})
      if (aCreer.length > 0) onCree()
    } catch {
      toast.push({status: 'error', title: 'La création a échoué. Réessayez.'})
    } finally {
      setEnCours(false)
    }
  }, [cinema, client, creneaux, dateDebut, film, nbSemaines, onCree, toast])

  const totalPrevu = creneaux.length * nbSemaines
  const titreDialogue = filmImpose
    ? `Programmer « ${filmImpose.titre} »`
    : 'Programmer un film'

  /* Rien à programmer tant qu'il n'y a pas un cinéma avec au moins une
     salle : on le dit, plutôt que d'afficher un formulaire qui ne peut
     rien produire. */
  const obstacle = chargementCinemas
    ? 'Chargement des cinémas…'
    : !cinema
      ? "Aucun cinéma n'est encore enregistré. Créez-en un dans « Cinémas » : une séance a besoin de savoir où elle a lieu."
      : salles.length === 0
        ? `${cinema.nom} n'a encore aucune salle. Ajoutez-les dans sa fiche, sous « Tarifs & salles ».`
        : null

  return (
    <Dialog id="programmer-film" header={titreDialogue} onClose={onFermer} width={1}>
      <Box padding={4}>
        {rapport ? (
          <Stack space={4}>
            <RapportResultat rapport={rapport} />
            <Button text="Fermer" tone="primary" onClick={onFermer} />
          </Stack>
        ) : obstacle ? (
          <Stack space={4}>
            <Card padding={3} radius={2} tone="caution" border>
              <Text size={1}>{obstacle}</Text>
            </Card>
            <Button text="Fermer" mode="ghost" onClick={onFermer} />
          </Stack>
        ) : (
          <Stack space={4}>
            {cinemaImpose ? null : (
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Cinéma
                </Text>
                <Select value={cinemaId} onChange={(e) => setCinemaId(e.currentTarget.value)}>
                  {cinemas.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nom}
                    </option>
                  ))}
                </Select>
              </Stack>
            )}

            {filmImpose ? null : (
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Film
                </Text>
                <Select value={filmId} onChange={(e) => setFilmId(e.currentTarget.value)}>
                  <option value="">— Choisir un film —</option>
                  {films.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.titre}
                      {f.duree ? ` (${f.duree} min)` : ''}
                    </option>
                  ))}
                </Select>
              </Stack>
            )}

            <Stack space={2}>
              <Text size={1} weight="semibold">
                Créneaux chaque semaine
              </Text>
              {/* Les largeurs reprennent exactement celles de LigneCreneau,
                  pour que chaque intitulé tombe au-dessus de son champ. */}
              <Flex gap={2} align="center">
                <Box flex={3}>
                  <Text size={0} muted>
                    Jour
                  </Text>
                </Box>
                <Box flex={2} style={{minWidth: 110}}>
                  <Text size={0} muted>
                    Début
                  </Text>
                </Box>
                <Box flex={2} style={{minWidth: 96}}>
                  <Text size={0} muted align="center">
                    Fin
                  </Text>
                </Box>
                <Box flex={3}>
                  <Text size={0} muted>
                    Salle
                  </Text>
                </Box>
                {/* Réserve la place du bouton « retirer » des lignes en dessous. */}
                <Box style={{width: 35}} />
              </Flex>
              {creneaux.map((creneau, index) => (
                <LigneCreneau
                  key={index}
                  creneau={creneau}
                  index={index}
                  salles={salles}
                  suppressionPossible={creneaux.length > 1}
                  dureeFilm={film?.duree ?? null}
                  filmChoisi={Boolean(film)}
                  onModifier={modifierCreneau}
                  onSupprimer={supprimerCreneau}
                />
              ))}
              <Button mode="ghost" icon={AddIcon} text="Ajouter un créneau" onClick={ajouterCreneau} />
            </Stack>

            <Flex gap={3}>
              <Stack space={2} flex={1}>
                <Text size={1} weight="semibold">
                  À partir du
                </Text>
                <TextInput
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.currentTarget.value)}
                />
              </Stack>
              <Stack space={2} flex={1}>
                <Text size={1} weight="semibold">
                  Pendant
                </Text>
                <Select
                  value={nbSemaines}
                  onChange={(e) => setNbSemaines(Number(e.currentTarget.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} semaine{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </Select>
              </Stack>
            </Flex>

            <Button
              text={
                enCours
                  ? 'Création en cours…'
                  : `Créer ${totalPrevu} séance${totalPrevu > 1 ? 's' : ''}`
              }
              tone="primary"
              disabled={!formulaireValide || enCours}
              onClick={creer}
            />
            <Text size={1} muted>
              Les doublons et les conflits de salle sont détectés automatiquement, cinéma par
              cinéma : seules les séances possibles seront créées, et un bilan s'affichera. Une
              salle est occupée jusqu'à la minute exacte de fin du film : deux séances peuvent
              s'enchaîner sans aucun battement.
            </Text>
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}
