/**
 * La grille de la semaine : 7 colonnes (mercredi → mardi, la semaine
 * de cinéma), et dans chaque colonne les deux vagues du soir — celle
 * de 19 h et celle de 21 h (17 h et 19 h le dimanche) — en Salle 1
 * et en Salle 2.
 *
 * Montrer les cases LIBRES change tout : c'est là qu'on dépose une
 * séance venue d'un autre jour, et c'est là qu'on clique pour en
 * programmer une. Une grille qui ne listerait que l'existant n'aurait
 * nulle part où poser quoi que ce soit.
 *
 * Chaque case affiche SON heure, pas celle de sa vague : derrière un
 * film de 2 h 20 commencé à 19 h, la case de 21 h annonce 21:30. Le
 * calcul est dans enchainement.ts.
 *
 * Les séances qui ne tombent sur aucune case ordinaire — le Hall-Bar
 * d'un soir d'événement, une avant-première à 18 h — s'affichent en bas
 * de leur journée, sous un trait. Elles se déplacent comme les autres.
 *
 * Une case sans film (vacances, projection privée) occupe sa case comme
 * une séance. Le rangement est fait dans utils/rangement-du-jour.ts.
 */
import {Box, Card, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'

import type {ActionsPlanning, CaseSansFilm, GlisserDeposer, SeancePlanning} from '../types'
import {SALLES_STANDARD, vaguesDuJour} from '../utils/creneaux-standards'
import {DUREE_SEMAINE_JOURS, ajouterJours, aujourdHui, formatJourCourt} from '../utils/dates'
import {heureDeDepart} from '../utils/enchainement'
import {clefDeCase, rangerLaJournee} from '../utils/rangement-du-jour'
import {CarteSansFilm} from './CarteSansFilm'
import {CelluleCreneau} from './CelluleCreneau'

interface Props {
  /** Le mercredi qui ouvre la semaine affichée. */
  debutSemaine: string
  /** La teinte de cette semaine, reprise en haut de chaque journée. */
  couleurSemaine: string
  seances: SeancePlanning[]
  casesSansFilm: CaseSansFilm[]
  /** Les identifiants des séances qui se chevauchent : elles s'affichent en rouge. */
  conflits: ReadonlySet<string>
  chargement: boolean
  actions: ActionsPlanning
  glisser: GlisserDeposer
}

export function GrilleSemaine({
  debutSemaine,
  couleurSemaine,
  seances,
  casesSansFilm,
  conflits,
  chargement,
  actions,
  glisser,
}: Props): React.JSX.Element {
  const jours = useMemo(
    () => Array.from({length: DUREE_SEMAINE_JOURS}, (_, index) => ajouterJours(debutSemaine, index)),
    [debutSemaine],
  )
  const dateDuJour = aujourdHui()

  if (chargement) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Box overflow="auto" paddingBottom={2}>
      <Grid columns={DUREE_SEMAINE_JOURS} gap={2} style={{minWidth: 1320}}>
        {jours.map((jour) => {
          const {seances: parCase, casesSansFilm: casesParCase, horsGrille, casesHorsGrille} =
            rangerLaJournee(
              seances.filter((seance) => seance.date === jour),
              casesSansFilm.filter((caseSansFilm) => caseSansFilm.date === jour),
            )
          const estAujourdHui = jour === dateDuJour
          return (
            <Card
              key={jour}
              padding={2}
              radius={3}
              tone={estAujourdHui ? 'primary' : 'transparent'}
              border
              style={{borderTop: `4px solid ${couleurSemaine}`}}
            >
              <Stack space={3}>
                <Text size={1} weight={estAujourdHui ? 'bold' : 'semibold'} align="center">
                  {formatJourCourt(jour)}
                </Text>

                {vaguesDuJour(jour).map((vagueInfo, vague) => (
                  <Stack
                    key={vagueInfo.titre}
                    space={2}
                    role="list"
                    aria-label={`${formatJourCourt(jour)}, séances de ${vagueInfo.titre}`}
                  >
                    <Text size={0} muted weight="semibold">
                      {vagueInfo.titre}
                    </Text>
                    {SALLES_STANDARD.map((salle) => {
                      const seance = parCase.get(clefDeCase(salle, vague)) ?? null
                      /* Une case libre de seconde vague ne part pas
                         forcément à l'heure de sa vague : elle attend la
                         fin du premier film dans la même salle. */
                      const precedente = vague > 0 ? (parCase.get(clefDeCase(salle, vague - 1)) ?? null) : null
                      const heure = seance?.heure ?? heureDeDepart(vague, jour, precedente)
                      return (
                        <CelluleCreneau
                          key={salle}
                          creneau={{date: jour, heure, salle}}
                          seance={seance}
                          caseSansFilm={casesParCase.get(clefDeCase(salle, vague)) ?? null}
                          enConflit={seance ? conflits.has(seance._id) : false}
                          actions={actions}
                          glisser={glisser}
                        />
                      )
                    })}
                  </Stack>
                ))}

                {horsGrille.length + casesHorsGrille.length > 0 && (
                  <Stack
                    space={2}
                    role="list"
                    aria-label={`Séances particulières du ${formatJourCourt(jour)}`}
                  >
                    <Card borderTop paddingTop={2} tone="inherit">
                      <Text size={0} muted weight="semibold">
                        Séances particulières
                      </Text>
                    </Card>
                    {horsGrille.map((seance) => (
                      <CelluleCreneau
                        key={seance._id}
                        creneau={{date: seance.date, heure: seance.heure, salle: seance.salle}}
                        seance={seance}
                        enConflit={conflits.has(seance._id)}
                        actions={actions}
                        glisser={glisser}
                      />
                    ))}
                    {casesHorsGrille.map((caseSansFilm) => (
                      <CarteSansFilm key={caseSansFilm._id} caseSansFilm={caseSansFilm} actions={actions} />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          )
        })}
      </Grid>
    </Box>
  )
}
