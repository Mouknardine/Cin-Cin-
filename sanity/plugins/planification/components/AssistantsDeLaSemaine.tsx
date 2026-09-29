/**
 * Les assistants ouverts depuis la barre de la semaine : programmer un
 * film, dupliquer la semaine, la remplir au hasard, sortir la newsletter
 * ou la feuille à imprimer. Un seul est ouvert à la fois.
 */
import {DialogImpression} from '../impression/DialogImpression'
import {DialogNewsletter} from '../newsletter/DialogNewsletter'
import type {FilmPlanning, SeancePlanning} from '../types'
import type {DialogOuvert} from './BarreSemaine'
import {DialogDupliquerSemaine} from './DialogDupliquerSemaine'
import {DialogGenererSemaine} from './DialogGenererSemaine'
import {DialogProgrammerFilm} from './DialogProgrammerFilm'

interface Props {
  ouvert: DialogOuvert
  debutSemaine: string
  films: FilmPlanning[]
  seances: SeancePlanning[]
  onFermer: () => void
  /** Après une création : remettre les soirées d'aplomb et relire la semaine. */
  onCree: () => void
}

export function AssistantsDeLaSemaine({
  ouvert,
  debutSemaine,
  films,
  seances,
  onFermer,
  onCree,
}: Props): React.JSX.Element | null {
  switch (ouvert) {
    case 'programmer':
      return (
        <DialogProgrammerFilm films={films} debutSemaine={debutSemaine} onFermer={onFermer} onCree={onCree} />
      )
    case 'dupliquer':
      return (
        <DialogDupliquerSemaine
          debutSemaine={debutSemaine}
          seancesSemaine={seances}
          onFermer={onFermer}
          onCree={onCree}
        />
      )
    case 'generer':
      return (
        <DialogGenererSemaine
          films={films}
          debutSemaine={debutSemaine}
          seancesSemaine={seances}
          onFermer={onFermer}
          onCree={onCree}
        />
      )
    case 'newsletter':
      return <DialogNewsletter debutSemaine={debutSemaine} onFermer={onFermer} />
    case 'impression':
      return <DialogImpression debutSemaine={debutSemaine} onFermer={onFermer} />
    default:
      return null
  }
}
