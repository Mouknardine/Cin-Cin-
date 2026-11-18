/**
 * Les trois réglages de la piqûre de rappel : le jour où elle part, son
 * titre, et le mot du cinéma. Tous ont une valeur par défaut — on peut
 * cocher, copier et envoyer sans rien écrire.
 */
import {ClipboardIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useState} from 'react'

/* Un champ de date envoie des valeurs intermédiaires pendant qu'on tape
   l'année (« 0002-11-18 ») : seules les dates plausibles sont retenues. */
const DATE_PLAUSIBLE = /^20\d{2}-\d{2}-\d{2}$/

function Champ({id, titre, aide, children}: {id: string; titre: string; aide: string; children: React.ReactNode}): React.JSX.Element {
  return (
    <Stack space={2}>
      <Text size={1} weight="semibold" as="label" htmlFor={id}>
        {titre}
      </Text>
      <Text size={1} muted>
        {aide}
      </Text>
      {children}
    </Stack>
  )
}

export function ChampJourDEnvoi({envoi, onChanger}: {envoi: string; onChanger: (jour: string) => void}): React.JSX.Element {
  const [saisie, setSaisie] = useState(envoi)
  const changer = useCallback(
    (evenement: React.ChangeEvent<HTMLInputElement>) => {
      const valeur = evenement.currentTarget.value
      setSaisie(valeur)
      if (DATE_PLAUSIBLE.test(valeur)) onChanger(valeur)
    },
    [onChanger],
  )
  return (
    <Champ id="piqure-envoi" titre="Jour de l’envoi" aide="Les séances et les dates proposées partent de ce jour-là.">
      <Box style={{maxWidth: '12rem'}}>
        <TextInput id="piqure-envoi" type="date" value={saisie} onChange={changer} />
      </Box>
    </Champ>
  )
}

interface PropsMessage {
  titre: string
  titreParDefaut: string
  onTitre: (titre: string) => void
  mot: string
  onMot: (mot: string) => void
  onCopierObjet: () => void
  objetVide: boolean
}

export function ChampsDuMessage({
  titre,
  titreParDefaut,
  onTitre,
  mot,
  onMot,
  onCopierObjet,
  objetVide,
}: PropsMessage): React.JSX.Element {
  const changerTitre = useCallback(
    (evenement: React.ChangeEvent<HTMLInputElement>) => onTitre(evenement.currentTarget.value),
    [onTitre],
  )
  const changerMot = useCallback(
    (evenement: React.ChangeEvent<HTMLTextAreaElement>) => onMot(evenement.currentTarget.value),
    [onMot],
  )
  return (
    <Stack space={4}>
      <Champ
        id="piqure-titre"
        titre="Titre"
        aide="Il s’écrit en capitales dans la case bleue et sert d’objet au message. Laissé vide, il reprend les noms cochés."
      >
        <Flex gap={2} align="center" wrap="wrap">
          <Box flex={1} style={{minWidth: '14rem'}}>
            <TextInput id="piqure-titre" value={titre} placeholder={titreParDefaut} onChange={changerTitre} />
          </Box>
          <Button
            mode="ghost"
            fontSize={1}
            icon={ClipboardIcon}
            text="Copier l’objet"
            disabled={objetVide}
            onClick={onCopierObjet}
          />
        </Flex>
      </Champ>
      <Champ
        id="piqure-mot"
        titre="Un mot (facultatif)"
        aide="Quelques lignes sous la case bleue. Laissé vide, la piqûre passe directement aux films et aux événements."
      >
        <TextArea
          id="piqure-mot"
          rows={4}
          value={mot}
          placeholder="Ex. : Le réalisateur sera là vendredi soir pour présenter ses deux films."
          onChange={changerMot}
        />
      </Champ>
    </Stack>
  )
}
