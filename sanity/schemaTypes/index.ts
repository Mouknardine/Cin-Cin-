import { imageZinema } from "./objects/imageZinema";

import { film } from "./film";
import { screening } from "./screening";
import { evenement } from "./evenement";
import { review } from "./review";
import { historyEntry } from "./historyEntry";
import { siteSettings } from "./siteSettings";
import { abonnements } from "./abonnements";
import { page } from "./page";
import { commande } from "./commande";

export const schemaTypes = [
  // Brique réutilisée par toutes les images du site
  imageZinema,

  // Contenu courant
  film,
  screening,
  evenement,
  review,
  historyEntry,

  // Documents uniques (une seule fiche pour tout le site)
  siteSettings,
  abonnements,
  page,

  // Billetterie : créé automatiquement par le serveur, jamais à la main
  commande,
];

/** Types dont il n'existe qu'une seule fiche : pas de bouton « créer ». */
export const typesUniques = ["siteSettings", "abonnements", "page"];

/** Types que personne ne crée à la main depuis le Studio. */
export const typesNonCreables = [...typesUniques, "commande"];
