/* ============================================================
   Dit ce que le Studio contient, sans rien y changer.

       node sanity/import/etat.mjs

   Aucune écriture, jamais : ce script ne sait que lire. Il sert à
   voir ce que le site va afficher, avant ou après une mise à jour —
   et à répondre à la question « pourquoi est-ce que je vois ça ? ».

   Il lui faut un jeton dans SANITY_WRITE_TOKEN (un jeton de lecture
   suffit). Le plus simple : l'onglet Actions de GitHub, workflow
   « Mettre Sanity à jour », mode « voir ».
   ============================================================ */

import { createClient } from "@sanity/client";

const jeton = process.env.SANITY_WRITE_TOKEN;
if (!jeton) {
  console.error("\n✗ Il manque le jeton Sanity (SANITY_WRITE_TOKEN).\n");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "vle63mzm",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-06-01",
  token: jeton,
  useCdn: false,
});

const dire = (...mots) => console.log(...mots);
const titre = (texte) => dire("\n" + texte + "\n" + "─".repeat(texte.length));
const aujourdhui = new Date().toISOString().slice(0, 10);

const ETATS = {
  "a-laffiche": "À l'affiche",
  "avant-premiere": "Avant-première",
  prochainement: "Prochainement",
  cycle: "Cycle",
  passe: "Terminé",
};

async function etat() {
  dire(`Studio : projet ${client.config().projectId}, jeu de données ${client.config().dataset}`);

  const tout = await client.fetch(
    `{
      "films": *[_type == "film" && !(_id in path("drafts.**"))] | order(status asc, title asc){
        _id, title, status, "slug": slug.current, "affiche": poster.asset->originalFilename,
        "largeur": poster.asset->metadata.dimensions.width,
        "hauteur": poster.asset->metadata.dimensions.height,
        "seances": count(*[_type == "screening" && references(^._id) && date >= $aujourdhui])
      },
      "cinemas": *[_type == "siteSettings"]{"nom": coalesce(nom, "Cinéma sans nom"),
        address, phone, tarifPlein, tarifReduit, "salles": salles[].nom} | order(lower(nom) asc),
      "frise": *[_id == "histoire"][0].etapes[]{year, title},
      "informations": *[_type == "evenement" && !(_id in path("drafts.**"))]{title, dateDebut, dateFin},
      "seances": *[_type == "screening" && date >= $aujourdhui] | order(date asc, time asc)[0...8]{
        date, time, room, "film": film->title
      },
      "seancesTotal": count(*[_type == "screening" && date >= $aujourdhui]),
      "articlesDePresse": count(*[_type == "film" && defined(presseUrl)])
    }`,
    { aujourdhui }
  );

  titre(`Les films (${tout.films.length})`);
  let etatCourant = null;
  for (const film of tout.films) {
    if (film.status !== etatCourant) {
      etatCourant = film.status;
      dire(`\n  ${ETATS[etatCourant] || etatCourant} :`);
    }
    const affiche = film.affiche
      ? `${film.affiche} (${film.largeur}×${film.hauteur})`
      : "PAS D'AFFICHE — le site en fabrique une avec le titre";
    dire(`    · ${film.title}`);
    dire(`      affiche : ${affiche}`);
    dire(`      adresse : /film/?s=${film.slug || film._id}   séances à venir : ${film.seances}`);
  }
  const visibles = tout.films.filter((f) => f.status !== "passe");
  dire(`\n  → ${visibles.length} film(s) visibles sur le site, ${tout.films.length - visibles.length} terminé(s).`);

  const cinemas = tout.cinemas || [];
  titre(`Cinémas (${cinemas.length})`);
  if (!cinemas.length) dire("  Aucun cinéma publié.");
  for (const c of cinemas) {
    dire(`  · ${c.nom}`);
    dire(`    Adresse   : ${String(c.address || "—").replace(/\n/g, ", ")}`);
    dire(`    Téléphone : ${c.phone || "—"}`);
    dire(`    Tarifs    : ${c.tarifPlein ?? "—"}.- / ${c.tarifReduit ?? "—"}.- réduit`);
    dire(`    Salles    : ${(c.salles || []).join(", ") || "—"}`);
  }

  const frise = tout.frise || [];
  titre(`Page Histoire (${frise.length} étape${frise.length > 1 ? "s" : ""})`);
  for (const e of frise) dire(`  · ${e.year} — ${e.title}`);
  if (!frise.length) dire("  vide");

  titre(`Informations et événements (${tout.informations.length})`);
  for (const e of tout.informations) {
    dire(`  · ${e.title}  [${e.dateDebut || "?"}${e.dateFin ? " → " + e.dateFin : ""}]`);
  }
  if (!tout.informations.length) dire("  aucun");

  titre(`Séances à venir (${tout.seancesTotal})`);
  for (const s of tout.seances) dire(`  · ${s.date} ${s.time} — ${s.film || "?"} (${s.room || "?"})`);
  if (!tout.seancesTotal) dire("  aucune — la page Agenda affiche son message d'attente");

  dire(`\nFilms avec un lien d'article de presse : ${tout.articlesDePresse}\n`);
}

etat().catch((erreur) => {
  console.error("\n✗ Lecture impossible :", erreur.message, "\n");
  process.exit(1);
});
