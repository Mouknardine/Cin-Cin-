/* ============================================================
   Minimum — TOUT le contenu du site vit dans ce fichier.
   C'est le seul à modifier : coordonnées, tarifs, films, séances.

   ⚠ Les valeurs marquées « À CONFIRMER » sont des textes
   provisoires, à remplacer par les vraies informations du cinéma.
   Les films et horaires sont des EXEMPLES pour montrer le site
   vivant : à remplacer par le vrai programme.
   ============================================================ */
window.MIN = {
  config: {
    nom: "Minimum",
    nomLong: "Cinéma Minimum",
    slogan: "Le cinéma, au minimum. Le reste est en trop.",
    // À CONFIRMER
    adresse: ["Adresse à confirmer", "Lausanne"],
    telephone: "",
    courriel: "info@cineminimum.ch",
    // Lien de la billetterie. Vide = le bouton « Réserver » ouvre un courriel.
    billetterie: "",
    instagram: "",
    facebook: "",
    ouverture: "Une demi-heure avant la première séance.",
    acces: "Transports publics, vélo ou à pied : on vous laisse choisir. Précisions à confirmer.",
    salles: "Une petite salle",
    places: "",
  },

  tarifs: [
    // À CONFIRMER
    { nom: "Plein tarif", prix: "—", note: "" },
    { nom: "Réduit", prix: "—", note: "AVS, AI, étudiants, apprentis, chômeurs" },
    { nom: "Moins de 16 ans", prix: "—", note: "" },
    { nom: "Carte de membre", prix: "—", note: "Entrées à tarif préférentiel, valable un an" },
  ],

  /* Séances : jours de la semaine (1 = lundi … 7 = dimanche) → heures.
     Le site affiche toujours les 7 prochains jours à partir
     d'aujourd'hui. */
  films: [
    {
      id: "stalker", titre: "Stalker", realisateur: "Andreï Tarkovski", annee: 1979,
      pays: "URSS", duree: 162, langue: "VO russe, st. français",
      synopsis: "Un guide mène un écrivain et un professeur dans la Zone, territoire interdit où, dit-on, un lieu exauce les désirs les plus intimes.",
      forme: "cercle", couleur: "noir",
      seances: { 1: ["18:00"], 3: ["20:30"], 5: ["18:00"], 7: ["17:00"] },
    },
    {
      id: "paris-texas", titre: "Paris, Texas", realisateur: "Wim Wenders", annee: 1984,
      pays: "Allemagne / France", duree: 147, langue: "VO anglaise, st. français",
      synopsis: "Un homme sorti du désert après quatre ans de silence tente de retrouver son fils, puis la femme qu'il a perdue.",
      forme: "barre", couleur: "orange",
      seances: { 2: ["18:30"], 4: ["20:30"], 6: ["20:30"], 7: ["14:30"] },
    },
    {
      id: "in-the-mood", titre: "In the Mood for Love", realisateur: "Wong Kar-wai", annee: 2000,
      pays: "Hong Kong", duree: 98, langue: "VO cantonaise, st. français",
      synopsis: "Hong Kong, 1962. Deux voisins découvrent que leurs conjoints entretiennent une liaison, et se rapprochent à leur tour.",
      forme: "carre", couleur: "blanc",
      seances: { 1: ["20:30"], 2: ["16:30"], 5: ["20:30"], 6: ["18:00"] },
    },
    {
      id: "jeanne-dielman", titre: "Jeanne Dielman", realisateur: "Chantal Akerman", annee: 1975,
      pays: "Belgique / France", duree: 201, langue: "VO française",
      synopsis: "Trois jours de la vie d'une veuve bruxelloise, ses gestes quotidiens, et la fissure qui s'ouvre dans leur ordonnancement.",
      forme: "moitie", couleur: "gris",
      seances: { 3: ["17:00"], 7: ["19:30"] },
    },
    {
      id: "playtime", titre: "Playtime", realisateur: "Jacques Tati", annee: 1967,
      pays: "France", duree: 124, langue: "VO française",
      synopsis: "Un groupe de touristes américains et monsieur Hulot se perdent dans un Paris de verre et d'acier.",
      forme: "grille", couleur: "orange",
      seances: { 4: ["18:00"], 6: ["16:00"], 7: ["16:30"] },
    },
    {
      id: "sans-soleil", titre: "Sans soleil", realisateur: "Chris Marker", annee: 1983,
      pays: "France", duree: 100, langue: "VO française",
      synopsis: "Un cinéaste voyageur écrit des lettres depuis le Japon, l'Afrique et l'Islande : un essai sur la mémoire et les images.",
      forme: "cercle", couleur: "blanc",
      seances: { 2: ["20:30"], 5: ["16:30"] },
    },
  ],

  /* Rendez-vous réguliers. */
  rendezVous: [
    { titre: "Le mardi du minimum", texte: "Une séance, un film, une discussion après la projection." },
    { titre: "Carte blanche", texte: "Chaque mois, une personne choisit le film et vient le présenter." },
    { titre: "Séance du dimanche", texte: "Un film pour toute la famille, en fin d'après-midi." },
  ],

  location: {
    texte: "La salle se loue pour une projection privée, une avant-première, une présentation ou un anniversaire. Dites-nous la date, le nombre de personnes et ce que vous voulez projeter.",
  },
};
