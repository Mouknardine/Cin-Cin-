/* ============================================================
   Minimum — TOUT le contenu du site vit dans ce fichier.
   C'est le seul à modifier : coordonnées, tarifs, films,
   émissions de radio, soirées du club.

   ⚠ Ce qui est marqué « À CONFIRMER » est provisoire.
   Les films et leurs affiches viennent du dépôt du Zinéma ;
   les HORAIRES, les ÉMISSIONS et les SOIRÉES sont des exemples,
   à remplacer par le vrai programme.

   Les horaires sont écrits par jour de la semaine
   (1 = lundi … 7 = dimanche) : le site affiche toujours les
   7 prochains jours à partir d'aujourd'hui.
   ============================================================ */
window.MIN = {
  config: {
    nom: "Minimum",
    nomLong: "Minimum — cinéma, radio, club",
    // À CONFIRMER
    adresse: ["Adresse à confirmer", "Lausanne"],
    telephone: "",
    courriel: "info@cineminimum.ch",
    instagram: "",
    facebook: "",
    // Lien de la billetterie. Vide = « Réserver » ouvre un courriel.
    billetterie: "",
    ouverture: "À confirmer.",
    acces: "À confirmer.",
    // Radio : adresse du flux audio (https://…/live.mp3). Vide = le lecteur affiche « bientôt ».
    radioFlux: "",
    radioNom: "Radio Minimum",
    // Club : renseignements pratiques. À CONFIRMER
    clubEntree: "À confirmer",
    clubPorte: "À confirmer",
    clubRegles: "Ici on danse, on écoute, on respecte. Aucune discrimination, aucun harcèlement.",
  },

  tarifs: [
    // À CONFIRMER
    { nom: "Plein tarif", prix: "—", note: "" },
    { nom: "Réduit", prix: "—", note: "AVS, AI, étudiants, apprentis, chômeurs" },
    { nom: "Moins de 16 ans", prix: "—", note: "" },
    { nom: "Carte de membre", prix: "—", note: "Entrées à tarif préférentiel, valable un an" },
  ],

  /* ---------------- CINÉMA ---------------- */
  films: [
    {
      id: "drowak", titre: "Drowak", realisateur: "Nicolas Steiner", annee: 2025,
      pays: "Allemagne", duree: 127, langue: "VO, st. français", age: "16/16 ans",
      synopsis: "Lena, une étudiante optimiste, anime un atelier d'écriture dont le seul participant est Hugo Drowak, un misanthrope aigri et alcoolique. Autrefois, il écrivait des poèmes d'amour passionnés, mais une déception l'a poussé à se réfugier dans l'alcool et l'isolement. Malgré ses remarques désobligeantes, Lena ne baisse pas les bras et tente de raviver sa créativité, car elle croit aux secondes chances.",
      bandeAnnonce: "https://www.youtube.com/watch?v=9V-duM99N58",
      img: "",
      seances: { 1: ["18:00"], 3: ["20:30"], 5: ["18:00"], 7: ["17:00"] },
    },
    {
      id: "le-dernier-pour-la-route", titre: "Le Dernier pour la route", realisateur: "Francesco Sossai", annee: 2025,
      pays: "Italie", duree: 98, langue: "VO, st. français", age: "16/16 ans",
      synopsis: "Carlobianchi et Doriano, deux cinquantenaires fauchés, errent la nuit en voiture de bar en bar, obsédés par l'idée d'un dernier verre, lorsqu'ils croisent la route de Giulio, un étudiant en architecture aussi timide que naïf. Entre confidences et gueule de bois, cette rencontre inattendue avec ces deux mentors improbables va bouleverser la vision que Giulio porte sur le monde, l'amour et son avenir.",
      bandeAnnonce: "https://www.youtube.com/watch?v=X8uIpic_AyM",
      img: "le-dernier-pour-la-route.jpg",
      seances: { 2: ["18:30"], 4: ["20:30"], 6: ["20:30"], 7: ["14:30"] },
    },
    {
      id: "de-la-comedie-francaise", titre: "De la Comédie Française", realisateur: "Bertrand Usclat & Martin Darondeau", annee: 2026,
      pays: "France", duree: 75, langue: "VF", age: "10/12 ans",
      synopsis: "Dans 3 heures, Nina dévoile sa première mise en scène à la Comédie-Française. Mais dans l'agitation des dernières répétitions, rien ne se passe comme prévu : retards, coups de stress, problèmes techniques et problèmes d'égo secouent la troupe. Pourtant, Nina n'a pas d'autre choix que d'aller jusqu'au bout car s'il y a bien une règle d'or à la Comédie-Française, c'est qu'on n'annule pas.",
      bandeAnnonce: "https://www.youtube.com/watch?v=8A2MVXcMhQQ",
      img: "de-la-comedie-francaise.jpg",
      seances: { 1: ["20:30"], 2: ["16:30"], 5: ["20:30"], 6: ["18:00"] },
    },
    {
      id: "les-matins-merveilleux", titre: "Les Matins merveilleux", realisateur: "Avril Besson", annee: 2026,
      pays: "France", duree: 86, langue: "VF", age: "12/16 ans",
      synopsis: "De vieux vinyles disco dans le coffre de sa Twingo, à peine remise de la mort de sa grand-mère, Charlie roule. Elle ne sait pas encore que ces disques ressusciteront les pas de danse de sa mère dans les yeux humides de Titou, caviste rêveur, ni qu'une plage méditerranéenne désertée sera le théâtre de sa rencontre avec Marina. Pour l'instant, elle roule.",
      bandeAnnonce: "https://www.youtube.com/watch?v=6rG0jikzSM4",
      img: "les-matins-merveilleux.jpg",
      seances: { 3: ["17:00"], 4: ["18:00"], 6: ["16:00"], 7: ["19:30"] },
    },
    {
      id: "ah-que-le-bonheur-est-proche", titre: "Ah que le bonheur est proche !", realisateur: "François-Christophe Marzal", annee: 2026,
      pays: "Suisse", duree: 70, langue: "VF", age: "16/16 ans",
      synopsis: "À 85 ans, Jean-Luc doit incarner le personnage de Don Quichotte sur la scène d'un théâtre prestigieux. Hélas, ses défaillances mémorielles contraignent la production à engager une doublure. Peu à peu, le vieil acteur se persuade que ladite doublure complote pour prendre sa place.",
      bandeAnnonce: "https://www.youtube.com/watch?v=TqFkuyKAOHc",
      img: "ah-que-le-bonheur-est-proche.jpg",
      seances: { 2: ["20:30"], 5: ["16:30"], 7: ["16:30"] },
    },
  ],

  /* ---------------- RADIO — EXEMPLES ---------------- */
  emissions: [
    { jour: 1, heure: "17:00", duree: 120, titre: "Le Lundi du Minimum", texte: "La playlist de la maison, du réveil au dernier métro." },
    { jour: 2, heure: "18:00", duree: 60, titre: "Écran Large", texte: "On parle des films de la semaine avec celles et ceux qui les voient." },
    { jour: 3, heure: "19:00", duree: 120, titre: "Sillons", texte: "Disques rares, disques oubliés, disques à partager." },
    { jour: 4, heure: "18:00", duree: 60, titre: "Carte blanche", texte: "Une personne invitée, une heure, zéro contrainte." },
    { jour: 5, heure: "20:00", duree: 120, titre: "Avant la nuit", texte: "L'échauffement avant le club, en direct de la salle." },
    { jour: 6, heure: "14:00", duree: 180, titre: "Samedi Minimum", texte: "Un après-midi de musique, de rencontres et de bruits en tout genre." },
    { jour: 7, heure: "16:00", duree: 120, titre: "Bande originale", texte: "Les musiques de films, de A à Z." },
  ],

  /* ---------------- CLUB — EXEMPLES ---------------- */
  soirees: [
    { jour: 5, heure: "23:00", nom: "Minimum Club", artistes: "Résident·es + invité·e", entree: "À confirmer" },
    { jour: 6, heure: "23:00", nom: "Minimum Club", artistes: "Deux DJ, une nuit", entree: "À confirmer" },
  ],

  rendezVous: [
    { titre: "Le mardi du minimum", texte: "Une séance, un film, une discussion après la projection." },
    { titre: "Carte blanche", texte: "Chaque mois, une personne choisit le film, le disque ou la soirée." },
    { titre: "Séance du dimanche", texte: "Un film pour toute la famille, en fin d'après-midi." },
  ],

  location: {
    texte: "La salle se loue pour une projection privée, une avant-première, une soirée ou un anniversaire. Dites-nous la date, le nombre de personnes et ce que vous voulez projeter ou jouer.",
  },
};
