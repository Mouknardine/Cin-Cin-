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
     4. il remet les TARIFS et les COORDONNÉES, sans toucher à
        l'image de partage déjà déposée, et remplit le mur des
        REMERCIEMENTS sans rien retirer de ce qui y est déjà ;
     5. il remplace la PAGE HISTOIRE et les INFORMATIONS par les
        vraies, et supprime celles qui avaient été inventées pendant
        la mise au point du site. Sanity garde un historique : une
        suppression se rattrape depuis le Studio.

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

/* ---------------- Le ménage dans les fiches ----------------
   Une fiche de film sans affiche, restée d'un essai, n'affiche rien
   nulle part mais encombre le Studio. */
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

/* ---------------- Les remerciements ----------------
   Le mur de la page Remerciements : les 144 personnes et institutions
   que le cinéma remercie, relevées une à une sur la page « Merci » de
   l'ancien site du Zinéma. L'ordre est celui de cette page-là,
   alphabétique par prénom.

   Quatre soutiens étaient déjà saisis dans le Studio. Ce sont les
   mêmes que « Canton de Vaud » et « OFC (Succès-Cinéma) » de
   l'ancienne page, sous un autre libellé : c'est la version du Studio
   qui reste, avec sa clef et son lien. */
const REMERCIEMENTS = [
  { _type: "remerciement", _key: "abel-davoine", nom: "Abel Davoine" },
  { _type: "remerciement", _key: "adriana-bouchat", nom: "Adriana Bouchat" },
  { _type: "remerciement", _key: "adrien-romedienne", nom: "Adrien Romedienne" },
  { _type: "remerciement", _key: "agnes-boudry", nom: "Agnès Boudry" },
  { _type: "remerciement", _key: "alain-weber", nom: "Alain Weber" },
  { _type: "remerciement", _key: "alfio-di-guardio", nom: "Alfio di Guardio" },
  { _type: "remerciement", _key: "anais-emery", nom: "Anaïs Emery" },
  { _type: "remerciement", _key: "anais-goudal", nom: "Anaïs Goudal" },
  { _type: "remerciement", _key: "annaik-pitteloud", nom: "Annaïk Pitteloud" },
  { _type: "remerciement", _key: "anne-delseth", nom: "Anne Delseth" },
  { _type: "remerciement", _key: "anthony-vouardoux", nom: "Anthony Vouardoux" },
  { _type: "remerciement", _key: "antoine-cattin", nom: "Antoine Cattin" },
  { _type: "remerciement", _key: "auriol-zima", nom: "Auriol Zima" },
  { _type: "remerciement", _key: "bastien-moeckli", nom: "Bastien Moeckli" },
  { _type: "remerciement", _key: "carine-maillard", nom: "Carine Maillard" },
  { _type: "remerciement", _key: "caroline-suard", nom: "Caroline Suard" },
  { _type: "remerciement", _key: "cedric-decroux", nom: "Cédric Decroux" },
  { _type: "remerciement", _key: "celine-macherel", nom: "Céline Macherel" },
  { _type: "remerciement", _key: "christiane-perrin-toplitsch", nom: "Christiane Perrin Toplitsch" },
  { _type: "remerciement", _key: "christophe-billeter", nom: "Christophe Billeter" },
  { _type: "remerciement", _key: "christophe-piguet", nom: "Christophe Piguet" },
  { _type: "remerciement", _key: "claire-felix", nom: "Claire Felix" },
  { _type: "remerciement", _key: "claude-joyet", nom: "Claude Joyet" },
  { _type: "remerciement", _key: "cliff-mac-bee", nom: "Cliff Mac Bee" },
  { _type: "remerciement", _key: "cynthia-kraus", nom: "Cynthia Kraus" },
  { _type: "remerciement", _key: "damien-frei", nom: "Damien Frei" },
  { _type: "remerciement", _key: "daniel-guttmann", nom: "Daniel Guttmann" },
  { _type: "remerciement", _key: "delphine-jeanneret", nom: "Delphine Jeanneret" },
  { _type: "remerciement", _key: "delphine-veillon", nom: "Delphine Veillon" },
  { _type: "remerciement", _key: "denis-vallon", nom: "Denis Vallon" },
  { _type: "remerciement", _key: "dominique-langevin", nom: "Dominique Langevin" },
  { _type: "remerciement", _key: "edouard-waintrop", nom: "Edouard Waintrop" },
  { _type: "remerciement", _key: "elise-gagnebin-de-bons", nom: "Elise Gagnebin-de-Bons" },
  { _type: "remerciement", _key: "emmanuel-schmutz", nom: "Emmanuel Schmutz" },
  { _type: "remerciement", _key: "eric-bouzigon", nom: "Eric Bouzigon" },
  { _type: "remerciement", _key: "a0167799fdb5", nom: "Etat de Vaud" }, // déjà dans le Studio
  { _type: "remerciement", _key: "fabien-ruf", nom: "Fabien Ruf" },
  { _type: "remerciement", _key: "fernand-melgar", nom: "Fernand Melgar" },
  { _type: "remerciement", _key: "florence-nicollier", nom: "Florence Nicollier" },
  { _type: "remerciement", _key: "frederic-gonseth", nom: "Frédéric Gonseth" },
  { _type: "remerciement", _key: "genet-mayor", nom: "Genêt Mayor" },
  { _type: "remerciement", _key: "geraldine-savary", nom: "Géraldine Savary" },
  { _type: "remerciement", _key: "gerard-ruey", nom: "Gérard Ruey" },
  { _type: "remerciement", _key: "gilbert-gubler", nom: "Gilbert Gubler" },
  { _type: "remerciement", _key: "gilles-meystre", nom: "Gilles Meystre" },
  { _type: "remerciement", _key: "gisele-olmi", nom: "Gisèle Olmi" },
  { _type: "remerciement", _key: "gregoire-junod", nom: "Grégoire Junod" },
  { _type: "remerciement", _key: "guy-meldem", nom: "Guy Meldem" },
  { _type: "remerciement", _key: "hotels-by-fassbind-lausanne-zurich", nom: "Hotels by Fassbind Lausanne Zürich" },
  { _type: "remerciement", _key: "ingo-lambert-toplitsch", nom: "Ingo Lambert Toplitsch" },
  { _type: "remerciement", _key: "jacques-muehlethaler", nom: "Jacques Muehlethaler" },
  { _type: "remerciement", _key: "jacques-perrier", nom: "Jacques Perrier" },
  { _type: "remerciement", _key: "janka-rahm", nom: "Janka Rahm" },
  { _type: "remerciement", _key: "jean-perret", nom: "Jean Perret" },
  { _type: "remerciement", _key: "jean-francois-sutterlet", nom: "Jean-François Sutterlet" },
  { _type: "remerciement", _key: "jean-jacques-schilt", nom: "Jean-Jacques Schilt" },
  { _type: "remerciement", _key: "jean-marc-lehmann", nom: "Jean-Marc Lehmann" },
  { _type: "remerciement", _key: "jean-marc-rusconi", nom: "Jean-Marc Rusconi" },
  { _type: "remerciement", _key: "jennifer-cerchia", nom: "Jennifer Cerchia" },
  { _type: "remerciement", _key: "jeremie-kisling", nom: "Jérémie Kisling" },
  { _type: "remerciement", _key: "jerome-roniger", nom: "Jérôme Roniger" },
  { _type: "remerciement", _key: "joaquim-manzoni", nom: "Joaquim Manzoni" },
  { _type: "remerciement", _key: "jonas-marguet", nom: "Jonas Marguet" },
  { _type: "remerciement", _key: "julien-bodivit", nom: "Julien Bodivit" },
  { _type: "remerciement", _key: "julien-moeschler", nom: "Julien Moeschler" },
  { _type: "remerciement", _key: "karen-ichters", nom: "Karen Ichters" },
  { _type: "remerciement", _key: "karine-odorici", nom: "Karine Odorici" },
  { _type: "remerciement", _key: "keel-chan", nom: "Keel Chan" },
  { _type: "remerciement", _key: "laura-grandjean", nom: "Laura Grandjean" },
  { _type: "remerciement", _key: "laurent-gerard", nom: "Laurent Gérard" },
  { _type: "remerciement", _key: "laurent-steiert", nom: "Laurent Steiert" },
  { _type: "remerciement", _key: "leila-klouche", nom: "Leila Klouche" },
  { _type: "remerciement", _key: "liora-zittoun", nom: "Liora Zittoun" },
  { _type: "remerciement", _key: "lorraine-pidoux", nom: "Lorraine Pidoux" },
  { _type: "remerciement", _key: "40ec6b59aced", nom: "Loterie Romande", url: "https://soutien-loro.ch/fr" }, // déjà dans le Studio
  { _type: "remerciement", _key: "louise-roduit", nom: "Louise Roduit" },
  { _type: "remerciement", _key: "luc-peter", nom: "Luc Peter" },
  { _type: "remerciement", _key: "manuel-borruat", nom: "Manuel Borruat" },
  { _type: "remerciement", _key: "marie-klay", nom: "Marie Klay" },
  { _type: "remerciement", _key: "marie-vachette", nom: "Marie Vachette" },
  { _type: "remerciement", _key: "marie-claude-jequier", nom: "Marie-Claude Jequier" },
  { _type: "remerciement", _key: "marion-basle", nom: "Marion Baslé" },
  { _type: "remerciement", _key: "marion-duval", nom: "Marion Duval" },
  { _type: "remerciement", _key: "martine-guttmann", nom: "Martine Guttmann" },
  { _type: "remerciement", _key: "matthieu-capcarrere", nom: "Matthieu Capcarrère" },
  { _type: "remerciement", _key: "mattia-fiumani", nom: "Mattia Fiumani" },
  { _type: "remerciement", _key: "melanie-mermod", nom: "Mélanie Mermod" },
  { _type: "remerciement", _key: "melodie-mousset", nom: "Mélodie Mousset" },
  { _type: "remerciement", _key: "michael-hedjem", nom: "Michaël Hedjem" },
  { _type: "remerciement", _key: "michel-barraz", nom: "Michel Barraz" },
  { _type: "remerciement", _key: "mike-pfenninger", nom: "Mike Pfenninger" },
  { _type: "remerciement", _key: "mme-m-perrieres", nom: "Mme & M. Perrières" },
  { _type: "remerciement", _key: "muriel-jost", nom: "Muriel Jost" },
  { _type: "remerciement", _key: "nathalie-saugy", nom: "Nathalie Saugy" },
  { _type: "remerciement", _key: "nathanael-ha-vinh", nom: "Nathanael Ha-Vinh" },
  { _type: "remerciement", _key: "nicola-di-pinto", nom: "Nicola Di Pinto" },
  { _type: "remerciement", _key: "nicolas-appelt", nom: "Nicolas Appelt" },
  { _type: "remerciement", _key: "nicolas-bideau", nom: "Nicolas Bideau" },
  { _type: "remerciement", _key: "norbert-creutz", nom: "Norbert Creutz" },
  { _type: "remerciement", _key: "412a1f5f0067", nom: "office fédéral de la culture" }, // déjà dans le Studio
  { _type: "remerciement", _key: "olaf-nitschmann", nom: "Olaf Nitschmann" },
  { _type: "remerciement", _key: "olivier-aeby", nom: "Olivier Aeby" },
  { _type: "remerciement", _key: "ondine-jung", nom: "Ondine Jung" },
  { _type: "remerciement", _key: "pascal-knoerr", nom: "Pascal Knoerr" },
  { _type: "remerciement", _key: "pascal-pelissier", nom: "Pascal Pelissier" },
  { _type: "remerciement", _key: "patrick-suhner", nom: "Patrick Suhner" },
  { _type: "remerciement", _key: "philippe-clivaz", nom: "Philippe Clivaz" },
  { _type: "remerciement", _key: "philippe-modoux", nom: "Philippe Modoux" },
  { _type: "remerciement", _key: "pierre-agthe", nom: "Pierre Agthe" },
  { _type: "remerciement", _key: "pierre-antoine-grisoni", nom: "Pierre-Antoine Grisoni" },
  { _type: "remerciement", _key: "pierre-yves-borgeaud", nom: "Pierre-Yves Borgeaud" },
  { _type: "remerciement", _key: "pierre-yves-fiora", nom: "Pierre-Yves Fiora" },
  { _type: "remerciement", _key: "raphael-sibilla", nom: "Raphaël Sibilla" },
  { _type: "remerciement", _key: "raphael-wagnieres", nom: "Raphaël Wagnières" },
  { _type: "remerciement", _key: "regina-boelsterli", nom: "Regina Boelsterli" },
  { _type: "remerciement", _key: "renato-morandi", nom: "Renato Morandi" },
  { _type: "remerciement", _key: "roland-dapples", nom: "Roland Dapples" },
  { _type: "remerciement", _key: "romeo-andreani", nom: "Romeo Andreani" },
  { _type: "remerciement", _key: "sandrine-kuster", nom: "Sandrine Kuster" },
  { _type: "remerciement", _key: "sara-bochicchio", nom: "Sara Bochicchio" },
  { _type: "remerciement", _key: "sebastiano-conforti", nom: "Sebastiano Conforti" },
  { _type: "remerciement", _key: "sebastien-riond", nom: "Sébastien Riond" },
  { _type: "remerciement", _key: "sibylle-koessler", nom: "Sibylle Koessler" },
  { _type: "remerciement", _key: "sigismond-de-vajay", nom: "Sigismond de Vajay" },
  { _type: "remerciement", _key: "silvia-zamora", nom: "Silvia Zamora" },
  { _type: "remerciement", _key: "stephane-detruche", nom: "Stéphane Détruche" },
  { _type: "remerciement", _key: "stephane-goel", nom: "Stéphane Goël" },
  { _type: "remerciement", _key: "stephane-noel", nom: "Stéphane Noël" },
  { _type: "remerciement", _key: "stevan-haener", nom: "Stevan Haener" },
  { _type: "remerciement", _key: "tatiana-rihs", nom: "Tatiana Rihs" },
  { _type: "remerciement", _key: "thierry-jobin", nom: "Thierry Jobin" },
  { _type: "remerciement", _key: "thierry-spicher-elena-tatti", nom: "Thierry Spicher & Elena Tatti" },
  { _type: "remerciement", _key: "tom-guex", nom: "Tom Guex" },
  { _type: "remerciement", _key: "urs-seidel", nom: "Urs Seidel" },
  { _type: "remerciement", _key: "valerie-debeaumont", nom: "Valérie Debeaumont" },
  { _type: "remerciement", _key: "vera-gilardoni", nom: "Vera Gilardoni" },
  { _type: "remerciement", _key: "05e916c49c9c", nom: "Ville de Lausanne" }, // déjà dans le Studio
  { _type: "remerciement", _key: "vincent-pluss", nom: "Vincent Pluss" },
  { _type: "remerciement", _key: "xavier-pattaroni", nom: "Xavier Pattaroni" },
  { _type: "remerciement", _key: "xaviere-sennac", nom: "Xavière Sennac" },
  { _type: "remerciement", _key: "yann-delmonico", nom: "Yann Delmonico" },
  { _type: "remerciement", _key: "yann-mingard", nom: "Yann Mingard" },
  { _type: "remerciement", _key: "yvan-ziade", nom: "Yvan Ziadé" },
  { _type: "remerciement", _key: "yves-fidalgo", nom: "Yves Fidalgo" },
];

