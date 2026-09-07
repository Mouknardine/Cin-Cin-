/* ============================================================
   Met le Studio à l'heure du programme réel, en une commande :

       npx sanity exec sanity/import/mettre-a-jour.mjs --with-user-token

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

import { getCliClient } from "sanity/cli";

import { FILMS, trierLesFilms } from "./programme.data.mjs";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER_AFFICHES = path.join(ICI, "affiches");

const client = getCliClient({ apiVersion: "2024-06-01" });

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
        { _type: "horaire", _key: "caisse", label: "Caisse", value: "À la buvette, 15 minutes avant la séance" },
        { _type: "horaire", _key: "reservation", label: "Réservation", value: "Nous ne prenons pas de réservations" },
        { _type: "horaire", _key: "paiement", label: "Paiement", value: "Espèces ou TWINT — pas de carte bancaire" },
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
        "Au cinéma, le paiement se fait en espèces ou par TWINT : nous ne prenons pas les cartes bancaires.",
    })
    .commit();
  dire("   ✎ Formules & paiement");
}

const PAGES = [
  ["home", "Zinéma — Cinéma d'art et essai à Lausanne", null,
   "Aucun film à l'affiche pour l'instant. Le programme paraît ici dès qu'il est arrêté.",
   "Cinéma d'art et essai rue du Maupas 4 à Lausanne : deux salles de 18 et 14 places, films en version originale et en français."],
  ["films", "Films — Zinéma", "Réouverture le mercredi 9 septembre 2026.",
   "Aucun film à l'affiche pour l'instant. Le programme paraît ici dès qu'il est arrêté.",
   "Les films à l'affiche et à venir au Zinéma, rue du Maupas 4 à Lausanne."],
  ["agenda", "Agenda — Zinéma", null,
   "Aucune séance programmée pour le moment. Les horaires paraissent ici dès qu'ils sont fixés.",
   "Toutes les séances du Zinéma, jour par jour, salle par salle."],
  ["evenements", "Événements — Zinéma", null,
   "Rien d'annoncé pour le moment.",
   "Séances spéciales, locations de salle et informations du Zinéma, à Lausanne."],
  ["histoire", "Histoire — Zinéma", null,
   "La frise est encore vide.",
   "Le Zinéma, salle de cinéma fondée en juin 2001 par Laurent Serge Toplitsch, rue du Maupas à Lausanne."],
  ["membership", "Tarifs & carte de membre — Zinéma",
   "Plein tarif 16.-, tarif réduit 10.-. Le paiement se fait en espèces ou par TWINT : nous ne prenons pas les cartes bancaires.",
   "Les formules paraîtront ici prochainement.",
   "Tarifs du Zinéma : 16.- plein tarif, 10.- tarif réduit, carte annuelle de membre de soutien à 60.-."],
  ["contact", "Infos pratiques — Zinéma",
   "Nous ne prenons pas de réservations : les billets sont en vente à la buvette, 15 minutes avant les représentations.",
   "Les informations pratiques paraîtront ici.",
   "Adresse, téléphone, tarifs et accès du Zinéma, rue du Maupas 4 à 1004 Lausanne."],
];

async function traiterLesPages() {
  titre("Les textes des sept pages");
  for (const [pageId, titrePage, intro, messageVide, seoDescription] of PAGES) {
    const id = "page-" + pageId;
    await client.createIfNotExists({ _id: id, _type: "page", pageId });
    const modification = client
      .patch(id)
      .set({ pageId, titre: titrePage, messageVide, seoDescription });
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
  dire(`Studio : projet ${client.config().projectId}, jeu de données ${client.config().dataset}`);
  await traiterLesFilms();
  await traiterLesReglages();
  await traiterLesPages();
  await remplacer("historyEntry", FRISE, "La frise de la page Histoire");
  await remplacer("evenement", INFORMATIONS, "Les informations en cours");

  const seances = await client.fetch(
    `count(*[_type == "screening" && date >= $aujourdhui])`,
    { aujourdhui: new Date().toISOString().slice(0, 10) }
  );
  titre("Il reste à faire à la main");
  dire(seances
    ? `   ${seances} séance(s) à venir sont programmées.`
    : "   Aucune séance : la page Agenda restera vide tant que les horaires\n     ne seront pas saisis, depuis la fiche de chaque film.");
  dire("   L'affiche de Drowak, si le Studio n'en a pas encore une.");
  dire("\nTerminé. Le site affiche le nouveau contenu immédiatement.\n");
}

principal().catch((erreur) => {
  console.error("\n✗ Le script s'est arrêté :", erreur.message);
  console.error("  Si Sanity refuse l'accès, connectez-vous d'abord avec");
  console.error("  « npx sanity login », puis relancez avec « --with-user-token ».\n");
  process.exit(1);
});
