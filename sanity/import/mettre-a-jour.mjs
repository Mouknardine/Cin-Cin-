/* ============================================================
   Met le Studio à l'heure du programme réel.

   Deux façons de le lancer, l'une sûre, l'autre définitive :

     node sanity/import/mettre-a-jour.mjs              → SIMULATION
     node sanity/import/mettre-a-jour.mjs --appliquer  → pour de vrai

   Sans « --appliquer », le script lit Sanity, dit exactement ce
   qu'il ferait, et n'écrit rien. C'est le mode par défaut : on
   regarde d'abord, on décide ensuite.

   Il lui faut un jeton d'écriture dans SANITY_WRITE_TOKEN. Le plus
   simple est de passer par l'onglet Actions de GitHub, où le jeton
   est déjà rangé : workflow « Mettre Sanity à jour ». Rien à
   installer sur son ordinateur.

   Ce que le script fait, dans l'ordre, en disant tout ce qu'il fait :

     1. il RECONNAÎT les films du programme déjà saisis — même sous
        un autre titre, en capitales, ou avec une autre adresse —
        et les corrige au lieu d'en créer un deuxième ;
     2. il CRÉE ceux qui manquent, avec leur affiche ;
     3. il RETIRE de l'affiche tous les autres films : ils passent
        en « Terminé », quittent le site, et restent consultables
        dans le Studio. Rien n'est supprimé ;
     4. il remet les TARIFS, les COORDONNÉES et les TEXTES DES PAGES,
        sans toucher au logo ni à l'image de partage déjà déposés ;
     5. il remplace la FRISE et les INFORMATIONS par les vraies, et
        supprime celles qui avaient été inventées pendant la mise au
        point du site. Sanity garde un historique : une suppression
        se rattrape depuis le Studio.

   Le lancer deux fois ne change rien de plus : il compare avant
   d'écrire.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@sanity/client";

import { FILMS, trierLesFilms } from "./programme.data.mjs";

/* Sans « --appliquer », on ne fait que regarder. */
const SIMULATION = !process.argv.includes("--appliquer");

const jeton = process.env.SANITY_WRITE_TOKEN;
if (!jeton) {
  console.error(
    "\n✗ Il manque le jeton d'écriture Sanity (SANITY_WRITE_TOKEN).\n" +
      "  Il se crée sur https://www.sanity.io/manage → projet vle63mzm →\n" +
      "  API → Tokens → Add API token, avec les droits « Editor ».\n"
  );
  process.exit(1);
}

const vraiClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "vle63mzm",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-06-01",
  token: jeton,
  useCdn: false, // on veut l'état réel, pas une copie de cache
});

/* En simulation, la lecture est vraie et l'écriture ne part jamais :
   même déroulé, même affichage, aucune conséquence. */
function clientDeSimulation(reel) {
  const patchSimule = () => {
    const api = { set: () => api, unset: () => api, commit: async () => {} };
    return api;
  };
  return {
    config: () => reel.config(),
    fetch: (...arguments_) => reel.fetch(...arguments_),
    assets: { upload: async (_type, _flux, o) => ({ _id: "simulation-" + o.filename }) },
    patch: patchSimule,
    createOrReplace: async () => {},
    createIfNotExists: async () => {},
    delete: async () => {},
  };
}

const client = SIMULATION ? clientDeSimulation(vraiClient) : vraiClient;

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER_AFFICHES = path.join(ICI, "affiches");

const dire = (...mots) => console.log(...mots);
const titre = (texte) => dire("\n" + texte + "\n" + "─".repeat(texte.length));

/* ---------------- L'affiche ----------------
   Sanity reconnaît un fichier déjà envoyé : relancer le script ne
   crée pas de deuxième copie de la même image. */
async function envoyerLAffiche(film) {
  if (!film.affiche) return null;
  const chemin = path.join(DOSSIER_AFFICHES, film.affiche);
  if (!fs.existsSync(chemin)) {
    dire(`   ⚠︎  affiche introuvable : ${film.affiche} — le film garde la sienne`);
    return null;
  }
  const image = await client.assets.upload("image", fs.createReadStream(chemin), {
    filename: film.affiche,
  });
  return {
    _type: "imageZinema",
    alt: film.alt,
    asset: { _type: "reference", _ref: image._id },
  };
}

