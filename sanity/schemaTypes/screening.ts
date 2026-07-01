import { defineField, defineType } from "sanity";

export const screening = defineType({
  name: "screening",
  title: "Séance",
  type: "document",
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
      description: "Ex. Salle 1",
      initialValue: "Salle unique",
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
