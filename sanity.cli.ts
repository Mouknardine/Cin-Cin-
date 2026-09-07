import { defineCliConfig } from "sanity/cli";

/* Le projet et le jeu de données ne sont pas des secrets : ils sont
   visibles par tous les visiteurs du site (assets/js/data.js), et
   l'accès en écriture demande de toute façon de se connecter. Les
   écrire ici évite qu'une commande échoue sur une machine neuve, faute
   de fichier .env.local — lequel reste prioritaire si on en a un. */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "vle63mzm",
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  /** Adresse en ligne du Studio : https://cincin-zinema.sanity.studio */
  studioHost: "cincin-zinema",
});
