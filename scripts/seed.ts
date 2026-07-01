/**
 * Pousse le contenu d'exemple (lib/mock-data.ts) dans le dataset Sanity
 * configuré, pour démarrer avec une base éditable plutôt qu'un studio vide.
 * Nécessite NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET et
 * SANITY_API_WRITE_TOKEN dans .env.local.
 *
 * Usage: npm run seed
 */
import { createClient } from "@sanity/client";
import {
  mockAnnouncements,
  mockFilms,
  mockHistory,
  mockScreenings,
  mockSiteSettings,
} from "../lib/mock-data";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error(
    "NEXT_PUBLIC_SANITY_PROJECT_ID et SANITY_API_WRITE_TOKEN sont requis dans .env.local pour lancer le seed."
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-06-01",
  useCdn: false,
});

async function run() {
  const tx = client.transaction();

  for (const film of mockFilms) {
    tx.createOrReplace({
      _id: film._id,
      _type: "film",
      title: film.title,
      slug: { _type: "slug", current: film.slug },
      director: film.director,
      year: film.year,
      country: film.country,
      duration: film.duration,
      language: film.language,
      subtitles: film.subtitles,
      ageRating: film.ageRating,
      genres: film.genres,
      status: film.status,
      synopsis: film.synopsis,
      posterSize: film.posterSize,
      featuredHome: film.featuredHome || false,
      price: film.price,
      sumupCheckoutUrl: film.sumupCheckoutUrl,
    });
  }

  for (const s of mockScreenings) {
    if (!s.film) continue;
    tx.createOrReplace({
      _id: s._id,
      _type: "screening",
      film: { _type: "reference", _ref: s.film._id },
      date: s.date,
      time: s.time,
      room: s.room,
      versionNote: s.versionNote,
      status: s.status,
      price: s.price,
      sumupCheckoutUrl: s.sumupCheckoutUrl,
    });
  }

  for (const a of mockAnnouncements) {
    tx.createOrReplace({
      _id: a._id,
      _type: "announcement",
      title: a.title,
      slug: { _type: "slug", current: a.slug },
      category: a.category,
      date: a.date,
      excerpt: a.excerpt,
      pinned: a.pinned || false,
    });
  }

  for (const h of mockHistory) {
    tx.createOrReplace({
      _id: h._id,
      _type: "historyEntry",
      year: h.year,
      title: h.title,
      order: h.order,
      body: [
        {
          _type: "block",
          style: "normal",
          children: [{ _type: "span", text: String(h.body || "") }],
        },
      ],
    });
  }

  tx.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    ...mockSiteSettings,
  });

  await tx.commit();
  console.log("Contenu d'exemple importé avec succès dans Sanity.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