/** Les champs d'un film, sans son affiche ni son adresse. */
function champsDuFilm(film) {
  const champs = {
    title: film.title,
    director: film.director,
    country: film.country,
    year: film.year,
    duration: film.duration,
    language: film.language,
    ageRating: film.ageRating,
    genres: film.genres,
    synopsis: film.synopsis,
    status: film.status,
    trailerUrl: film.trailerUrl,
  };
  if (film.subtitles) champs.subtitles = film.subtitles;
  return champs;
}

async function traiterLesFilms() {
  titre("Les films");

  const existants = await client.fetch(
    `*[_type == "film" && !(_id in path("drafts.**"))]{
       _id, title, status, "slug": slug.current, "aUneAffiche": defined(poster.asset)
     }`
  );
  dire(`${existants.length} film(s) dans le Studio.`);

  const { aMettreAJour, aCreer, aRetirer } = trierLesFilms(existants, FILMS);

  for (const { film, existant } of aMettreAJour) {
    const modification = client.patch(existant._id).set(champsDuFilm(film));
    /* Pas de citation de presse inventée sur une fiche du programme. */
    modification.unset(["review"]);
    /* On ne touche à l'adresse de la page que si elle n'en a pas :
       la changer casserait les liens déjà partagés. */
    if (!existant.slug) {
      modification.set({ slug: { _type: "slug", current: film.slug } });
    }
    const affiche = await envoyerLAffiche(film);
    if (affiche) modification.set({ poster: affiche });
    await modification.commit();
    const note = affiche
      ? "affiche remplacée"
      : existant.aUneAffiche
        ? "affiche conservée"
        : "sans affiche";
    dire(`   ✎ « ${existant.title} » → ${film.title} (${note})`);
  }

  for (const film of aCreer) {
    const affiche = await envoyerLAffiche(film);
    await client.createOrReplace({
      _id: "film-" + film.slug,
      _type: "film",
      slug: { _type: "slug", current: film.slug },
      ...champsDuFilm(film),
      ...(affiche ? { poster: affiche } : {}),
    });
    dire(`   + ${film.title}${affiche ? " (avec son affiche)" : " (sans affiche)"}`);
  }

  for (const film of aRetirer) {
    await client.patch(film._id).set({ status: "passe" }).commit();
    dire(`   − ${film.title} → Terminé (retiré du site, gardé dans le Studio)`);
  }

  if (!aRetirer.length) dire("   Aucun film à retirer.");

  return new Set([
    ...aMettreAJour.map(({ existant }) => existant._id),
    ...aCreer.map((film) => "film-" + film.slug),
  ]);
}

/* ---------------- Les séances ----------------
   Une séance survit à son film : la page Agenda les liste toutes, sans
   regarder si le film est encore à l'affiche. Retirer un film sans
   toucher à ses séances laisserait donc son titre à l'agenda. */
async function traiterLesSeances(filmsDuProgramme) {
  titre("Les séances à venir");

  const seances = await client.fetch(
    `*[_type == "screening" && date >= $aujourdhui && !(_id in path("drafts.**"))]
     | order(date asc, time asc){_id, date, time, "filmId": film._ref, "titre": film->title}`,
    { aujourdhui: new Date().toISOString().slice(0, 10) }
  );

  const aGarder = seances.filter((s) => filmsDuProgramme.has(s.filmId));
  const aSupprimer = seances.filter((s) => !filmsDuProgramme.has(s.filmId));

  if (!seances.length) {
    dire("   Aucune séance à venir.");
    return;
  }
  dire(`   ${seances.length} séance(s) à venir, dont ${aGarder.length} pour un film du programme.`);

  for (const seance of aSupprimer) {
    await client.delete(seance._id);
    await client.delete("drafts." + seance._id).catch(() => {});
  }
  if (aSupprimer.length) {
    const titres = [...new Set(aSupprimer.map((s) => s.titre || "film supprimé"))];
    dire(`   ✗ ${aSupprimer.length} séance(s) supprimée(s), celles de films qui quittent l'affiche :`);
    for (const t of titres) dire(`       ${t}`);
  }
}

/* ---------------- Les citations de presse ----------------
   Une citation rattachée à un film terminé ne s'affiche plus nulle
   part, mais encombre le Studio. */
