/**
 * Ce qu'on peut mettre en avant, à cocher : les films qui passent bientôt,
 * puis les événements à venir. Rien n'est coché d'avance — la piqûre sert à
 * pousser une chose précise, c'est au cinéma de dire laquelle.
 */
import {Box, Card, Checkbox, Flex, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'

import type {EvenementEnAvant, FilmEnAvant} from './candidats'
import {resumeDeLEvenement, resumeDuFilm} from './resumes'

interface Props {
  envoi: string
  films: readonly FilmEnAvant[]
  evenements: readonly EvenementEnAvant[]
  coches: ReadonlySet<string>
  onBasculer: (cle: string) => void
}

interface PropsLigne {
  cle: string
  titre: string
  details: readonly string[]
  /** Une ligne mise en valeur : la séance spéciale d'un film. */
  aRemarquer?: string | null
  cochee: boolean
  onChanger: (evenement: React.ChangeEvent<HTMLInputElement>) => void
}

function Ligne({cle, titre, details, aRemarquer, cochee, onChanger}: PropsLigne): React.JSX.Element {
  const id = `piqure-${cle}`
  return (
    <Card padding={2} radius={2} tone={cochee ? 'primary' : 'inherit'}>
      <Flex align="flex-start" gap={3}>
        <Box paddingTop={1}>
          <Checkbox id={id} value={cle} checked={cochee} onChange={onChanger} />
        </Box>
        <Stack space={2} flex={1}>
          <Text size={1} weight="semibold" as="label" htmlFor={id}>
            {titre}
          </Text>
          {details.map((detail) => (
            <Text key={detail} size={1} muted>
              {detail}
            </Text>
          ))}
          {aRemarquer && (
            <Text size={1} weight="medium">
              {aRemarquer}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}

function Rubrique({titre, vide, children}: {titre: string; vide: string | null; children: React.ReactNode}): React.JSX.Element {
  return (
    <Stack space={2}>
      <Text size={1} weight="semibold">
        {titre}
      </Text>
      {vide ? (
        <Text size={1} muted>
          {vide}
        </Text>
      ) : (
        <Stack space={1}>{children}</Stack>
      )}
    </Stack>
  )
}

export function ListeAMettreEnAvant({envoi, films, evenements, coches, onBasculer}: Props): React.JSX.Element {
  const changer = useCallback(
    (evenement: React.ChangeEvent<HTMLInputElement>) => onBasculer(evenement.currentTarget.value),
    [onBasculer],
  )

  return (
    <Stack space={4}>
      <Rubrique titre="Films" vide={films.length ? null : 'Aucune séance programmée dans les huit semaines qui suivent.'}>
        {films.map((choix) => {
          const resume = resumeDuFilm(choix)
          return (
            <Ligne
              key={choix.cle}
              cle={choix.cle}
              titre={choix.film.titre}
              details={resume.prochaine ? [resume.prochaine] : []}
              aRemarquer={resume.speciale}
              cochee={coches.has(choix.cle)}
              onChanger={changer}
            />
          )
        })}
      </Rubrique>
      <Rubrique titre="Événements" vide={evenements.length ? null : 'Aucun événement dans les huit semaines qui suivent.'}>
        {evenements.map((choix) => (
          <Ligne
            key={choix.cle}
            cle={choix.cle}
            titre={choix.evenement.titre}
            details={[resumeDeLEvenement(choix, envoi)]}
            cochee={coches.has(choix.cle)}
            onChanger={changer}
          />
        ))}
      </Rubrique>
    </Stack>
  )
}
