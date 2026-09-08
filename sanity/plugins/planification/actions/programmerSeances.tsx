/**
 * Bouton « Programmer des séances » posé directement sur la fiche d'un film.
 *
 * C'est le raccourci principal du Studio : plutôt que de créer une séance
 * à la fois, on ouvre l'assistant depuis le film qu'on a sous les yeux,
 * on donne ses créneaux habituels (mercredi 19:00 Salle 1, samedi 21:00
 * Salle 2…) et le nombre de semaines, et toutes les séances sont créées
 * et publiées d'un coup. L'agenda du site se remplit dans la foulée.
 */
import {CalendarIcon} from '@sanity/icons'
import {useCallback, useState} from 'react'
import type {DocumentActionComponent} from 'sanity'

import {DialogProgrammerFilm} from '../components/DialogProgrammerFilm'
import {debutDeSemaine} from '../utils/dates'

function aujourdhui(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export const programmerSeances: DocumentActionComponent = (props) => {
  const [ouvert, setOuvert] = useState(false)

  const fermer = useCallback(() => {
    setOuvert(false)
    props.onComplete()
  }, [props])

  /* Une séance renvoie vers la version PUBLIÉE du film : tant que le film
     n'est qu'un brouillon, le programmer n'aurait aucun sens — le site ne
     verrait qu'une référence vide. */
  const publie = props.published as {title?: string; duration?: number} | null
  const titre = publie?.title ?? ''

  if (!publie) {
    return {
      label: 'Programmer des séances',
      icon: CalendarIcon,
      disabled: true,
      title: "Publiez d'abord le film : une séance a besoin d'un film publié.",
      onHandle: () => undefined,
    }
  }

  return {
    label: 'Programmer des séances',
    icon: CalendarIcon,
    onHandle: () => setOuvert(true),
    dialog: ouvert && {
      type: 'custom',
      component: (
        <DialogProgrammerFilm
          films={[]}
          filmImpose={{
            _id: props.id,
            titre: titre || 'Ce film',
            duree: typeof publie.duration === 'number' ? publie.duration : null,
          }}
          debutSemaine={debutDeSemaine(aujourdhui())}
          onFermer={fermer}
          onCree={() => undefined}
        />
      ),
    },
  }
}
