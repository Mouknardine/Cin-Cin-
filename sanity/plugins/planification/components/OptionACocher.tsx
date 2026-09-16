/**
 * Une option à cocher, avec son titre et son explication.
 *
 * Les assistants en proposent une chacun — « rebattre les cartes »,
 * « tenir compte des semaines voisines ». Toutes deux demandent la
 * même chose : une case, un intitulé cliquable, et deux lignes qui
 * disent ce que ça change. D'où ce composant unique.
 */
import {Card, Checkbox, Flex, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'

interface Props {
  id: string
  titre: string
  cochee: boolean
  onChanger: (cochee: boolean) => void
  children: React.ReactNode
}

export function OptionACocher({id, titre, cochee, onChanger, children}: Props): React.JSX.Element {
  const changer = useCallback(
    (evenement: React.ChangeEvent<HTMLInputElement>) => onChanger(evenement.currentTarget.checked),
    [onChanger],
  )

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Flex align="flex-start" gap={3}>
        <Checkbox id={id} checked={cochee} onChange={changer} />
        <Stack space={2} flex={1}>
          <Text size={1} weight="semibold" as="label" htmlFor={id}>
            {titre}
          </Text>
          <Text size={1} muted>
            {children}
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}
