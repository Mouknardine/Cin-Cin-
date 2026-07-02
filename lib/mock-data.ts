/**
 * Contenu d'exemple affiché tant qu'aucun projet Sanity n'est branché
 * (NEXT_PUBLIC_SANITY_PROJECT_ID vide) ou tant qu'un type de contenu est
 * encore vide dans le Studio. À remplacer par le vrai contenu du client —
 * zinema.ch n'a pas pu être consulté depuis cet environnement (accès
 * réseau restreint), ce texte est donc volontairement générique.
 */
import type { Announcement, Film, HistoryEntry, Screening, SiteSettings } from "@/lib/types";

const iso = (d: string) => d;

export const mockFilms: Film[] = [
  {
    _id: "film-1",
    title: "La Ligne de Crête",
    slug: "la-ligne-de-crete",
    director: "Aline Voisard",
    year: 2026,
    country: "Suisse / France",
    duration: 104,
    language: "VO français",
    subtitles: "st all/en",
    ageRating: "10 ans",
    genres: ["Drame", "Premier film"],
    status: "a-laffiche",
    synopsis:
      "Dans le Jura vaudois, une factrice hérite de la ferme familiale et doit choisir entre la vendre à un promoteur ou reprendre un métier qu'elle a fui vingt ans plus tôt. Un premier film sec et lumineux, tourné à quelques kilomètres de Lausanne.",
    posterSize: "large",
    featuredHome: true,
    poster: {},
    trailerUrl: "",
    price: "16.- / 12.- (réduit)",
    sumupCheckoutUrl: "#",
  },
  {
    _id: "film-2",
    title: "Les Villes Invisibles",
    slug: "les-villes-invisibles",
    director: "Teo Marchetti",
    year: 2025,
    country: "Italie",
    duration: 96,
    language: "VO italien",
    subtitles: "st fr",
    ageRating: "Tous publics",
    genres: ["Documentaire", "Architecture"],
    status: "a-laffiche",
    synopsis:
      "Un tour d'Italie des grands ensembles abandonnés des années 60, filmés comme des cathédrales. Une méditation documentaire sur la ruine et la beauté involontaire du béton.",
    posterSize: "medium",
    featuredHome: true,
    poster: {},
    trailerUrl: "",
    price: "16.- / 12.- (réduit)",
  },
  {
    _id: "film-3",
    title: "Nuit Blanche à Kyōbashi",
    slug: "nuit-blanche-a-kyobashi",
    director: "Rie Fukunaga",
    year: 2025,
    country: "Japon",
    duration: 118,
    language: "VO japonais",
    subtitles: "st fr/all",
    ageRating: "14 ans",
    genres: ["Thriller", "Néo-noir"],
    status: "a-laffiche",
    synopsis:
      "Un comptable de nuit devient malgré lui le témoin d'un règlement de comptes dans le quartier des affaires de Tōkyō. Néo-noir hypnotique, lauréat du prix de la mise en scène à Locarno.",
    posterSize: "medium",
    featuredHome: true,
    poster: {},
    trailerUrl: "",
    sumupCheckoutUrl: "#",
    price: "16.- / 12.- (réduit)",
  },
  {
    _id: "film-4",
    title: "Petites Solidarités",
    slug: "petites-solidarites",
    director: "Camille Ott & Yannick Perret",
    year: 2026,
    country: "Suisse",
    duration: 82,
    language: "VO français",
    subtitles: "st all",
    ageRating: "Tous publics",
    genres: ["Documentaire", "Local"],
    status: "avant-premiere",
    synopsis:
      "Avant-première en présence des réalisateur·rice·s. Une année dans une épicerie coopérative du quartier sous-gare : portrait choral d'un lieu qui résiste à l'air du temps.",
    posterSize: "small",
    poster: {},
    trailerUrl: "",
  },
  {
    _id: "film-5",
    title: "L'Été des Machines",
    slug: "lete-des-machines",
    director: "Noor Haddad",
    year: 2025,
    country: "Liban / Belgique",
    duration: 91,
    language: "VO arabe",
    subtitles: "st fr",
    ageRating: "12 ans",
    genres: ["Comédie dramatique"],
    status: "a-laffiche",
    synopsis:
      "Trois frères tentent de faire tourner l'atelier de réparation hérité de leur père pendant une panne d'électricité qui n'en finit pas. Comédie douce-amère très remarquée à Cannes.",
    posterSize: "medium",
    poster: {},
    trailerUrl: "",
    price: "16.- / 12.- (réduit)",
  },
  {
    _id: "film-6",
    title: "Rouge Cadmium",
    slug: "rouge-cadmium",
    director: "Ester Bregman",
    year: 1974,
    country: "Suisse",
    duration: 88,
    language: "VO français",
    subtitles: "",
    ageRating: "16 ans",
    genres: ["Ciné-club", "Rétrospective"],
    status: "cycle",
    synopsis:
      "Cycle « Cinéastes suisses oubliées » — copie restaurée. Une peintre lausannoise règle ses comptes avec le milieu de l'art dans ce film rare, présenté avec une introduction du Zinéma.",
    posterSize: "small",
    poster: {},
    trailerUrl: "",
  },
  {
    _id: "film-7",
    title: "Grand Bal",
    slug: "grand-bal",
    director: "Miloud Kessi",
    year: 2026,
    country: "France",
    duration: 76,
    language: "Sans dialogue",
    subtitles: "",
    ageRating: "Tous publics",
    genres: ["Jeune public", "Animation"],
    status: "prochainement",
    synopsis:
      "Un bal de village où chaque danseur devient, le temps d'une valse, une créature différente. Ciné-goûter dès 6 ans, à partir du 14 juillet.",
    posterSize: "small",
    poster: {},
    trailerUrl: "",
  },
  {
    _id: "film-8",
    title: "Sous le Lac",
    slug: "sous-le-lac",
    director: "Anaïs Delacroix",
    year: 2025,
    country: "Suisse",
    duration: 99,
    language: "VO français",
    subtitles: "st en",
    ageRating: "12 ans",
    genres: ["Drame", "Léman"],
    status: "a-laffiche",
    synopsis:
      "Une plongeuse scientifique enquête sur la disparition de son frère au fond du Léman. Tourné en partie sur les quais d'Ouchy, un thriller intime porté par une photographie aquatique somptueuse.",
    posterSize: "large",
    featuredHome: true,
    poster: {},
    trailerUrl: "",
    sumupCheckoutUrl: "#",
    price: "16.- / 12.- (réduit)",
  },
];

