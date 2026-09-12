import { imageZinema } from "./objects/imageZinema";

import { film } from "./film";
import { screening } from "./screening";
import { evenement } from "./evenement";
import { histoire } from "./histoire";
import { cinema } from "./cinema";
import { abonnements } from "./abonnements";
import { location } from "./location";
import { commande } from "./commande";

export const schemaTypes = [
  // Brique réutilisée par toutes les images du site
  imageZinema,

  // Contenu courant
  film,
  screening,
  evenement,

  // Un cinéma : sa fiche existe autant de fois qu'il y a de cinémas
  cinema,

  // Documents uniques (une seule fiche pour tout le site)
  abonnements,
  location,
  histoire,

  // Billetterie : créé automatiquement par le serveur, jamais à la main
  commande,
];

/** Types dont il n'existe qu'une seule fiche : pas de bouton « créer ».
    Le cinéma n'en fait plus partie : il y en a un par salle de cinéma. */
export const typesUniques = ["abonnements", "location", "histoire"];

/** Types que personne ne crée à la main depuis le Studio. */
export const typesNonCreables = [...typesUniques, "commande"];