/* Une liste de noms ne se remplace pas à l'aveugle : le Studio se
   modifie aussi à la main. On repart donc de ce qu'il contient —
   chaque entrée déjà là est reprise telle quelle, avec son libellé, sa
   mention, son lien et sa clef — et on n'ajoute que ce qui manque. Une
   entrée que la liste ci-dessus ne prévoit pas est remise à la fin
   plutôt que d'être effacée : rien ne doit disparaître du mur. */
async function fusionnerLesRemerciements() {
  const existants = (await client.fetch(`*[_id == "siteSettings"][0].remerciements[]`)) || [];
  const parClef = new Map(existants.map((r) => [r._key, r]));
  const prevues = new Set(REMERCIEMENTS.map((r) => r._key));

  const liste = REMERCIEMENTS.map((r) => parClef.get(r._key) || r);
  const gardees = existants.filter((r) => prevues.has(r._key));
  const inattendues = existants.filter((r) => !prevues.has(r._key));

  const total = liste.length + inattendues.length;
  dire(
    `   ✎ Remerciements : ${total} noms sur le mur ` +
      `(${existants.length} déjà dans le Studio, ${total - existants.length} ajoutés)`
  );
  for (const r of gardees) dire(`       = gardé tel quel : ${r.nom}`);
  for (const r of inattendues) {
    dire(`       = gardé tel quel, remis à la fin (absent de la liste) : ${r.nom}`);
  }
  if (!existants.length) dire("       Le mur était vide.");

  return [...liste, ...inattendues];
}