const day = (offset: number) => {
  const base = new Date("2026-07-01T00:00:00");
  base.setDate(base.getDate() + offset);
  return base.toISOString().slice(0, 10);
};

export const mockScreenings: Screening[] = [
  { _id: "s1", date: day(0), time: "18:15", room: "Salle 1", status: "disponible", film: ref(mockFilms[0]) },
  { _id: "s2", date: day(0), time: "20:45", room: "Salle 1", status: "disponible", film: ref(mockFilms[2]) },
  { _id: "s3", date: day(0), time: "18:30", room: "Salle 2", status: "complet", film: ref(mockFilms[4]) },
  { _id: "s4", date: day(1), time: "18:00", room: "Salle 1", status: "disponible", film: ref(mockFilms[1]) },
  { _id: "s5", date: day(1), time: "20:30", room: "Salle 1", status: "disponible", film: ref(mockFilms[0]) },
  { _id: "s6", date: day(1), time: "20:15", room: "Salle 2", status: "disponible", film: ref(mockFilms[7]) },
  { _id: "s7", date: day(2), time: "18:15", room: "Salle 1", status: "disponible", film: ref(mockFilms[2]) },
  {
    _id: "s8",
    date: day(2),
    time: "20:30",
    room: "Salle 2",
    status: "disponible",
    versionNote: "Avant-première + rencontre",
    film: ref(mockFilms[3]),
  },
  { _id: "s9", date: day(3), time: "18:30", room: "Salle 1", status: "annule", film: ref(mockFilms[4]) },
  { _id: "s10", date: day(3), time: "20:45", room: "Salle 1", status: "disponible", film: ref(mockFilms[7]) },
  {
    _id: "s11",
    date: day(3),
    time: "18:00",
    room: "Salle 2",
    status: "disponible",
    versionNote: "Ciné-club — copie restaurée",
    film: ref(mockFilms[5]),
  },
  { _id: "s12", date: day(4), time: "18:15", room: "Salle 1", status: "disponible", film: ref(mockFilms[0]) },
  { _id: "s13", date: day(4), time: "20:30", room: "Salle 1", status: "disponible", film: ref(mockFilms[2]) },
  { _id: "s14", date: day(4), time: "18:30", room: "Salle 2", status: "disponible", film: ref(mockFilms[1]) },
  { _id: "s15", date: day(5), time: "16:00", room: "Salle 2", status: "disponible", versionNote: "Ciné-goûter dès 6 ans", film: ref(mockFilms[6]) },
  { _id: "s16", date: day(5), time: "18:15", room: "Salle 1", status: "disponible", film: ref(mockFilms[7]) },
  { _id: "s17", date: day(5), time: "20:45", room: "Salle 1", status: "disponible", film: ref(mockFilms[0]) },
  { _id: "s18", date: day(6), time: "11:00", room: "Salle 1", status: "disponible", versionNote: "Brunch-ciné", film: ref(mockFilms[4]) },
  { _id: "s19", date: day(6), time: "18:00", room: "Salle 2", status: "disponible", film: ref(mockFilms[2]) },
  { _id: "s20", date: day(6), time: "20:30", room: "Salle 1", status: "disponible", film: ref(mockFilms[7]) },
];

function ref(f: Film) {
  return { _id: f._id, title: f.title, slug: f.slug, director: f.director, poster: f.poster };
}

