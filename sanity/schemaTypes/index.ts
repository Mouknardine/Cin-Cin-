import { imageZinema } from "./objects/imageZinema";

import { film } from "./film";
import { screening } from "./screening";
import { evenement } from "./evenement";
import { histoire } from "./histoire";
import { siteSettings } from "./siteSettings";
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

  // Documents uniques (une seule fiche pour tout le site)
  siteSettings,
  abonnements,
  location,
  histoire,

  // Billetterie : créé automatiquement par le serveur, jamais à la main
  commande,
];

/** Types dont il n'existe qu'une seule fiche : pas de bouton « créer ». */
export const typesUniques = ["siteSettings", "abonnements", "location", "histoire"];

/** Types que personne ne crée à la main depuis le Studio. */
export const typesNonCreables = [...typesUniques, "commande"];
