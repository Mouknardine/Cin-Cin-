/* ============================================================
   Le contenu réel du cinéma, tel qu'il est publié sur zinema.ch.

   Ce fichier ne parle à personne : il ne contient que des données.
   C'est mettre-a-jour.mjs, à côté, qui les envoie dans le Studio.
   Les séparer permet de relire les textes sans lire du code — et
   de vérifier le tri des films sans toucher à Sanity.
   ============================================================ */

/** Les cinq films du programme de septembre 2026. */
export const FILMS = [
  {
    slug: "drowak",
    title: "Drowak",
    /* Le film est sorti en Suisse alémanique sous son titre allemand :
       c'est sous celui-là que son affiche a été déposée. */
    autresTitres: ["Sie glauben an Engel, Herr Drowak?"],
    director: "Nicolas Steiner",
    country: "Allemagne",
    year: 2025,
    duration: 127,
    language: "VO",
    subtitles: "st fr",
    ageRating: "16/16 ans",
    genres: ["Fiction"],
    status: "a-laffiche",
    trailerUrl: "https://www.youtube.com/watch?v=9V-duM99N58",
    affiche: null, // déjà déposée dans le Studio
    synopsis:
      "Lena, une étudiante optimiste, anime un atelier d'écriture dont le seul participant est Hugo Drowak, un misanthrope aigri et alcoolique. Autrefois, il écrivait des poèmes d'amour passionnés, mais une déception l'a poussé à se réfugier dans l'alcool et l'isolement. Malgré ses remarques désobligeantes, Lena ne baisse pas les bras et tente de raviver sa créativité, car elle croit aux secondes chances.",
  },
  {
    slug: "le-dernier-pour-la-route",
    title: "Le Dernier pour la route",
    director: "Francesco Sossai",
    country: "Italie",
    year: 2025,
    duration: 98,
    language: "VO",
    subtitles: "st fr",
    ageRating: "16/16 ans",
    genres: ["Fiction"],
    status: "a-laffiche",
    trailerUrl: "https://www.youtube.com/watch?v=X8uIpic_AyM",
    affiche: "le-dernier-pour-la-route.jpg",
    alt: "Affiche du film Le Dernier pour la route : trois hommes marchent sur un fond jaune, entre une pompe à essence et un panneau « 15 Venise ».",
    synopsis:
      "Carlobianchi et Doriano, deux cinquantenaires fauchés, errent la nuit en voiture de bar en bar, obsédés par l'idée d'un dernier verre, lorsqu'ils croisent la route de Giulio, un étudiant en architecture aussi timide que naïf. Entre confidences et gueule de bois, cette rencontre inattendue avec ces deux mentors improbables va bouleverser la vision que Giulio porte sur le monde, l'amour et son avenir.",
  },
  {
    slug: "de-la-comedie-francaise",
    title: "De la Comédie Française",
    director: "Bertrand Usclat & Martin Darondeau",
    country: "France",
    year: 2026,
    duration: 75,
    language: "VF",
    subtitles: "",
    ageRating: "10/12 ans",
    genres: ["Fiction"],
    status: "a-laffiche",
    trailerUrl: "https://www.youtube.com/watch?v=8A2MVXcMhQQ",
    affiche: "de-la-comedie-francaise.jpg",
    alt: "Affiche du film De la Comédie Française : la troupe au complet, en costumes de scène et en tenue de ville, rassemblée sur fond blanc.",
    synopsis:
      "Dans 3 heures, Nina dévoile sa première mise en scène à la Comédie-Française. Mais dans l'agitation des dernières répétitions, rien ne se passe comme prévu : retards, coups de stress, problèmes techniques et problèmes d'égo secouent la troupe. Pourtant, Nina n'a pas d'autre choix que d'aller jusqu'au bout car s'il y a bien une règle d'or à la Comédie-Française, c'est qu'on n'annule pas. Commence alors une course contre la montre pour sauver la représentation.",
  },
  {
    slug: "les-matins-merveilleux",
    title: "Les Matins merveilleux",
    director: "Avril Besson",
    country: "France",
    year: 2026,
    duration: 86,
    language: "VF",
    subtitles: "",
    ageRating: "12/16 ans",
    genres: ["Fiction"],
    status: "a-laffiche",
    trailerUrl: "https://www.youtube.com/watch?v=6rG0jikzSM4",
    affiche: "les-matins-merveilleux.jpg",
    alt: "Affiche du film Les Matins merveilleux : deux femmes enlacées se regardent devant la mer, un homme les attend en contrebas.",
    synopsis:
      "De vieux vinyles disco dans le coffre de sa Twingo, à peine remise de la mort de sa grand-mère, Charlie roule. Elle ne sait pas encore que ces disques ressusciteront les pas de danse de sa mère dans les yeux humides de Titou, caviste rêveur, ni qu'une plage méditerranéenne désertée sera le théâtre de sa rencontre avec Marina, qui rêve son idéal de liberté dans la pizzeria du village. Pour l'instant, elle roule.",
  },
  {
    slug: "ah-que-le-bonheur-est-proche",
    title: "Ah que le bonheur est proche !",
    director: "François-Christophe Marzal",
    country: "Suisse",
    year: 2026,
    duration: 70,
    language: "VF",
    subtitles: "",
    ageRating: "16/16 ans",
    genres: ["Fiction"],
    status: "prochainement", // sortie le 30 septembre 2026
    trailerUrl: "https://www.youtube.com/watch?v=TqFkuyKAOHc",
    affiche: "ah-que-le-bonheur-est-proche.jpg",
    alt: "Affiche du film Ah que le bonheur est proche ! : un comédien âgé se maquille devant le miroir éclairé de sa loge, en noir et blanc.",
    synopsis:
      "À 85 ans, Jean-Luc doit incarner le personnage de Don Quichotte sur la scène d'un théâtre prestigieux. Hélas, ses défaillances mémorielles contraignent la production à engager une doublure. Peu à peu, le vieil acteur se persuade que ladite doublure complote pour prendre sa place.",
  },
];

