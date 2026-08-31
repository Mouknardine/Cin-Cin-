/**
 * Bloc « Séances de ce film », posé directement dans le formulaire d'un film.
 *
 * Il répond à la question qu'on se pose en ouvrant une fiche — « ce film,
 * il passe quand ? » — et porte le bouton qui programme toutes ses séances
 * d'un coup. Plus besoin d'aller les créer une par une ailleurs : on donne
 * les créneaux habituels et le nombre de semaines, et l'agenda du site se
 * remplit dans la foulée.
 */
import {AddIcon, CalendarIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useClient, useFormValue} from 'sanity'

import {API_VERSION} from '../types'
import {formatJourCourt} from '../utils/dates'
import {DialogProgrammerFilm} from './DialogProgrammerFilm'
import {lundiDeLaSemaine} from '../utils/dates'

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

const ETATS: Record<string, string> = {
  complet: 'complet',
  annule: 'annulée',
}

export function ChampSeancesDuFilm(): React.JSX.Element {
  const client = useClient({apiVersion: API_VERSION})

  const idBrut = useFormValue(['_id']) as string | undefined
  const titre = (useFormValue(['title']) as string | undefined) ?? ''
  const duree = useFormValue(['duration']) as number | undefined
  const id = (idBrut ?? '').replace(/^drafts\./, '')

  const [seances, setSeances] = useState<SeanceResumee[] | null>(null)
  const [dialogueOuvert, setDialogueOuvert] = useState(false)

  const charger = useCallback(() => {
    if (!id) return
    setSeances(null)
    client
      .fetch<SeanceResumee[]>(
        `*[_type == "screening" && film._ref == $id && date >= $today]
          | order(date asc, time asc)
          {_id, date, "heure": time, "salle": room, "statut": status}`,
        {id, today: aujourdhui()},
      )
      .then(setSeances)
      .catch(() => setSeances([]))
  }, [client, id])

  useEffect(charger, [charger])

  /* Une séance renvoie vers la version publiée du film : tant que la fiche
     n'a jamais été publiée, la programmer n'aurait pas de sens. */
  const jamaisPublie = (idBrut ?? '').startsWith('drafts.') && seances !== null && !titre

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} tone="transparent" border>
        <Stack space={3}>
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
            <Stack space={2}>
              <Text size={1} weight="semibold">
                {seances.length} séance{seances.length > 1 ? 's' : ''} à venir
              </Text>
              <Box>
                {seances.slice(0, 12).map((s) => (
                  <Text key={s._id} size={1} muted style={{lineHeight: '1.6'}}>
                    {formatJourCourt(s.date)} · {s.heure} · {s.salle}
                    {ETATS[s.statut] ? ` — ${ETATS[s.statut]}` : ''}
                  </Text>
                ))}
                {seances.length > 12 ? (
                  <Text size={1} muted>
                    … et {seances.length - 12} autre{seances.length - 12 > 1 ? 's' : ''}
                  </Text>
                ) : null}
              </Box>
            </Stack>
          )}

          <Button
            icon={seances && seances.length ? AddIcon : CalendarIcon}
            text="Programmer des séances"
            tone="primary"
            mode="ghost"
            disabled={!id || jamaisPublie}
            onClick={() => setDialogueOuvert(true)}
          />
          <Text size={1} muted>
            Vous donnez les créneaux habituels du film (par exemple mercredi 19:00 en Salle 1 et
            samedi 21:00 en Salle 2) et le nombre de semaines : toutes les séances sont créées et
            publiées d'un coup, et l'agenda du site se remplit aussitôt.
          </Text>
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