async function traiterLesReglages() {
  titre("Tarifs, coordonnées et formules");

  await client.createIfNotExists({ _id: "siteSettings", _type: "siteSettings" });
  const remerciements = await fusionnerLesRemerciements();
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
      remerciements,
      seoDescription:
        "Cinéma d'art et essai rue du Maupas 4 à Lausanne : deux salles de 18 et 14 places, films en version originale et en français.",
    })
    .commit();
  dire("   ✎ Réglages du cinéma (l'image de partage est conservée)");

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
/* Un paragraphe de texte, au format que Sanity attend. */
const bloc = (texte, cle) => ({
  _type: "block",
  _key: cle,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: cle + "s", text: texte, marks: [] }],
});

/* La page Histoire tient dans une seule fiche : la phrase
   d'accueil et les étapes de la frise, dans l'ordre de lecture. */
const HISTOIRE_INTRO =
  "Une salle de cinéma de quartier ouverte en juin 2001 dans le quartier de Chauderon à Lausanne";

const FRISE = [
  {
    _key: "etape-1", year: "2001", title: "Ouverture",
    body: [
      bloc("Le Zinéma est fondé en juin 2001 par Laurent Serge Toplitsch, à la rue du Maupas 4.", "h1a"),
      bloc("Architecture : Christophe Piguet (Lausanne), Manuel Borruat (Bienne) et Etienne Gillabert (Paris), pour le maître d'ouvrage Laurent Toplitsch.", "h1b"),
      bloc("Design : Elise Gagnebin-de-Bons, plasticienne (Lausanne), Sara Bochicchio, graphiste (Lausanne), et Manuel Borruat, architecte (Bienne).", "h1c"),
      bloc("Graphisme : Stéphane Hernandez (Genève) et Sara Bochicchio (Lausanne).", "h1d"),
    ],
  },
  {
    _key: "etape-2", year: "2005", title: "Architecture, design et graphisme",
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

/* La page Histoire est une fiche unique : on la réécrit en entier,
   il n'y a rien à supprimer à côté. */
async function ecrireLHistoire() {
  titre("La page Histoire");
  await client.createOrReplace({
    _id: "histoire",
    _type: "histoire",
    intro: HISTOIRE_INTRO,
    etapes: FRISE.map((etape) => ({ _type: "etape", ...etape })),
  });
  for (const etape of FRISE) dire(`   ✎ ${etape.year} — ${etape.title}`);
}

/* Les informations n'ont pas d'état « Terminé » : ce qui avait été
   inventé doit donc partir pour de bon. */
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
  await traiterLeMenage(filmsDuProgramme);
  await traiterLesReglages();
  await ecrireLHistoire();
  await remplacer("evenement", INFORMATIONS, "Les informations en cours");

  titre("Il reste à faire à la main");
  dire("   Les horaires des séances, depuis la fiche de chaque film.");
  dire("   Tant qu'il n'y en a pas, la page Agenda affiche son message d'attente.");
  dire("   Les liens d'articles de presse, sur la fiche de chaque film.");
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