async function traiterLesCritiques(filmsDuProgramme) {
  titre("Les citations de presse");
  /* Deux questions simples valent mieux qu'une requête savante : on
     demande les citations, puis celles qui servent encore. « Encore
     utilisée » se juge sur les films du programme, pas sur ce qui est
     à l'affiche à cet instant : les autres films sortent du site dans
     la foulée, leurs citations avec eux. */
  const [critiques, encoreUtilisees] = await Promise.all([
    client.fetch(`*[_type == "review" && !(_id in path("drafts.**"))]{_id, quote, source}`),
    client.fetch(`*[_type == "film" && _id in $ids && defined(review._ref)].review._ref`, {
      ids: [...filmsDuProgramme],
    }),
  ]);
  const gardees = new Set(encoreUtilisees || []);
  const orphelines = critiques.filter((critique) => !gardees.has(critique._id));
  if (!orphelines.length) {
    dire("   Rien à retirer.");
    return;
  }
  for (const critique of orphelines) {
    await client.delete(critique._id);
    await client.delete("drafts." + critique._id).catch(() => {});
    dire(`   ✗ supprimée : « ${String(critique.quote || "").slice(0, 60)}… » (${critique.source || "?"})`);
  }
}

/* ---------------- Le ménage ----------------
   Une fiche de film ne contient rien d'irremplaçable, SAUF son
   affiche : le titre, la réalisation et le synopsis se retapent en
   trente secondes, une affiche non. La règle est donc simple et sans
   risque : une fiche qui ne porte AUCUNE affiche déposée et qui n'est
   pas au programme s'en va pour de bon. Celles qui en portent une
   restent, en « Terminé » — invisibles sur le site, prêtes à revenir.

   Cela emporte aussi les brouillons jamais publiés, ces fiches vides
   nées d'un clic malheureux, que rien d'autre ne signale. */
async function traiterLeMenage(filmsDuProgramme) {
  titre("Le ménage dans les fiches");

  const garder = [...filmsDuProgramme];
  const garderBrouillons = garder.map((id) => "drafts." + id);

  const [aSupprimer, gardees] = await Promise.all([
    client.fetch(
      `*[_type == "film" && !(_id in $garder) && !(_id in $garderBrouillons)
         && !defined(poster.asset)]{_id, title, director, status}`,
      { garder, garderBrouillons }
    ),
    client.fetch(
      `*[_type == "film" && !(_id in $garder) && defined(poster.asset)]{
         _id, title, "affiche": poster.asset->originalFilename}`,
      { garder }
    ),
  ]);

  for (const film of gardees) {
    dire(`   = gardé : ${film.title} — porte une affiche (${film.affiche})`);
  }

  if (!aSupprimer.length) {
    dire("   Aucune fiche vide à retirer.");
    return;
  }

  /* L'ORDRE COMPTE : Sanity refuse de supprimer un document tant qu'un
     autre le désigne. Les séances de ces films — passées comprises —
     doivent donc partir AVANT eux, sinon la suppression est rejetée. */
  const identifiants = aSupprimer.map((f) => f._id.replace(/^drafts\./, ""));
  const seances = await client.fetch(
    `*[_type == "screening" && film._ref in $identifiants]._id`,
    { identifiants }
  );
  for (const id of seances) {
    await client.delete(id);
    await client.delete("drafts." + id).catch(() => {});
  }
  if (seances.length) dire(`   ✗ ${seances.length} séance(s) de ces films supprimée(s) d'abord.`);

  /* Une fiche qui résiste ne doit pas arrêter le ménage : on la
     signale, on passe à la suivante, et on dit à la fin qui reste. */
  const resistantes = [];
  for (const film of aSupprimer) {
    const nu = film._id.replace(/^drafts\./, "");
    try {
      await client.delete("drafts." + nu).catch(() => {});
      await client.delete(nu);
      const brouillon = film._id.startsWith("drafts.") ? " (brouillon jamais publié)" : "";
      dire(`   ✗ supprimé : ${film.title || "fiche sans titre"} — ${film.director || "sans réalisation"}${brouillon}`);
    } catch (erreur) {
      resistantes.push({ film, raison: erreur.message });
      dire(`   ⚠︎ gardé malgré tout : ${film.title} — ${erreur.message.split("\n")[0]}`);
    }
  }
  if (resistantes.length) {
    dire(`   ${resistantes.length} fiche(s) n'ont pas pu être supprimées : quelque chose les désigne encore.`);
  }
}

