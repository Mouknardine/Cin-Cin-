/**
 * Bloc « Séances de ce film », posé dans le formulaire d'un film.
 *
 * Tout se fait ici, sans quitter la fiche :
 *   - voir les séances à venir du film ;
 *   - en ajouter plusieurs d'un coup (les créneaux de la semaine × un
 *     nombre de semaines) ;
 *   - marquer une séance « complet » ou « annulée » ;
 *   - supprimer une séance.
 *
 * Les changements partent directement sur la version publiée : ils sont
 * en ligne aussitôt, sans clic « Publish » supplémentaire.
 */
import {AddIcon, CalendarIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Select, Spinner, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useClient, useFormValue} from 'sanity'

import {API_VERSION} from '../types'
import {formatJourCourt, lundiDeLaSemaine} from '../utils/dates'
import {supprimerSeance} from '../utils/mutations'
import {DialogProgrammerFilm} from './DialogProgrammerFilm'

interface SeanceResumee {
  _id: string
  date: string
  heure: string
  salle: string
  statut: string
}

function aujourdhui(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

const ETATS = [
  {valeur: 'disponible', libelle: 'Places disponibles'},
  {valeur: 'complet', libelle: 'Complet'},
  {valeur: 'annule', libelle: 'Annulée'},
]

export function ChampSeancesDuFilm(): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const idBrut = useFormValue(['_id']) as string | undefined
  const titre = (useFormValue(['title']) as string | undefined) ?? ''
  const duree = useFormValue(['duration']) as number | undefined
  const id = (idBrut ?? '').replace(/^drafts\./, '')

  const [seances, setSeances] = useState<SeanceResumee[] | null>(null)
  const [publie, setPublie] = useState<boolean | null>(null)
  const [dialogueOuvert, setDialogueOuvert] = useState(false)
  const [enCours, setEnCours] = useState<string | null>(null)

  const charger = useCallback(() => {
    if (!id) return
    client
      .fetch<{seances: SeanceResumee[]; publie: boolean}>(
        `{
          "seances": *[_type == "screening" && film._ref == $id && date >= $today]
            | order(date asc, time asc)
            {_id, date, "heure": time, "salle": room, "statut": status},
          "publie": defined(*[_id == $id][0]._id)
        }`,
        {id, today: aujourdhui()},
      )
      .then((r) => {
        setSeances(r.seances)
        setPublie(r.publie)
      })
      .catch(() => {
        setSeances([])
        setPublie(null)
      })
  }, [client, id])

  useEffect(charger, [charger])

  const changerEtat = useCallback(
    async (seanceId: string, statut: string) => {
      setEnCours(seanceId)
      // Affichage immédiat : on n'attend pas l'aller-retour pour montrer le choix.
      setSeances((liste) =>
        (liste ?? []).map((s) => (s._id === seanceId ? {...s, statut} : s)),
      )
      try {
        await client.patch(seanceId).set({status: statut}).commit()
      } catch {
        toast.push({status: 'error', title: "L'enregistrement a échoué. Réessayez."})
        charger()
      } finally {
        setEnCours(null)
      }
    },
    [charger, client, toast],
  )

  const supprimer = useCallback(
    async (seanceId: string) => {
      setEnCours(seanceId)
      try {
        await supprimerSeance(client, seanceId)
        setSeances((liste) => (liste ?? []).filter((s) => s._id !== seanceId))
      } catch {
        toast.push({status: 'error', title: 'La suppression a échoué. Réessayez.'})
        charger()
      } finally {
        setEnCours(null)
      }
    },
    [charger, client, toast],
  )

  /* Une séance renvoie toujours vers la version PUBLIÉE du film : tant
     que la fiche n'a jamais été publiée, la programmer créerait des
     renvois dans le vide. */
  const jamaisPublie = publie === false

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} tone="transparent" border>
        <Stack space={4}>
          {seances === null ? (
            <Flex align="center" gap={2}>
              <Spinner muted />
              <Text size={1} muted>
                Chargement des séances…
              </Text>
            </Flex>
          ) : seances.length === 0 ? (
            <Text size={1} muted>
              Ce film n'a aucune séance à venir.
            </Text>
          ) : (
            <Stack space={3}>
              <Text size={1} weight="semibold">
                {seances.length} séance{seances.length > 1 ? 's' : ''} à venir
              </Text>
              <Stack space={2}>
                {seances.map((s) => (
                  <Flex key={s._id} align="center" gap={2}>
                    <Box style={{minWidth: '11rem'}}>
                      <Text size={1}>
                        {formatJourCourt(s.date)} · {s.heure} · {s.salle}
                      </Text>
                    </Box>
                    <Box flex={1}>
                      <Select
                        fontSize={1}
                        value={s.statut || 'disponible'}
                        disabled={enCours === s._id}
                        onChange={(e) => changerEtat(s._id, e.currentTarget.value)}
                      >
                        {ETATS.map((etat) => (
                          <option key={etat.valeur} value={etat.valeur}>
                            {etat.libelle}
                          </option>
                        ))}
                      </Select>
                    </Box>
                    <Button
                      mode="bleed"
                      tone="critical"
                      icon={TrashIcon}
                      fontSize={1}
                      padding={2}
                      title="Supprimer cette séance"
                      disabled={enCours === s._id}
                      onClick={() => supprimer(s._id)}
                    />
                  </Flex>
                ))}
              </Stack>
              <Text size={1} muted>
                « Complet » et « Annulée » s'affichent tout de suite sur l'agenda du site et
                désactivent l'achat de billets. Aucun clic « Publish » n'est nécessaire.
              </Text>
            </Stack>
          )}

          <Stack space={2}>
            <Button
              icon={seances && seances.length ? AddIcon : CalendarIcon}
              text="Ajouter des séances"
              tone="primary"
              mode="ghost"
              disabled={!id || jamaisPublie || seances === null}
              onClick={() => setDialogueOuvert(true)}
            />
            <Text size={1} muted>
              {jamaisPublie
                ? "Publiez d'abord ce film (bouton Publish, en bas) : une séance a besoin d'un film publié pour s'afficher sur le site."
                : "Vous indiquez les horaires de la semaine — par exemple mercredi 19:00 en Salle 1 et samedi 21:00 en Salle 2 — et le nombre de semaines. Toutes les séances sont créées d'un coup et l'agenda du site se remplit aussitôt."}
            </Text>
          </Stack>
        </Stack>
      </Card>

      {dialogueOuvert ? (
        <DialogProgrammerFilm
          films={[]}
          filmImpose={{
            _id: id,
            titre: titre || 'Ce film',
            duree: typeof duree === 'number' ? duree : null,
          }}
          lundi={lundiDeLaSemaine(aujourdhui())}
          onFermer={() => {
            setDialogueOuvert(false)
            charger()
          }}
          onCree={charger}
        />
      ) : null}
    </Stack>
  )
}