/* ---------------- Reconnaître un film déjà présent ----------------
   Un même film peut avoir été saisi sous son titre original, avec ou
   sans accents, en capitales, avec une adresse de page différente.
   On compare donc des titres « nettoyés » : sans accents, sans
   ponctuation, sans majuscules. */
export function normaliser(texte) {
  return String(texte || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Tous les noms sous lesquels un film de la liste peut se présenter. */
export function clefsDuFilm(film) {
  return [film.title, film.slug, ...(film.autresTitres || [])].map(normaliser);
}

/**
 * Range les films de Sanity en trois tas :
 *   - « aMettreAJour » : le film du programme existe déjà, on le corrige ;
 *   - « aCreer »       : il n'existe pas encore ;
 *   - « aRetirer »     : tout le reste, qui n'est plus à l'affiche.
 * Aucune suppression : un film retiré passe en « Terminé » et reste
 * consultable dans le Studio.
 */
export function trierLesFilms(filmsDansSanity, filmsDuProgramme = FILMS) {
  const aMettreAJour = [];
  const aCreer = [];
  const dejaPris = new Set();

  for (const film of filmsDuProgramme) {
    const clefs = clefsDuFilm(film);
    const trouve = filmsDansSanity.find(
      (existant) =>
        !dejaPris.has(existant._id) &&
        (clefs.includes(normaliser(existant.title)) ||
          clefs.includes(normaliser(existant.slug)))
    );
    if (trouve) {
      dejaPris.add(trouve._id);
      aMettreAJour.push({ film, existant: trouve });
    } else {
      aCreer.push(film);
    }
  }

  const aRetirer = filmsDansSanity.filter(
    (existant) => !dejaPris.has(existant._id) && existant.status !== "passe"
  );

  return { aMettreAJour, aCreer, aRetirer };
}