async function traiterLesReglages() {
  titre("Tarifs, coordonnées et formules");

  await client.createIfNotExists({ _id: "siteSettings", _type: "siteSettings" });
  await client
    .patch("siteSettings")
    .set({
      address: "Rue du Maupas 4\n1004 Lausanne",
      phone: "021 311 29 30",
      phoneSecondary: "076 567 12 91",
      email: "admin@zinema.ch",
      tarifPlein: 16,
      tarifReduit: 10,
      conditionsReduit: [
        "Membres de soutien de l'association Microciné",
        "Abonné·e·s au journal Le Courrier",
        "Étudiant·e·s",
        "Carte Culture Caritas",
      ],
      openingHours: [
        { _type: "horaire", _key: "caisse", label: "Billetterie", value: "Au bar, 15 minutes avant la séance" },
        { _type: "horaire", _key: "paiement", label: "Paiement", value: "Espèces, TWINT ou carte bancaire" },
      ],
      salles: [
        { _type: "salle", _key: "salle1", nom: "Salle 1", places: 18 },
        { _type: "salle", _key: "salle2", nom: "Salle 2", places: 14 },
        { _type: "salle", _key: "hall", nom: "Hall-Bar", places: 50 },
      ],
      seoDescription:
        "Cinéma d'art et essai rue du Maupas 4 à Lausanne : deux salles de 18 et 14 places, films en version originale et en français.",
    })
    .commit();
  dire("   ✎ Réglages du cinéma (le logo et l'image de partage sont conservés)");

  await client.createIfNotExists({ _id: "abonnements", _type: "abonnements" });
  await client
    .patch("abonnements")
    .set({
      formules: [
        {
          _type: "formule",
          _key: "membredesoutien",
          titre: "Carte annuelle — membre de soutien",
          prix: "60.- par an",
          texte: "La carte de soutien à l'association Microciné, valable une année.",
          avantages: [
            "Toutes les places à 10.-",
            "Une boisson sans alcool offerte à chaque projection",
          ],
        },
      ],
      beneficiaire: "Association Microciné",
      iban: "CH79 0900 0000 1725 7734 1",
      notePaiement:
        "Au cinéma, le paiement se fait en espèces, par TWINT ou par carte bancaire.",
    })
    .commit();
  dire("   ✎ Formules & paiement");
}

/* Une page : son identifiant, son titre d'onglet, son paragraphe
   d'introduction (facultatif) et sa description pour les moteurs de
   recherche.

   Il n'y a plus de « message quand la page est vide » : une rubrique
   sans contenu n'affiche rien du tout. Une case qui annonce qu'il n'y
   a rien prend autant de place qu'une vraie information et n'en
   apprend aucune. */
const PAGES = [
  ["home", "Zinéma — Cinéma d'art et essai à Lausanne", null,
   "Cinéma d'art et essai rue du Maupas 4 à Lausanne : deux salles de 18 et 14 places, films en version originale et en français."],
  ["films", "Films — Zinéma", null,
   "Les films à l'affiche et à venir au Zinéma, rue du Maupas 4 à Lausanne."],
  ["agenda", "Agenda — Zinéma", null,
   "Toutes les séances du Zinéma, jour par jour, salle par salle."],
  ["evenements", "Événements — Zinéma", null,
   "Séances spéciales, locations de salle et informations du Zinéma, à Lausanne."],
  ["histoire", "Histoire — Zinéma", null,
   "Le Zinéma, salle de cinéma fondée en juin 2001 par Laurent Serge Toplitsch, rue du Maupas à Lausanne."],
  ["membership", "Tarifs & carte de membre — Zinéma", null,
   "Tarifs du Zinéma : 16.- plein tarif, 10.- tarif réduit, carte annuelle de membre de soutien à 60.-."],
  ["contact", "Infos pratiques — Zinéma", null,
   "Adresse, téléphone, tarifs et accès du Zinéma, rue du Maupas 4 à 1004 Lausanne."],
];

async function traiterLesPages() {
  titre("Les textes des sept pages");
  for (const [pageId, titrePage, intro, seoDescription] of PAGES) {
    const id = "page-" + pageId;
    await client.createIfNotExists({ _id: id, _type: "page", pageId });
    const modification = client
      .patch(id)
      .set({ pageId, titre: titrePage, seoDescription })
      /* Reste des versions précédentes du site : le champ n'existe plus. */
      .unset(["messageVide"]);
    if (intro) modification.set({ intro });
    else modification.unset(["intro"]);
    await modification.commit();
    dire(`   ✎ ${pageId}`);
  }
}

/* Un paragraphe de texte, au format que Sanity attend. */
const bloc = (texte, cle) => ({
  _type: "block",
  _key: cle,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: cle + "s", text: texte, marks: [] }],
});

