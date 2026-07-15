import { defineField, defineType, type SanityDocument } from "sanity";

import { intervallesSeChevauchent } from "../plugins/planification/utils/conflits";

interface ScreeningEnCours extends SanityDocument {
  film?: { _ref?: string };
  date?: string;
  time?: string;
  room?: string;
}

export const screening = defineType({
  name: "screening",
  title: "Séance",
  type: "document",
  // Avertit (sans bloquer) si une autre séance occupe déjà la même salle
  // au même moment (durée du film + pause de nettoyage comprises).
  validation: (Rule) =>
    Rule.custom(async (document, contexte) => {
      const seance = document as ScreeningEnCours | undefined;
      const { date, time, room } = seance ?? {};
      const filmRef = seance?.film?._ref;
      if (!date || !time || !room || !filmRef) return true;

      const client = contexte.getClient({ apiVersion: "2024-06-01" });
      const idPublie = (seance?._id ?? "").replace(/^drafts\./, "");
      const { duree, autres } = await client.fetch<{
        duree: number | null;
        autres: { heure: string; duree: number | null; titre: string | null }[];
      }>(
        `{
          "duree": *[_id == $filmRef][0].duration,
          "autres": *[_type == "screening" && date == $date && room == $room
            && !(_id in [$idPublie, $idBrouillon])]{
            "heure": time, "duree": film->duration, "titre": film->title
          }
        }`,
        { filmRef, date, room, idPublie, idBrouillon: `drafts.${idPublie}` }
      );

      const genante = autres.find((autre) =>
        intervallesSeChevauchent(time, duree, autre.heure, autre.duree)
      );
      if (genante) {
        return `Conflit possible : « ${genante.titre ?? "un autre film"} » occupe déjà cette salle vers ${genante.heure} (durée + pause comprises).`;
      }
      return true;
    }).warning(),
  fields: [
    defineField({
      name: "film",
      title: "Film",
      type: "reference",
      to: [{ type: "film" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "time",
      title: "Heure",
      type: "string",
      description: "Format 24h, ex. 20:30",
      validation: (Rule) =>
        Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
          name: "heure (HH:MM)",
        }),
    }),
    defineField({
      name: "room",
      title: "Salle",
      type: "string",
      options: {
        list: [
          { title: "Salle 1 (18 places)", value: "Salle 1" },
          { title: "Salle 2 (14 places)", value: "Salle 2" },
        ],
        layout: "radio",
      },
      initialValue: "Salle 1",
    }),
    defineField({
      name: "versionNote",
      title: "Mention de version",
      type: "string",
      description: "Ex. VO st fr, ciné-club, avant-première + rencontre…",
    }),
    defineField({
      name: "status",
      title: "Statut",
      type: "string",
      options: {
        list: [
          { title: "Disponible", value: "disponible" },
          { title: "Complet", value: "complet" },
          { title: "Annulé", value: "annule" },
        ],
        layout: "radio",
      },
      initialValue: "disponible",
    }),
    defineField({
      name: "price",
      title: "Prix (CHF)",
      type: "string",
      description: "Remplace le prix par défaut du film si renseigné.",
    }),
    defineField({
      name: "sumupCheckoutUrl",
      title: "Lien de paiement SumUp",
      type: "url",
      description:
        "Lien spécifique à cette séance. Si vide, le lien par défaut du film est utilisé.",
    }),
  ],
  orderings: [
    {
      title: "Date & heure",
      name: "dateTimeAsc",
      by: [
        { field: "date", direction: "asc" },
        { field: "time", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "film.title",
      date: "date",
      time: "time",
      room: "room",
      status: "status",
    },
    prepare({ title, date, time, room, status }) {
      return {
        title: title || "Séance",
        subtitle: [date, time, room, status].filter(Boolean).join(" · "),
      };
    },
  },
});