for (const f of mockFilms) {
  f.screenings = mockScreenings.filter((s) => s.film?._id === f._id);
}

mockFilms[0].review = {
  _id: "r1",
  quote:
    "Un film qui prend son temps et le nôtre — la plus belle surprise suisse de l'année.",
  author: "M. Renevey",
  source: "Le Courrier",
};
mockFilms[2].review = {
  _id: "r2",
  quote: "Une tension qui ne relâche jamais, portée par une mise en scène chirurgicale.",
  author: "J. Bovier",
  source: "24 heures",
};
mockFilms[7].review = {
  _id: "r3",
  quote: "Le Léman n'a jamais été aussi inquiétant. Sidérant.",
  author: "L. Guignard",
  source: "Radio Django",
};

export const mockAnnouncements: Announcement[] = [
  {
    _id: "a1",
    title: "Cycle « Cinéastes suisses oubliées » — tout l'été",
    slug: "cycle-cineastes-suisses-oubliees",
    category: "cycle",
    date: iso(day(-3)),
    excerpt:
      "Chaque mardi, une copie restaurée d'un film suisse réalisé par une femme et sorti des radars. Entrée libre pour les moins de 18 ans.",
    pinned: true,
  },
  {
    _id: "a2",
    title: "Brunch-ciné, un dimanche par mois",
    slug: "brunch-cine",
    category: "brunch",
    date: iso(day(-10)),
    excerpt:
      "Buffet dès 10h30, film à 11h. Réservation conseillée, places limitées à 40 personnes.",
  },
  {
    _id: "a3",
    title: "Le Zinéma recrute des bénévoles pour la billetterie",
    slug: "recrutement-benevoles",
    category: "info",
    date: iso(day(-14)),
    excerpt:
      "Envie de filer un coup de main quelques soirs par mois ? Écrivez-nous, on adore les gens qui aiment le cinéma autant que nous.",
  },
  {
    _id: "a4",
    title: "Nouvelle carte d'abonnement à prix libre",
    slug: "nouvelle-carte-abonnement",
    category: "nouveaute",
    date: iso(day(-20)),
    excerpt:
      "Dix entrées, prix libre entre 90.- et 140.-. Parce qu'un cinéma de quartier doit rester accessible à tout le quartier.",
  },
];

export const mockHistory: HistoryEntry[] = [
  {
    _id: "h1",
    year: "2001",
    title: "Ouverture, contre le courant",
    order: 1,
    body: "Le Zinéma ouvre ses portes à une époque où les grandes salles lausannoises multiplient les écrans en réduisant leur nombre de sièges. Le pari inverse : une salle généreuse, pensée pour rassembler plutôt que fragmenter.",
  },
  {
    _id: "h2",
    year: "2006",
    title: "Premier cycle de reprises",
    order: 2,
    body: "Le cinéma se fait connaître pour ses cycles thématiques et ses avant-premières accompagnées de rencontres, à contre-courant du multiplexe standardisé.",
  },
  {
    _id: "h3",
    year: "2013",
    title: "Rénovation et deuxième salle",
    order: 3,
    body: "Agrandissement du lieu avec une seconde salle, sans jamais sacrifier le confort ni l'intimité qui font la réputation du Zinéma.",
  },
  {
    _id: "h4",
    year: "2020",
    title: "La salle comme bien commun",
    order: 4,
    body: "Face à la crise, le Zinéma renforce ses liens avec les associations du quartier et invente de nouveaux formats : brunchs-ciné, ciné-clubs, projections scolaires.",
  },
  {
    _id: "h5",
    year: "2026",
    title: "Toujours avant-gardiste",
    order: 5,
    body: "Vingt-cinq ans après son ouverture, le Zinéma continue de défendre l'idée qu'un cinéma indépendant se juge à la qualité de son accueil autant qu'à celle de sa programmation.",
  },
];

export const mockSiteSettings: SiteSettings = {
  historyIntro:
    "Pendant que les grandes salles rétrécissaient leurs rangées pour multiplier les écrans, le Zinéma a fait le pari inverse : une salle généreuse, pensée pour rassembler un public plutôt que le fragmenter en micro-écrans.",
  tagline: "Cinéma indépendant à Lausanne",
  seoDescription:
    "Le Zinéma, cinéma indépendant à Lausanne : films en VO, avant-premières, ciné-club et brunchs-ciné.",
  address: "Rue à préciser 00, 1000 Lausanne",
  phone: "021 000 00 00",
  email: "billetterie@zinema.ch",
  openingHours: [
    { label: "Caisse, tous les jours", value: "dès 30 min avant la première séance" },
    { label: "Bureau", value: "lu–ve, 10h–18h" },
  ],
  mapUrl: "https://www.openstreetmap.org/",
  socialLinks: [
    { label: "Instagram", url: "https://instagram.com" },
    { label: "Facebook", url: "https://facebook.com" },
  ],
};
