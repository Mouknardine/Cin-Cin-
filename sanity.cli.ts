import { defineCliConfig } from "sanity/cli";

/* ---------------------------------------------------------------------------
   Le projet Sanity du Zinéma. Ce n'est pas un secret : le site public l'écrit
   en clair dans assets/js/data.js, il est visible par tous les visiteurs.

   Cette valeur est FIXE, et volontairement pas réglable par une variable
   d'environnement. Elle l'a été, et ça s'est retourné contre nous : un
   .env.local oublié sur une machine désignait « g0k3smf3 », l'ancien projet
   abandonné. Toute commande lancée depuis cette machine — publication du
   Studio comprise — visait donc silencieusement le mauvais projet, pendant
   que le site lisait le bon. Rien n'échouait : ça marchait, ailleurs.

   Le projet est un fait du dépôt, pas un réglage de poste de travail.
   --------------------------------------------------------------------------- */
export const PROJECT_ID = "vle63mzm";

export default defineCliConfig({
  api: {
    projectId: PROJECT_ID,
    /* Le jeu de données, lui, reste réglable : on peut vouloir travailler
       sur une copie de test sans toucher au contenu publié. */
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  /** Adresse en ligne du Studio : https://cincin-zinema.sanity.studio */
  studioHost: "cincin-zinema",
});
