/**
 * « Où en est ce film ? » en cases à cocher (demande du cinéma,
 * 3 novembre 2026). Les règles d'exclusion vivent dans
 * utils/etats-du-film.ts ; ce composant ne fait que les afficher.
 *
 * Il écrit deux champs d'un coup : « statuts », les cases cochées, et
 * « status », l'état principal que lisent les requêtes à un seul état.
 * Les deux ne peuvent donc jamais se contredire.
 */
import {Box, Checkbox, Flex, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {PatchEvent, type StringInputProps, set, unset, useFormCallbacks, useFormValue} from 'sanity'

import {ETATS_DU_FILM, basculer, statutPrincipal, statutsDe} from '../utils/etats-du-film'

export function ChampEtatsDuFilm(props: StringInputProps): React.JSX.Element {
  const {onChange: changerLaFiche} = useFormCallbacks()
  const statutsEnregistres = useFormValue(['statuts'])
  const coches = statutsDe({status: props.value, statuts: statutsEnregistres})

  const changer = useCallback(
    (valeur: string) => {
      const suivants = basculer(coches, valeur)
      const principal = statutPrincipal(suivants)
      changerLaFiche(
        PatchEvent.from([
          suivants.length ? set(suivants, ['statuts']) : unset(['statuts']),
          principal ? set(principal, ['status']) : unset(['status']),
        ]),
      )
    },
    [coches, changerLaFiche],
  )

  return (
    <Stack space={3}>
      {ETATS_DU_FILM.map((etat) => {
        const id = `etat-du-film-${etat.valeur}`
        return (
          <Flex key={etat.valeur} align="center" gap={3}>
            <Checkbox
              id={id}
              checked={coches.includes(etat.valeur)}
              disabled={Boolean(props.readOnly)}
              onChange={() => changer(etat.valeur)}
            />
            <Box flex={1}>
              <Text as="label" htmlFor={id} size={1} weight="medium">
                {etat.titre}
                {etat.aide ? <span style={{fontWeight: 400, opacity: 0.7}}> — {etat.aide}</span> : null}
              </Text>
            </Box>
          </Flex>
        )
      })}
    </Stack>
  )
}
