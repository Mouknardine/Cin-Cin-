/* ============================================================
   Minimum — TOUT le contenu du site vit dans ce fichier.
   C'est le seul à modifier : coordonnées, tarifs, films et
   séances, radio, club.

   Cinéma : programme, tarifs et coordonnées repris de
   cineminimum.ch (semaine 47, du 18 au 24 novembre 2026).
   Chaque séance est une date réelle : « 2026-11-19 », « 19:00 ».
   Radio et club : ⚠ EXEMPLES, à remplacer par les vrais contenus.
   ============================================================ */
window.MIN = {
  config: {
    nom: "Minimum",
    nomLong: "Cinéma Minimum",
    ville: "Neuchâtel",
    adresse: ["Quai Philippe-Godet 20", "2000 Neuchâtel"],
    lieu: "La Case à Chocs (ancienne Brasserie Müller)",
    salle: "Salle Anaïs Emery",
    telephone: "032 545 37 37",
    telephoneBureau: "076 567 12 91",
    courriel: "cineminimum@gmail.com",
    instagram: "",
    facebook: "",
    billets: "Pas de réservation : les billets sont en vente à la buvette 15 minutes avant la séance.",
    paiement: "Pas de carte bancaire : paiement en espèces ou par Twint.",
    // Radio : ⚠ exemples. Adresse du flux direct (https://…/live.mp3), vide = « bientôt ».
    radioNom: "Radio Minimum",
    radioFlux: "",
    // Club : ⚠ exemples.
    clubEntree: "À confirmer",
    clubPorte: "À confirmer",
    clubRegles: "Ici on danse, on écoute, on respecte. Aucune discrimination, aucun harcèlement.",
  },

  tarifs: [
    { nom: "Tarif ordinaire", prix: "16.-", note: "" },
    { nom: "AVS, AI, chômeur·euse·s", prix: "14.-", note: "" },
    { nom: "Réduit", prix: "10.-", note: "Membres de soutien, abonné·e·s au journal Le Courrier, étudiant·e·s, Carte Culture Caritas" },
    { nom: "Carte annuelle", prix: "60.-", note: "Membre de soutien, avec une boisson sans alcool offerte à chaque projection" },
    { nom: "AG Culturel", prix: "0.-", note: "" },
  ],

  location: {
    texte: "Projections privées à la demande, pour 40 personnes au maximum (6 au minimum), dès 25.- par personne. Vous louez notre salle pour voir le film de votre choix.",
  },

  /* ---------------- CINÉMA ----------------
     seances : liste de [date, heure]. */
  films: [
    {
      id: "mr-nobody-against-putin", titre: "Mr. Nobody Against Putin", realisateur: "David Borenstein & Pavel Ilyich Talankin",
      genre: "Documentaire", annee: 2025, pays: "Danemark-Tchéquie-Allemagne", duree: 90, langue: "VOSTFR", age: "16/16 ans",
      mention: "Meilleur documentaire — Oscar 2026",
      synopsis: "Quand la Russie envahit l'Ukraine, les écoles du pays sont envahies par la propagande d'État et l'idéologie militariste. Pasha, enseignant et vidéographe dans une petite ville de l'Oural, se retrouve chargé de documenter les séances d'éducation patriotique imposées par Moscou. Pendant deux ans, il filme clandestinement ce qu'il se passe vraiment : l'endoctrinement des enfants, les exercices militaires, le départ des élèves vers le front. Un acte de résistance courageux qui finit par mettre sa vie en danger.",
      bandeAnnonce: "https://www.youtube.com/watch?v=qufodzXdabg", lien: "https://letsdoc.ch/fr/pro/films/mr-nobody-against-putin",
      img: "mr-nobody-against-putin.jpg",
      seances: [["2026-11-17", "19:00"], ["2026-11-19", "19:00"], ["2026-11-23", "19:00"]],
    },
    {
      id: "garance", titre: "Garance", realisateur: "Jeanne Herry",
      genre: "Fiction", annee: 2026, pays: "France", duree: 105, langue: "VF", age: "10/10 ans",
      mention: "",
      synopsis: "Garance est une jeune actrice alcoolique. Huit années marquées par les déménagements, le travail, les rencontres, les fêtes et les angoisses, mais aussi par les joies et les épreuves. Un parcours traversé par une révolution intime, amicale et sexuelle, dans un chaos où se mêlent liberté, excès, amour et destruction.",
      bandeAnnonce: "https://www.youtube.com/watch?v=kgG4W6-RZyQ&t=89s", lien: "https://cineuropa.org/fr/newsdetail/491552/",
      img: "garance.jpg",
      seances: [["2026-11-17", "21:00"], ["2026-11-18", "21:00"], ["2026-11-21", "21:00"]],
    },
    {
      id: "nicole-nicole", titre: "Nicole Nicole", realisateur: "Lauren Dällenbach",
      genre: "Documentaire", annee: 2026, pays: "Suisse", duree: 94, langue: "VOSTFR", age: "16/16 ans",
      mention: "",
      synopsis: "Depuis plus de 50 ans, Nicole et sa mère Alberte partagent leur quotidien dans la maison familiale où le temps semble s'être arrêté. Alberte redoute de se retrouver seule et Nicole — limitée dans son autonomie — n'a jamais pu prendre son envol, malgré les encouragements répétés de sa sœur Danielle. C'est alors que la nièce de Nicole, Lauren, sort sa caméra et devient le moteur d'un parcours d'émancipation aussi touchant que réjouissant.",
      bandeAnnonce: "https://www.youtube.com/watch?v=LTNtRLSrizE", lien: "https://www.rts.ch/info/culture/cinema/2026/article/nicole-nicole-le-film-de-lauren-dallenbach-sur-sa-tante-atypique-29399567.html",
      img: "nicole-nicole.jpg",
      seances: [["2026-11-18", "19:00"], ["2026-11-24", "19:00"]],
    },
    {
      id: "dentro", titre: "Dentro", realisateur: "Elsa Amiel",
      genre: "Documentaire", annee: 2026, pays: "France", duree: 94, langue: "VOSTFR", age: "16/16 ans",
      mention: "",
      synopsis: "La prison de Volterra en Toscane accueille une pratique artistique unique : c'est entre ses murs qu'Armando Punzo s'enferme depuis trois décennies avec des hommes condamnés à de longues peines, pour y créer ses spectacles. Elsa Amiel noue ici un magnifique dialogue entre théâtre et cinéma pour mieux transformer l'espace carcéral en une paradoxale expérience de liberté et de pensée.",
      bandeAnnonce: "https://www.youtube.com/watch?v=Me118VCUlcI", lien: "https://film-fest-report.com/visions-du-reel-2026-dentro-real-elsa-amiel-critique/",
      img: "dentro.jpg",
      seances: [["2026-11-19", "21:00"]],
    },
    {
      id: "lost-land", titre: "Lost Land", realisateur: "Akio Fujimoto",
      genre: "Fiction", annee: 2025, pays: "Myanmar", duree: 99, langue: "VOSTFR", age: "16/16 ans",
      mention: "Projection extraordinaire en partenariat avec Terre des Hommes",
      synopsis: "Somira et son petit frère Shafi quittent un camp rohingya pour rejoindre la Malaisie, où vit désormais une partie de leur famille dispersée. Premier long-métrage de fiction en langue rohingya, interprété presque exclusivement par des Rohingyas, Lost Land constitue une odyssée à la fois bouleversante et tendre, à hauteur d'enfant, qui donne un visage à tout un peuple apatride. Une œuvre indispensable, récompensée d'un Prix spécial du Jury à Venise.",
      bandeAnnonce: "https://www.youtube.com/watch?v=CQGQ9FsEu4E&t=1s", lien: "https://trigon-film.org/fr/films/lost-land/",
      img: "lost-land.jpg",
      seances: [["2026-11-20", "19:00"]],
    },
    {
      id: "enjoy-your-stay", titre: "Enjoy Your Stay", realisateur: "Dominique Locher & Mary Honeylyn Joy Alipo",
      genre: "Fiction", annee: 2026, pays: "Suisse", duree: 99, langue: "VOSTFR", age: "16/16 ans",
      mention: "Sortie — première en présence des réalisateur·ice·s le samedi 21 novembre à 19h",
      synopsis: "Luz, une femme de ménage philippine de 35 ans, vit sans papiers à Verbier (Valais) et travaille au noir dans des chalets de luxe. Lorsqu'elle apprend que son ex-mari cherche à obtenir l'exclusive garde de leur fille restée à Manille, elle doit d'urgence réunir une importante somme d'argent pour rembourser ses dettes et rentrer.",
      bandeAnnonce: "https://www.youtube.com/watch?v=ZVooUpk6XS0&t=2s", lien: "https://cineworx.ch/movie/enjoy-your-stay-2/",
      img: "enjoy-your-stay.jpg",
      seances: [["2026-11-21", "19:00"], ["2026-11-22", "17:00"], ["2026-11-23", "21:00"], ["2026-11-24", "21:00"]],
    },
    {
      id: "la-hype", titre: "La Hype — 2020 revisitée", realisateur: "Mike Wyniger",
      genre: "Documentaire", annee: 2026, pays: "Suisse", duree: 115, langue: "VOSTFR", age: "16/16 ans",
      mention: "Sortie — première en présence du réalisateur le dimanche 22 novembre à 19h",
      synopsis: "Pendant la pandémie, la population a été confrontée à des informations contradictoires, et même la communauté scientifique semblait souvent divisée. Quelques années plus tard, le recul permet de porter un regard neuf sur ces événements. Le journaliste et cinéaste Mike Wyniger revient sur les expériences vécues en 2020 et se demande quelles leçons on peut en tirer pour mieux gérer les crises futures.",
      bandeAnnonce: "https://www.youtube.com/watch?v=GWPRToUchGs", lien: "",
      img: "la-hype.jpg",
      seances: [["2026-11-22", "19:00"]],
    },
  ],

  /* ---------------- RADIO — ⚠ EXEMPLES ----------------
     Émissions hebdomadaires : jour 1 = lundi … 7 = dimanche. */
  emissions: [
    { jour: 1, heure: "17:00", duree: 120, titre: "Le Lundi du Minimum", texte: "La playlist de la maison, du réveil au dernier métro." },
    { jour: 2, heure: "18:00", duree: 60, titre: "Écran Large", texte: "On parle des films de la semaine avec celles et ceux qui les voient." },
    { jour: 3, heure: "19:00", duree: 120, titre: "Sillons", texte: "Disques rares, disques oubliés, disques à partager." },
    { jour: 4, heure: "18:00", duree: 60, titre: "Carte blanche", texte: "Une personne invitée, une heure, zéro contrainte." },
    { jour: 5, heure: "20:00", duree: 120, titre: "Avant la nuit", texte: "L'échauffement avant le club, en direct de la salle." },
    { jour: 6, heure: "14:00", duree: 180, titre: "Samedi Minimum", texte: "Un après-midi de musique, de rencontres et de bruits en tout genre." },
    { jour: 7, heure: "16:00", duree: 120, titre: "Bande originale", texte: "Les musiques de films, de A à Z." },
  ],
  /* Pistes du lecteur (comme une playlist). url vide = bientôt en ligne. */
  pistes: [
    { titre: "minimum_mix_1", artiste: "Radio Minimum", url: "" },
    { titre: "minimum_mix_2", artiste: "Radio Minimum", url: "" },
    { titre: "minimum_mix_3", artiste: "Radio Minimum", url: "" },
    { titre: "minimum_mix_4", artiste: "Radio Minimum", url: "" },
    { titre: "minimum_mix_5", artiste: "Radio Minimum", url: "" },
  ],

  /* ---------------- CLUB — ⚠ EXEMPLES ---------------- */
  soirees: [
    { jour: 5, heure: "23:00", nom: "Minimum Club", artistes: "Résident·es + invité·e" },
    { jour: 6, heure: "23:00", nom: "Minimum Club", artistes: "Deux DJ, une nuit" },
  ],
};
