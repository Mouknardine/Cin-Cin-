/* ============================================================
   Zinéma — accès au contenu (Sanity + repli sur contenu d'exemple)
   Lu directement dans le navigateur à chaque affichage de page :
   une publication dans le Studio Sanity apparaît donc en ligne
   immédiatement, sans jamais reconstruire ni redéployer le site.
   ============================================================ */
(function (global) {
  "use strict";

  // Renseigner ces deux valeurs une fois le projet Sanity créé
  // (voir SANITY.md). Tant que SANITY_PROJECT_ID est vide, le site
  // affiche le contenu d'exemple ci-dessous.
  var SANITY_PROJECT_ID = "g0k3smf3";
  var SANITY_DATASET = "production";
  var SANITY_API_VERSION = "2024-01-01";

  var isSanityConfigured = Boolean(SANITY_PROJECT_ID);

  /* ---------------- Billetterie en ligne ----------------
     false = comportement actuel : les boutons d'achat ouvrent le
             lien de paiement SumUp collé à la main dans Sanity.
     true  = nouvelle caisse : le site ouvre son panneau d'achat,
             le serveur crée le paiement et délivre le billet.

     À passer à true UNE FOIS que le site tourne sur un hébergement
     capable d'exécuter le dossier /api (Infomaniak) et que
     config.php y est rempli — voir BILLETTERIE.md. Avant ça, le
     panneau s'ouvrirait pour rien : il n'aurait personne à qui
     parler. */
  var BILLETTERIE_EN_LIGNE = false;

  /* ---------------- Tarifs ----------------
     Les deux seuls prix du cinéma, définis à un seul endroit et
     réutilisés partout (bouton d'achat, page Membership, contact).
     Un film ou une séance peut toujours indiquer son propre prix
     dans Sanity (soirée spéciale, ciné-goûter…) : il prend alors
     le pas sur ces tarifs. */
  var TARIFS = {
    plein: "16.-",
    reduit: "10.-",
    conditionsReduit: "AVS, AI, étudiant·e·s, apprenti·e·s, chômage",
    /* La ligne affichée sur le bouton d'achat. */
    resume: "16.- / 10.- réduit",
  };

  function sanityFetch(query, params) {
    if (!isSanityConfigured) return Promise.resolve(null);
    var base = "https://" + SANITY_PROJECT_ID + ".api.sanity.io/v" + SANITY_API_VERSION + "/data/query/" + SANITY_DATASET;
    var url = base + "?query=" + encodeURIComponent(query);
    if (params) {
      Object.keys(params).forEach(function (key) {
        url += "&$" + key + "=" + encodeURIComponent(JSON.stringify(params[key]));
      });
    }
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("sanity fetch failed: " + res.status);
        return res.json();
      })
      .then(function (json) {
        return json.result;
      })
      .catch(function () {
        // Réseau, CORS non configuré, ou projet invalide : on retombe
        // silencieusement sur le contenu d'exemple, jamais de page vide.
        return null;
      });
  }

  function withFallback(query, params, fallback) {
    return sanityFetch(query, params).then(function (result) {
      if (result == null) return fallback;
      if (Array.isArray(result) && result.length === 0) return fallback;
      return result;
    });
  }

  var filmFields =
    "_id,title,\"slug\":slug.current,originalTitle,director,year,country,duration,language,subtitles,ageRating,genres,status,synopsis,posterSize,featuredHome,poster,stillImages,trailerUrl,price,sumupCheckoutUrl,\"review\":review->{_id,quote,author,source,url}";
  var screeningFields =
    "_id,date,time,room,versionNote,status,price,sumupCheckoutUrl,\"film\":film->{_id,title,\"slug\":slug.current,director,poster}";

  var queries = {
    films: "*[_type == \"film\"] | order(status asc, year desc) {" + filmFields + "}",
    filmBySlug:
      "*[_type == \"film\" && slug.current == $slug][0]{" +
      filmFields +
      ",\"screenings\": *[_type == \"screening\" && references(^._id)] | order(date asc, time asc) {" +
      screeningFields +
      "}}",
    screenings: "*[_type == \"screening\"] | order(date asc, time asc) {" + screeningFields + "}",
    announcements:
      "*[_type == \"announcement\"] | order(pinned desc, date desc) {_id,title,\"slug\":slug.current,category,date,image,excerpt,body,linkUrl,pinned}",
    history: "*[_type == \"historyEntry\"] | order(order asc) {_id,year,title,body,image,order}",
    siteSettings:
      "*[_type == \"siteSettings\"][0]{tagline,seoDescription,historyIntro,address,phone,phoneSecondary,email,openingHours,accessInfo,mapUrl,socialLinks}",
  };

  /* ---------------- Contenu d'exemple ---------------- */
  /* Les dates d'exemple sont relatives à aujourd'hui : le programme
     de démonstration montre ainsi toujours des séances à venir. */
  function dayOffset(offset) {
    var base = new Date();
    base.setHours(12, 0, 0, 0);
    base.setDate(base.getDate() + offset);
    return base.toISOString().slice(0, 10);
  }

  function ref(f) {
    return { _id: f._id, title: f.title, slug: f.slug, director: f.director, poster: f.poster };
  }

  var mockFilms = [
    { _id: "film-1", title: "Cinque Secondi", slug: "cinque-secondi", director: "Paolo Virzì", year: 2025, country: "Italie", duration: 100, language: "VO italien", subtitles: "st fr", ageRating: "12 ans", genres: ["Comédie dramatique"], status: "a-laffiche", synopsis: "Un homme bourru retiré dans la campagne toscane voit sa tranquillité bousculée par une joyeuse communauté venue reprendre le vignoble voisin. Paolo Virzì réunit Valerio Mastandrea et Valeria Bruni Tedeschi dans une comédie humaine, tendre et mordante.", posterSize: "large", featuredHome: true, poster: { localUrl: "assets/img/affiches/cinque-secondi.jpg" }, trailerUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", price: TARIFS.resume, sumupCheckoutUrl: "#" },
    { _id: "film-2", title: "Wolves", slug: "wolves", director: "Jonas Ulrich", year: 2025, country: "Suisse", duration: 94, language: "VO suisse-allemand", subtitles: "st fr", ageRating: "14 ans", genres: ["Drame"], status: "a-laffiche", synopsis: "Deux êtres que tout rapproche et que tout menace, filmés au plus près des visages. Présenté au Zurich Film Festival, un premier long métrage suisse d'une intensité rare, porté par Selma Kopp et Bartosz Bielenia.", posterSize: "medium", featuredHome: true, poster: { localUrl: "assets/img/affiches/wolves.jpg" }, trailerUrl: "https://www.youtube.com/watch?v=eRsGyueVLvQ", sumupCheckoutUrl: "#", price: TARIFS.resume },
    { _id: "film-3", title: "Siri Hustvedt — Dance Around the Self", slug: "siri-hustvedt-dance-around-the-self", director: "Sabine Lidl", year: 2025, country: "Allemagne", duration: 90, language: "VO anglais/allemand", subtitles: "st fr", ageRating: "Tous publics", genres: ["Documentaire", "Portrait"], status: "a-laffiche", synopsis: "Un portrait intime de l'écrivaine Siri Hustvedt, entre New York et l'écriture, la mémoire et le deuil, avec la présence de Paul Auster. Présenté à la Berlinale (Panorama).", posterSize: "medium", featuredHome: true, poster: { localUrl: "assets/img/affiches/siri-hustvedt.jpg" }, trailerUrl: "https://www.youtube.com/watch?v=R6MlUcmOul8", sumupCheckoutUrl: "#", price: TARIFS.resume },
    { _id: "film-4", title: "La Vénus Électrique", slug: "la-venus-electrique", director: "Pierre Salvadori", year: 2026, country: "France", duration: 105, language: "VO français", subtitles: "st all", ageRating: "12 ans", genres: ["Comédie", "Music-hall"], status: "avant-premiere", synopsis: "Avant-première — film d'ouverture du Festival de Cannes 2026. Dans le Paris des années folles, une artiste de music-hall au numéro électrisant affole les scènes et les cœurs. Avec Pio Marmaï, Anaïs Demoustier, Gilles Lellouche et Vimala Pons.", posterSize: "small", poster: { localUrl: "assets/img/affiches/la-venus-electrique.jpg" }, trailerUrl: "https://www.youtube.com/watch?v=WhWc3b3KhnY", sumupCheckoutUrl: "#", price: TARIFS.resume },
    { _id: "film-5", title: "être paysan·ne", slug: "etre-paysan-ne", director: "Frédéric Gonseth & Catherine Azad", year: 2025, country: "Suisse", duration: 92, language: "VO français", subtitles: "st all", ageRating: "Tous publics", genres: ["Documentaire", "Local"], status: "a-laffiche", synopsis: "Des paysannes et paysans suisses racontent un métier en pleine mutation, entre attachement à la terre et mobilisation pour survivre. Un documentaire au plus près d'un monde qui lance son SOS.", posterSize: "medium", poster: { localUrl: "assets/img/affiches/etre-paysan-ne.jpg" }, trailerUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", sumupCheckoutUrl: "#", price: TARIFS.resume },
    { _id: "film-6", title: "Rouge Cadmium", slug: "rouge-cadmium", director: "Ester Bregman", year: 1974, country: "Suisse", duration: 88, language: "VO français", subtitles: "", ageRating: "16 ans", genres: ["Ciné-club", "Rétrospective"], status: "cycle", synopsis: "Cycle « Cinéastes suisses oubliées » — copie restaurée. Une peintre lausannoise règle ses comptes avec le milieu de l'art dans ce film rare, présenté avec une introduction du Zinéma.", posterSize: "small", poster: {}, trailerUrl: "https://www.youtube.com/watch?v=eRsGyueVLvQ", sumupCheckoutUrl: "#", price: TARIFS.resume },
    { _id: "film-7", title: "Grand Bal", slug: "grand-bal", director: "Miloud Kessi", year: 2026, country: "France", duration: 76, language: "Sans dialogue", subtitles: "", ageRating: "Tous publics", genres: ["Jeune public", "Animation"], status: "prochainement", synopsis: "Un bal de village où chaque danseur devient, le temps d'une valse, une créature différente. Ciné-goûter dès 6 ans, à partir du 14 juillet.", posterSize: "small", poster: {}, trailerUrl: "https://www.youtube.com/watch?v=R6MlUcmOul8", sumupCheckoutUrl: "#", price: "10.- (ciné-goûter)" },
    { _id: "film-8", title: "Devenir Paysan", slug: "devenir-paysan", director: "Alexia Tissières", year: 2025, country: "Suisse", duration: 85, language: "VO français", subtitles: "st all", ageRating: "Tous publics", genres: ["Documentaire", "Portrait"], status: "a-laffiche", synopsis: "Le chemin d'un jeune homme qui choisit la terre : apprendre le métier, tenir une ferme, trouver sa place. Sélectionné aux Journées de Soleure, un documentaire lumineux sur une vocation à contre-courant.", posterSize: "large", featuredHome: true, poster: { localUrl: "assets/img/affiches/devenir-paysan.jpg" }, trailerUrl: "https://www.youtube.com/watch?v=WhWc3b3KhnY", sumupCheckoutUrl: "#", price: TARIFS.resume },
  ];

  var mockScreenings = [
    { _id: "s1", date: dayOffset(0), time: "18:15", room: "Salle 1", status: "disponible", film: ref(mockFilms[0]) },
    { _id: "s2", date: dayOffset(0), time: "20:45", room: "Salle 1", status: "disponible", film: ref(mockFilms[2]) },
    { _id: "s3", date: dayOffset(0), time: "18:30", room: "Salle 2", status: "complet", film: ref(mockFilms[4]) },
    { _id: "s4", date: dayOffset(1), time: "18:00", room: "Salle 1", status: "disponible", film: ref(mockFilms[1]) },
    { _id: "s5", date: dayOffset(1), time: "20:30", room: "Salle 1", status: "disponible", film: ref(mockFilms[0]) },
    { _id: "s6", date: dayOffset(1), time: "20:15", room: "Salle 2", status: "disponible", film: ref(mockFilms[7]) },
    { _id: "s7", date: dayOffset(2), time: "18:15", room: "Salle 1", status: "disponible", film: ref(mockFilms[2]) },
    { _id: "s8", date: dayOffset(2), time: "20:30", room: "Salle 2", status: "disponible", versionNote: "Avant-première + rencontre", film: ref(mockFilms[3]) },
    { _id: "s9", date: dayOffset(3), time: "18:30", room: "Salle 1", status: "annule", film: ref(mockFilms[4]) },
    { _id: "s10", date: dayOffset(3), time: "20:45", room: "Salle 1", status: "disponible", film: ref(mockFilms[7]) },
    { _id: "s11", date: dayOffset(3), time: "18:00", room: "Salle 2", status: "disponible", versionNote: "Ciné-club — copie restaurée", film: ref(mockFilms[5]) },
    { _id: "s12", date: dayOffset(4), time: "18:15", room: "Salle 1", status: "disponible", film: ref(mockFilms[0]) },
    { _id: "s13", date: dayOffset(4), time: "20:30", room: "Salle 1", status: "disponible", film: ref(mockFilms[2]) },
    { _id: "s14", date: dayOffset(4), time: "18:30", room: "Salle 2", status: "disponible", film: ref(mockFilms[1]) },
    { _id: "s15", date: dayOffset(5), time: "16:00", room: "Salle 2", status: "disponible", versionNote: "Ciné-goûter dès 6 ans", film: ref(mockFilms[6]) },
    { _id: "s16", date: dayOffset(5), time: "18:15", room: "Salle 1", status: "disponible", film: ref(mockFilms[7]) },
    { _id: "s17", date: dayOffset(5), time: "20:45", room: "Salle 1", status: "disponible", film: ref(mockFilms[0]) },
    { _id: "s18", date: dayOffset(6), time: "11:00", room: "Salle 1", status: "disponible", versionNote: "Brunch-ciné", film: ref(mockFilms[4]) },
    { _id: "s19", date: dayOffset(6), time: "18:00", room: "Salle 2", status: "disponible", film: ref(mockFilms[2]) },
    { _id: "s20", date: dayOffset(6), time: "20:30", room: "Salle 1", status: "disponible", film: ref(mockFilms[7]) },
  ];

  mockFilms.forEach(function (f) {
    f.screenings = mockScreenings.filter(function (s) {
      return s.film && s.film._id === f._id;
    });
  });

  mockFilms[0].review = { _id: "r1", quote: "Virzì au sommet de son art : on rit, on serre les dents, on ressort réconcilié.", author: "M. Renevey", source: "Le Courrier", url: "#" };
  mockFilms[2].review = { _id: "r2", quote: "Un portrait d'une délicatesse rare, qui donne envie de relire toute son œuvre.", author: "J. Bovier", source: "24 heures", url: "#" };
  mockFilms[7].review = { _id: "r3", quote: "Un regard juste et lumineux sur celles et ceux qui nous nourrissent.", author: "L. Guignard", source: "Radio Django", url: "#" };

  var mockAnnouncements = [
    { _id: "a0", title: "La Coupe du monde sur grand écran, jusqu'au 19 juillet", slug: "coupe-du-monde-au-zinema", category: "evenement", date: dayOffset(-5), excerpt: "Tous les matchs en direct dans la grande salle, du 11 juin au 19 juillet. Entrée 6.-, une bière ou un soft offert, consigne 1.-. Ambiance garantie, hors-jeu commentés par la salle.", pinned: true, image: { localUrl: "assets/img/affiches/coupe-du-monde.jpg" } },
    { _id: "a1", title: "Cycle « Cinéastes suisses oubliées » — tout l'été", slug: "cycle-cineastes-suisses-oubliees", category: "cycle", date: dayOffset(-3), excerpt: "Chaque mardi, une copie restaurée d'un film suisse réalisé par une femme et sorti des radars. Entrée libre pour les moins de 18 ans.", pinned: true },
    { _id: "a2", title: "Brunch-ciné, un dimanche par mois", slug: "brunch-cine", category: "brunch", date: dayOffset(-10), excerpt: "Buffet dès 10h30, film à 11h. Réservation conseillée, places limitées à 40 personnes." },
    { _id: "a3", title: "Le Zinéma recrute des bénévoles pour la billetterie", slug: "recrutement-benevoles", category: "info", date: dayOffset(-14), excerpt: "Envie de filer un coup de main quelques soirs par mois ? Écrivez-nous, on adore les gens qui aiment le cinéma autant que nous." },
    { _id: "a4", title: "Nouvelle carte d'abonnement à prix libre", slug: "nouvelle-carte-abonnement", category: "nouveaute", date: dayOffset(-20), excerpt: "Dix entrées, prix libre entre 90.- et 140.-. Parce qu'un cinéma de quartier doit rester accessible à tout le quartier." },
  ];

  var mockHistory = [
    { _id: "h1", year: "2001", title: "Ouverture, contre le courant", order: 1, body: "Le Zinéma ouvre ses portes à une époque où les grandes salles lausannoises multiplient les écrans en réduisant leur nombre de sièges. Le pari inverse : une salle généreuse, pensée pour rassembler plutôt que fragmenter." },
    { _id: "h2", year: "2006", title: "Premier cycle de reprises", order: 2, body: "Le cinéma se fait connaître pour ses cycles thématiques et ses avant-premières accompagnées de rencontres, à contre-courant du multiplexe standardisé." },
    { _id: "h3", year: "2013", title: "Rénovation et deuxième salle", order: 3, body: "Agrandissement du lieu avec une seconde salle, sans jamais sacrifier le confort ni l'intimité qui font la réputation du Zinéma." },
    { _id: "h4", year: "2020", title: "La salle comme bien commun", order: 4, body: "Face à la crise, le Zinéma renforce ses liens avec les associations du quartier et invente de nouveaux formats : brunchs-ciné, ciné-clubs, projections scolaires." },
    { _id: "h5", year: "2026", title: "Toujours avant-gardiste", order: 5, body: "Vingt-cinq ans après son ouverture, le Zinéma continue de défendre l'idée qu'un cinéma indépendant se juge à la qualité de son accueil autant qu'à celle de sa programmation." },
  ];

  var mockSiteSettings = {
    historyIntro: "Pendant que les grandes salles rétrécissaient leurs rangées pour multiplier les écrans, le Zinéma a fait le pari inverse : une salle généreuse, pensée pour rassembler un public plutôt que le fragmenter en micro-écrans.",
    tagline: "Cinéma indépendant à Lausanne",
    seoDescription: "Le Zinéma, cinéma indépendant à Lausanne : films en VO, avant-premières, ciné-club et brunchs-ciné.",
    address: "Rue du Maupas 4, 1004 Lausanne",
    phone: "021 311 29 30",
    phoneSecondary: "076 567 12 91",
    email: "admin@zinema.ch",
    openingHours: [
      { label: "Caisse", value: "15 min avant chaque séance" },
      { label: "Billetterie", value: "En ligne ou sur place" },
      { label: "Tarifs", value: TARIFS.plein + " / " + TARIFS.reduit + " réduit" },
    ],
    socialLinks: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "Facebook", url: "https://facebook.com" },
    ],
  };

  /* ---------------- API publique ---------------- */
  var ZinemaData = {
    isSanityConfigured: isSanityConfigured,
    billetterieEnLigne: BILLETTERIE_EN_LIGNE,
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    tarifs: TARIFS,
    getFilms: function () {
      return withFallback(queries.films, {}, mockFilms);
    },
    getFilmBySlug: function (slug) {
      var fallback = mockFilms.filter(function (f) { return f.slug === slug; })[0] || null;
      if (!slug) return Promise.resolve(fallback);
      return withFallback(queries.filmBySlug, { slug: slug }, fallback);
    },
    getScreenings: function () {
      return withFallback(queries.screenings, {}, mockScreenings);
    },
    getAnnouncements: function () {
      return withFallback(queries.announcements, {}, mockAnnouncements);
    },
    getHistory: function () {
      return withFallback(queries.history, {}, mockHistory);
    },
    getSiteSettings: function () {
      return withFallback(queries.siteSettings, {}, mockSiteSettings);
    },
  };

  global.ZinemaData = ZinemaData;
})(window);