const FRISE = [
  {
    _id: "histoire-2001", order: 1, year: "2001", title: "Ouverture",
    body: [
      bloc("Le Zinéma est fondé en juin 2001 par Laurent Serge Toplitsch, à la rue du Maupas 4.", "h1a"),
      bloc("Architecture : Christophe Piguet (Lausanne), Manuel Borruat (Bienne) et Etienne Gillabert (Paris), pour le maître d'ouvrage Laurent Toplitsch.", "h1b"),
      bloc("Design : Elise Gagnebin-de-Bons, plasticienne (Lausanne), Sara Bochicchio, graphiste (Lausanne), et Manuel Borruat, architecte (Bienne).", "h1c"),
      bloc("Graphisme : Stéphane Hernandez (Genève) et Sara Bochicchio (Lausanne).", "h1d"),
    ],
  },
  {
    _id: "histoire-2005", order: 2, year: "2005", title: "Architecture, design et graphisme",
    body: [
      bloc("Architecture : François Valenta (Lausanne), pour le maître d'ouvrage Laurent Toplitsch.", "h2a"),
      bloc("Design : Fulguro — Cédric Decroux, Axel Jaccard et Yves Fidalgo (Lausanne).", "h2b"),
      bloc("Graphisme : Guy Meldem (Lausanne) et Tatiana Rihs (Lausanne).", "h2c"),
    ],
  },
];

const INFORMATIONS = [
  {
    _id: "evenement-projections-privees",
    title: "Projections privées, anniversaires et locations de salle",
    slug: { _type: "slug", current: "projections-privees" },
    category: "info",
    dateDebut: "2026-09-09",
    excerpt:
      "Vous louez notre salle pour voir le film de votre choix. Pour un maximum de 18 personnes (minimum 6), dès 25.- par personne.",
  },
  {
    _id: "evenement-fermeture-estivale",
    title: "Fermeture estivale",
    slug: { _type: "slug", current: "fermeture-estivale-2026" },
    category: "info",
    dateDebut: "2026-07-01",
    dateFin: "2026-09-08",
    excerpt:
      "Le cinéma est fermé du mercredi 1er juillet au mardi 8 septembre 2026. Réouverture le mercredi 9 septembre.",
  },
];

/* La frise et les informations n'ont pas d'état « Terminé » : ce qui
   avait été inventé doit donc partir pour de bon. */
async function remplacer(type, documents, etiquette) {
  titre(etiquette);
  const garder = documents.map((d) => d._id);
  const aSupprimer = await client.fetch(
    `*[_type == $type && !(_id in $garder) && !(_id in path("drafts.**"))]{_id, title, year}`,
    { type, garder }
  );
  for (const doc of documents) {
    await client.createOrReplace({ ...doc, _type: type });
    dire(`   ✎ ${doc.year ? doc.year + " — " : ""}${doc.title}`);
  }
  for (const doc of aSupprimer) {
    await client.delete(doc._id);
    await client.delete("drafts." + doc._id).catch(() => {});
    dire(`   ✗ supprimé : ${doc.year ? doc.year + " — " : ""}${doc.title || doc._id}`);
  }
  if (!aSupprimer.length) dire("   Rien à supprimer.");
}

/* ---------------- Déroulé ---------------- */
async function principal() {
  dire(
    `Studio : projet ${client.config().projectId}, jeu de données ${client.config().dataset}`
  );
  dire(
    SIMULATION
      ? "MODE SIMULATION — rien ne sera écrit. Relancer avec « --appliquer » pour le faire vraiment.\n"
      : "MODE RÉEL — les modifications partent dans le Studio.\n"
  );
  const filmsDuProgramme = await traiterLesFilms();
  await traiterLesSeances(filmsDuProgramme);
  await traiterLesCritiques(filmsDuProgramme);
  await traiterLeMenage(filmsDuProgramme);
  await traiterLesReglages();
  await traiterLesPages();
  await remplacer("historyEntry", FRISE, "La frise de la page Histoire");
  await remplacer("evenement", INFORMATIONS, "Les informations en cours");

  titre("Il reste à faire à la main");
  dire("   Les horaires des séances, depuis la fiche de chaque film.");
  dire("   Tant qu'il n'y en a pas, la page Agenda affiche son message d'attente.");
  dire("   Les citations de presse, si vous voulez en mettre une en avant.");
  dire(
    SIMULATION
      ? "\nSimulation terminée : rien n'a été modifié.\n"
      : "\nTerminé. Le site affiche le nouveau contenu immédiatement.\n"
  );
}

principal().catch((erreur) => {
  console.error("\n✗ Le script s'est arrêté :", erreur.message);
  console.error("  Si Sanity refuse l'accès, le jeton est absent, expiré, ou");
  console.error("  n'a pas les droits « Editor ».\n");
  process.exit(1);
});
